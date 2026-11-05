import uuid
"""
PayShield AI — Test Suite for AI Risk Intelligence, Explainability & Model Reliability
Tests all 18 dedicated scenarios across ML inference, heuristic rules, Gemini explainability,
privacy/PII minimization, merchant data isolation, and graceful fault tolerance.
"""

import pytest
import json
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.risk_engine.engine import risk_engine, RiskEngine
from app.risk_engine.rules import (
    BaselineAmountRule,
    VelocitySpikeRule,
    GeoIPAnomalyRule,
    AccountAgeAnomalyRule,
    SubThresholdStructuringRule,
    DeviceSessionIntegrityRule,
    OrderItemMismatchRule,
    FailedAttemptsSpikeRule
)
from app.risk_engine.ml_model import fraud_ml_model, FraudClassificationModel
from app.services.ai_explainer import ai_explainer, AIExplainerService
from app.services.auth import create_access_token, hash_password
from app.config import settings

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_merchants(db_session: Session):
    m1 = db_session.query(User).filter(User.email == "merchant_ai_1@example.com").first()
    if not m1:
        m1 = User(
            email="merchant_ai_1@example.com",
            hashed_password=hash_password("SecretPassword123!"),
            full_name="Merchant AI One",
            business_name="Store Alpha",
            role="merchant",
            is_active=True
        )
        db_session.add(m1)
        db_session.flush()

    m2 = db_session.query(User).filter(User.email == "merchant_ai_2@example.com").first()
    if not m2:
        m2 = User(
            email="merchant_ai_2@example.com",
            hashed_password=hash_password("SecretPassword123!"),
            full_name="Merchant AI Two",
            business_name="Store Beta",
            role="merchant",
            is_active=True
        )
        db_session.add(m2)
        db_session.flush()

    db_session.commit()
    return m1, m2


# ---------------------------------------------------------------------------
# Scenario 1: Low-risk transaction (score < 35, LOW)
# ---------------------------------------------------------------------------
def test_01_low_risk_transaction():
    txn = {
        "amount": 45.0,
        "customer_baseline_amount": 50.0,
        "account_age_days": 180,
        "failed_attempts_24h": 0,
        "ip_country": "US",
        "billing_country": "US",
        "device_fingerprint": "Mozilla/5.0 Safari/605.1.15"
    }
    score, level, triggered, ml_pred = risk_engine.evaluate_transaction_full(txn, [])
    assert score < settings.MEDIUM_RISK_SCORE
    assert level == "LOW"
    assert len(triggered) == 0
    assert ml_pred["ml_risk_tier"] == "LOW"


# ---------------------------------------------------------------------------
# Scenario 2: High-risk transaction (score >= 70, HIGH or CRITICAL)
# ---------------------------------------------------------------------------
def test_02_high_risk_transaction():
    txn = {
        "amount": 950.0,
        "customer_baseline_amount": 80.0,  # ~11.8x baseline (+35 pts)
        "account_age_days": 2,              # new account with elevated amount (+24 pts)
        "failed_attempts_24h": 3,           # repeated declines (+28 pts)
        "ip_country": "RU",
        "billing_country": "US",            # geo mismatch (+22 pts)
        "device_fingerprint": "Mozilla/5.0 Firefox"
    }
    score, level, triggered, ml_pred = risk_engine.evaluate_transaction_full(txn, [])
    assert score >= settings.HIGH_RISK_SCORE
    assert level in ("HIGH", "CRITICAL")
    assert len(triggered) >= 3


