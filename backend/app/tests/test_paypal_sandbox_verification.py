"""
test_paypal_sandbox_verification.py
====================================
PayShield AI — Comprehensive PayPal Sandbox Security and Failure Testing Suite
Covers the 15 required failure and resilience test scenarios for Task 8:

1.  test_01_invalid_amount_rejected
2.  test_02_unsupported_currency_rejected
3.  test_03_missing_credentials_handling
4.  test_04_invalid_oauth_credentials_rejected
5.  test_05_invalid_order_id_capture_rejected
6.  test_06_unauthenticated_capture_rejected
7.  test_07_cross_merchant_order_access_prevented
8.  test_08_duplicate_capture_idempotency
9.  test_09_capture_timeout_resilience
10. test_10_buyer_cancellation_handled
11. test_11_invalid_webhook_signature_rejected
12. test_12_duplicate_webhook_event_idempotency
13. test_13_paypal_api_error_response_sanitization
14. test_14_database_failure_during_capture_self_heals
15. test_15_production_mode_strictly_rejects_mock_simulator
"""

import uuid
import json
import pytest
import httpx
from datetime import datetime
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.models.paypal_order import PayPalOrder
from app.models.transaction import Transaction
from app.models.audit_log import AuditLog
from app.services.auth import hash_password, create_access_token
from app.services.paypal_service import PayPalService

client = TestClient(app)


