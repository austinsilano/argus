"""
Okta OAuth provider.

To activate:
  1. Create an Okta app at developer.okta.com
  2. Set these env vars:
       OKTA_CLIENT_ID
       OKTA_CLIENT_SECRET
       OKTA_DOMAIN          (e.g. yourorg.okta.com)
  3. Set AUTH_PROVIDER=okta in .env
  4. Add redirect URI in Okta app settings:
       http://localhost:8000/api/auth/callback  (local)
       https://argus.yourteam.com/api/auth/callback  (prod)

Okta can be federated with Entra ID — if your org already uses
Okta as the identity layer in front of O365, use Okta here.
If your org uses Entra ID directly, use the entra provider.
"""
import os
import httpx

CLIENT_ID     = os.getenv("OKTA_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("OKTA_CLIENT_SECRET", "")
DOMAIN        = os.getenv("OKTA_DOMAIN", "")   # e.g. yourorg.okta.com

SCOPES   = ["openid", "profile", "email"]
PROVIDER = "okta"


def is_configured() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET and DOMAIN)


def get_auth_url(redirect_uri: str, state: str) -> str:
    params = {
        "client_id":     CLIENT_ID,
        "response_type": "code",
        "redirect_uri":  redirect_uri,
        "response_mode": "query",
        "scope":         " ".join(SCOPES),
        "state":         state,
        "nonce":         state,  # Okta requires nonce
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"https://{DOMAIN}/oauth2/v1/authorize?{query}"


async def exchange_code(code: str, redirect_uri: str) -> dict:
    import base64
    credentials = base64.b64encode(
        f"{CLIENT_ID}:{CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"https://{DOMAIN}/oauth2/v1/token",
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type":  "application/x-www-form-urlencoded",
            },
            data={
                "grant_type":   "authorization_code",
                "code":         code,
                "redirect_uri": redirect_uri,
            },
        )
        r.raise_for_status()
        return r.json()


async def get_user_profile(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://{DOMAIN}/oauth2/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        r.raise_for_status()
        data = r.json()
        return {
            "id":       data.get("sub", ""),
            "email":    data.get("email", ""),
            "name":     data.get("name", ""),
            "provider": PROVIDER,
        }


def get_logout_url(post_logout_uri: str) -> str:
    return (
        f"https://{DOMAIN}/oauth2/v1/logout"
        f"?post_logout_redirect_uri={post_logout_uri}"
    )
