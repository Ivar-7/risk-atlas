from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.paths import LEDGER_PATH, RUNS_DIR


def _canonical(payload: dict[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True, default=str)


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _tail_hash(path: Path) -> str:
    if not path.exists() or path.stat().st_size == 0:
        return "0" * 64
    last = ""
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                last = line
    if not last:
        return "0" * 64
    return json.loads(last)["entry_hash"]


def append_run(result: dict[str, Any]) -> dict[str, Any]:
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "run_id": result["run_id"],
        "created_at": result["created_at"],
        "model_version": result["model"]["version"],
        "controls": result["controls"],
        "input_hashes": result["input_hashes"],
        "metrics": result["metrics"],
        "ai_delta_1_in_100_kes": result["metrics"]["ai_delta_1_in_100_kes"],
        "prev_hash": _tail_hash(LEDGER_PATH),
    }
    record["entry_hash"] = _sha(record["prev_hash"] + _canonical(record))
    with LEDGER_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record) + "\n")
    slim = {k: v for k, v in result.items() if k != "explanations"}
    (RUNS_DIR / f"{result['run_id']}.json").write_text(_canonical(slim), encoding="utf-8")
    return record


def read_ledger(limit: int = 50) -> list[dict[str, Any]]:
    if not LEDGER_PATH.exists():
        return []
    rows = []
    with LEDGER_PATH.open(encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return list(reversed(rows[-limit:]))


def verify_chain() -> dict[str, Any]:
    rows = list(reversed(read_ledger(10_000)))
    prev = "0" * 64
    for i, row in enumerate(rows):
        if row["prev_hash"] != prev:
            return {"ok": False, "broken_at": i, "run_id": row.get("run_id")}
        body = {k: v for k, v in row.items() if k != "entry_hash"}
        expected = _sha(row["prev_hash"] + _canonical(body))
        if expected != row["entry_hash"]:
            return {"ok": False, "broken_at": i, "run_id": row.get("run_id"), "reason": "hash_mismatch"}
        prev = row["entry_hash"]
    return {"ok": True, "entries": len(rows), "verified_at": datetime.now(timezone.utc).isoformat()}