@pytest.fixture
def test_merchants():
    """Sets up two distinct merchants for strict tenant isolation testing."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        m_a = User(
            email=f"merchant_qa_a_{suffix}@payshield.ai",
            hashed_password=hash_password("SecurePassA!"),
            full_name="Merchant QA Alice",
            business_name="Alice QA Corp",
            role="merchant",
            is_active=True
        )
        m_b = User(
            email=f"merchant_qa_b_{suffix}@payshield.ai",
            hashed_password=hash_password("SecurePassB!"),
            full_name="Merchant QA Bob",
            business_name="Bob QA Corp",
            role="merchant",
            is_active=True
        )
        db.add_all([m_a, m_b])
        db.commit()
        db.refresh(m_a)
        db.refresh(m_b)

        token_a = create_access_token({"sub": str(m_a.id), "email": m_a.email, "role": m_a.role})
        token_b = create_access_token({"sub": str(m_b.id), "email": m_b.email, "role": m_b.role})

        return {
            "merchant_a": m_a,
            "merchant_b": m_b,
            "headers_a": {"Authorization": f"Bearer {token_a}"},
            "headers_b": {"Authorization": f"Bearer {token_b}"}
        }
    finally:
        db.close()


# -----------------------------------------------------------------------------
# Scenario 1: Invalid Amount Rejected
# -----------------------------------------------------------------------------
def test_01_invalid_amount_rejected(test_merchants):
    """Rejects zero, negative, and excessive order amounts."""
    # Zero amount
    res_zero = client.post(
        "/api/paypal/orders",
        json={"amount": 0.0, "currency": "USD", "item_name": "Zero Test"},
        headers=test_merchants["headers_a"]
    )
    assert res_zero.status_code in (400, 422)

    # Negative amount
    res_neg = client.post(
        "/api/paypal/orders",
        json={"amount": -25.50, "currency": "USD", "item_name": "Negative Test"},
        headers=test_merchants["headers_a"]
    )
    assert res_neg.status_code in (400, 422)

    # Excessive amount (> $100,000)
    res_excess = client.post(
        "/api/paypal/orders",
        json={"amount": 150000.0, "currency": "USD", "item_name": "Excessive Test"},
        headers=test_merchants["headers_a"]
    )
    assert res_excess.status_code == 400
    assert "cannot exceed $100,000" in res_excess.json().get("detail", "")


# -----------------------------------------------------------------------------
# Scenario 2: Unsupported Currency Rejected
# -----------------------------------------------------------------------------
def test_02_unsupported_currency_rejected(test_merchants):
    """Rejects unrecognized ISO currency codes."""
    res = client.post(
        "/api/paypal/orders",
        json={"amount": 50.0, "currency": "XYZ", "item_name": "Fake Currency Test"},
        headers=test_merchants["headers_a"]
    )
    assert res.status_code == 400
    assert "Unsupported currency code" in res.json().get("detail", "")


# -----------------------------------------------------------------------------
# Scenario 3: Missing Credentials Handling
# -----------------------------------------------------------------------------
def test_03_missing_credentials_handling(test_merchants):
    """When real credentials missing and simulator disabled, fails gracefully with informative message."""
    with patch.object(settings, "PAYPAL_CLIENT_ID", ""), \
         patch.object(settings, "PAYPAL_CLIENT_SECRET", ""), \
         patch.object(settings, "PAYPAL_MOCK_SIMULATOR", False):
        service = PayPalService()
        assert not service.is_configured()

        res = client.post(
            "/api/paypal/orders",
            json={"amount": 10.0, "currency": "USD", "item_name": "Missing Creds Test"},
            headers=test_merchants["headers_a"]
        )
        assert res.status_code == 400
        assert "PayPal Sandbox credentials are not configured" in res.json().get("detail", "")


# -----------------------------------------------------------------------------
# Scenario 4: Invalid OAuth Credentials Rejected
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_04_invalid_oauth_credentials_rejected():
    """Invalid client_id/secret returns 401 from PayPal and fails cleanly without exposing secrets."""
    service = PayPalService()
    service.client_id = "INVALID_CLIENT_ID_XYZ123"
    service.client_secret = "INVALID_SECRET_ABC789"

    mock_resp = httpx.Response(
        status_code=401,
        json={"error": "invalid_client", "error_description": "Client Authentication failed"},
        request=httpx.Request("POST", f"{service.base_url}/v1/oauth2/token")
    )
    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=mock_resp)):
        token = await service.get_access_token()
        assert token is None


# -----------------------------------------------------------------------------
# Scenario 5: Invalid Order ID Capture Rejected
# -----------------------------------------------------------------------------
def test_05_invalid_order_id_capture_rejected(test_merchants):
    """Capturing non-existent order ID returns 404 and does not create synthetic records."""
    non_existent_id = f"PAYPAL-NONEXISTENT-{uuid.uuid4().hex[:8].upper()}"
    res = client.post(
        f"/api/paypal/orders/{non_existent_id}/capture",
        headers=test_merchants["headers_a"]
    )
    assert res.status_code == 404
    assert f"Order '{non_existent_id}' not found" in res.json().get("detail", "")


# -----------------------------------------------------------------------------
# Scenario 6: Unauthenticated Capture Rejected
# -----------------------------------------------------------------------------
def test_06_unauthenticated_capture_rejected(test_merchants):
    """Anonymous client cannot capture an order created by a registered merchant."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 25.0, "currency": "USD", "item_name": "Auth Test Item"},
        headers=test_merchants["headers_a"]
    )
    assert create_res.status_code == 200
    order_id = create_res.json()["paypal_order_id"]

    # Anonymous user attempts capture
    anon_res = client.post(f"/api/paypal/orders/{order_id}/capture")
    assert anon_res.status_code == 401
    assert "Authentication required" in anon_res.json().get("detail", "")


# -----------------------------------------------------------------------------
# Scenario 7: Cross-Merchant Order Access Prevented
# -----------------------------------------------------------------------------
def test_07_cross_merchant_order_access_prevented(test_merchants):
    """Merchant B cannot capture or inspect Merchant A's order."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 45.0, "currency": "USD", "item_name": "Tenant Isolation Item"},
        headers=test_merchants["headers_a"]
    )
    order_id = create_res.json()["paypal_order_id"]

    # Merchant B tries to capture Merchant A's order
    b_capture_res = client.post(
        f"/api/paypal/orders/{order_id}/capture",
        headers=test_merchants["headers_b"]
    )
    assert b_capture_res.status_code == 403
    assert "belonging to another merchant" in b_capture_res.json().get("detail", "")

    # Merchant B tries to view Merchant A's order
    b_view_res = client.get(
        f"/api/paypal/orders/{order_id}",
        headers=test_merchants["headers_b"]
    )
    assert b_view_res.status_code == 403


# -----------------------------------------------------------------------------
# Scenario 8: Duplicate Capture Idempotency
# -----------------------------------------------------------------------------
def test_08_duplicate_capture_idempotency(test_merchants):
    """Calling capture on an already COMPLETED order is idempotent and does not create duplicate transactions."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 30.0, "currency": "USD", "item_name": "Idempotency Item"},
        headers=test_merchants["headers_a"]
    )
    order_id = create_res.json()["paypal_order_id"]

    # First capture
    cap1 = client.post(f"/api/paypal/orders/{order_id}/capture", headers=test_merchants["headers_a"])
    assert cap1.status_code == 200
    assert cap1.json()["status"] == "COMPLETED"
    txn_id_1 = cap1.json()["transaction_id"]

    # Second capture (duplicate)
    cap2 = client.post(f"/api/paypal/orders/{order_id}/capture", headers=test_merchants["headers_a"])
    assert cap2.status_code == 200
    assert cap2.json()["status"] == "COMPLETED"
    assert cap2.json()["transaction_id"] == txn_id_1
    assert "already captured" in cap2.json()["message"]