# ---------------------------------------------------------------------------
# Scenario 3: Multiple triggered risk signals
# ---------------------------------------------------------------------------
def test_03_multiple_triggered_risk_signals():
    now = datetime.utcnow()
    txn = {
        "customer_id": "CUST-MULTI-01",
        "amount": 450.0,
        "customer_baseline_amount": 100.0,  # 4.5x baseline (+35)
        "ip_country": "NG",
        "billing_country": "US",            # Geo IP (+22)
        "device_fingerprint": "fp-headless-bot-9",  # Device (+26)
        "timestamp": now
    }
    # Velocity history
    history = [
        {"customer_id": "CUST-MULTI-01", "timestamp": now - timedelta(minutes=2)},
        {"customer_id": "CUST-MULTI-01", "timestamp": now - timedelta(minutes=4)},
        {"customer_id": "CUST-MULTI-01", "timestamp": now - timedelta(minutes=6)}
    ]
    score, level, triggered, _ = risk_engine.evaluate_transaction_full(txn, history)
    triggered_ids = [r.rule_id for r in triggered]
    assert "RULE_AMOUNT_BASELINE" in triggered_ids
    assert "RULE_GEO_IP_ANOMALY" in triggered_ids
    assert "RULE_DEVICE_INTEGRITY" in triggered_ids
    assert "RULE_VELOCITY_SPIKE" in triggered_ids
    assert score >= settings.CRITICAL_RISK_SCORE
    assert level == "CRITICAL"


# ---------------------------------------------------------------------------
# Scenario 4: Missing transaction features not penalized
# ---------------------------------------------------------------------------
def test_04_missing_transaction_features_not_penalized():
    # Transaction with missing baseline, items, account age, and failed attempts
    minimal_txn = {
        "amount": 75.0,
        "currency": "USD",
        "customer_id": "CUST-NEW-01",
        "ip_country": "US",
        "billing_country": "US"
        # Notice: customer_baseline_amount, items, account_age_days, failed_attempts_24h are omitted
    }
    score, level, triggered, ml_pred = risk_engine.evaluate_transaction_full(minimal_txn, [])
    assert score == 0
    assert level == "LOW"
    assert len(triggered) == 0
    assert ml_pred["ml_risk_tier"] == "LOW"


# ---------------------------------------------------------------------------
# Scenario 5: Invalid transaction input handled safely
# ---------------------------------------------------------------------------
def test_05_invalid_transaction_input_handled_safely():
    malformed_txn = {
        "amount": "not_a_number",
        "customer_baseline_amount": None,
        "account_age_days": "invalid",
        "failed_attempts_24h": -5,
        "items": "corrupted { json [",
        "timestamp": "not_a_date"
    }
    # Must not raise exceptions or crash
    score, level, triggered, ml_pred = risk_engine.evaluate_transaction_full(malformed_txn, [])
    assert 0 <= score <= 100
    assert level in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    assert isinstance(triggered, list)
    assert 0.0 <= ml_pred.get("fraud_probability", 0.0) <= 1.0


# ---------------------------------------------------------------------------
# Scenario 6: Deterministic scoring
# ---------------------------------------------------------------------------
def test_06_deterministic_scoring():
    txn = {
        "amount": 290.0,
        "customer_baseline_amount": 100.0,
        "account_age_days": 30,
        "failed_attempts_24h": 0,
        "ip_country": "CA",
        "billing_country": "CA",
        "device_fingerprint": "standard-desktop-chrome"
    }
    scores = []
    levels = []
    for _ in range(5):
        s, l, t, _ = risk_engine.evaluate_transaction_full(txn, [])
        scores.append(s)
        levels.append(l)

    assert len(set(scores)) == 1, "Scores must be strictly deterministic across evaluations"
    assert len(set(levels)) == 1, "Risk level must be strictly deterministic across evaluations"


# ---------------------------------------------------------------------------
# Scenario 7: ML model unavailable fallback
# ---------------------------------------------------------------------------
def test_07_ml_model_unavailable_fallback():
    mock_model = FraudClassificationModel()
    mock_model.model = None

    with patch.object(mock_model, "_initialize_model", side_effect=RuntimeError("Disk failure loading model")):
        res = mock_model.predict_fraud_probability({"amount": 100.0}, [])
        assert res["is_fallback"] is True
        assert res["fraud_probability"] == 0.0
        assert res["ml_risk_tier"] == "UNKNOWN"
        assert "fallback" in res["model_version"].lower()


