import pytest
from app.risk_engine.engine import risk_engine
from app.risk_engine.ml_model import fraud_ml_model
from app.risk_engine.rules import (
    AccountAgeAnomalyRule,
    FailedAttemptsSpikeRule,
    SubThresholdStructuringRule,
    DeviceSessionIntegrityRule
)

def test_ml_model_feature_attributions_and_probability():
    # Legitimate profile
    legit_txn = {
        "amount": 45.0,
        "customer_baseline_amount": 50.0,
        "account_age_days": 180,
        "ip_country": "US",
        "billing_country": "US",
        "device_fingerprint": "fp-mac-safari-1",
        "failed_attempts_24h": 0
    }
    pred_legit = fraud_ml_model.predict_fraud_probability(legit_txn, [])
    assert pred_legit["fraud_probability"] < 0.35
    assert pred_legit["ml_risk_tier"] == "LOW"
    assert len(pred_legit["top_attributions"]) > 0

    # High-risk profile
    fraud_txn = {
        "amount": 2900.0,
        "customer_baseline_amount": 60.0,
        "account_age_days": 2,
        "ip_country": "RU",
        "billing_country": "US",
        "device_fingerprint": "fp-headless-puppeteer",
        "failed_attempts_24h": 4
    }
    pred_fraud = fraud_ml_model.predict_fraud_probability(fraud_txn, [])
    assert pred_fraud["fraud_probability"] >= 0.40
    assert pred_fraud["ml_risk_tier"] in ("MEDIUM", "HIGH")

def test_account_age_anomaly_rule():
    rule = AccountAgeAnomalyRule()
    # Brand new account with high order
    res = rule.evaluate({"amount": 500.0, "customer_baseline_amount": 100.0, "account_age_days": 3}, [])
    assert res.triggered is True
    assert res.score_points == 24

    # Established account
    res_normal = rule.evaluate({"amount": 500.0, "customer_baseline_amount": 100.0, "account_age_days": 120}, [])
    assert res_normal.triggered is False

def test_failed_attempts_spike_rule():
    rule = FailedAttemptsSpikeRule()
    res = rule.evaluate({"failed_attempts_24h": 3}, [])
    assert res.triggered is True
    assert res.score_points == 28

    res_clean = rule.evaluate({"failed_attempts_24h": 0}, [])
    assert res_clean.triggered is False

def test_subthreshold_structuring_evasion_rule():
    rule = SubThresholdStructuringRule()
    # Structuring attack: $98.50 to evade a $100 threshold
    res = rule.evaluate({"amount": 98.50, "customer_baseline_amount": 35.0}, [])
    assert res.triggered is True
    assert res.score_points == 22

    # Normal non-structuring amount
    res_clean = rule.evaluate({"amount": 42.00, "customer_baseline_amount": 40.0}, [])
    assert res_clean.triggered is False

def test_device_integrity_rule():
    rule = DeviceSessionIntegrityRule()
    res = rule.evaluate({"device_fingerprint": "fp-headless-chrome-automated"}, [])
    assert res.triggered is True
    assert res.score_points == 26

    res_clean = rule.evaluate({"device_fingerprint": "fp-safari-ios-iphone"}, [])
    assert res_clean.triggered is False

def test_full_engine_evasion_scenario_detection():
    """
    Tests an adversarial evasion attempt:
    Attacker keeps order amount at $98.00 (below $100 baseline multiplier alert),
    but uses a new account (< 2 days) and a headless browser.
    The combined ML and multi-signal rules must detect this evasion attempt!
    """
    evasion_txn = {
        "amount": 98.00,
        "customer_baseline_amount": 35.0, # ratio = 2.8x (just under 3.0x naive rule threshold!)
        "account_age_days": 2,
        "device_fingerprint": "fp-headless-bot-8",
        "failed_attempts_24h": 3,
        "ip_country": "US",
        "billing_country": "US"
    }

    score, level, triggered, ml_result = risk_engine.evaluate_transaction_full(evasion_txn, [])
    # Even though amount is below the 3.0x baseline threshold, the evasion defense detects it:
    triggered_ids = [r.rule_id for r in triggered]
    assert "RULE_SUBTHRESHOLD_STRUCTURING" in triggered_ids
    assert "RULE_ACCOUNT_AGE_ANOMALY" in triggered_ids
    assert "RULE_FAILED_ATTEMPTS_SPIKE" in triggered_ids
    assert "RULE_DEVICE_INTEGRITY" in triggered_ids
    assert score >= 70 # Flagged as HIGH
    assert level == "HIGH"
