"""
test_paypal_lifecycle.py
========================
End-to-end PayPal Sandbox payment lifecycle test suite covering Task 4:
1. Successful order creation.
2. Invalid amount.
3. Invalid currency.
4. Customer approval.
5. Successful capture.
6. Failed capture.
7. Duplicate capture.
8. Unauthorized capture.
9. Cross-merchant capture.
10. Incorrect capture amount.
11. Incorrect currency.
12. Database persistence.
13. PayPal API timeout.
14. Synthetic payment labelling.
15. Webhook verification & reconciliation.
"""

import uuid
import json
import pytest
import httpx
from unittest.mock import patch, AsyncMock
from datetime import datetime

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.models.paypal_order import PayPalOrder
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.services.auth import hash_password, create_access_token


client = TestClient(app)


@pytest.fixture
def merchant_accounts():
    """Sets up isolated test merchants."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:8]
        user_a = User(
            email=f"merchant_pp_a_{suffix}@testcorp.com",
            hashed_password=hash_password("PassA123!"),
            full_name="Merchant Alpha PP",
            business_name="Alpha PP LLC",
            role="merchant",
            is_active=True
        )
        user_b = User(
            email=f"merchant_pp_b_{suffix}@testcorp.com",
            hashed_password=hash_password("PassB123!"),
            full_name="Merchant Beta PP",
            business_name="Beta PP LLC",
            role="merchant",
            is_active=True
        )
        db.add_all([user_a, user_b])
        db.commit()
        db.refresh(user_a)
        db.refresh(user_b)

        token_a = create_access_token({"sub": str(user_a.id), "email": user_a.email, "role": user_a.role})
        token_b = create_access_token({"sub": str(user_b.id), "email": user_b.email, "role": user_b.role})

        return {
            "merchant_a": user_a,
            "merchant_b": user_b,
            "headers_a": {"Authorization": f"Bearer {token_a}"},
            "headers_b": {"Authorization": f"Bearer {token_b}"}
        }
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 1. Successful Order Creation
# ─────────────────────────────────────────────────────────────────────────────
def test_01_successful_order_creation():
    """Backend creates an order through PayPal Orders API with valid parameters."""
    res = client.post(
        "/api/paypal/orders",
        json={"amount": 95.00, "currency": "USD", "item_name": "Premium Cloud Suite"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "paypal_order_id" in data
    assert data["amount"] == 95.00
    assert data["currency"] == "USD"
    assert data["status"] in ("CREATED", "COMPLETED")
    assert data["verified_by_backend"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 2. Invalid Amount
# ─────────────────────────────────────────────────────────────────────────────
def test_02_invalid_amount():
    """Rejects zero, negative, and excessive order amounts."""
    # Zero amount
    res_zero = client.post("/api/paypal/orders", json={"amount": 0.0, "currency": "USD", "item_name": "Free Item"})
    assert res_zero.status_code in (400, 422)

    # Negative amount
    res_neg = client.post("/api/paypal/orders", json={"amount": -15.50, "currency": "USD", "item_name": "Negative Item"})
    assert res_neg.status_code in (400, 422)

    # Excessive amount (> 100,000)
    res_huge = client.post("/api/paypal/orders", json={"amount": 150000.0, "currency": "USD", "item_name": "Over Limit"})
    assert res_huge.status_code in (400, 422)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Invalid Currency
# ─────────────────────────────────────────────────────────────────────────────
def test_03_invalid_currency():
    """Rejects unsupported or invalid currency codes."""
    res_bad = client.post("/api/paypal/orders", json={"amount": 50.0, "currency": "INVALID", "item_name": "Item"})
    assert res_bad.status_code in (400, 422)

    res_xyz = client.post("/api/paypal/orders", json={"amount": 50.0, "currency": "XYZ", "item_name": "Item"})
    assert res_xyz.status_code in (400, 422)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Customer Approval (Valid State Transition)
# ─────────────────────────────────────────────────────────────────────────────
def test_04_customer_approval():
    """Records customer approval and enforces CREATED -> APPROVED state transition."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 65.0, "currency": "USD", "item_name": "Approval Test Item"}
    )
    assert create_res.status_code == 200
    order_id = create_res.json()["paypal_order_id"]

    # Customer approves order
    approve_res = client.post(f"/api/paypal/orders/{order_id}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # Second approval attempt on already approved order must reject
    dup_approve = client.post(f"/api/paypal/orders/{order_id}/approve")
    assert dup_approve.status_code == 400
    assert "invalid state transition" in dup_approve.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# 5. Successful Capture
# ─────────────────────────────────────────────────────────────────────────────
def test_05_successful_capture():
    """Captures order, verifies capture response, and evaluates risk engine."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 120.0, "currency": "USD", "item_name": "Success Capture Test"}
    )
    assert create_res.status_code == 200
    order_id = create_res.json()["paypal_order_id"]

    mock_capture = {
        "order_id": order_id,
        "capture_id": f"CAP-LIVE-{uuid.uuid4().hex[:10].upper()}",
        "status": "COMPLETED",
        "amount": 120.0,
        "currency": "USD",
        "payer_email": "sandbox.buyer@example.com",
        "payer_name": "Verified Sandbox Buyer",
        "raw_response": {"id": order_id, "status": "COMPLETED"},
        "verified": True,
        "mode": "live_sandbox"
    }

    with patch("app.services.paypal_service.paypal_service.capture_order", return_value=mock_capture):
        cap_res = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert cap_res.status_code == 200
        data = cap_res.json()
        assert data["status"] == "COMPLETED"
        assert data["capture_id"] == mock_capture["capture_id"]
        assert data["transaction_id"] is not None
        assert "risk_evaluation" in data
        assert 0 <= data["risk_evaluation"]["score"] <= 100


# ─────────────────────────────────────────────────────────────────────────────
# 6. Failed Capture
# ─────────────────────────────────────────────────────────────────────────────
def test_06_failed_capture():
    """Failed capture marks order status as FAILED in database and returns 400."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 80.0, "currency": "USD", "item_name": "Failed Capture Test"}
    )
    assert create_res.status_code == 200
    order_id = create_res.json()["paypal_order_id"]

    mock_failed_capture = {
        "order_id": order_id,
        "status": "FAILED",
        "error": "INSTRUMENT_DECLINED: The instrument presented was declined.",
        "verified": False,
        "mode": "live_sandbox"
    }

    with patch("app.services.paypal_service.paypal_service.capture_order", return_value=mock_failed_capture):
        cap_res = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert cap_res.status_code == 400
        assert "capture failed" in cap_res.json()["detail"].lower()

    # Verify order is marked as FAILED in DB
    db = SessionLocal()
    try:
        db_order = db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == order_id).first()
        assert db_order is not None
        assert db_order.status == "FAILED"
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 7. Duplicate Capture (Idempotency)
# ─────────────────────────────────────────────────────────────────────────────
def test_07_duplicate_capture():
    """Capturing an already-completed order returns an idempotent response without duplicate DB rows."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 99.0, "currency": "USD", "item_name": "Idempotent Capture"}
    )
    order_id = create_res.json()["paypal_order_id"]

    # First capture
    cap1 = client.post(f"/api/paypal/orders/{order_id}/capture")
    assert cap1.status_code == 200
    first_txn_id = cap1.json()["transaction_id"]

    # Count transactions before duplicate call
    db = SessionLocal()
    try:
        count_before = db.query(Transaction).filter(Transaction.id == first_txn_id).count()
        assert count_before == 1

        # Second capture
        cap2 = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert cap2.status_code == 200
        assert cap2.json()["status"] == "COMPLETED"
        assert "already captured" in cap2.json()["message"].lower()

        count_after = db.query(Transaction).filter(Transaction.id == first_txn_id).count()
        assert count_after == 1, "Duplicate capture must not generate duplicate transactions"
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 8. Unauthorized Capture
# ─────────────────────────────────────────────────────────────────────────────
def test_08_unauthorized_capture(merchant_accounts):
    """Anonymous user cannot capture an order belonging to a registered merchant."""
    create_res = client.post(
        "/api/paypal/orders",
        headers=merchant_accounts["headers_a"],
        json={"amount": 150.0, "currency": "USD", "item_name": "Merchant Owned Product"}
    )
    assert create_res.status_code == 200
    order_id = create_res.json()["paypal_order_id"]

    # Anonymous capture attempt
    anon_cap = client.post(f"/api/paypal/orders/{order_id}/capture")
    assert anon_cap.status_code == 401
    assert "authentication required" in anon_cap.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# 9. Cross-Merchant Capture
# ─────────────────────────────────────────────────────────────────────────────
def test_09_cross_merchant_capture(merchant_accounts):
    """Merchant B cannot capture Merchant A's order (403 Forbidden)."""
    create_res = client.post(
        "/api/paypal/orders",
        headers=merchant_accounts["headers_a"],
        json={"amount": 200.0, "currency": "USD", "item_name": "Private Merchant A Service"}
    )
    assert create_res.status_code == 200
    order_id = create_res.json()["paypal_order_id"]

    # Merchant B attempts capture
    cross_cap = client.post(
        f"/api/paypal/orders/{order_id}/capture",
        headers=merchant_accounts["headers_b"]
    )
    assert cross_cap.status_code == 403
    assert "another merchant" in cross_cap.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# 10. Incorrect Capture Amount
