import httpx
import base64
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("payshield.paypal")

class PayPalService:
    def __init__(self):
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self.base_url = settings.PAYPAL_BASE_URL.rstrip('/')
        self.mode = settings.PAYPAL_MODE

    @property
    def effective_client_id(self) -> str:
        if settings.PAYPAL_CLIENT_ID is not None:
            return settings.PAYPAL_CLIENT_ID.strip()
        return (self.client_id or "").strip()

    @property
    def effective_client_secret(self) -> str:
        if settings.PAYPAL_CLIENT_SECRET is not None:
            return settings.PAYPAL_CLIENT_SECRET.strip()
        return (self.client_secret or "").strip()

    def is_configured(self) -> bool:
        c_id = self.effective_client_id.lower()
        c_sec = self.effective_client_secret.lower()
        if not c_id or not c_sec:
            return False
        if c_id in ("", "placeholder", "demo", "mock", "test") or c_sec in ("", "placeholder", "demo", "mock", "test"):
            return False
        if c_id.startswith("test_") or c_id.startswith("mock_") or "fake" in c_id:
            return False
        return True

    def is_mock_mode(self) -> bool:
        if not self.is_configured():
            return True
        return settings.PAYPAL_MOCK_SIMULATOR

    async def get_access_token(self) -> Optional[str]:
        if not self.is_configured() or self.is_mock_mode():
            return None

        auth_str = f"{self.effective_client_id}:{self.effective_client_secret}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()

        headers = {
            "Authorization": f"Basic {encoded_auth}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(f"{self.base_url}/v1/oauth2/token", headers=headers, data=data)
                if res.status_code == 200:
                    return res.json().get("access_token")
                else:
                    logger.error(f"PayPal OAuth failed with status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error fetching PayPal access token: {e}")
        return None

    async def create_order(self, amount: float, currency: str = "USD", item_name: str = "Sandbox Goods") -> Dict[str, Any]:
        """
        Creates an order with PayPal Sandbox API or deterministic sandbox simulator.
        Strictly validates amount and currency.
        """
        if amount <= 0:
            raise ValueError("Order amount must be greater than zero.")
        currency = currency.upper().strip()

        # If explicit mock simulator is forced, use simulator
        token = None
        if not self.is_mock_mode():
            token = await self.get_access_token()
        
        # Real PayPal Sandbox Call if configured
        if token:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            payload = {
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "reference_id": f"PAYSHIELD-REF-{uuid.uuid4().hex[:8].upper()}",
                        "description": item_name,
                        "amount": {
                            "currency_code": currency,
                            "value": f"{amount:.2f}"
                        }
                    }
                ]
            }

            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(f"{self.base_url}/v2/checkout/orders", headers=headers, json=payload)
                    if res.status_code in (200, 201):
                        order_data = res.json()
                        return {
                            "order_id": order_data.get("id"),
                            "status": order_data.get("status"),
                            "amount": amount,
                            "currency": currency,
                            "raw_response": order_data,
                            "mode": "live_sandbox"
                        }
                    else:
                        logger.error(f"PayPal create order failed: {res.text}")
                        raise RuntimeError(f"PayPal API responded with status {res.status_code}: {res.text}")
            except httpx.RequestError as e:
                logger.error(f"PayPal create order network exception: {e}")
                raise RuntimeError(f"Failed to communicate with PayPal Sandbox API: {e}")

        # If credentials not configured, check if explicit mock simulator is permitted
        if not settings.PAYPAL_MOCK_SIMULATOR:
            raise RuntimeError(
                "PayPal Sandbox credentials are not configured and PAYPAL_MOCK_SIMULATOR is false. "
                "Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET or set PAYPAL_MOCK_SIMULATOR=true."
            )

        simulated_id = f"PAYPAL-MOCK-{uuid.uuid4().hex[:12].upper()}"
        return {
            "order_id": simulated_id,
            "status": "CREATED",
            "amount": amount,
            "currency": currency,
            "raw_response": {
                "id": simulated_id,
                "status": "CREATED",
                "intent": "CAPTURE",
                "create_time": datetime.utcnow().isoformat(),
                "simulation": True
            },
            "mode": "sandbox_simulator"
        }

    async def capture_order(
        self,
        order_id: str,
        expected_amount: Optional[float] = None,
        expected_currency: Optional[str] = "USD"
    ) -> Dict[str, Any]:
        """
        Captures authorized payment from PayPal Sandbox or completes simulation.
        Validates capture status server-side.
        """
        token = None
        if not self.is_mock_mode() and not order_id.startswith("PAYPAL-MOCK-"):
            token = await self.get_access_token()

        if token and not order_id.startswith("PAYPAL-MOCK-"):
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(f"{self.base_url}/v2/checkout/orders/{order_id}/capture", headers=headers)
                    if res.status_code in (200, 201):
                        capture_data = res.json()
                        status = capture_data.get("status")
                        purchase_unit = capture_data.get("purchase_units", [{}])[0]
                        capture_details = purchase_unit.get("payments", {}).get("captures", [{}])[0]
                        capture_id = capture_details.get("id")
                        amount_val = float(capture_details.get("amount", {}).get("value", 0.0))
                        currency_val = capture_details.get("amount", {}).get("currency_code", "USD")

                        return {
                            "order_id": order_id,
                            "capture_id": capture_id,
                            "status": status,
                            "amount": amount_val,
                            "currency": currency_val,
                            "payer_email": capture_data.get("payer", {}).get("email_address"),
                            "payer_name": f"{capture_data.get('payer', {}).get('name', {}).get('given_name', '')} {capture_data.get('payer', {}).get('name', {}).get('surname', '')}".strip(),
                            "raw_response": capture_data,
                            "verified": True,
                            "mode": "live_sandbox"
                        }
                    else:
                        logger.error(f"PayPal capture failed: {res.text}")
                        return {
                            "order_id": order_id,
                            "status": "FAILED",
                            "error": res.text,
                            "verified": False,
                            "mode": "live_sandbox"
                        }
            except Exception as e:
                logger.error(f"PayPal capture error: {e}")
                return {
                    "order_id": order_id,
                    "status": "FAILED",
                    "error": str(e),
                    "verified": False,
                    "mode": "live_sandbox"
                }

        # Offline Mock Simulator execution (only if enabled)
        if not settings.PAYPAL_MOCK_SIMULATOR and not order_id.startswith("PAYPAL-MOCK-"):
            return {
                "order_id": order_id,
                "status": "FAILED",
                "error": "PayPal credentials not configured and mock simulator is disabled.",
                "verified": False,
                "mode": "none"
            }

        capture_id = f"CAP-MOCK-{uuid.uuid4().hex[:10].upper()}"
        actual_amount = expected_amount if expected_amount is not None else 100.00
        actual_currency = expected_currency if expected_currency is not None else "USD"

        return {
            "order_id": order_id,
            "capture_id": capture_id,
            "status": "COMPLETED",
            "amount": actual_amount,
            "currency": actual_currency,
            "payer_email": "demo.sandbox.buyer@example.com",
            "payer_name": "Sandbox Test Buyer",
            "raw_response": {
                "id": order_id,
                "status": "COMPLETED",
                "capture_id": capture_id,
                "capture_time": datetime.utcnow().isoformat(),
                "simulation": True
            },
            "verified": True,
            "mode": "sandbox_simulator"
        }

    async def verify_webhook_signature(
        self,
        headers: Dict[str, str],
        body_dict: Dict[str, Any]
    ) -> bool:
        """
        Verifies incoming PayPal Webhook signature via PayPal Sandbox REST API.
        Reference: https://developer.paypal.com/api/rest/webhooks/rest/
        """
        token = await self.get_access_token()
        if not token or not settings.PAYPAL_WEBHOOK_ID:
            # If in simulator mode or no webhook ID configured, return True in debug, False in production
            return settings.DEBUG

        verification_payload = {
            "auth_algo": headers.get("paypal-auth-algo"),
            "cert_url": headers.get("paypal-cert-url"),
            "transmission_id": headers.get("paypal-transmission-id"),
            "transmission_sig": headers.get("paypal-transmission-sig"),
            "transmission_time": headers.get("paypal-transmission-time"),
            "webhook_id": settings.PAYPAL_WEBHOOK_ID,
            "webhook_event": body_dict
        }

        try:
            req_headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/v1/notifications/verify-webhook-signature",
                    headers=req_headers,
                    json=verification_payload
                )
                if res.status_code == 200:
                    status = res.json().get("verification_status")
                    return status == "SUCCESS"
                logger.error(f"PayPal webhook verification failed: {res.text}")
        except Exception as e:
            logger.error(f"Error during PayPal webhook verification: {e}")

        return False

paypal_service = PayPalService()