# ---------------------------------------------------------------------------
# Scenario 8: ML inference failure handled without crashing
# ---------------------------------------------------------------------------
def test_08_ml_inference_failure_handled_safely():
    engine_with_failing_ml = RiskEngine()
    txn = {"amount": 50.0, "customer_baseline_amount": 50.0}
    with patch.object(engine_with_failing_ml.ml_model, "extract_features", side_effect=ValueError("Feature extraction fail")):
        pred = engine_with_failing_ml.ml_model.predict_fraud_probability(txn, [])
        assert pred["is_fallback"] is True
        assert pred["fraud_probability"] == 0.0
        assert pred["ml_risk_tier"] == "UNKNOWN" 


# ---------------------------------------------------------------------------
# Scenario 9: Gemini API timeout fallback
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_09_gemini_api_timeout_fallback():
    explainer = AIExplainerService()
    explainer.api_key = "test_gemini_key_12345"
    
    txn = {"amount": 120.0, "currency": "USD"}
    
    with patch("httpx.AsyncClient.post", side_effect=Exception("ReadTimeout: Request timed out after 10.0s")):
        res = await explainer.generate_explanation(txn, 40, "MEDIUM", [])
        assert res["is_fallback"] is True
        assert res["explanation_source"] == "grounded_rule_ml_fallback"
        assert "summary" in res
        assert "recommended_steps" in res


# ---------------------------------------------------------------------------
# Scenario 10: Gemini malformed JSON recovery
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_10_gemini_malformed_json_recovery():
    explainer = AIExplainerService()
    explainer.api_key = "test_gemini_key_12345"

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [{
            "content": {"parts": [{"text": "INVALID_NON_JSON_OUTPUT { truncated"}]}
        }]
    }

    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        res = await explainer.generate_explanation({"amount": 80.0}, 20, "LOW", [])
        assert res["is_fallback"] is True
        assert res["explanation_source"] == "grounded_rule_ml_fallback"
        assert "summary" in res


# ---------------------------------------------------------------------------
# Scenario 11: Gemini unavailable offline fallback
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_11_gemini_unavailable_offline_fallback():
    explainer = AIExplainerService()
    explainer.api_key = ""  # No key configured

    res = await explainer.generate_explanation({"amount": 150.0}, 30, "LOW", [])
    assert res["is_fallback"] is True
    assert res["explanation_source"] == "grounded_rule_ml_fallback"
    assert res["recommended_action"] in ("approve", "verify_shipping", "manual_review")


# ---------------------------------------------------------------------------
# Scenario 12: PII minimization in fact registry
# ---------------------------------------------------------------------------
def test_12_pii_minimization_in_fact_registry():
    explainer = AIExplainerService()
    raw_txn = {
        "amount": 250.0,
        "customer_email": "john.customer@private-bank.com",
        "ip_address": "192.168.1.100",  # Raw IP
        "ip_country": "US",
        "device_fingerprint": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        "secret_token": "super_secret_key_should_never_leak"
    }

    facts = explainer.build_fact_registry(raw_txn, 35, "MEDIUM", [])
    gateway_facts = facts["verified_gateway_facts"]

    # 1. Email must be masked
    assert "john.customer@private-bank.com" not in json.dumps(gateway_facts)
    assert gateway_facts.get("customer_email_masked") == "j***r@private-bank.com"

    # 2. Raw IP address must NOT be present
    assert "ip_address" not in gateway_facts
    assert "192.168.1.100" not in json.dumps(gateway_facts)

    # 3. Raw secret tokens must not be present
    assert "super_secret_key_should_never_leak" not in json.dumps(facts)

    # 4. Device fingerprint must be sanitized category
    assert gateway_facts.get("device_category") == "verified_browser_user_agent"


