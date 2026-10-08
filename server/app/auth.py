"""Password and cookie-session authentication stored in PostgreSQL."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from psycopg.errors import UniqueViolation

from app.database import connect


SESSION_DAYS = 7
PASSWORD_HASHER = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)


def _public_user(row: tuple) -> dict:
    return {"id": str(row[0]), "full_name": row[1], "email": row[2]}


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def register_user(full_name: str, email: str, password: str) -> dict | None:
    user_id = uuid4()
    password_hash = PASSWORD_HASHER.hash(password)
    try:
        with connect() as connection:
            row = connection.execute(
                """INSERT INTO app_users (id, full_name, email, password_hash)
                   VALUES (%s, %s, %s, %s) RETURNING id, full_name, email""",
                (user_id, full_name.strip(), email.strip().lower(), password_hash),
            ).fetchone()
    except UniqueViolation:
        return None
    return _public_user(row)


def authenticate(email: str, password: str) -> dict | None:
    with connect() as connection:
        row = connection.execute(
            "SELECT id, full_name, email, password_hash FROM app_users WHERE email = %s",
            (email.strip().lower(),),
        ).fetchone()
    if not row:
        return None
    try:
        PASSWORD_HASHER.verify(row[3], password)
    except (VerifyMismatchError, InvalidHashError):
        return None
    return _public_user(row)


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    with connect() as connection:
        connection.execute("DELETE FROM auth_sessions WHERE expires_at <= now()")
        connection.execute(
            "INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (%s, %s, %s)",
            (_token_hash(token), user_id, expires_at),
        )
    return token


def session_user(token: str | None) -> dict | None:
    if not token:
        return None
    with connect() as connection:
        row = connection.execute(
            """SELECT u.id, u.full_name, u.email FROM auth_sessions s
               JOIN app_users u ON u.id = s.user_id
               WHERE s.token_hash = %s AND s.expires_at > now()""",
            (_token_hash(token),),
        ).fetchone()
    return _public_user(row) if row else None


def delete_session(token: str | None) -> None:
    if not token:
        return
    with connect() as connection:
        connection.execute("DELETE FROM auth_sessions WHERE token_hash = %s", (_token_hash(token),))
