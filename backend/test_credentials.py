import httpx, base64, asyncio, sys, os
from app.config import settings

CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", settings.PAYPAL_CLIENT_ID)
CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", settings.PAYPAL_CLIENT_SECRET)
BASE_URL = settings.PAYPAL_BASE_URL.rstrip('/')

async def test_oauth():
    auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
    encoded = base64.b64encode(auth_str.encode()).decode()
    headers = {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            f"{BASE_URL}/v1/oauth2/token",
            headers=headers,
            data={"grant_type": "client_credentials"}
        )
        if res.status_code == 200:
            data = res.json()
            token_preview = data["access_token"][:24] + "..."
            expires = data.get("expires_in", "?")
            app_id = data.get("app_id", "?")
            scopes = data.get("scope", "").split()
            print("[OK] PayPal Sandbox OAuth SUCCESS")
            print(f"     Token prefix : {token_preview}")
            print(f"     Expires in   : {expires}s")
            print(f"     App ID       : {app_id}")
            print(f"     Scope count  : {len(scopes)} permissions granted")
            return data["access_token"]
        else:
            try:
                err = res.json()
                print(f"[FAIL] Status {res.status_code}: {err.get('error')} - {err.get('error_description')}")
            except Exception:
                print(f"[FAIL] Status {res.status_code}: non-JSON response")
            sys.exit(1)

async def test_create_order(token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": "PAYSHIELD-CRED-TEST",
            "description": "PayShield Credential Verification",
            "amount": {"currency_code": "USD", "value": "10.00"}
        }]
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            f"{BASE_URL}/v2/checkout/orders",
            headers=headers,
            json=payload
        )
        if res.status_code in (200, 201):
            data = res.json()
            order_id = data.get("id")
            status = data.get("status")
            print(f"\n[OK] PayPal Order Creation SUCCESS")
            print(f"     Order ID : {order_id}")
            print(f"     Status   : {status}")
            links = {l["rel"]: l["href"] for l in data.get("links", [])}
            approve_url = links.get("approve", "N/A")
            print(f"     Approve  : {approve_url[:60]}...")
            return order_id
        else:
            try:
                err = res.json()
                print(f"[FAIL] Order creation Status {res.status_code}: {err}")
            except Exception:
                print(f"[FAIL] Order creation Status {res.status_code}: non-JSON")
            sys.exit(1)

async def main():
    print("=" * 60)
    print("PayShield AI — PayPal Sandbox Credential Verification")
    print("=" * 60)
    token = await test_oauth()
    order_id = await test_create_order(token)
    print("\n" + "=" * 60)
    print("[RESULT] Credentials are VALID and WORKING")
    print("         - OAuth token obtained successfully")
    print("         - Order creation API accessible")
    print("         - Ready for real sandbox checkout flow")
    print("=" * 60)

asyncio.run(main())