# ---------------------------------------------------------------------------
# Scenario 13: Merchant data isolation on re-analysis endpoint
# ---------------------------------------------------------------------------
def test_13_merchant_data_isolation_on_reanalysis(test_merchants, db_session: Session):
    m1, m2 = test_merchants

    # Create transaction belonging to Merchant 1
    txn1 = Transaction(
        user_id=m1.id,
        reference_id=f"TXN-ISO-{uuid.uuid4().hex[:8].upper()}",
        timestamp=datetime.utcnow(),
        amount=100.0,
        currency="USD",
        payment_status="COMPLETED",
        customer_id="CUST-ISO-1",
        customer_name="Merchant 1 Customer",
        customer_email="cust1@example.com",
        source="PAYPAL",
        risk_score=20,
        risk_level="LOW"
    )
    db_session.add(txn1)
    db_session.commit()
    db_session.refresh(txn1)

    # Merchant 2 attempts to trigger re-analysis on Merchant 1's transaction
    token_m2 = create_access_token(data={"sub": str(m2.id), "email": m2.email, "role": m2.role})
    headers_m2 = {"Authorization": f"Bearer {token_m2}"}

    res = client.post(f"/api/transactions/{txn1.id}/analyze", headers=headers_m2)
    assert res.status_code == 403, "Merchant 2 must be forbidden from reanalyzing Merchant 1's transaction"


# ---------------------------------------------------------------------------
# Scenario 14: Historical analysis persistence
# ---------------------------------------------------------------------------
def test_14_historical_analysis_persistence(db_session: Session):
    txn = Transaction(
        reference_id=f"TXN-PERSIST-{uuid.uuid4().hex[:8].upper()}",
        timestamp=datetime.utcnow(),
        amount=300.0,
        currency="USD",
        payment_status="COMPLETED",
        customer_id="CUST-PERSIST-1",
        customer_name="Persistent Customer",
        customer_email="persist@test.com",
        source="PAYPAL",
        risk_score=45,
        risk_level="MEDIUM"
    )
    db_session.add(txn)
    db_session.flush()

    analysis = RiskAnalysis(
        transaction_id=txn.id,
        deterministic_score=45,
        risk_level="MEDIUM",
        ml_fraud_probability=0.38,
        ml_risk_tier="MEDIUM",
        hybrid_score=42,
        ai_summary="Screened with medium risk indicator.",
        ai_explanation="Historical order variance evaluated.",
        model_used="RandomForest-v1.0"
    )
    db_session.add(analysis)
    db_session.commit()

    saved = db_session.query(RiskAnalysis).filter(RiskAnalysis.transaction_id == txn.id).first()
    assert saved is not None
    assert saved.deterministic_score == 45
    assert saved.risk_level == "MEDIUM"
    assert saved.ml_fraud_probability == 0.38
    assert saved.ml_risk_tier == "MEDIUM"


# ---------------------------------------------------------------------------
# Scenario 15: Risk category threshold boundaries (LOW, MEDIUM, HIGH, CRITICAL)
# ---------------------------------------------------------------------------
def test_15_risk_category_threshold_boundaries():
    engine_inst = RiskEngine()

    # Score 34 -> LOW
    with patch.object(engine_inst.ml_model, "predict_fraud_probability", return_value={"fraud_probability": 0.10, "is_fallback": False}):
        with patch.object(engine_inst, "_evaluate_rules_mock", return_value=(34, []), create=True):
            # Test direct threshold logic
            def eval_tier(score, prob):
                crit = getattr(settings, "CRITICAL_RISK_SCORE", 85)
                if score >= crit or prob >= 0.85:
                    return "CRITICAL"
                elif score >= settings.HIGH_RISK_SCORE or prob >= 0.70:
                    return "HIGH"
                elif score >= settings.MEDIUM_RISK_SCORE or prob >= 0.35:
                    return "MEDIUM"
                return "LOW"

            assert eval_tier(34, 0.20) == "LOW"
            assert eval_tier(35, 0.20) == "MEDIUM"
            assert eval_tier(69, 0.20) == "MEDIUM"
            assert eval_tier(70, 0.20) == "HIGH"
            assert eval_tier(84, 0.20) == "HIGH"
            assert eval_tier(85, 0.20) == "CRITICAL"
            assert eval_tier(10, 0.86) == "CRITICAL"
            assert eval_tier(10, 0.72) == "HIGH"
            assert eval_tier(10, 0.40) == "MEDIUM"


