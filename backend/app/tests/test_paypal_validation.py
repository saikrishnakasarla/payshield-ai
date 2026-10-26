import pytest
import asyncio
from fastapi import HTTPException
from app.config import settings
from app.database import SessionLocal
from app.api.routes_paypal import (
    get_paypal_status,
    get_paypal_config,
    create_paypal_order,
    capture_paypal_order,
    update_paypal_credentials,
    PayPalCredentialsUpdateRequest
)
from app.schemas.paypal import PayPalOrderCreateRequest

def test_paypal_status_endpoint():
    data = get_paypal_status()
    assert hasattr(data, "is_configured")
    assert hasattr(data, "mock_mode")
    assert hasattr(data, "api_endpoint")

def test_paypal_config_endpoint():
    data = get_paypal_config()
    assert data.currency == "USD"
    assert data.environment == "sandbox"
    assert hasattr(data, "mock_mode")
    assert not hasattr(data, "client_secret")  # Never expose secrets!

def test_paypal_create_order_zero_amount_rejected():
    db = SessionLocal()
    try:
        with pytest.raises(Exception):
            req = PayPalOrderCreateRequest(amount=0.0, currency="USD", item_name="Invalid Order")
            asyncio.run(create_paypal_order(req, None, db))
    finally:
        db.close()

def test_paypal_create_order_negative_amount_rejected():
    db = SessionLocal()
    try:
        with pytest.raises(Exception):
            req = PayPalOrderCreateRequest(amount=-50.0, currency="USD", item_name="Negative Order")
            asyncio.run(create_paypal_order(req, None, db))
    finally:
        db.close()

def test_capture_unknown_order_returns_404():
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as exc_info:
            coro = capture_paypal_order("NON_EXISTENT_ORDER_9999", None, db)
            try:
                coro.send(None)
            except StopIteration:
                pass
        assert exc_info.value.status_code == 404
        assert "not found" in str(exc_info.value.detail).lower()
    finally:
        db.close()

@pytest.mark.asyncio
async def test_paypal_simulator_mode_create_and_capture():
    settings.PAYPAL_MOCK_SIMULATOR = True
    db = SessionLocal()
    try:
        req = PayPalOrderCreateRequest(
            amount=125.0,
            currency="USD",
            item_name="Cloud Subscription License",
            customer_email="tester@example.com",
            customer_name="Test Runner"
        )
        order_data = await create_paypal_order(req, None, db)
        order_id = order_data.paypal_order_id
        assert order_id is not None
        assert order_data.verified_by_backend is True
        assert order_data.amount == 125.0
        assert order_data.currency == "USD"

        cap_res = await capture_paypal_order(order_id, None, db)
        assert cap_res.status == "COMPLETED"
        assert cap_res.capture_id is not None
        assert cap_res.risk_evaluation is not None
        assert "score" in cap_res.risk_evaluation
        assert "ml_fraud_probability" in cap_res.risk_evaluation
        assert "hybrid_score" in cap_res.risk_evaluation
    finally:
        db.close()

@pytest.mark.asyncio
async def test_update_paypal_credentials():
    db = SessionLocal()
    try:
        creds = PayPalCredentialsUpdateRequest(
            client_id="test_client_id_demo_sandbox_12345",
            client_secret="test_secret_demo_sandbox_67890",
            mock_simulator=True
        )
        res = await update_paypal_credentials(creds, None, db)
        assert "client_id_preview" in res
        assert "test_cli" in res["client_id_preview"]
    finally:
        db.close()
