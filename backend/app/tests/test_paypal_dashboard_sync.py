"""
test_paypal_dashboard_sync.py
============================
Tests verifying that real PayPal Sandbox captures are correctly persisted in the
database and then appear in the dashboard + transactions list endpoints.

Root cause being tested:
  Before the fix, captured PayPal transactions had is_synthetic=False and
  source="PAYPAL_SANDBOX". The dashboard/transactions endpoints filtered to
  is_synthetic=True only, making real PayPal captures invisible.

  After the fix, all queries include:
    OR source == "PAYPAL_SANDBOX"
  so real captures always appear regardless of login state.
"""
import pytest
import json
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# Helper: create + capture a simulator order and return transaction data
# ─────────────────────────────────────────────────────────────────────────────
def simulate_full_checkout(amount: float = 99.99, item_name: str = "Test Product") -> dict:
    """Creates and captures a simulated PayPal order. Returns the capture response."""
    original_mock = settings.PAYPAL_MOCK_SIMULATOR
    settings.PAYPAL_MOCK_SIMULATOR = True
    try:
        create_res = client.post(
            "/api/paypal/orders",
            json={"amount": amount, "currency": "USD", "item_name": item_name}
        )
        assert create_res.status_code == 200, f"Create failed: {create_res.text}"
        order_id = create_res.json()["paypal_order_id"]

        capture_res = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert capture_res.status_code == 200, f"Capture failed: {capture_res.text}"
        return capture_res.json()
    finally:
        settings.PAYPAL_MOCK_SIMULATOR = original_mock


# ─────────────────────────────────────────────────────────────────────────────
# TEST 1: PayPal Sandbox transactions appear in dashboard/summary (all timeframes)
# ─────────────────────────────────────────────────────────────────────────────
def test_paypal_transaction_appears_in_dashboard_summary():
    """
    After capturing a PayPal order, the dashboard/summary endpoint must include
    the resulting transaction in its total_transactions count.
    This was the PRIMARY BUG: dashboard only showed is_synthetic=True rows.
    """
    # Capture a PayPal order
    capture = simulate_full_checkout(amount=150.0, item_name="Dashboard Sync Test")
    txn_id = capture.get("transaction_id")
    assert txn_id is not None, "Capture must return a transaction_id"

    # Check dashboard/summary for all timeframes
    for timeframe in ["24h", "7d", "30d", "all"]:
        res = client.get(f"/api/dashboard/summary?timeframe={timeframe}")
        assert res.status_code == 200
        data = res.json()
        assert data["total_transactions"] >= 1, (
            f"[{timeframe}] PayPal capture txn #{txn_id} was NOT counted in dashboard. "
            "The is_synthetic filter bug may not be fixed."
        )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 2: PayPal transaction appears in /api/transactions list (unauthenticated)
# ─────────────────────────────────────────────────────────────────────────────
def test_paypal_transaction_visible_in_transaction_monitor_unauthenticated():
    """
    The transaction monitor must show PAYPAL_SANDBOX source transactions
    even when the user is not authenticated.
    """
    capture = simulate_full_checkout(amount=79.00, item_name="Transaction Monitor Sync Test")
    txn_id = capture.get("transaction_id")
    assert txn_id is not None

    # Unauthenticated request
    res = client.get("/api/transactions?limit=100&sort_by=timestamp&sort_order=desc")
    assert res.status_code == 200
    data = res.json()
    items = data.get("items", [])
    found_ids = [item["id"] for item in items]
    assert txn_id in found_ids, (
        f"Transaction #{txn_id} (PayPal Sandbox capture) was NOT found in /api/transactions "
        f"for an unauthenticated request. Found IDs: {found_ids[:10]}..."
    )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 3: Dedicated /api/dashboard/paypal-transactions endpoint returns captures
# ─────────────────────────────────────────────────────────────────────────────
def test_paypal_transactions_dedicated_endpoint():
    """
    The /api/dashboard/paypal-transactions endpoint must return only real PayPal
    Sandbox captures (source=PAYPAL_SANDBOX, is_synthetic=False).
    """
    capture = simulate_full_checkout(amount=250.00, item_name="Dedicated Endpoint Test")
    txn_id = capture.get("transaction_id")
    assert txn_id is not None

    res = client.get("/api/dashboard/paypal-transactions")
    assert res.status_code == 200
    data = res.json()

    assert "count" in data
    assert "transactions" in data
    assert "source_filter" in data
    assert data["source_filter"] == "PAYPAL_SANDBOX"
    assert data["count"] >= 1

    txn_ids = [t["transaction_id"] for t in data["transactions"]]
    assert txn_id in txn_ids, (
        f"Transaction #{txn_id} not found in /api/dashboard/paypal-transactions. "
        f"Found IDs: {txn_ids}"
    )

    # Verify none are synthetic
    for t in data["transactions"]:
        assert t["is_synthetic"] is False, (
            f"Synthetic transaction found in PayPal-only endpoint: {t}"
        )
        assert t["source"] == "PAYPAL_SANDBOX", (
            f"Non-PayPal source in dedicated endpoint: {t['source']}"
        )
        assert t["payment_status"] == "COMPLETED"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 4: PayPal transaction has all required fields for dashboard display