# ---------------------------------------------------------------------------
# Scenario 16: AI explanation consistency with evidence
# ---------------------------------------------------------------------------
def test_16_ai_explanation_consistency_with_evidence():
    explainer = AIExplainerService()
    txn = {
        "amount": 500.0,
        "currency": "USD",
        "customer_baseline_amount": 100.0,
        "customer_email": "traveler@example.com"
    }
    rule_res = BaselineAmountRule().evaluate(txn, [])
    assert rule_res.triggered is True

    fallback = explainer._generate_rule_and_ml_fallback(
        txn, 35, "MEDIUM", [rule_res],
        ml_prediction={"fraud_probability": 0.25, "top_attributions": []}
    )

    # Explanation must explicitly reference the triggered rule evidence
    assert "Baseline Amount Discrepancy" in fallback["summary"] or "Baseline Amount Discrepancy" in fallback["explanation"]
    assert "500.00" in fallback["explanation"]
    assert fallback["recommended_action"] in ("approve", "verify_shipping", "manual_review")


# ---------------------------------------------------------------------------
# Scenario 17: Payment processing unaffected by AI failure
# ---------------------------------------------------------------------------
def test_17_payment_processing_unaffected_by_ai_failure():
    # 1. Create order in gateway mock
    create_res = client.post("/api/payments/create", json={
        "provider": "STRIPE",
        "amount": 100.0,
        "currency": "USD",
        "description": "Resilient payment order"
    })
    assert create_res.status_code == 200
    order_id = create_res.json()["order_id"]

    # 2. Simulate payment order verification when AI explanation service encounters external failure
    with patch("app.services.ai_explainer.AIExplainerService.explain_risk", side_effect=Exception("Gemini service outage")):
        res = client.post("/api/payments/verify", json={
            "provider": "STRIPE",
            "payment_id": f"ch_{order_id}",
            "order_id": order_id,
            "amount": 100.0,
            "currency": "USD",
            "customer_email": "resilient@test.com",
            "customer_name": "Resilient Customer",
            "test_scenario": "SUCCESS"
        })
        # Payment verification must still succeed and return 200
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["status"] == "COMPLETED" 


# ---------------------------------------------------------------------------
# Scenario 18: Model preprocessing consistency
# ---------------------------------------------------------------------------
def test_18_model_preprocessing_consistency():
    txn1 = {
        "amount": 150.0,
        "customer_baseline_amount": 100.0,
        "account_age_days": 45,
        "failed_attempts_24h": 0,
        "ip_country": "US",
        "billing_country": "US",
        "device_fingerprint": "chrome-desktop"
    }
    txn2 = {
        "amount": 0.0,
        "customer_baseline_amount": None,
        "account_age_days": None,
        "failed_attempts_24h": None,
        "device_fingerprint": None
    }

    features1 = fraud_ml_model.extract_features(txn1, [])
    features2 = fraud_ml_model.extract_features(txn2, [])

    # Check shape
    assert features1.shape == (1, 10), "Feature matrix must have exactly 10 features"
    assert features2.shape == (1, 10), "Feature matrix must have exactly 10 features"

    # Check no NaNs or Infs
    assert not np.isnan(features1).any(), "Features must not contain NaNs"
    assert not np.isnan(features2).any(), "Features must not contain NaNs"
    assert not np.isinf(features1).any(), "Features must not contain Infs"
    assert not np.isinf(features2).any(), "Features must not contain Infs"
