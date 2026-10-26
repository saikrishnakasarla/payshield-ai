import pytest
from app.services.ai_explainer import ai_explainer, AIExplainerService
from app.risk_engine.rules import RuleResult

def test_ai_fallback_generates_valid_structure():
    txn_data = {
        "amount": 2500.0,
        "currency": "USD",
        "customer_baseline_amount": 100.0
    }
    mock_rules = [
        RuleResult(
            rule_id="RULE_AMOUNT_BASELINE",
            rule_name="Baseline Amount Discrepancy",
            description="Amount exceeds baseline",
            score_points=35,
            category="AMOUNT_ANOMALY",
            evidence="Amount ($2,500.00) is 25.0x customer baseline.",
            triggered=True
        )
    ]

    fallback = ai_explainer._generate_rule_based_fallback(txn_data, 75, "HIGH", mock_rules)
    assert "summary" in fallback
    assert "explanation" in fallback
    assert "uncertainties" in fallback
    assert "recommended_steps" in fallback
    assert len(fallback["recommended_steps"]) >= 2
    assert "Fallback" in fallback["model_used"]

def test_ai_explainer_service_sync_generation():
    txn_data = {
        "amount": 50.0,
        "currency": "USD",
        "customer_baseline_amount": 50.0
    }
    res = ai_explainer.generate_explanation_sync(txn_data, 10, "LOW", [])
    assert res is not None
    assert "summary" in res
    assert "recommended_steps" in res
    assert res["recommended_action"] == "approve"

def test_ai_explainer_sanitizes_hallucinations():
    service = AIExplainerService()
    text = "The user is definitely fraudulent and is a criminal."
    sanitized = service._sanitize_hallucinations(text)
    assert "is definitely fraudulent" not in sanitized
    assert "is a criminal" not in sanitized
    assert "statistical risk indicators" in sanitized

def test_fact_registry_grounding():
    service = AIExplainerService()
    txn = {
        "amount": 150.0,
        "customer_baseline_amount": 100.0,
        "billing_country": "US",
        "ip_country": "US",
        "account_age_days": 45,
        "failed_attempts_24h": 1
    }
    facts = service.build_fact_registry(txn, 25, "LOW", [])
    assert "verified_gateway_facts" in facts
    assert facts["verified_gateway_facts"]["amount"] == 150.0
    assert facts["verified_gateway_facts"]["account_age_days"] == 45
    assert facts["verified_gateway_facts"]["prior_failed_attempts_24h"] == 1
