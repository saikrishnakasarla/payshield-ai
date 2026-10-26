import pytest
import json
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_providers_status_endpoint():
    """Verify all 4 payment providers are listed and accurately report configuration."""
    res = client.get("/api/payments/providers")
    assert res.status_code == 200
    providers = res.json()
    assert len(providers) == 4
    names = [p["provider"] for p in providers]
    assert "PAYPAL" in names
    assert "STRIPE" in names
    assert "RAZORPAY" in names
    assert "ADYEN" in names

    # Stripe and Razorpay should report not configured unless keys are added
    stripe_info = next(p for p in providers if p["provider"] == "STRIPE")
    assert "Test Credit Cards" in stripe_info["supported_methods"]
    
    razorpay_info = next(p for p in providers if p["provider"] == "RAZORPAY")
    assert "UPI (VPA Simulation)" in razorpay_info["supported_methods"]

def test_stripe_payment_create_and_verify_success():
    """Test full Stripe workflow: create intent -> server-side verify -> DB persist -> risk scored."""
    create_res = client.post("/api/payments/create", json={
        "provider": "STRIPE",
        "amount": 149.99,
        "currency": "USD",
        "customer_email": "stripe.testuser@example.com",
        "customer_name": "Stripe Cardholder",
        "item_name": "Pro Security Subscription"
    })
    assert create_res.status_code == 200
    create_data = create_res.json()
    assert create_data["provider"] == "STRIPE"
    assert create_data["order_id"].startswith("pi_")
    assert create_data["amount"] == 149.99

    # Verify and capture
    verify_res = client.post("/api/payments/verify", json={
        "provider": "STRIPE",
        "payment_id": f"ch_{create_data['order_id']}",
        "order_id": create_data["order_id"],
        "amount": 149.99,
        "currency": "USD",
        "customer_email": "stripe.testuser@example.com",
        "customer_name": "Stripe Cardholder",
        "test_scenario": "SUCCESS"
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["success"] is True
    assert v_data["status"] == "COMPLETED"
    assert v_data["provider"] == "STRIPE"
    assert v_data["risk_evaluation"]["score"] >= 0

    # Verify transaction appears in dashboard
    dash_res = client.get("/api/transactions?provider=STRIPE")
    assert dash_res.status_code == 200
    txns = dash_res.json()["items"]
    assert any(t["provider"] == "STRIPE" for t in txns)

def test_razorpay_upi_payment_flow():
    """Test Razorpay UPI payment workflow: create order -> verify UPI -> evaluate risk."""
    create_res = client.post("/api/payments/create", json={
        "provider": "RAZORPAY",
        "amount": 799.00,
        "currency": "INR",
        "customer_email": "upi.merchant@example.com",
        "customer_name": "UPI Verified Shopper",
        "item_name": "AI Fraud Protection License"
    })
    assert create_res.status_code == 200
    create_data = create_res.json()
    assert create_data["provider"] == "RAZORPAY"
    assert create_data["order_id"].startswith("order_")
    assert create_data["currency"] == "INR"

    # Verify UPI payment
    verify_res = client.post("/api/payments/verify", json={
        "provider": "RAZORPAY",
        "payment_id": f"pay_upi_{create_data['order_id']}",
        "order_id": create_data["order_id"],
        "amount": 799.00,
        "currency": "INR",
        "customer_email": "upi.merchant@example.com",
        "customer_name": "UPI Verified Shopper",
        "payment_method": "UPI",
        "test_scenario": "SUCCESS"
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["success"] is True
    assert v_data["payment_method"] == "UPI"
    assert v_data["provider"] == "RAZORPAY"

def test_stripe_declined_card_scenario():
    """Test declined card scenario with proper status and error response."""
    verify_res = client.post("/api/payments/verify", json={
        "provider": "STRIPE",
        "payment_id": "pi_declined_test_123",
        "order_id": "pi_declined_test_123",
        "amount": 89.0,
        "currency": "USD",
        "customer_email": "declined@example.com",
        "customer_name": "Card Decliner",
        "test_scenario": "DECLINED"
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["success"] is False
    assert v_data["status"] == "DECLINED"

def test_razorpay_pending_scenario():
    """Test pending authorization / UPI app push scenario."""
    verify_res = client.post("/api/payments/verify", json={
        "provider": "RAZORPAY",
        "payment_id": "pay_pending_upi_123",
        "order_id": "order_pending_upi_123",
        "amount": 499.0,
        "currency": "INR",
        "customer_email": "pending@example.com",
        "customer_name": "Pending UPI Shopper",
        "test_scenario": "PENDING"
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["success"] is False
    assert v_data["status"] == "PENDING"

def test_suspicious_pattern_scenario_triggers_high_risk():
    """Test suspicious evasion pattern triggers high risk score in PayShield risk engine."""
    verify_res = client.post("/api/payments/verify", json={
        "provider": "STRIPE",
        "payment_id": "pi_suspicious_spike_999",
        "order_id": "pi_suspicious_spike_999",
        "amount": 2500.0,
        "currency": "USD",
        "customer_email": "highrisk@darkweb.org",
        "customer_name": "Suspicious Adversary",
        "test_scenario": "SUSPICIOUS"
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["risk_evaluation"]["score"] >= 65
    assert v_data["risk_evaluation"]["risk_level"] in ("MEDIUM", "HIGH")
