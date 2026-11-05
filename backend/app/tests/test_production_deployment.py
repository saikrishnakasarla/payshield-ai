"""
PayShield AI — Test Suite for Production Deployment, Monitoring & Observability
Verifies production configuration validation, non-ephemeral database enforcement,
health check probes (/health, /health/live, /health/ready), structured logging,
correlation ID tracing, error sanitization, and resilience under dependency failure.
"""

import pytest
import uuid
import re
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.config import Settings, settings
from app.database import check_database_connection
from app.middleware.logging_middleware import sanitize_log_message, get_correlation_id
from app.services.metrics import metrics

client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Scenario 1: Production Configuration Validation
# ---------------------------------------------------------------------------
def test_01_production_config_validation_success():
    """Valid production settings with PostgreSQL and secure 32+ char key pass validation."""
    prod_settings = Settings(
        APP_ENV="production",
        DEBUG=False,
        DATABASE_URL="postgresql://usr:strongpwd@ep-prod.aws.neon.tech/payshield_prod?sslmode=require",
        SECRET_KEY="c" * 32,  # 32 characters
        PAYPAL_MODE="sandbox",
        PAYPAL_CLIENT_ID="valid_sandbox_client_id",
        PAYPAL_CLIENT_SECRET="valid_sandbox_secret_key",
        PAYPAL_MOCK_SIMULATOR=False
    )
    assert prod_settings.is_production is True
    assert prod_settings.DEBUG is False
    assert prod_settings.PAYPAL_MOCK_SIMULATOR is False


# ---------------------------------------------------------------------------
# Scenario 2: Missing or Insecure SECRET_KEY Rejected in Production
# ---------------------------------------------------------------------------
def test_02_production_rejects_insecure_secret_key():
    """Production rejects default, short, or placeholder secret keys."""
    # Short secret key
    with pytest.raises(ValueError, match="SECRET_KEY must be at least 32 characters long"):
        Settings(
            APP_ENV="production",
            DEBUG=False,
            DATABASE_URL="postgresql://usr:pwd@host:5432/db",
            SECRET_KEY="too_short_key",
            PAYPAL_MOCK_SIMULATOR=False
        )

    # Insecure default placeholder key
    with pytest.raises(ValueError, match="Insecure or default development SECRET_KEY detected"):
        Settings(
            APP_ENV="production",
            DEBUG=False,
            DATABASE_URL="postgresql://usr:pwd@host:5432/db",
            SECRET_KEY="payshield-hackathon-super-secret-jwt-key-2026-secure-random",
            PAYPAL_MOCK_SIMULATOR=False
        )


# ---------------------------------------------------------------------------
# Scenario 3: Rejection of Ephemeral SQLite in Production
# ---------------------------------------------------------------------------
def test_03_rejection_of_ephemeral_sqlite_in_production():
    """Production strictly rejects SQLite storage for financial transaction records."""
    with pytest.raises(ValueError, match="Ephemeral.*SQLite storage cannot be used"):
        Settings(
            APP_ENV="production",
            DEBUG=False,
            DATABASE_URL="sqlite:///./payshield.db",
            SECRET_KEY="c" * 32,
            PAYPAL_MOCK_SIMULATOR=False
        )

    # In-memory SQLite also rejected
    with pytest.raises(ValueError, match="Ephemeral.*SQLite storage cannot be used"):
        Settings(
            APP_ENV="production",
            DEBUG=False,
            DATABASE_URL="sqlite:///:memory:",
            SECRET_KEY="c" * 32,
            PAYPAL_MOCK_SIMULATOR=False
        )


# ---------------------------------------------------------------------------
# Scenario 4: Rejection of Simulator Fallback in Production
# ---------------------------------------------------------------------------
def test_04_rejection_of_simulator_fallback_in_production():
    """Production strictly rejects running with mock simulator enabled."""
    with pytest.raises(ValueError, match="PAYPAL_MOCK_SIMULATOR cannot be enabled in production"):
        Settings(
            APP_ENV="production",
            DEBUG=False,
            DATABASE_URL="postgresql://usr:pwd@host/db",
            SECRET_KEY="c" * 32,
            PAYPAL_MOCK_SIMULATOR=True
        )