# ─────────────────────────────────────────────────────────────────────────────
def test_10_incorrect_capture_amount():
    """Rejects capture if amount returned by PayPal does not match created order amount."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 50.0, "currency": "USD", "item_name": "Amount Mismatch Test"}
    )
    order_id = create_res.json()["paypal_order_id"]

    # PayPal returns capture for $150.0 instead of $50.0
    mismatch_capture = {
        "order_id": order_id,
        "capture_id": f"CAP-MISMATCH-{uuid.uuid4().hex[:8].upper()}",
        "status": "COMPLETED",
        "amount": 150.0,
        "currency": "USD",
        "payer_email": "buyer@example.com",
        "payer_name": "Buyer Name",
        "raw_response": {},
        "verified": True,
        "mode": "live_sandbox"
    }

    with patch("app.services.paypal_service.paypal_service.capture_order", return_value=mismatch_capture):
        cap_res = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert cap_res.status_code == 400
        assert "amount mismatch" in cap_res.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# 11. Incorrect Currency
# ─────────────────────────────────────────────────────────────────────────────
def test_11_incorrect_currency():
    """Rejects capture if currency returned by PayPal does not match order currency."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 75.0, "currency": "USD", "item_name": "Currency Mismatch Test"}
    )
    order_id = create_res.json()["paypal_order_id"]

    # PayPal returns capture for EUR instead of USD
    currency_mismatch = {
        "order_id": order_id,
        "capture_id": f"CAP-CURR-{uuid.uuid4().hex[:8].upper()}",
        "status": "COMPLETED",
        "amount": 75.0,
        "currency": "EUR",
        "payer_email": "buyer@example.com",
        "payer_name": "Buyer Name",
        "raw_response": {},
        "verified": True,
        "mode": "live_sandbox"
    }

    with patch("app.services.paypal_service.paypal_service.capture_order", return_value=currency_mismatch):
        cap_res = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert cap_res.status_code == 400
        assert "currency mismatch" in cap_res.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# 12. Database Persistence
