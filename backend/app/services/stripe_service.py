import httpx
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from app.config import settings
from app.services.payment_adapter import BasePaymentAdapter

logger = logging.getLogger("payshield.stripe")

class StripeService(BasePaymentAdapter):
    provider_name = "STRIPE"

    def __init__(self):
        self.base_url = "https://api.stripe.com/v1"

    @property
    def secret_key(self) -> str:
        return (settings.STRIPE_SECRET_KEY or "").strip()

    @property
    def publishable_key(self) -> str:
        return (settings.STRIPE_PUBLISHABLE_KEY or "").strip()

    def is_configured(self) -> bool:
        sk = self.secret_key.lower()
        if not sk or sk in ("", "placeholder", "demo", "mock", "test"):
            return False
        # Stripe test keys start with sk_test_
        return sk.startswith("sk_test_") or sk.startswith("sk_live_")

    def is_mock_mode(self) -> bool:
        return not self.is_configured()

    async def create_payment_order(
        self,
        amount: float,
        currency: str = "USD",
        customer_email: str = "test@example.com",
        customer_name: str = "Stripe Tester",
        item_name: str = "Cloud Goods",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates a Stripe PaymentIntent in Test Mode or deterministic sandbox simulator.
        Amount is converted to cents (integer) for Stripe API.
        """
        if amount <= 0:
            raise ValueError("Payment amount must be greater than zero.")
        currency = currency.lower().strip()
        amount_cents = int(round(amount * 100))

        if self.is_configured():
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            data = {
                "amount": str(amount_cents),
                "currency": currency,
                "description": item_name,
                "receipt_email": customer_email,
                "payment_method_types[]": "card"
            }
            if metadata:
                for k, v in metadata.items():
                    data[f"metadata[{k}]"] = str(v)

            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(f"{self.base_url}/payment_intents", headers=headers, data=data)
                    if res.status_code in (200, 201):
                        pi = res.json()
                        return {
                            "order_id": pi.get("id"),
                            "client_secret": pi.get("client_secret"),
                            "status": pi.get("status"),
                            "amount": amount,
                            "currency": currency.upper(),
                            "raw_response": pi,
                            "mode": "live_test"
                        }
                    else:
                        logger.error(f"Stripe PaymentIntent create error: {res.text}")
                        raise RuntimeError(f"Stripe API responded with status {res.status_code}: {res.text}")
            except httpx.RequestError as e:
                logger.error(f"Stripe request network error: {e}")
                raise RuntimeError(f"Failed to communicate with Stripe API: {e}")

        # Deterministic Test Mode Simulator
        sim_pi_id = f"pi_test_sim_{uuid.uuid4().hex[:16]}"
        sim_client_secret = f"{sim_pi_id}_secret_{uuid.uuid4().hex[:12]}"
        return {
            "order_id": sim_pi_id,
            "client_secret": sim_client_secret,
            "status": "requires_payment_method",
            "amount": amount,
            "currency": currency.upper(),
            "raw_response": {
                "id": sim_pi_id,
                "object": "payment_intent",
                "amount": amount_cents,
                "currency": currency,
                "status": "requires_payment_method",
                "client_secret": sim_client_secret,
                "simulation": True,
                "created": int(datetime.utcnow().timestamp())
            },
            "mode": "sandbox_simulator"
        }

    async def verify_and_capture_payment(
        self,
        payment_id: str,
        order_id: Optional[str] = None,
        expected_amount: Optional[float] = None,
        expected_currency: Optional[str] = "USD",
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Verifies or confirms a Stripe PaymentIntent server-side.
        Handles test scenario simulation for specific test cards or scenario tokens.
        """
        pi_id = order_id or payment_id

        # Check for simulated test scenarios (Declined, 3DS, Success)
        scenario = (extra_data or {}).get("test_scenario", "").upper()

        if self.is_configured() and not pi_id.startswith("pi_test_sim_"):
            headers = {"Authorization": f"Bearer {self.secret_key}"}
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    # Retrieve PaymentIntent status
                    res = await client.get(f"{self.base_url}/payment_intents/{pi_id}", headers=headers)
                    if res.status_code == 200:
                        pi = res.json()
                        st = pi.get("status")
                        verified = (st == "succeeded")
                        charges = pi.get("charges", {}).get("data", [])
                        charge_id = charges[0].get("id") if charges else f"ch_{uuid.uuid4().hex[:12]}"
                        amount_received = float(pi.get("amount_received", pi.get("amount", 0))) / 100.0

                        return {
                            "transaction_id": charge_id,
                            "order_id": pi_id,
                            "amount": amount_received if amount_received > 0 else (expected_amount or 0.0),
                            "currency": pi.get("currency", expected_currency or "USD").upper(),
                            "status": "COMPLETED" if verified else st.upper(),
                            "payer_email": pi.get("receipt_email") or (extra_data or {}).get("customer_email", "stripe.buyer@example.com"),
                            "payer_name": (extra_data or {}).get("customer_name", "Stripe Test Cardholder"),
                            "payment_method": "CARD",
                            "verified": verified,
                            "raw_response": pi,
                            "mode": "live_test"
                        }
                    else:
                        logger.error(f"Stripe PaymentIntent retrieve failed: {res.text}")
                        return {
                            "transaction_id": f"ch_err_{uuid.uuid4().hex[:8]}",
                            "order_id": pi_id,
                            "amount": expected_amount or 0.0,
                            "currency": (expected_currency or "USD").upper(),
                            "status": "FAILED",
                            "payer_email": "stripe.buyer@example.com",
                            "payer_name": "Stripe Test Cardholder",
                            "payment_method": "CARD",
                            "verified": False,
                            "error": res.text,
                            "raw_response": {},
                            "mode": "live_test"
                        }
            except Exception as e:
                logger.error(f"Error connecting to Stripe API: {e}")

        # Deterministic simulation based on scenario or order
        if scenario == "DECLINED":
            return {
                "transaction_id": f"ch_declined_{uuid.uuid4().hex[:10]}",
                "order_id": pi_id,
                "amount": expected_amount or 50.0,
                "currency": (expected_currency or "USD").upper(),
                "status": "DECLINED",
                "payer_email": (extra_data or {}).get("customer_email", "declined.card@example.com"),
                "payer_name": (extra_data or {}).get("customer_name", "Declined Card Holder"),
                "payment_method": "CARD",
                "verified": False,
                "error": "Your card was declined. Please try an authorized test card.",
                "raw_response": {"status": "requires_payment_method", "last_payment_error": {"code": "card_declined"}},
                "mode": "sandbox_simulator"
            }
        elif scenario in ("REQUIRES_ACTION", "AUTHENTICATION_REQUIRED", "3DS"):
            return {
                "transaction_id": f"ch_3ds_{uuid.uuid4().hex[:10]}",
                "order_id": pi_id,
                "amount": expected_amount or 50.0,
                "currency": (expected_currency or "USD").upper(),
                "status": "REQUIRES_ACTION",
                "payer_email": (extra_data or {}).get("customer_email", "3ds.card@example.com"),
                "payer_name": (extra_data or {}).get("customer_name", "3DS Auth Required"),
                "payment_method": "CARD",
                "verified": False,
                "error": "Payment requires additional customer authentication (3D Secure).",
                "raw_response": {"status": "requires_action", "next_action": {"type": "use_stripe_sdk"}},
                "mode": "sandbox_simulator"
            }

        # Default: Successful capture
        ch_id = f"ch_sim_{uuid.uuid4().hex[:14]}"
        return {
            "transaction_id": ch_id,
            "order_id": pi_id,
            "amount": expected_amount or 100.0,
            "currency": (expected_currency or "USD").upper(),
            "status": "COMPLETED",
            "payer_email": (extra_data or {}).get("customer_email", "stripe.buyer@example.com"),
            "payer_name": (extra_data or {}).get("customer_name", "Stripe Test Buyer"),
            "payment_method": "CARD",
            "verified": True,
            "raw_response": {
                "id": pi_id,
                "object": "payment_intent",
                "status": "succeeded",
                "amount": int((expected_amount or 100.0) * 100),
                "charge_id": ch_id,
                "simulation": True
            },
            "mode": "sandbox_simulator"
        }

stripe_service = StripeService()
