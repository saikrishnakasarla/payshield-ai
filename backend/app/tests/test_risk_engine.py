import pytest
from datetime import datetime, timedelta
from app.risk_engine.rules import (
    BaselineAmountRule,
    VelocitySpikeRule,
    DuplicateReferenceRule,
    OrderItemMismatchRule,
    GeoIPAnomalyRule,
    BurstFrequencyRule
)
from app.risk_engine.engine import RiskEngine

def test_baseline_amount_rule_triggers():
    rule = BaselineAmountRule()
    txn = {
        "amount": 450.0,
        "customer_baseline_amount": 100.0,
    }
    res = rule.evaluate(txn, [])
    assert res.triggered is True
    assert res.score_points == 35
    assert "4.5x higher" in res.evidence

def test_baseline_amount_rule_normal():
    rule = BaselineAmountRule()
    txn = {
        "amount": 120.0,
        "customer_baseline_amount": 100.0,
    }
    res = rule.evaluate(txn, [])
    assert res.triggered is False
    assert res.score_points == 0

def test_velocity_spike_rule_triggers():
    rule = VelocitySpikeRule()
    now = datetime.utcnow()
    current_txn = {
        "customer_id": "CUST-TEST",
        "ip_address": "1.2.3.4",
        "timestamp": now
    }
    history = [
        {"customer_id": "CUST-TEST", "ip_address": "1.2.3.4", "timestamp": now - timedelta(minutes=2)},
        {"customer_id": "CUST-TEST", "ip_address": "1.2.3.4", "timestamp": now - timedelta(minutes=4)},
        {"customer_id": "CUST-TEST", "ip_address": "1.2.3.4", "timestamp": now - timedelta(minutes=6)},
    ]
    res = rule.evaluate(current_txn, history)
    assert res.triggered is True
    assert res.score_points == 25
    assert "3 payment attempts detected" in res.evidence

def test_order_item_mismatch_rule():
    rule = OrderItemMismatchRule()
    txn = {
        "amount": 250.00,
        "items": [
            {"name": "Item A", "price": 50.00, "quantity": 1},
            {"name": "Item B", "price": 40.00, "quantity": 1}
        ] # Sum is 90.00
    }
    res = rule.evaluate(txn, [])
    assert res.triggered is True
    assert res.score_points == 20
    assert "Cart calculation discrepancy" in res.evidence

def test_geo_ip_anomaly_rule():
    rule = GeoIPAnomalyRule()
    txn = {
        "ip_country": "NG",
        "billing_country": "US"
    }
    res = rule.evaluate(txn, [])
    assert res.triggered is True
    assert res.score_points == 22
    assert "originated from NG, but billing instrument registered in US" in res.evidence

def test_risk_score_is_bounded_zero_to_hundred():
    engine = RiskEngine()
    now = datetime.utcnow()
    
    # Create an extreme scenario that would sum to over 150 points
    extreme_txn = {
        "amount": 50000.0,
        "customer_baseline_amount": 50.0, # +35 pts
        "customer_id": "CUST-BURST",
        "ip_address": "194.226.57.1",
        "ip_country": "RU",
        "billing_country": "US", # +22 pts
        "timestamp": now,
        "items": [{"name": "Item", "price": 10.0, "quantity": 1}] # +20 pts
    }
    # 5 history items within 30s -> +25 velocity, +18 burst
    history = [
        {"customer_id": "CUST-BURST", "ip_address": "194.226.57.1", "timestamp": now - timedelta(seconds=10)}
        for _ in range(5)
    ]

    score, level, triggered = engine.evaluate_transaction(extreme_txn, history)
    assert score <= 100
    assert score >= 0
    assert level == "HIGH"
    assert len(triggered) >= 3

def test_duplicate_reference_rule():
    rule = DuplicateReferenceRule()
    txn = {
        "id": 2,
        "reference_id": "TXN-EXISTING-123",
        "device_fingerprint": "dev-abc",
        "amount": 100.0
    }
    history = [
        {"id": 1, "reference_id": "TXN-EXISTING-123", "device_fingerprint": "dev-xyz", "amount": 50.0}
    ]
    res = rule.evaluate(txn, history)
    assert res.triggered is True
    assert res.score_points == 30
    assert "Duplicate reference ID" in res.evidence

def test_burst_frequency_rule():
    rule = BurstFrequencyRule()
    now = datetime.utcnow()
    current_txn = {
        "device_fingerprint": "fingerprint-burst-1",
        "ip_address": "10.0.0.1",
        "timestamp": now
    }
    history = [
        {"device_fingerprint": "fingerprint-burst-1", "ip_address": "10.0.0.1", "timestamp": now - timedelta(seconds=10 * i)}
        for i in range(1, 5)
    ]
    res = rule.evaluate(current_txn, history)
    assert res.triggered is True
    assert res.score_points == 18
    assert "rapid transactions in under 60 seconds" in res.evidence

def test_risk_engine_handles_missing_or_malformed_data():
    engine = RiskEngine()
    empty_txn = {}
    score, level, triggered = engine.evaluate_transaction(empty_txn, [])
    assert 0 <= score <= 100
    assert level == "LOW"

    malformed_txn = {
        "amount": None,
        "customer_baseline_amount": "invalid",
        "items": "malformed-json-{{{{",
        "timestamp": "not-a-timestamp"
    }
    score, level, triggered = engine.evaluate_transaction(malformed_txn, [])
    assert 0 <= score <= 100

