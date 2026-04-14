"""
FastAPI dependency for route protection.

Usage in any router:
    from auth.auth_deps import require_auth

    @router.get("/protected")
    async def route(user = Depends(require_auth)):
        return {"user": user["email"]}

Dev mode (no provider configured):
    Returns a dev user so the app works without OAuth credentials.
    Never bypasses auth in production — is_configured() checks env vars.
"""
import sys
sys.path.insert(0, "/app")

from fastapi import Request, HTTPException
from auth.auth_service import verify_session_token, is_configured

DEV_USER = {
    "sub":      "dev-local",
    "email":    "dev@localhost",
    "name":     "Dev User",
    "provider": "none",
    "dev":      True,
}


def require_auth(request: Request) -> dict:
    """Require a valid session. Bypasses in dev mode."""
    if not is_configured():
        return DEV_USER

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = verify_session_token(auth[7:])
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Session expired — please sign in again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user(request: Request) -> dict | None:
    """Soft version — returns None if not authenticated."""
    if not is_configured():
        return DEV_USER
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return verify_session_token(auth[7:])
