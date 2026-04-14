from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
import secrets
import sys

sys.path.insert(0, "/app")

from auth.auth_service import (
    get_auth_url, exchange_code, get_user_profile,
    create_session_token, verify_session_token,
    get_logout_url, is_configured, get_provider_name,
    FRONTEND_URL,
)

router = APIRouter()
_pending_states: set[str] = set()


@router.get("/status")
async def auth_status():
    return {
        "configured": is_configured(),
        "provider":   get_provider_name() if is_configured() else None,
    }


@router.get("/login")
async def login():
    if not is_configured():
        raise HTTPException(status_code=503, detail="Auth not configured")
    state = secrets.token_urlsafe(32)
    _pending_states.add(state)
    return RedirectResponse(get_auth_url(state))


@router.get("/callback")
async def callback(code: str = None, state: str = None, error: str = None):
    if error:
        return RedirectResponse(f"{FRONTEND_URL}/auth-error?reason={error}")
    if not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/auth-error?reason=missing_params")
    if state not in _pending_states:
        return RedirectResponse(f"{FRONTEND_URL}/auth-error?reason=invalid_state")
    _pending_states.discard(state)

    try:
        tokens  = await exchange_code(code)
        profile = await get_user_profile(tokens["access_token"])
        session = create_session_token(profile)
    except Exception as e:
        print(f"Token exchange error: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/auth-error?reason=token_exchange_failed")

    # Pass token as query param — frontend reads it, stores in localStorage
    return RedirectResponse(f"{FRONTEND_URL}/auth/success?token={session}")


@router.get("/me")
async def me(request: Request):
    user = _extract_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.post("/logout")
async def logout():
    return JSONResponse({"logout_url": get_logout_url()})


def _extract_user(request: Request) -> dict | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return verify_session_token(auth[7:])