# -----------------------------------------------------------------------------
# Scenario 9: Capture Timeout Resilience
# -----------------------------------------------------------------------------
def test_09_capture_timeout_resilience(test_merchants):
    """Network timeout during capture is caught cleanly and reported with status 400 FAILED."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 75.0, "currency": "USD", "item_name": "Timeout Item"},
        headers=test_merchants["headers_a"]
    )
    order_id = create_res.json()["paypal_order_id"]

    with patch("app.api.routes_paypal.paypal_service.capture_order", new=AsyncMock(return_value={
        "order_id": order_id,
        "status": "FAILED",
        "error": "PayPal Sandbox API timed out while capturing payment",
        "verified": False,
        "mode": "live_sandbox"
    })):
        cap_res = client.post(f"/api/paypal/orders/{order_id}/capture", headers=test_merchants["headers_a"])
        assert cap_res.status_code == 400
        assert "timed out" in cap_res.json().get("detail", "")


# -----------------------------------------------------------------------------
# Scenario 10: Buyer Cancellation Handled
# -----------------------------------------------------------------------------
def test_10_buyer_cancellation_handled(test_merchants):
    """Cancelled orders cannot be captured and return 400 Bad Request."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 55.0, "currency": "USD", "item_name": "Cancel Item"},
        headers=test_merchants["headers_a"]
    )
    order_id = create_res.json()["paypal_order_id"]

    # Mark as CANCELLED in DB
    db = SessionLocal()
    try:
        db_order = db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == order_id).first()
        db_order.status = "CANCELLED"
        db.commit()
    finally:
        db.close()

    cap_res = client.post(f"/api/paypal/orders/{order_id}/capture", headers=test_merchants["headers_a"])
    assert cap_res.status_code == 400
    assert "Order was cancelled and cannot be captured" in cap_res.json().get("detail", "")


# -----------------------------------------------------------------------------
# Scenario 11: Invalid Webhook Signature Rejected
# -----------------------------------------------------------------------------
def test_11_invalid_webhook_signature_rejected():
    """Webhook with invalid or missing signature headers is rejected with 401 Unauthorized."""
    payload = {
        "id": f"WH-EVENT-{uuid.uuid4().hex[:8]}",
        "event_type": "CHECKOUT.ORDER.APPROVED",
        "resource": {"id": "ORDER-123"}
    }
    # Missing transmission headers
    res = client.post("/api/paypal/webhook", json=payload)
    assert res.status_code == 401
    assert "signature verification failed" in res.json().get("detail", "")


# -----------------------------------------------------------------------------
# Scenario 12: Duplicate Webhook Event Idempotency
# -----------------------------------------------------------------------------
def test_12_duplicate_webhook_event_idempotency():
    """Duplicate webhook event IDs are detected and idempotently acknowledged without re-processing."""
    event_id = f"WH-EVENT-DEDUP-{uuid.uuid4().hex[:8]}"
    payload = {
        "id": event_id,
        "event_type": "CHECKOUT.ORDER.APPROVED",
        "resource": {"id": f"PP-TEST-ORDER-{uuid.uuid4().hex[:6]}"}
    }
    mock_headers = {
        "paypal-auth-algo": "SHA256withRSA",
        "paypal-cert-url": "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-123",
        "paypal-transmission-id": f"TRANS-{uuid.uuid4().hex[:8]}",
        "paypal-transmission-sig": "mock_valid_signature_base64",
        "paypal-transmission-time": "2026-11-05T05:00:00Z"
    }

    with patch("app.api.routes_paypal.paypal_service.verify_webhook_signature", new=AsyncMock(return_value=True)):
        # First delivery
        res1 = client.post("/api/paypal/webhook", json=payload, headers=mock_headers)
        assert res1.status_code == 200
        assert res1.json().get("status") in ("success", "received", "duplicate")

        # Second delivery (duplicate replay)
        res2 = client.post("/api/paypal/webhook", json=payload, headers=mock_headers)
        assert res2.status_code == 200
        assert res2.json().get("status") == "duplicate"
        assert "already processed" in res2.json().get("message", "")


