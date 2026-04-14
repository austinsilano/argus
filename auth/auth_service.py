"""
Provider-agnostic auth orchestration.

Reads AUTH_PROVIDER env var to decide which provider to use.
All other auth code imports from here — never directly from providers.

Switching providers:
  .env: AUTH_PROVIDER=okta   → uses Okta
  .env: AUTH_PROVIDER=entra  → uses Microsoft Entra ID (default)
"""
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt

AUTH_PROVIDER  = os.getenv("AUTH_PROVIDER", "entra").lower()
REDIRECT_URI   = os.getenv("AUTH_REDIRECT_URI", "http://localhost:8000/api/auth/callback")
FRONTEND_URL   = os.getenv("FRONTEND_URL", "http://localhost:3000")
JWT_SECRET     = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM  = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "8"))


def _get_provider():
    if AUTH_PROVIDER == "okta":
        from auth.providers import okta
        return okta
    else:
        from auth.providers import entra
        return entra


def is_configured() -> bool:
    return _get_provider().is_configured()


def get_provider_name() -> str:
    return AUTH_PROVIDER


def get_auth_url(state: str) -> str:
    return _get_provider().get_auth_url(REDIRECT_URI, state)


async def exchange_code(code: str) -> dict:
    return await _get_provider().exchange_code(code, REDIRECT_URI)


async def get_user_profile(access_token: str) -> dict:
    return await _get_provider().get_user_profile(access_token)


def get_logout_url() -> str:
    return _get_provider().get_logout_url(FRONTEND_URL)


def create_session_token(user: dict) -> str:
    payload = {
        "sub":      user.get("id", ""),
        "email":    user.get("email", ""),
        "name":     user.get("name", ""),
        "provider": user.get("provider", AUTH_PROVIDER),
        "exp":      datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat":      datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_session_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None
