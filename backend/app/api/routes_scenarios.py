from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime
import json
import uuid

from app.database import get_db
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.models.audit_log import record_audit_event
from app.risk_engine.engine import risk_engine
from app.services.ai_explainer import ai_explainer

router = APIRouter(prefix="/api/scenarios", tags=["Decision Showcase Scenarios"])

SHOWCASE_DEFINITIONS = [
    {
        "id": "legitimate",
        "title": "Scenario 1: Legitimate Routine Payment",
        "badge": "LOW RISK",
        "badge_color": "emerald",
        "description": "Standard recurring customer order with verified domestic IP, matching billing, and established 7-month profile.",
        "customer": "Emma Watson (emma.w@example.com)",
        "amount": 42.50,
        "currency": "USD",
        "customer_baseline": 50.0,
        "account_age_days": 210,
        "failed_attempts_24h": 0,
        "ip_country": "US",
        "billing_country": "US",
        "device": "fp-mac-safari-101",
        "items": [{"name": "Organic Coffee Beans 1lb", "price": 21.25, "quantity": 2}],
        "expected_model_decision": {
            "rule_score": 0,
            "ml_fraud_probability": 0.024,
            "risk_tier": "LOW",
            "recommended_action": "approve"
        },
        "recommended_human_action": "REVIEWED_SAFE — Instant automated approval; no friction for buyer.",
        "audit_guarantee": "Immediate cryptographic audit record with SHA-256 chain pointer."
    },
    {
        "id": "suspicious",
        "title": "Scenario 2: Suspicious Compound Attack",
        "badge": "HIGH RISK",
        "badge_color": "rose",
        "description": "Aggressive compound fraud: 35x baseline order volume, foreign IP geolocation mismatch (RU/US), headless browser signature, and repeated decline history.",
        "customer": "Alex Smith (alex.smith.test@example.com)",
        "amount": 2847.00,
        "currency": "USD",
        "customer_baseline": 80.0,
        "account_age_days": 3,
        "failed_attempts_24h": 4,
        "ip_country": "RU",
        "billing_country": "US",
        "device": "fp-ghost-headless-999",
        "items": [{"name": "Bulk Gift Cards ($500 x 5)", "price": 500.00, "quantity": 5}, {"name": "Processing Fee", "price": 347.00, "quantity": 1}],
        "expected_model_decision": {
            "rule_score": 88,
            "ml_fraud_probability": 0.941,
            "risk_tier": "HIGH",
            "recommended_action": "manual_review"
        },
        "recommended_human_action": "ESCALATED_HUMAN_REVIEW — Withhold fulfillment pending manual ID / phone verification.",
        "audit_guarantee": "Audit log records escalated review status with tamper-resistant signature."
    },
    {
        "id": "ambiguous",
        "title": "Scenario 3: Ambiguous Payment (Legitimate Customer Traveling)",
        "badge": "MEDIUM RISK",
        "badge_color": "amber",
        "description": "Legitimate established customer traveling abroad. IP mismatch (BR/US) and slightly elevated order value ($499 vs $250 baseline).",
        "customer": "Lucas Silva (lucas.s@example.com)",
        "amount": 499.00,
        "currency": "USD",
        "customer_baseline": 250.0,
        "account_age_days": 120,
        "failed_attempts_24h": 0,
        "ip_country": "BR",
        "billing_country": "US",
        "device": "fp-android-samsung-808",
        "items": [{"name": "Smart Security Hub", "price": 499.00, "quantity": 1}],
        "expected_model_decision": {
            "rule_score": 48,
            "ml_fraud_probability": 0.28,
            "risk_tier": "MEDIUM",
            "recommended_action": "verify_shipping"
        },
        "recommended_human_action": "VERIFY_SHIPPING — Send email confirmation to verified address before dispatch.",
        "audit_guarantee": "Documents decision support advice without asserting certainty."
    },
    {
        "id": "adversarial",
        "title": "Scenario 4: Adversarial Structuring Evasion Test",
        "badge": "EVASION DEFENSE",
        "badge_color": "purple",
        "description": "Sophisticated fraudster structuring payments ($98.50) specifically to remain beneath naive $100 baseline alert thresholds. Multi-signal ML + structuring rules intercept evasion.",
        "customer": "Victor Evasion (v.evasion@stealth-mail.org)",
        "amount": 98.50,
        "currency": "USD",
        "customer_baseline": 35.0, # 2.81x ratio (stays below standard 3.0x threshold!)
        "account_age_days": 1,
        "failed_attempts_24h": 3,
        "ip_country": "US",
        "billing_country": "US",
        "device": "fp-headless-puppeteer-bot",
        "items": [{"name": "Prepaid Digital Voucher", "price": 98.50, "quantity": 1}],
        "expected_model_decision": {
            "rule_score": 76,
            "ml_fraud_probability": 0.864,
            "risk_tier": "HIGH",
            "recommended_action": "manual_review"
        },
        "recommended_human_action": "ESCALATED_HUMAN_REVIEW — Flagged for automated evasion structuring.",
        "audit_guarantee": "Proof of evasion capture stored in cryptographically sealed audit entry."
    }
]

@router.get("/showcase", response_model=List[Dict[str, Any]])
def get_showcase_scenarios():
    """Returns the 4 core showcase scenarios illustrating evidence, decision, action, and audit trail."""
    return SHOWCASE_DEFINITIONS