# ---------------------------------------------------------------------------
# Scenario 5: Health and Readiness Endpoints
# ---------------------------------------------------------------------------
def test_05_health_and_readiness_endpoints():
    """Verify /health, /health/live, and /health/ready return 200 with appropriate metadata."""
    # 1. /health
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == settings.APP_NAME
    assert "dependencies" in data
    assert data["dependencies"]["database"]["status"] == "connected"

    # 2. /health/live
    live_res = client.get("/health/live")
    assert live_res.status_code == 200
    assert live_res.json()["status"] == "alive"

    # 3. /health/ready
    ready_res = client.get("/health/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "ready"
    assert ready_res.json()["database"] == "connected"


# ---------------------------------------------------------------------------
# Scenario 6: Database Unavailability Handling
# ---------------------------------------------------------------------------
def test_06_database_unavailability_handling():
    """When the database is unreachable, /health/ready must return HTTP 503."""
    with patch("app.api.routes_health.check_database_connection", return_value=(False, 150.0, "Connection refused")):
        res = client.get("/health/ready")
        assert res.status_code == 503
        data = res.json()
        assert data["status"] == "unready"
        assert "failed" in data["reason"].lower()


# ---------------------------------------------------------------------------
# Scenario 7: PayPal Timeout Handling
# ---------------------------------------------------------------------------
def test_07_paypal_timeout_handling():
    """External PayPal network timeout must return an informative error without crashing."""
    with patch("app.services.paypal_service.PayPalService.create_order", side_effect=Exception("Connection timed out after 30s")):
        res = client.post("/api/paypal/orders", json={
            "amount": 100.0,
            "currency": "USD"
        })
        # Handled gracefully with error response
        assert res.status_code in (400, 500, 502, 504)
        data = res.json()
        assert "error" in data or "detail" in data


# ---------------------------------------------------------------------------
# Scenario 8: Gemini Timeout Handling with Fallback
# ---------------------------------------------------------------------------
def test_08_gemini_timeout_handling_with_fallback():
    """Gemini AI API failure falls back to deterministic rule and ML synthesis."""
    with patch("httpx.AsyncClient.post", side_effect=Exception("ReadTimeout: Gemini AI timeout")):
        # Transaction creation still succeeds because Gemini is wrapped in graceful fallback
        res = client.post("/api/transactions", json={
            "amount": 120.0,
            "currency": "USD",
            "customer_id": "CUST-TIMEOUT-TEST",
            "customer_name": "Timeout User",
            "customer_email": "timeout_user@example.com"
        })
        assert res.status_code == 201
        data = res.json()
        assert data["ai_analysis"]["is_fallback"] is True
        assert data["ai_analysis"]["explanation_source"] == "grounded_rule_ml_fallback"


# ---------------------------------------------------------------------------
# Scenario 9: Structured Logging and PII / Secret Redaction
# ---------------------------------------------------------------------------
def test_09_structured_logging_pii_and_secret_redaction():
    """Log sanitizer scrubs Bearer tokens, passwords, secrets, and card numbers."""
    sensitive_log = (
        'Incoming request: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 '
        '{"password": "MySuperSecretPassword123!", "client_secret": "paypal_secret_xyz"} '
        'Card: 4532 1234 5678 9012'
    )
    cleaned = sanitize_log_message(sensitive_log)
    
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in cleaned
    assert "[REDACTED_TOKEN]" in cleaned
    assert "MySuperSecretPassword123!" not in cleaned
    assert "[REDACTED_PASSWORD]" in cleaned
    assert "paypal_secret_xyz" not in cleaned
    assert "[REDACTED_SECRET]" in cleaned
    assert "4532 1234 5678 9012" not in cleaned
    assert "[REDACTED_CARD_NUMBER]" in cleaned


# ---------------------------------------------------------------------------
# Scenario 10: Request Correlation IDs (X-Request-ID)
# ---------------------------------------------------------------------------
def test_10_request_correlation_ids_in_response():
    """Every response must include an X-Request-ID header matching the client or auto-generated."""
    # 1. Custom client-provided Request ID
    custom_id = "trace_custom_999888"
    res1 = client.get("/health/live", headers={"X-Request-ID": custom_id})
    assert res1.status_code == 200
    assert res1.headers.get("X-Request-ID") == custom_id

    # 2. Auto-generated Request ID
    res2 = client.get("/health/live")
    assert res2.status_code == 200
    generated_id = res2.headers.get("X-Request-ID")
    assert generated_id is not None
    assert generated_id.startswith("req_")


# ---------------------------------------------------------------------------
# Scenario 11: Security Headers Enforced
# ---------------------------------------------------------------------------
def test_11_security_headers_enforced():
    """Security headers (nosniff, frameguard, referrer policy) must be set on responses."""
    res = client.get("/health/live")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


# ---------------------------------------------------------------------------
# Scenario 12: Production-Safe Error Responses (No Internal Stack Trace Leaks)
# ---------------------------------------------------------------------------
def test_12_production_safe_error_responses():
    """Unhandled internal exceptions return a sanitized JSON error with request_id and no trace."""
    res = client.get("/health/test-error")
    assert res.status_code == 500
    data = res.json()
    assert data["error"] == "Internal Server Error"
    assert "super_secret_pwd" not in res.text
    assert "request_id" in data
    assert "contact support quoting this request id" in data["detail"].lower()


# ---------------------------------------------------------------------------
# Scenario 13: Diagnostics Endpoint Exposes Status Without Secrets
# ---------------------------------------------------------------------------
def test_13_diagnostics_endpoint_security():
    """Diagnostics endpoint exposes feature and engine statuses without revealing any secrets."""
    res = client.get("/health/diagnostics")
    assert res.status_code == 200
    diag = res.json()

    assert "application" in diag
    assert "environment" in diag
    assert "database" in diag
    assert "gateways" in diag
    assert "services" in diag

    # Verify no raw secrets appear in diagnostics response
    raw_text = res.text
    assert settings.SECRET_KEY not in raw_text
    if settings.PAYPAL_CLIENT_SECRET:
        assert settings.PAYPAL_CLIENT_SECRET not in raw_text
    if settings.GEMINI_API_KEY:
        assert settings.GEMINI_API_KEY not in raw_text


# ---------------------------------------------------------------------------
# Scenario 14: Payment Processing During Optional AI Outages
# ---------------------------------------------------------------------------
def test_14_payment_processing_during_optional_ai_outages():
    """Multi-gateway payment creation and verification succeed even when AI service is down."""
    # 1. Create order
    create_res = client.post("/api/payments/create", json={
        "provider": "STRIPE",
        "amount": 250.0,
        "currency": "USD",
        "description": "Test resilient order under AI outage"
    })
    assert create_res.status_code == 200
    order_id = create_res.json()["order_id"]

    # 2. Simulate complete failure of AI explanation
    with patch("app.services.ai_explainer.AIExplainerService.explain_risk", side_effect=Exception("Total Gemini failure")):
        verify_res = client.post("/api/payments/verify", json={
            "provider": "STRIPE",
            "payment_id": f"ch_{order_id}",
            "order_id": order_id,
            "amount": 250.0,
            "currency": "USD",
            "customer_email": "resilient_user@example.com",
            "customer_name": "Resilient Cardholder",
            "test_scenario": "SUCCESS"
        })
        # Payment verification must still succeed with HTTP 200
        assert verify_res.status_code == 200
        assert verify_res.json()["success"] is True
        assert verify_res.json()["status"] == "COMPLETED"


# ---------------------------------------------------------------------------
# Scenario 15: Operational Metrics Telemetry
# ---------------------------------------------------------------------------
def test_15_operational_metrics_telemetry():
    """Operational metrics endpoint records throughput, latencies, and gateway calls."""
    res = client.get("/health/metrics")
    assert res.status_code == 200
    summary = res.json()

    assert "uptime_seconds" in summary
    assert "requests" in summary
    assert summary["requests"]["total"] >= 1
    assert "database" in summary
    assert "payment_gateways" in summary
    assert "ai_intelligence" in summary
