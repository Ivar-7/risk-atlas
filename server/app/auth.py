"""Verify Clerk session tokens before exposing model and document data."""

from __future__ import annotations

from functools import lru_cache
import os

import jwt
from fastapi import HTTPException, Request


@lru_cache(maxsize=4)
def _jwks_client(url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(url, timeout=5)


def verify_session(token: str) -> dict:
    issuer = os.getenv("CLERK_ISSUER", "").strip().rstrip("/")
    if not issuer.startswith("https://"):
        raise HTTPException(503, "Clerk token verification is not configured")
    public_key = os.getenv("CLERK_JWT_KEY", "").replace("\\n", "\n").strip()
    try:
        key = public_key or _jwks_client(f"{issuer}/.well-known/jwks.json").get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"require": ["exp", "nbf", "iat", "iss", "sub", "sid"]},
            leeway=5,
        )
    except jwt.PyJWKClientConnectionError as exc:
        raise HTTPException(503, "Clerk signing keys are unavailable") from exc
    except (jwt.PyJWKClientError, jwt.InvalidTokenError, ValueError) as exc:
        raise HTTPException(401, "Invalid or expired session token") from exc
    allowed_origins = {
        origin.strip().rstrip("/")
        for origin in os.getenv("RISK_ATLAS_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    }
    if claims.get("azp") and claims["azp"].rstrip("/") not in allowed_origins:
        raise HTTPException(401, "Session token has an unauthorized origin")
    if claims.get("sts") == "pending":
        raise HTTPException(403, "Complete sign-in before accessing the model")
    return claims


def require_auth(request: Request) -> dict:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(401, "Sign in to access the model API")
    return verify_session(token.strip())
