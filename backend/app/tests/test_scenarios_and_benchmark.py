import pytest
import asyncio
from app.database import SessionLocal
from app.api.routes_benchmark import get_public_dataset_benchmark_evaluation
from app.api.routes_scenarios import get_showcase_scenarios, simulate_showcase_scenario

def test_public_dataset_benchmark_endpoint():
    res = get_public_dataset_benchmark_evaluation()
    assert "metrics" in res
    assert "precision" in res["metrics"]
    assert "recall" in res["metrics"]
    assert "pr_auc" in res["metrics"]
    assert "false_positive_rate" in res["metrics"]
    assert "system_comparison" in res
    assert "rules_only" in res["system_comparison"]
    assert "random_forest_ml" in res["system_comparison"]
    assert len(res["sample_evaluations"]) >= 4

def test_showcase_scenarios_list():
    scenarios = get_showcase_scenarios()
    assert len(scenarios) == 4
    ids = [s["id"] for s in scenarios]
    assert "legitimate" in ids
    assert "suspicious" in ids
    assert "ambiguous" in ids
    assert "adversarial" in ids

def test_simulate_adversarial_evasion_scenario():
    db = SessionLocal()
    try:
        # Run adversarial simulation synchronously
        res = simulate_showcase_scenario("adversarial", db)
        assert res["risk_level"] == "HIGH"
        assert res["ml_fraud_probability"] > 0.40
        assert res["audit_record"]["is_chained"] is True
        
        triggered_ids = [r["rule_id"] for r in res["triggered_rules"]]
        assert "RULE_SUBTHRESHOLD_STRUCTURING" in triggered_ids
    finally:
        db.close()