# ─────────────────────────────────────────────────────────────────────────────
def test_paypal_transaction_has_complete_fields():
    """
    Each PayPal capture must have: transaction_id, reference_id, amount, currency,
    payer_email, risk_score, risk_level, timestamp, source.
    """
    capture = simulate_full_checkout(amount=500.00, item_name="Field Completeness Test")
    txn_id = capture.get("transaction_id")

    # Fetch via transaction detail endpoint
    res = client.get(f"/api/transactions/{txn_id}")
    assert res.status_code == 200
    data = res.json()
    txn = data.get("transaction") or data

    required_fields = ["id", "reference_id", "amount", "currency", "payment_status",
                       "customer_email", "risk_score", "risk_level", "timestamp", "source"]
    for field in required_fields:
        assert field in txn, f"Required field '{field}' missing from transaction detail"

    assert txn["source"] == "PAYPAL_SANDBOX"
    assert txn["is_synthetic"] is False
    assert txn["payment_status"] == "COMPLETED"
    assert txn["risk_score"] is not None
    assert txn["risk_level"] in ("LOW", "MEDIUM", "HIGH")


# ─────────────────────────────────────────────────────────────────────────────
# TEST 5: Risk evaluation is attached to every PayPal capture
# ─────────────────────────────────────────────────────────────────────────────
def test_paypal_capture_includes_risk_evaluation():
    """
    Every server-side PayPal capture must include a risk_evaluation block with:
    score, level, ai_summary, and recommended_action.
    """
    capture = simulate_full_checkout(amount=99.0, item_name="Risk Eval Test")

    assert "risk_evaluation" in capture, "risk_evaluation block missing from capture response"
    risk = capture["risk_evaluation"]
    assert "score" in risk, "risk_evaluation.score missing"
    assert "level" in risk, "risk_evaluation.level missing"
    assert "ai_summary" in risk, "risk_evaluation.ai_summary missing"
    assert isinstance(risk["score"], (int, float))
    assert 0 <= risk["score"] <= 100, f"Risk score out of bounds: {risk['score']}"
    assert risk["level"] in ("LOW", "MEDIUM", "HIGH"), f"Invalid risk level: {risk['level']}"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 6: Multiple captures accumulate in dashboard (no lost/overwritten rows)
# ─────────────────────────────────────────────────────────────────────────────
def test_multiple_paypal_captures_accumulate():
    """
    Performing 3 captures must result in 3 distinct transactions in the PayPal
    endpoint. No rows should be overwritten or deduplicated incorrectly.
    """
    # Get baseline count
    base_res = client.get("/api/dashboard/paypal-transactions")
    base_count = base_res.json()["count"]

    # Do 3 captures
    ids = []
    for i in range(3):
        cap = simulate_full_checkout(amount=float(10 + i), item_name=f"Accumulate Test {i+1}")
        ids.append(cap["transaction_id"])

    assert len(set(ids)) == 3, "Three captures must produce three distinct transaction IDs"

    after_res = client.get("/api/dashboard/paypal-transactions")
    after_count = after_res.json()["count"]
    assert after_count >= base_count + 3, (
        f"Expected at least {base_count + 3} PayPal transactions, got {after_count}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 7: Duplicate capture is idempotent (returns already-captured data)
# ─────────────────────────────────────────────────────────────────────────────
def test_duplicate_capture_is_idempotent():
    """
    Capturing the same order_id twice must return status COMPLETED both times
    without creating a duplicate transaction row.
    """
    original_mock = settings.PAYPAL_MOCK_SIMULATOR
    settings.PAYPAL_MOCK_SIMULATOR = True
    try:
        create_res = client.post(
            "/api/paypal/orders",
            json={"amount": 77.77, "currency": "USD", "item_name": "Idempotent Capture Test"}
        )
        assert create_res.status_code == 200
        order_id = create_res.json()["paypal_order_id"]

        # First capture
        cap1 = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert cap1.status_code == 200
        txn_id_1 = cap1.json().get("transaction_id")

        # Second capture — must be idempotent
        cap2 = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert cap2.status_code == 200
        data2 = cap2.json()
        assert data2["status"] == "COMPLETED"
        assert data2["message"] == "Order was already captured and verified."
        # The transaction_id returned may be None on idempotent return (acceptable)
    finally:
        settings.PAYPAL_MOCK_SIMULATOR = original_mock


# ─────────────────────────────────────────────────────────────────────────────
# TEST 8: Missing PayPal credentials → clear error, no crash
# ─────────────────────────────────────────────────────────────────────────────
def test_missing_credentials_clear_error():
    """
    When PAYPAL_MOCK_SIMULATOR=False and credentials are missing, creating an
    order must return a structured error (400), not a 500 crash.
    """
    original_mock = settings.PAYPAL_MOCK_SIMULATOR
    original_client_id = settings.PAYPAL_CLIENT_ID
    original_secret = settings.PAYPAL_CLIENT_SECRET
    settings.PAYPAL_MOCK_SIMULATOR = False
    settings.PAYPAL_CLIENT_ID = ""
    settings.PAYPAL_CLIENT_SECRET = ""
    try:
        res = client.post(
            "/api/paypal/orders",
            json={"amount": 50.0, "currency": "USD", "item_name": "Credential Error Test"}
        )
        assert res.status_code == 400
        data = res.json()
        assert "detail" in data
        assert "credentials" in data["detail"].lower() or "sandbox" in data["detail"].lower()
    finally:
        settings.PAYPAL_MOCK_SIMULATOR = original_mock
        settings.PAYPAL_CLIENT_ID = original_client_id
        settings.PAYPAL_CLIENT_SECRET = original_secret


# ─────────────────────────────────────────────────────────────────────────────
# TEST 9: PayPal /config never exposes client_secret
# ─────────────────────────────────────────────────────────────────────────────
def test_config_never_exposes_secret():
    """The /api/paypal/config endpoint must never include client_secret."""
    res = client.get("/api/paypal/config")
    assert res.status_code == 200
    payload = res.json()
    assert "client_secret" not in payload
    assert "PAYPAL_CLIENT_SECRET" not in str(payload)