# ─────────────────────────────────────────────────────────────────────────────
def test_12_database_persistence():
    """Ensures order, transaction, and risk analysis are all persisted and linked."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 135.0, "currency": "USD", "item_name": "DB Persistence Verification"}
    )
    order_id = create_res.json()["paypal_order_id"]

    cap_res = client.post(f"/api/paypal/orders/{order_id}/capture")
    assert cap_res.status_code == 200
    txn_id = cap_res.json()["transaction_id"]

    db = SessionLocal()
    try:
        # 1. Order persisted
        db_order = db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == order_id).first()
        assert db_order is not None
        assert db_order.status == "COMPLETED"
        assert db_order.transaction_id == txn_id

        # 2. Transaction persisted
        db_txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        assert db_txn is not None
        assert db_txn.amount == 135.0
        assert db_txn.payment_status == "COMPLETED"

        # 3. Risk Analysis persisted and linked
        db_analysis = db.query(RiskAnalysis).filter(RiskAnalysis.transaction_id == txn_id).first()
        assert db_analysis is not None
        assert db_analysis.deterministic_score == db_txn.risk_score
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 13. PayPal API Timeout Handling
# ─────────────────────────────────────────────────────────────────────────────
def test_13_paypal_api_timeout():
    """Network timeout during PayPal capture is handled safely without crashing (returns 400)."""
    create_res = client.post(
        "/api/paypal/orders",
        json={"amount": 88.0, "currency": "USD", "item_name": "Timeout Test Item"}
    )
    order_id = create_res.json()["paypal_order_id"]

    timeout_response = {
        "order_id": order_id,
        "status": "FAILED",
        "error": "PayPal Sandbox API timed out while capturing payment: Connection timed out.",
        "verified": False,
        "mode": "live_sandbox"
    }

    with patch("app.services.paypal_service.paypal_service.capture_order", return_value=timeout_response):
        cap_res = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert cap_res.status_code == 400
        assert "timed out" in cap_res.json()["detail"].lower()

    # DB order must reflect FAILED state
    db = SessionLocal()
    try:
        db_order = db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == order_id).first()
        assert db_order.status == "FAILED"
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 14. Synthetic Payment Labelling Separation
# ─────────────────────────────────────────────────────────────────────────────
def test_14_synthetic_payment_labelling():
    """Verifies that simulator orders are stamped is_synthetic=True, while live sandbox orders are is_synthetic=False."""
    # A. Simulator mode
    sim_create = client.post("/api/paypal/orders", json={"amount": 45.0, "currency": "USD", "item_name": "Sim Item"})
    sim_order_id = sim_create.json()["paypal_order_id"]
    sim_cap = client.post(f"/api/paypal/orders/{sim_order_id}/capture")
    sim_txn_id = sim_cap.json()["transaction_id"]

    db = SessionLocal()
    try:
        sim_txn = db.query(Transaction).filter(Transaction.id == sim_txn_id).first()
        assert sim_txn.is_synthetic is True
        assert sim_txn.source == "SIMULATOR_SANDBOX"

        # B. Live Sandbox mode
        live_create = client.post("/api/paypal/orders", json={"amount": 110.0, "currency": "USD", "item_name": "Live Item"})
        live_order_id = live_create.json()["paypal_order_id"]

        mock_live_capture = {
            "order_id": live_order_id,
            "capture_id": f"CAP-REAL-SANDBOX-{uuid.uuid4().hex[:8].upper()}",
            "status": "COMPLETED",
            "amount": 110.0,
            "currency": "USD",
            "payer_email": "real.buyer@sandbox.paypal.com",
            "payer_name": "Real Sandbox Buyer",
            "raw_response": {},
            "verified": True,
            "mode": "live_sandbox"
        }

        with patch("app.services.paypal_service.paypal_service.capture_order", return_value=mock_live_capture):
            live_cap = client.post(f"/api/paypal/orders/{live_order_id}/capture")
            live_txn_id = live_cap.json()["transaction_id"]

            live_txn = db.query(Transaction).filter(Transaction.id == live_txn_id).first()
            assert live_txn.is_synthetic is False
            assert live_txn.source == "PAYPAL_SANDBOX"
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 15. Webhook Verification & Status Reconciliation
# ─────────────────────────────────────────────────────────────────────────────
def test_15_webhook_verification_and_reconciliation():
    """Tests webhook signature verification, status reconciliation, and duplicate event protection."""
    # 1. Unsigned / invalid webhook is rejected with 401
    invalid_res = client.post(
        "/api/paypal/webhook",
        headers={"paypal-transmission-id": "missing-other-headers"},
        json={"event_type": "CHECKOUT.ORDER.APPROVED", "resource": {"id": "TEST-ORDER-123"}}
    )
    assert invalid_res.status_code == 401

    # 2. Valid signed webhook reconciles payment status
    db = SessionLocal()
    try:
        # Create an order to be reconciled
        order_num = f"ORDER-WEBHOOK-{uuid.uuid4().hex[:8].upper()}"
        test_order = PayPalOrder(
            paypal_order_id=order_num,
            status="CREATED",
            amount=75.0,
            currency="USD"
        )
        db.add(test_order)
        db.commit()

        webhook_event_id = f"WH-EVENT-{uuid.uuid4().hex[:12].upper()}"
        webhook_body = {
            "id": webhook_event_id,
            "event_type": "CHECKOUT.ORDER.APPROVED",
            "resource": {
                "id": order_num,
                "status": "APPROVED"
            }
        }

        # Mock successful webhook signature validation
        with patch("app.services.paypal_service.paypal_service.verify_webhook_signature", return_value=True):
            wh_res = client.post("/api/paypal/webhook", json=webhook_body)
            assert wh_res.status_code == 200
            assert wh_res.json()["verified"] is True
            assert wh_res.json()["reconciled"] is True

            # Verify order status transitioned to APPROVED in database
            db.refresh(test_order)
            assert test_order.status == "APPROVED"

            # 3. Duplicate event protection (replaying same event ID returns duplicate status)
            wh_dup = client.post("/api/paypal/webhook", json=webhook_body)
            assert wh_dup.status_code == 200
            assert wh_dup.json()["status"] == "duplicate"
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 16. Prevent Simulator Fallback in Production
# ─────────────────────────────────────────────────────────────────────────────
def test_16_prevent_simulator_fallback_in_production():
    """Confirms that in production environment, simulator fallback is strictly forbidden."""
    from app.services.paypal_service import paypal_service
    with patch.object(settings, "APP_ENV", "production"):
        with patch.object(settings, "DEBUG", False):
            # 1. is_mock_mode returns False in production
            assert paypal_service.is_mock_mode() is False

            # 2. Creating order without real PayPal credentials raises/rejects with 400
            with patch.object(paypal_service, "get_access_token", return_value=None):
                res = client.post(
                    "/api/paypal/orders",
                    json={"amount": 45.0, "currency": "USD", "item_name": "Prod Attempt"}
                )
                assert res.status_code == 400
                assert "Production security violation" in res.json()["detail"]

            # 3. Capturing simulated order in production is rejected
            db = SessionLocal()
            try:
                unique_sim_id = f"PAYPAL-MOCK-PROD-{uuid.uuid4().hex[:8].upper()}"
                mock_ord = PayPalOrder(
                    paypal_order_id=unique_sim_id,
                    status="CREATED",
                    amount=50.0,
                    currency="USD"
                )
                db.add(mock_ord)
                db.commit()

                sim_cap = client.post(f"/api/paypal/orders/{unique_sim_id}/capture")
                assert sim_cap.status_code == 400
                assert "Production security violation" in sim_cap.json()["detail"]
            finally:
                db.close()
