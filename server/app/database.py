"""PostgreSQL persistence for Neon-backed accounts and model runs."""

from __future__ import annotations

import json
import os
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

import psycopg
from dotenv import load_dotenv
from psycopg.types.json import Jsonb


SCHEMA_PATH = Path(__file__).resolve().parent.parent / "migrations" / "001_initial.sql"
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def configured() -> bool:
    return bool(os.getenv("DATABASE_URL", "").strip())


@contextmanager
def connect() -> Iterator[psycopg.Connection]:
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError("DATABASE_URL is not configured")
    if not url.startswith(("postgres://", "postgresql://")):
        raise RuntimeError("DATABASE_URL must be a PostgreSQL connection string")
    with psycopg.connect(url, connect_timeout=10, sslmode="require") as connection:
        yield connection


def initialize() -> None:
    if not configured():
        return
    statements = [part.strip() for part in SCHEMA_PATH.read_text(encoding="utf-8").split(";") if part.strip()]
    with connect() as connection:
        for statement in statements:
            connection.execute(statement)


def save_run(result: dict[str, Any]) -> None:
    if not configured():
        return
    with connect() as connection:
        connection.execute(
            """INSERT INTO model_runs (run_id, created_at, result)
               VALUES (%s, %s, %s)
               ON CONFLICT (run_id) DO NOTHING""",
            (result["run_id"], result["created_at"], Jsonb(result, dumps=lambda value: json.dumps(value, default=str))),
        )


def load_run(run_id: str) -> dict[str, Any] | None:
    if not configured():
        return None
    with connect() as connection:
        row = connection.execute("SELECT result FROM model_runs WHERE run_id = %s", (run_id,)).fetchone()
    return row[0] if row else None


def load_latest_run() -> dict[str, Any] | None:
    if not configured():
        return None
    with connect() as connection:
        row = connection.execute("SELECT result FROM model_runs ORDER BY created_at DESC LIMIT 1").fetchone()
    return row[0] if row else None