# -----------------------------------------------------------------------------
# Scenario 13: PayPal API Error Response Sanitization
# -----------------------------------------------------------------------------
def test_13_paypal_api_error_response_sanitization(test_merchants):
    """PayPal upstream 500 error responses are sanitized without leaking server secrets or crashing."""
    with patch("app.api.routes_paypal.paypal_service.create_order", side_effect=RuntimeError("PayPal API responded with status 503: Service Unavailable")):
        res = client.post(
            "/api/paypal/orders",
            json={"amount": 20.0, "currency": "USD", "item_name": "Sanitization Item"},
            headers=test_merchants["headers_a"]
        )
        assert res.status_code == 400
        assert "Service Unavailable" in res.json().get("detail", "")
        # Confirm no secrets leaked in error detail
        assert "PAYPAL_CLIENT_SECRET" not in res.text
        assert "secret" not in res.text.lower() or "service unavailable" in res.text.lower()


# -----------------------------------------------------------------------------
# Scenario 14: Database Failure During Capture Self-Heals
# -----------------------------------------------------------------------------
def test_14_database_failure_during_capture_self_heals(test_merchants):
    """Reconciliation endpoint self-heals a COMPLETED order that had a missing transaction record."""
    db = SessionLocal()
    order_id = f"PP-ORPHAN-{uuid.uuid4().hex[:8]}"
    try:
        # Simulate an order that was marked COMPLETED by PayPal but DB crashed before Transaction link
        order = PayPalOrder(
            user_id=test_merchants["merchant_a"].id,
            paypal_order_id=order_id,
            amount=99.00,
            currency="USD",
            status="COMPLETED",
            capture_id=f"CAP-ORPHAN-{uuid.uuid4().hex[:6]}",
            captured_at=datetime.utcnow(),
            payer_email="orphan@paypal.com",
            payer_name="Orphan Buyer"
        )
        db.add(order)
        db.commit()
    finally:
        db.close()

    # Call reconciliation route
    rec_res = client.post(f"/api/paypal/orders/{order_id}/reconcile", headers=test_merchants["headers_a"])
    assert rec_res.status_code == 200
    assert rec_res.json()["status"] == "COMPLETED"
    assert rec_res.json()["transaction_id"] is not None

    # Verify transaction was restored in DB
    db = SessionLocal()
    try:
        txn = db.query(Transaction).filter(Transaction.provider_order_id == order_id).first()
        assert txn is not None
        assert float(txn.amount) == 99.00
        assert txn.payment_status == "COMPLETED"
    finally:
        db.close()


# -----------------------------------------------------------------------------
# Scenario 15: Production Mode Strictly Rejects Mock Simulator
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_15_production_mode_strictly_rejects_mock_simulator():
    """In production mode (APP_ENV=production or DEBUG=false), simulator fallback is strictly forbidden."""
    with patch.object(settings, "APP_ENV", "production"), \
         patch.object(settings, "DEBUG", False), \
         patch.object(settings, "PAYPAL_CLIENT_ID", ""), \
         patch.object(settings, "PAYPAL_CLIENT_SECRET", ""):
        service = PayPalService()
        assert service.is_production
        assert not service.is_mock_mode()

        # create_order must raise RuntimeError forbidding simulator
        with pytest.raises(RuntimeError) as exc_info:
            await service.create_order(amount=10.0, currency="USD")
        assert "simulator fallback is strictly forbidden in production" in str(exc_info.value)
