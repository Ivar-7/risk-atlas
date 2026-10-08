from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import os
from time import perf_counter
from typing import Any
from uuid import uuid4
from fastapi import Depends, FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from app.audit.ledger import append_run, read_ledger, verify_chain
from app.auth import require_auth
from app.database import configured as database_configured, initialize as initialize_database, load_latest_run, load_run, save_run
from app.engine.config_load import load_assumptions, load_parameters
from app.engine.ingestion import IngestedData, load_portfolio
from app.engine.pipeline import run_model
from app.engine.exposure_preview import ai_available, preview_exposure
from app.engine.vulnerability import vulnerability_matrix
from app.engine.document_review import MAX_BYTES, review_document
from app.engine.loss_terms import LossTerms, calculate_loss
from app.schemas import PreviewRequest, RunRequest

STORE: dict[str, dict[str, Any]] = {}
PREVIEWS: dict[str, dict[str, Any]] = {}
PORTFOLIO: IngestedData | None = None
SAMPLE_RUN_ID: str | None = None


def _public(result: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in result.items() if k not in {"explanations", "owner_id"}}


def _owned_run(run_id: str, owner_id: str) -> dict[str, Any]:
    result = STORE.get(run_id) or load_run(run_id)
    if not result or (result.get("owner_id") != owner_id and not result.get("sample_run")):
        raise HTTPException(404, "Unknown run_id")
    return result


@asynccontextmanager
async def lifespan(_: FastAPI):
    global PORTFOLIO, SAMPLE_RUN_ID
    initialize_database()
    PORTFOLIO = load_portfolio()
    result = run_model({"apply_drainage_correction": False, "free_text": ""}, ingested=PORTFOLIO)
    result["owner_id"] = None
    result["sample_run"] = True
    save_run(result)
    STORE[result["run_id"]] = result
    append_run(result)
    SAMPLE_RUN_ID = result["run_id"]
    yield


app = FastAPI(title="Risk Atlas API", version="1.0.0", lifespan=lifespan)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "RISK_ATLAS_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "locations": PORTFOLIO.row_count if PORTFOLIO else 0, "database_configured": database_configured()}


@app.get("/api/defaults", dependencies=[Depends(require_auth)])
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


@app.get("/api/capabilities", dependencies=[Depends(require_auth)])
def capabilities():
    return {"ai_exposure_available": ai_available()}


@app.post('/api/documents/analyze', dependencies=[Depends(require_auth)])
async def analyze_document(file: UploadFile = File(...)):
    try:
        started = perf_counter()
        data = await file.read(MAX_BYTES + 1)
        result = review_document(file.filename or '', data)
        result['processing_ms'] = round((perf_counter() - started) * 1000)
        return result
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    finally:
        await file.close()


@app.post('/api/loss/calculate', dependencies=[Depends(require_auth)])
def calculate_document_loss(terms: LossTerms):
    return {key: str(value) if isinstance(value, Decimal) else value for key, value in calculate_loss(terms).items()}


@app.post("/api/exposure/preview", dependencies=[Depends(require_auth)])
def preview(body: PreviewRequest, claims: dict = Depends(require_auth)):
    try:
        result = preview_exposure(body.free_text, PORTFOLIO.hotspots)
        now = datetime.now(timezone.utc)
        for key, stored in list(PREVIEWS.items()):
            if now - stored["created_at"] > timedelta(hours=1):
                del PREVIEWS[key]
        preview_id = str(uuid4())
        PREVIEWS[preview_id] = {"text": body.free_text, "result": result, "created_at": now, "owner_id": claims["sub"]}
        return {**result, "preview_id": preview_id}
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.post("/api/runs", dependencies=[Depends(require_auth)])
def create_run(body: RunRequest, claims: dict = Depends(require_auth)):
    try:
        payload = body.model_dump()
        if body.free_text.strip():
            if not body.exposure_reviewed:
                raise ValueError("Confirm the extracted exposure before running the model")
            reviewed = PREVIEWS.get(body.preview_id or "")
            if not reviewed or reviewed["owner_id"] != claims["sub"] or reviewed["text"] != body.free_text or datetime.now(timezone.utc) - reviewed["created_at"] > timedelta(hours=1):
                raise ValueError("Review this exact exposure text before running the model")
            review_result = reviewed["result"]
            if not review_result["groups"] or any(note.startswith("Skipped") for note in review_result["notes"]):
                raise ValueError("Exposure preview has missing or invalid groups")
            payload["exposure_groups"] = review_result["groups"]
            payload["exposure_source"] = review_result["source"]
            payload["exposure_review"] = {
                "input_text": reviewed["text"],
                "groups": review_result["groups"],
                "source": review_result["source"],
                "model": review_result.get("model"),
                "response_id": review_result.get("response_id"),
                "reviewed": True,
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
            }
        else:
            payload["exposure_groups"] = []
            payload["exposure_source"] = "none"
        result = run_model(payload, ingested=PORTFOLIO)
        result["owner_id"] = claims["sub"]
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    save_run(result)
    STORE[result["run_id"]] = result
    record = append_run(result)
    payload = _public(result)
    payload["audit_record"] = record
    return payload


@app.get("/api/runs/latest", dependencies=[Depends(require_auth)])
def latest_run(claims: dict = Depends(require_auth)):
    owner_id = claims["sub"]
    owned = [run for run in STORE.values() if run.get("owner_id") == owner_id]
    persisted = load_latest_run(owner_id)
    if persisted:
        owned.append(persisted)
    result = max(owned, key=lambda run: run["created_at"]) if owned else None
    result = result or STORE.get(SAMPLE_RUN_ID or "")
    if not result:
        raise HTTPException(404, "No run available")
    return _public(result)


@app.get("/api/runs/{run_id}", dependencies=[Depends(require_auth)])
def get_run(run_id: str, claims: dict = Depends(require_auth)):
    return _public(_owned_run(run_id, claims["sub"]))


@app.get("/api/runs/{run_id}/explain/{loc_id}", dependencies=[Depends(require_auth)])
def explain_location(run_id: str, loc_id: str, claims: dict = Depends(require_auth)):
    result = _owned_run(run_id, claims["sub"])
    explanation = result["explanations"].get(loc_id)
    if not explanation:
        raise HTTPException(404, "Unknown loc_id")
    location = next((row for row in result["locations"] if row["loc_id"] == loc_id), None)
    return {"location": location, **explanation}


@app.get("/api/audit", dependencies=[Depends(require_auth)])
def audit(limit: int = Query(40, ge=1, le=200), claims: dict = Depends(require_auth)):
    return {"ledger": read_ledger(limit, owner_id=claims["sub"]), "chain": verify_chain()}
