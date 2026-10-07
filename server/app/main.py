from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.audit.ledger import append_run, read_ledger, verify_chain
from app.engine.config_load import load_assumptions, load_parameters
from app.engine.ingestion import IngestedData, load_portfolio
from app.engine.pipeline import run_model
from app.engine.vulnerability import vulnerability_matrix
from app.schemas import RunRequest

STORE: dict[str, dict[str, Any]] = {}
PORTFOLIO: IngestedData | None = None
LATEST: str | None = None


def _public(result: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in result.items() if k != "explanations"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    global PORTFOLIO, LATEST
    PORTFOLIO = load_portfolio()
    result = run_model({"apply_drainage_correction": True, "free_text": ""}, ingested=PORTFOLIO)
    STORE[result["run_id"]] = result
    append_run(result)
    LATEST = result["run_id"]
    yield


app = FastAPI(title="Nairobi Urban Flood CAT · Team A", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "locations": PORTFOLIO.row_count if PORTFOLIO else 0, "latest_run_id": LATEST}


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


@app.post("/api/runs")
def create_run(body: RunRequest):
    global LATEST
    result = run_model(body.model_dump(), ingested=PORTFOLIO)
    STORE[result["run_id"]] = result
    record = append_run(result)
    LATEST = result["run_id"]
    payload = _public(result)
    payload["audit_record"] = record
    return payload


@app.get("/api/runs/latest")
def latest_run():
    if not LATEST or LATEST not in STORE:
        raise HTTPException(404, "No run available")
    return _public(STORE[LATEST])


@app.get("/api/runs/{run_id}")
def get_run(run_id: str):
    if run_id not in STORE:
        raise HTTPException(404, "Unknown run_id")
    return _public(STORE[run_id])


@app.get("/api/runs/{run_id}/explain/{loc_id}")
def explain_location(run_id: str, loc_id: str):
    if run_id not in STORE:
        raise HTTPException(404, "Unknown run_id")
    explanation = STORE[run_id]["explanations"].get(loc_id)
    if not explanation:
        raise HTTPException(404, "Unknown loc_id")
    location = next((row for row in STORE[run_id]["locations"] if row["loc_id"] == loc_id), None)
    return {"location": location, **explanation}


@app.get("/api/audit")
def audit(limit: int = 40):
    return {"ledger": read_ledger(limit), "chain": verify_chain()}
