from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4
import os

import psycopg
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.auth import SESSION_DAYS, authenticate, create_session, delete_session, register_user, session_user
from app.audit.ledger import append_run, read_ledger, verify_chain
from app.database import configured as database_configured, initialize as initialize_database, load_latest_run, load_run, save_run
from app.engine.config_load import load_assumptions, load_parameters
from app.engine.ingestion import IngestedData, load_portfolio
from app.engine.pipeline import run_model
from app.engine.exposure_preview import ai_available, preview_exposure
from app.engine.vulnerability import vulnerability_matrix
from app.schemas import LoginRequest, PreviewRequest, RegisterRequest, RunRequest

STORE: dict[str, dict[str, Any]] = {}
PREVIEWS: dict[str, dict[str, Any]] = {}
PORTFOLIO: IngestedData | None = None
LATEST: str | None = None


def _public(result: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in result.items() if k != "explanations"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    global PORTFOLIO, LATEST
    initialize_database()
    PORTFOLIO = load_portfolio()
    result = run_model({"apply_drainage_correction": True, "free_text": ""}, ingested=PORTFOLIO)
    save_run(result)
    STORE[result["run_id"]] = result
    append_run(result)
    LATEST = result["run_id"]
    yield


app = FastAPI(title="Risk Atlas API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "locations": PORTFOLIO.row_count if PORTFOLIO else 0, "latest_run_id": LATEST, "database_configured": database_configured()}


def _require_database() -> None:
    if not database_configured():
        raise HTTPException(503, "Account database is not configured")


def _session_cookie(response: Response, request: Request, token: str) -> None:
    secure = request.url.scheme == "https" or os.getenv("RISK_ATLAS_SECURE_COOKIES", "").lower() == "true"
    response.set_cookie(
        "risk_atlas_session", token, max_age=SESSION_DAYS * 86400, httponly=True,
        secure=secure, samesite="lax", path="/",
    )


@app.post("/api/auth/register", status_code=201)
def register(body: RegisterRequest, request: Request, response: Response):
    _require_database()
    try:
        user = register_user(body.full_name, str(body.email), body.password)
        if user is None:
            raise HTTPException(409, "An account with this email already exists")
        _session_cookie(response, request, create_session(user["id"]))
        return {"user": user}
    except psycopg.Error as exc:
        raise HTTPException(503, "Account database is unavailable") from exc


@app.post("/api/auth/login")
def login(body: LoginRequest, request: Request, response: Response):
    _require_database()
    try:
        user = authenticate(str(body.email), body.password)
        if user is None:
            raise HTTPException(401, "Invalid email or password")
        _session_cookie(response, request, create_session(user["id"]))
        return {"user": user}
    except psycopg.Error as exc:
        raise HTTPException(503, "Account database is unavailable") from exc


@app.get("/api/auth/me")
def current_user(request: Request):
    _require_database()
    try:
        return {"user": session_user(request.cookies.get("risk_atlas_session"))}
    except psycopg.Error as exc:
        raise HTTPException(503, "Account database is unavailable") from exc


@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    if database_configured():
        try:
            delete_session(request.cookies.get("risk_atlas_session"))
        except psycopg.Error as exc:
            raise HTTPException(503, "Account database is unavailable") from exc
    response.delete_cookie("risk_atlas_session", path="/")
    return {"ok": True}


@app.get("/api/defaults")
def defaults():
    params = load_parameters()
    return {
        "model": params["model"],
        "return_periods": params["return_periods"],
        "hazard": params["hazard"],
        "vulnerability": params["vulnerability"],
        "vulnerability_matrix": vulnerability_matrix(params),
        "assumptions": load_assumptions()["assumptions"],
    }


@app.get("/api/capabilities")
def capabilities():
    return {"ai_exposure_available": ai_available()}


@app.post("/api/exposure/preview")
def preview(body: PreviewRequest):
    try:
        result = preview_exposure(body.free_text, PORTFOLIO.hotspots)
        now = datetime.now(timezone.utc)
        for key, stored in list(PREVIEWS.items()):
            if now - stored["created_at"] > timedelta(hours=1):
                del PREVIEWS[key]
        preview_id = str(uuid4())
        PREVIEWS[preview_id] = {"text": body.free_text, "result": result, "created_at": now}
        return {**result, "preview_id": preview_id}
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.post("/api/runs")
def create_run(body: RunRequest):
    global LATEST
    try:
        payload = body.model_dump()
        if body.free_text.strip():
            reviewed = PREVIEWS.get(body.preview_id or "")
            if not reviewed or reviewed["text"] != body.free_text or datetime.now(timezone.utc) - reviewed["created_at"] > timedelta(hours=1):
                raise ValueError("Review this exact exposure text before running the model")
            review_result = reviewed["result"]
            if not review_result["groups"] or any(note.startswith("Skipped") for note in review_result["notes"]):
                raise ValueError("Exposure preview has missing or invalid groups")
            payload["exposure_groups"] = review_result["groups"]
            payload["exposure_source"] = review_result["source"]
        else:
            payload["exposure_groups"] = []
            payload["exposure_source"] = "none"
        result = run_model(payload, ingested=PORTFOLIO)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    STORE[result["run_id"]] = result
    save_run(result)
    record = append_run(result)
    LATEST = result["run_id"]
    payload = _public(result)
    payload["audit_record"] = record
    return payload


@app.get("/api/runs/latest")
def latest_run():
    result = STORE.get(LATEST or "") or load_latest_run()
    if not result:
        raise HTTPException(404, "No run available")
    return _public(result)


@app.get("/api/runs/{run_id}")
def get_run(run_id: str):
    result = STORE.get(run_id) or load_run(run_id)
    if not result:
        raise HTTPException(404, "Unknown run_id")
    return _public(result)


@app.get("/api/runs/{run_id}/explain/{loc_id}")
def explain_location(run_id: str, loc_id: str):
    result = STORE.get(run_id) or load_run(run_id)
    if not result:
        raise HTTPException(404, "Unknown run_id")
    explanation = result["explanations"].get(loc_id)
    if not explanation:
        raise HTTPException(404, "Unknown loc_id")
    location = next((row for row in result["locations"] if row["loc_id"] == loc_id), None)
    return {"location": location, **explanation}


@app.get("/api/audit")
def audit(limit: int = 40):
    return {"ledger": read_ledger(limit), "chain": verify_chain()}