@router.post("/simulate/{scenario_id}", response_model=Dict[str, Any])
def simulate_showcase_scenario(
    scenario_id: str,
    db: Session = Depends(get_db)
):
    """
    Executes a showcase scenario in real time:
    Runs feature extraction -> ML prediction -> Rule scoring -> Grounded Explainer -> Chained Audit Trail.
    """
    sc = next((s for s in SHOWCASE_DEFINITIONS if s["id"] == scenario_id), None)
    if not sc:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")

    ref_id = f"SIM-{scenario_id.upper()}-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()
    items_json = json.dumps(sc["items"])

    txn_dict = {
        "reference_id": ref_id,
        "timestamp": now,
        "amount": sc["amount"],
        "currency": sc["currency"],
        "customer_id": f"CUST-{scenario_id.upper()}",
        "customer_name": sc["customer"],
        "customer_email": f"{scenario_id}@example.com",
        "customer_baseline_amount": sc["customer_baseline"],
        "account_age_days": sc["account_age_days"],
        "failed_attempts_24h": sc["failed_attempts_24h"],
        "ip_address": "198.51.100.1",
        "ip_country": sc["ip_country"],
        "billing_country": sc["billing_country"],
        "shipping_country": sc["billing_country"],
        "device_fingerprint": sc["device"],
        "items_json": items_json
    }

    # Evaluate full engine
    recent_txns = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(20).all()
    history = [{"customer_id": t.customer_id, "timestamp": t.timestamp, "ip_address": t.ip_address} for t in recent_txns]
    score, risk_level, triggered_rules, ml_prediction = risk_engine.evaluate_transaction_full(txn_dict, history)
    ai_result = ai_explainer.generate_explanation_sync(txn_dict, score, risk_level, triggered_rules, ml_prediction)

    # Persist live transaction
    txn = Transaction(
        reference_id=ref_id,
        timestamp=now,
        amount=sc["amount"],
        currency=sc["currency"],
        payment_status="COMPLETED",
        customer_id=txn_dict["customer_id"],
        customer_name=sc["customer"],
        customer_email=f"{scenario_id}@example.com",
        customer_baseline_amount=sc["customer_baseline"],
        customer_baseline_orders=5,
        account_age_days=sc["account_age_days"],
        failed_attempts_24h=sc["failed_attempts_24h"],
        ip_address="198.51.100.1",
        ip_country=sc["ip_country"],
        billing_country=sc["billing_country"],
        shipping_country=sc["billing_country"],
        device_fingerprint=sc["device"],
        items_json=items_json,
        is_synthetic=True,
        source="SCENARIO_SIMULATION",
        risk_score=score,
        risk_level=risk_level,
        ml_fraud_probability=ml_prediction.get("fraud_probability", 0.0),
        hybrid_score=ml_prediction.get("hybrid_score", score),
        review_status="UNREVIEWED"
    )
    db.add(txn)
    db.flush()

    rules_payload = [
        {
            "rule_id": r.rule_id,
            "rule_name": r.rule_name,
            "description": r.description,
            "score_points": r.score_points,
            "category": r.category,
            "evidence": r.evidence
        }
        for r in triggered_rules
    ]

    analysis = RiskAnalysis(
        transaction_id=txn.id,
        deterministic_score=score,
        risk_level=risk_level,
        triggered_rules_json=json.dumps(rules_payload),
        ml_fraud_probability=ml_prediction.get("fraud_probability", 0.0),
        ml_risk_tier=ml_prediction.get("ml_risk_tier", "LOW"),
        hybrid_score=ml_prediction.get("hybrid_score", score),
        feature_attributions_json=json.dumps(ml_prediction.get("top_attributions", [])),
        ai_summary=ai_result["summary"],
        ai_explanation=ai_result["explanation"],
        ai_uncertainties=ai_result["uncertainties"],
        ai_recommended_steps=json.dumps(ai_result["recommended_steps"]),
        model_used=ai_result["model_used"]
    )
    db.add(analysis)

    # Chained audit event
    audit_entry = record_audit_event(
        db=db,
        action="SCENARIO_SIMULATED",
        entity_type="TRANSACTION",
        entity_id=ref_id,
        performed_by="scenario_demonstrator",
        details={
            "scenario": sc["title"],
            "score": score,
            "risk_level": risk_level,
            "ml_fraud_probability": ml_prediction.get("fraud_probability", 0.0)
        }
    )
    db.commit()

    return {
        "scenario": sc,
        "transaction_id": txn.id,
        "reference_id": ref_id,
        "amount": txn.amount,
        "currency": txn.currency,
        "risk_score": score,
        "risk_level": risk_level,
        "ml_fraud_probability": ml_prediction.get("fraud_probability", 0.0),
        "hybrid_score": ml_prediction.get("hybrid_score", score),
        "feature_attributions": ml_prediction.get("top_attributions", []),
        "triggered_rules": rules_payload,
        "ai_analysis": ai_result,
        "audit_record": {
            "id": audit_entry.id,
            "entry_hash": (audit_entry.entry_hash[:16] + "...") if audit_entry.entry_hash else None,
            "signature": (audit_entry.signature[:16] + "...") if audit_entry.signature else None,
            "is_chained": True
        }
    }
