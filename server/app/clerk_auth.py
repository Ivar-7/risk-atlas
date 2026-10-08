"""Verify Clerk sessions before serving model data."""

from __future__ import annotations

import os

from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from fastapi import HTTPException, Request


def require_auth(request: Request) -> None:
    secret_key = os.getenv("CLERK_SECRET_KEY", "").strip()
    if not secret_key:
        raise HTTPException(503, "Clerk is not configured on the API")
    parties = [value.strip() for value in os.getenv(
        "CLERK_AUTHORIZED_PARTIES",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
    ).split(",") if value.strip()]
    state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=secret_key,
            authorized_parties=parties,
            accepts_token=["session_token"],
        ),
    )
    if not state.is_signed_in:
        raise HTTPException(401, "Sign in to access the model", headers={"WWW-Authenticate": "Bearer"})
