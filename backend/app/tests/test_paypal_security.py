"""
test_paypal_security.py
=======================
Automated test suite covering PayPal Payment Security Remediation (Task 2):
1. Anonymous credential modification — must be rejected (401).
2. Authenticated merchant credential modification — must follow authorization rules (403 for non-merchant, 200 for merchant).
3. Merchant A attempting to capture Merchant B's order — must be rejected (403 for other merchant, 401 for anonymous).
4. Valid merchant capturing their own eligible order — succeeds (200 COMPLETED).
5. Invalid order ID — rejected (404 for unknown, 400 for empty).
6. Invalid payment amount — rejected (400/422 for amount <= 0).
7. Invalid currency — rejected (400/422 for unsupported currency).
8. Duplicate capture request — idempotent return (200 with existing capture, no duplicate records created).
9. PayPal capture failure — handled safely (400 with status FAILED).
10. Synthetic transaction labelling — offline simulator records marked is_synthetic=True, source='SIMULATOR_SANDBOX'.
"""

import pytest
import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.database import SessionLocal
from app.models.paypal_order import PayPalOrder
from app.models.transaction import Transaction
from app.models.user import User
from app.services.auth import hash_password, create_access_token

client = TestClient(app)


@pytest.fixture
def auth_merchants():
    """Creates two distinct merchants (A and B) and a non-merchant user (Viewer)."""
    db = SessionLocal()
    try:
        uid = uuid.uuid4().hex[:6]
        
        # Merchant A
        user_a = User(
            email=f"merchant_a_{uid}@testsec.com",
            hashed_password=hash_password("Password123!"),
            full_name="Merchant Alice",
            business_name="Alice Store",
            role="merchant",
            is_active=True
        )
        # Merchant B
        user_b = User(
            email=f"merchant_b_{uid}@testsec.com",
            hashed_password=hash_password("Password123!"),
            full_name="Merchant Bob",
            business_name="Bob Store",
            role="merchant",
            is_active=True
        )
        # Viewer (non-merchant role)
        user_viewer = User(
            email=f"viewer_{uid}@testsec.com",
            hashed_password=hash_password("Password123!"),
            full_name="Viewer Charlie",
            business_name="Observer LLC",
            role="viewer",
            is_active=True
        )
        db.add_all([user_a, user_b, user_viewer])
        db.commit()
        db.refresh(user_a)
        db.refresh(user_b)
        db.refresh(user_viewer)

        # Generate direct access tokens without consuming login rate limits
        token_a = create_access_token({"sub": str(user_a.id), "role": user_a.role})
        token_b = create_access_token({"sub": str(user_b.id), "role": user_b.role})
        token_v = create_access_token({"sub": str(user_viewer.id), "role": user_viewer.role})

        return {
            "user_a": user_a,
            "headers_a": {"Authorization": f"Bearer {token_a}"},
            "user_b": user_b,
            "headers_b": {"Authorization": f"Bearer {token_b}"},
            "user_viewer": user_viewer,
            "headers_viewer": {"Authorization": f"Bearer {token_v}"},
        }
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 1. Anonymous credential modification — must be rejected (401)
# ─────────────────────────────────────────────────────────────────────────────
def test_anonymous_credential_modification_rejected():
    anon_client = TestClient(app)
    payload = {
        "client_id": "malicious_injected_client_id_12345",
        "client_secret": "malicious_injected_secret_67890",
        "mock_simulator": True
    }
    # PUT anonymously
    res_put = anon_client.put("/api/paypal/credentials", json=payload)
    assert res_put.status_code == 401, f"Expected 401 on anonymous PUT, got {res_put.status_code}"

    # POST anonymously
    res_post = anon_client.post("/api/paypal/credentials", json=payload)
    assert res_post.status_code == 401, f"Expected 401 on anonymous POST, got {res_post.status_code}"

    # GET anonymously
    res_get = anon_client.get("/api/paypal/credentials")
    assert res_get.status_code == 401, f"Expected 401 on anonymous GET, got {res_get.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Authenticated merchant credential modification — authorization rules
# ─────────────────────────────────────────────────────────────────────────────
def test_authenticated_merchant_credential_modification(auth_merchants):
    headers_viewer = auth_merchants["headers_viewer"]
    headers_a = auth_merchants["headers_a"]

    payload = {
        "client_id": "test_merchant_client_id_987654321",
        "client_secret": "test_merchant_secret_123456789",
        "mock_simulator": True
    }

    # Non-merchant (role='viewer') rejected with 403 Forbidden
    res_viewer = client.put("/api/paypal/credentials", headers=headers_viewer, json=payload)
    assert res_viewer.status_code == 403, f"Expected 403 for non-merchant, got {res_viewer.status_code}"

    # Valid merchant succeeds (with mock simulator active or safe test credentials)
    res_merchant = client.put("/api/paypal/credentials", headers=headers_a, json=payload)
    assert res_merchant.status_code == 200
    data = res_merchant.json()
    assert "client_id_preview" in data
    # Ensure client secret is NEVER in response
    assert "client_secret" not in data
    assert "test_merchant_secret" not in str(data)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Merchant A attempting to capture Merchant B's order — must be rejected
