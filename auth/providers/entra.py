"""
Microsoft Entra ID (Azure AD) OAuth provider.

Handles the full OAuth 2.0 authorization code flow against
Microsoft's identity platform.
"""
import os
import httpx

CLIENT_ID     = os.getenv("AZURE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET", "")
TENANT_ID     = os.getenv("AZURE_TENANT_ID", "")

AUTHORITY  = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES     = ["openid", "profile", "email", "User.Read"]
PROVIDER   = "entra"


def is_configured() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET and TENANT_ID)


def get_auth_url(redirect_uri: str, state: str) -> str:
    params = {
        "client_id":     CLIENT_ID,
        "response_type": "code",
        "redirect_uri":  redirect_uri,
        "response_mode": "query",
        "scope":         " ".join(SCOPES),
        "state":         state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{AUTHORITY}/oauth2/v2.0/authorize?{query}"


async def exchange_code(code: str, redirect_uri: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{AUTHORITY}/oauth2/v2.0/token",
            data={
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "code":          code,
                "redirect_uri":  redirect_uri,
                "grant_type":    "authorization_code",
                "scope":         " ".join(SCOPES),
            },
        )
        r.raise_for_status()
        return r.json()


async def get_user_profile(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        r.raise_for_status()
        data = r.json()
        return {
            "id":       data.get("id", ""),
            "email":    data.get("mail") or data.get("userPrincipalName", ""),
            "name":     data.get("displayName", ""),
            "provider": PROVIDER,
        }


def get_logout_url(post_logout_uri: str) -> str:
    return (
        f"{AUTHORITY}/oauth2/v2.0/logout"
        f"?post_logout_redirect_uri={post_logout_uri}"
    )