# ─────────────────────────────────────────────────────────────────────────────
def test_cross_merchant_capture_rejected(auth_merchants):
    settings.PAYPAL_MOCK_SIMULATOR = True
    headers_a = auth_merchants["headers_a"]
    headers_b = auth_merchants["headers_b"]

    # Merchant B creates an order
    create_res = client.post(
        "/api/paypal/orders",
        headers=headers_b,
        json={"amount": 89.00, "currency": "USD", "item_name": "Merchant B Private License"}
    )
    assert create_res.status_code == 200
    order_id = create_res.json()["paypal_order_id"]

    # Merchant A attempts to capture Merchant B's order -> 403 Forbidden
    cap_res_a = client.post(f"/api/paypal/orders/{order_id}/capture", headers=headers_a)
    assert cap_res_a.status_code == 403, f"Expected 403 Forbidden, got {cap_res_a.status_code}"
    assert "another merchant account" in cap_res_a.json().get("detail", "")

    # Anonymous user attempts to capture Merchant B's order -> 401 Unauthorized
    anon_client = TestClient(app)
    cap_res_anon = anon_client.post(f"/api/paypal/orders/{order_id}/capture")
    assert cap_res_anon.status_code == 401, f"Expected 401 Unauthorized, got {cap_res_anon.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# 4. Valid merchant capturing their own eligible order
# ─────────────────────────────────────────────────────────────────────────────
def test_valid_merchant_capturing_own_eligible_order(auth_merchants):
    settings.PAYPAL_MOCK_SIMULATOR = True
    headers_a = auth_merchants["headers_a"]

    # Merchant A creates an order
    create_res = client.post(
        "/api/paypal/orders",
        headers=headers_a,
        json={"amount": 140.00, "currency": "USD", "item_name": "Merchant A Cloud Server"}
    )
    assert create_res.status_code == 200
    order_id = create_res.json()["paypal_order_id"]

    # Merchant A captures their own order -> 200 COMPLETED
    cap_res = client.post(f"/api/paypal/orders/{order_id}/capture", headers=headers_a)
    assert cap_res.status_code == 200
    data = cap_res.json()
    assert data["status"] == "COMPLETED"
    assert data["amount"] == 140.00
    assert data["verified_by_backend"] is True
    assert data["transaction_id"] is not None


# ─────────────────────────────────────────────────────────────────────────────
# 5. Invalid order ID — rejected (404 / 400)
# ─────────────────────────────────────────────────────────────────────────────
def test_invalid_order_id():
    # Non-existent order
    res_missing = client.post("/api/paypal/orders/NON_EXISTENT_ORDER_99999/capture")
    assert res_missing.status_code == 404
    assert "not found" in res_missing.json().get("detail", "").lower()

    # Empty order ID
    res_empty = client.post("/api/paypal/orders/%20/capture")
    assert res_empty.status_code in (400, 404)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Invalid payment amount — rejected (400 / 422)
# ─────────────────────────────────────────────────────────────────────────────
def test_invalid_payment_amount():
    # Zero amount
    res_zero = client.post("/api/paypal/orders", json={"amount": 0.0, "currency": "USD", "item_name": "Zero"})
    assert res_zero.status_code in (400, 422)

    # Negative amount
    res_neg = client.post("/api/paypal/orders", json={"amount": -25.50, "currency": "USD", "item_name": "Negative"})
    assert res_neg.status_code in (400, 422)

    # Exorbitant amount exceeding $100,000 sandbox limit
    res_huge = client.post("/api/paypal/orders", json={"amount": 500000.0, "currency": "USD", "item_name": "Huge"})
    assert res_huge.status_code in (400, 422)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Invalid currency — rejected (400 / 422)
# ─────────────────────────────────────────────────────────────────────────────
def test_invalid_currency():
    # Length error or unknown currency
    res_bad_curr = client.post("/api/paypal/orders", json={"amount": 50.0, "currency": "XYZ", "item_name": "Bad Currency"})
    assert res_bad_curr.status_code == 400
    assert "Unsupported currency" in res_bad_curr.json().get("detail", "")

    # Valid currencies supported
    for curr in ["USD", "EUR", "GBP", "INR"]:
        res_ok = client.post("/api/paypal/orders", json={"amount": 10.0, "currency": curr, "item_name": "Valid Currency Test"})
        assert res_ok.status_code == 200, f"Expected 200 for {curr}, got {res_ok.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# 8. Duplicate capture request — idempotent return (200 with existing capture)
# ─────────────────────────────────────────────────────────────────────────────
def test_duplicate_capture_request_idempotent(auth_merchants):
    settings.PAYPAL_MOCK_SIMULATOR = True
    headers_a = auth_merchants["headers_a"]
    db = SessionLocal()

    try:
        # Create order
        create_res = client.post(
            "/api/paypal/orders",
            headers=headers_a,
            json={"amount": 60.00, "currency": "USD", "item_name": "Idempotency Test Item"}
        )
        order_id = create_res.json()["paypal_order_id"]

        # First capture
        cap1 = client.post(f"/api/paypal/orders/{order_id}/capture", headers=headers_a)
        assert cap1.status_code == 200
        txn_id_1 = cap1.json()["transaction_id"]
        assert txn_id_1 is not None

        # Count total transactions in DB
        initial_txn_count = db.query(Transaction).count()

        # Second capture attempt (duplicate)
        cap2 = client.post(f"/api/paypal/orders/{order_id}/capture", headers=headers_a)
        assert cap2.status_code == 200
        data2 = cap2.json()
        assert data2["status"] == "COMPLETED"
        assert data2["transaction_id"] == txn_id_1
        assert "already captured" in data2.get("message", "").lower()

        # Verify no duplicate transaction was inserted
        new_txn_count = db.query(Transaction).count()
        assert new_txn_count == initial_txn_count, "Duplicate capture should NOT create duplicate transaction records."
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 9. PayPal capture failure — handled safely (400)
# ─────────────────────────────────────────────────────────────────────────────
def test_paypal_capture_failure_handled(auth_merchants):
    headers_a = auth_merchants["headers_a"]
    db = SessionLocal()

    try:
        # Create order
        create_res = client.post(
            "/api/paypal/orders",
            headers=headers_a,
            json={"amount": 110.00, "currency": "USD", "item_name": "Failure Simulation Order"}
        )
        order_id = create_res.json()["paypal_order_id"]

        # Mock capture failure from upstream PayPal API
        mock_failure_response = {
            "order_id": order_id,
            "status": "FAILED",
            "error": "INSTRUMENT_DECLINED: The provided funding instrument was declined by PayPal.",
            "verified": False,
            "mode": "live_sandbox"
        }

        with patch("app.services.paypal_service.paypal_service.capture_order", return_value=mock_failure_response):
            cap_res = client.post(f"/api/paypal/orders/{order_id}/capture", headers=headers_a)
            assert cap_res.status_code == 400
            assert "PayPal capture failed" in cap_res.json().get("detail", "")

        # Verify order in DB was persisted as FAILED
        db_order = db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == order_id).first()
        assert db_order is not None
        assert db_order.status == "FAILED"

        # Subsequent capture on FAILED order is rejected
        retry_res = client.post(f"/api/paypal/orders/{order_id}/capture", headers=headers_a)
        assert retry_res.status_code == 400
        assert "marked as FAILED" in retry_res.json().get("detail", "")
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 10. Synthetic transaction labelling
# ─────────────────────────────────────────────────────────────────────────────
def test_synthetic_transaction_labelling(auth_merchants):
    """
    Offline simulator orders must be labelled is_synthetic=True and source='SIMULATOR_SANDBOX'.
    They must never be presented as real PayPal Sandbox captures.
    """
    settings.PAYPAL_MOCK_SIMULATOR = True
    headers_a = auth_merchants["headers_a"]
    db = SessionLocal()

    try:
        # 1. Create and capture via offline simulator
        create_res = client.post(
            "/api/paypal/orders",
            headers=headers_a,
            json={"amount": 77.00, "currency": "USD", "item_name": "Synthetic Labelling Test"}
        )
        order_id = create_res.json()["paypal_order_id"]
        assert order_id.startswith("PAYPAL-MOCK-")

        cap_res = client.post(f"/api/paypal/orders/{order_id}/capture", headers=headers_a)
        assert cap_res.status_code == 200
        txn_id = cap_res.json()["transaction_id"]

        # Inspect resulting transaction in DB
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        assert txn is not None
        assert txn.is_synthetic is True, "Offline simulator capture must be labelled is_synthetic=True"
        assert txn.source == "SIMULATOR_SANDBOX", f"Expected source='SIMULATOR_SANDBOX', got '{txn.source}'"

        # 2. Check dedicated real PayPal endpoint: simulator capture MUST NOT be included
        dash_res = client.get("/api/dashboard/paypal-transactions")
        assert dash_res.status_code == 200
        dash_txns = dash_res.json()["transactions"]
        txn_ids_in_real = [t["transaction_id"] for t in dash_txns]
        assert txn_id not in txn_ids_in_real, "Synthetic simulator transaction must NOT appear in verified PayPal Sandbox table."
    finally:
        db.close()
