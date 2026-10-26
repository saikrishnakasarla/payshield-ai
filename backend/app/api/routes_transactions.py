from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import uuid

from app.database import get_db
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.models.audit_log import AuditLog, record_audit_event
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionRead, TransactionListResponse
from app.schemas.risk import RiskAnalysisResponse, ReviewActionRequest, TriggeredRuleSchema
from app.risk_engine.engine import risk_engine
from app.services.ai_explainer import ai_explainer
from app.services.auth import get_optional_current_user

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=TransactionListResponse)
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by reference, email, customer, or IP"),
    provider: Optional[str] = Query(None, description="Filter by provider: PAYPAL, STRIPE, RAZORPAY, ADYEN, or ALL"),
    payment_status: Optional[str] = Query(None, description="Filter by status: COMPLETED, PENDING, DECLINED, FAILED, or ALL"),
    risk_level: Optional[str] = Query(None, pattern="^(ALL|LOW|MEDIUM|HIGH)$"),
    review_status: Optional[str] = Query(None),
    sort_by: str = Query("timestamp", pattern="^(timestamp|amount|risk_score)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)

    verified_sources = ["PAYPAL_SANDBOX", "STRIPE_TEST", "RAZORPAY_TEST", "ADYEN_TEST"]
    if current_user:
        query = query.filter(
            or_(
                Transaction.user_id == current_user.id,
                Transaction.is_synthetic == True,
                Transaction.source.in_(verified_sources)
            )
        )
    else:
        query = query.filter(
            or_(
                Transaction.is_synthetic == True,
                Transaction.source.in_(verified_sources)
            )
        )

    # Provider filter
    if provider and provider.upper() != "ALL":
        query = query.filter(Transaction.provider == provider.upper())

    # Payment status filter
    if payment_status and payment_status.upper() != "ALL":
        query = query.filter(Transaction.payment_status == payment_status.upper())

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.reference_id.ilike(term),
                Transaction.customer_name.ilike(term),
                Transaction.customer_email.ilike(term),
                Transaction.ip_address.ilike(term),
                Transaction.customer_id.ilike(term)
            )
        )

    # Risk level filter
    if risk_level and risk_level != "ALL":
        query = query.filter(Transaction.risk_level == risk_level)

    # Review status filter
    if review_status and review_status != "ALL":
        query = query.filter(Transaction.review_status == review_status)

    # Sorting
    col = getattr(Transaction, sort_by, Transaction.timestamp)
    query = query.order_by(desc(col) if sort_order == "desc" else asc(col))

    total = query.count()
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 1

    return TransactionListResponse(
        total=total,
        items=items,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{transaction_id}", response_model=Dict[str, Any])
def get_transaction(
    transaction_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    # Data isolation: if transaction belongs to a user, enforce ownership unless synthetic
    if not txn.is_synthetic and txn.user_id is not None:
        if not current_user or (current_user.id != txn.user_id and current_user.role != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this transaction."
            )

    latest_analysis = (
        db.query(RiskAnalysis)
        .filter(RiskAnalysis.transaction_id == txn.id)
        .order_by(RiskAnalysis.created_at.desc())
        .first()
    )

    triggered_rules = []
    if latest_analysis and latest_analysis.triggered_rules_json:
        try:
            triggered_rules = json.loads(latest_analysis.triggered_rules_json)
        except Exception:
            triggered_rules = []

    recommended_steps = []
    if latest_analysis and latest_analysis.ai_recommended_steps:
        try:
            recommended_steps = json.loads(latest_analysis.ai_recommended_steps)
        except Exception:
            recommended_steps = [latest_analysis.ai_recommended_steps]

    items = []
    if txn.items_json:
        try:
            items = json.loads(txn.items_json)
        except Exception:
            items = []

    feature_attributions = []
    if latest_analysis and getattr(latest_analysis, "feature_attributions_json", None):
        try:
            feature_attributions = json.loads(latest_analysis.feature_attributions_json)
        except Exception:
            feature_attributions = []

    # Format event timeline
    timeline = [
        {
            "event": "Order Initiated",
            "timestamp": txn.timestamp.isoformat(),
            "detail": f"Order received for {txn.amount} {txn.currency} from {txn.customer_email}",
            "actor": "System"
        },
        {
            "event": "Payment Verified",
            "timestamp": txn.timestamp.isoformat(),
            "detail": f"Status: {txn.payment_status} via {txn.source}",
            "actor": "PayPal Gateway"
        },
        {
            "event": "PayShield Multi-Signal Screening",
            "timestamp": (latest_analysis.created_at if latest_analysis else txn.timestamp).isoformat(),
            "detail": f"Assessed Rule Score: {txn.risk_score}/100 | ML Fraud Prob: {getattr(txn, 'ml_fraud_probability', 0.0)*100:.1f}% ({txn.risk_level})",
            "actor": "Ensemble Engine (Random Forest + Rules)"
        }
    ]

    if txn.review_status != "UNREVIEWED" and txn.reviewed_at:
        timeline.append({
            "event": f"Status Changed to {txn.review_status}",
            "timestamp": txn.reviewed_at.isoformat(),
            "detail": txn.review_notes or "Review notes entered",
            "actor": txn.reviewer or "Merchant Reviewer"
        })

    # Historical demo context
    history_matches = (
        db.query(Transaction)
        .filter(Transaction.customer_id == txn.customer_id, Transaction.id != txn.id)
        .order_by(Transaction.timestamp.desc())
        .limit(5)
        .all()
    )
    customer_history = [
        {
            "id": h.id,
            "reference_id": h.reference_id,
            "amount": h.amount,
            "currency": h.currency,
            "timestamp": h.timestamp.isoformat(),
            "risk_score": h.risk_score,
            "risk_level": h.risk_level,
            "payment_status": h.payment_status
        }
        for h in history_matches
    ]

    return {
        "transaction": {
            "id": txn.id,
            "reference_id": txn.reference_id,
            "timestamp": txn.timestamp.isoformat(),
            "amount": txn.amount,
            "currency": txn.currency,
            "payment_status": txn.payment_status,
            "customer_id": txn.customer_id,
            "customer_name": txn.customer_name,
            "customer_email": txn.customer_email,
            "customer_baseline_amount": txn.customer_baseline_amount,
            "customer_baseline_orders": txn.customer_baseline_orders,
            "account_age_days": getattr(txn, "account_age_days", 90),
            "failed_attempts_24h": getattr(txn, "failed_attempts_24h", 0),
            "ip_address": txn.ip_address,
            "ip_country": txn.ip_country,
            "billing_country": txn.billing_country,
            "shipping_country": txn.shipping_country,
            "device_fingerprint": txn.device_fingerprint,
            "items": items,
            "is_synthetic": txn.is_synthetic,
            "source": txn.source,
            "risk_score": txn.risk_score,
            "risk_level": txn.risk_level,
            "ml_fraud_probability": getattr(txn, "ml_fraud_probability", 0.0),
            "hybrid_score": getattr(txn, "hybrid_score", txn.risk_score),
            "review_status": txn.review_status,
            "review_notes": txn.review_notes,
            "reviewed_at": txn.reviewed_at.isoformat() if txn.reviewed_at else None,
            "reviewer": txn.reviewer
        },
        "risk_analysis": {
            "deterministic_score": txn.risk_score,
            "risk_level": txn.risk_level,
            "ml_fraud_probability": getattr(latest_analysis, "ml_fraud_probability", getattr(txn, "ml_fraud_probability", 0.0)),
            "ml_risk_tier": getattr(latest_analysis, "ml_risk_tier", txn.risk_level),
            "hybrid_score": getattr(latest_analysis, "hybrid_score", txn.risk_score),
            "feature_attributions": feature_attributions,
            "triggered_rules": triggered_rules,
            "ai_summary": latest_analysis.ai_summary if latest_analysis else "Screened under standard baseline heuristics.",
            "ai_explanation": latest_analysis.ai_explanation if latest_analysis else "Transaction assessed against historical customer indicators.",
            "ai_uncertainties": latest_analysis.ai_uncertainties if latest_analysis else "Review recommendations are decision support aids, not certified fraud claims.",
            "ai_recommended_steps": recommended_steps,
            "model_used": latest_analysis.model_used if latest_analysis else "RandomForest-v1.0"
        },
        "latest_analysis": {
            "deterministic_score": txn.risk_score,
            "risk_level": txn.risk_level,
            "ml_fraud_probability": getattr(latest_analysis, "ml_fraud_probability", getattr(txn, "ml_fraud_probability", 0.0)),
            "ml_risk_tier": getattr(latest_analysis, "ml_risk_tier", txn.risk_level),
            "hybrid_score": getattr(latest_analysis, "hybrid_score", txn.risk_score),
            "feature_attributions": feature_attributions,
            "triggered_rules": triggered_rules,
            "ai_summary": latest_analysis.ai_summary if latest_analysis else "Screened under standard baseline heuristics.",
            "ai_explanation": latest_analysis.ai_explanation if latest_analysis else "Transaction assessed against historical customer indicators.",
            "ai_uncertainties": latest_analysis.ai_uncertainties if latest_analysis else "Review recommendations are decision support aids, not certified fraud claims.",
            "ai_recommended_steps": recommended_steps,
            "model_used": latest_analysis.model_used if latest_analysis else "RandomForest-v1.0"
        },
        "timeline": timeline,
        "customer_history": customer_history,
        "evidence_breakdown": {
            "known_factors": [
                f"Customer baseline average order value: ${txn.customer_baseline_amount:.2f}",
                f"Account age: {getattr(txn, 'account_age_days', 90)} days | Prior declines (24h): {getattr(txn, 'failed_attempts_24h', 0)}",
                f"Billing country: {txn.billing_country} | Shipping country: {txn.shipping_country}",
                f"IP geolocated to: {txn.ip_country} ({txn.ip_address or 'Unknown IP'})",
                f"Device telemetry: {txn.device_fingerprint or 'Standard Browser'}",
                f"Reported gateway status: {txn.payment_status} ({txn.source})"
            ],
            "statistical_inferences": [
                f"Random Forest ML fraud probability: {getattr(txn, 'ml_fraud_probability', 0.0)*100:.1f}%",
                f"Deterministic rule score: {txn.risk_score}/100 ({len(triggered_rules)} heuristic triggers)",
                f"Hybrid ensemble decision score: {getattr(txn, 'hybrid_score', txn.risk_score)}/100"
            ],
            "uncertainties": [
                "Transaction velocity is measured against historical time windows.",
                "Actual cardholder authorization or gift purchasing requires merchant confirmation.",
                "AI explanation is an objective evidence synthesizer and never claims fraud certainty."
            ],
            "merchant_recommendations": recommended_steps or [
                "Review order details against verified customer account.",
                "Verify delivery address before shipping physical merchandise.",
                "Use 'Mark Reviewed' or 'Escalate' to document review decision."
            ]
        }
    }

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_transaction(
    txn_in: TransactionCreate,
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a transaction, runs multi-signal risk scoring (ML + Heuristics),
    generates grounded AI explanation, records tamper-evident chained audit event.
    Supports idempotency via X-Idempotency-Key to prevent replays.
    """
    # 1. Idempotency Check
    if x_idempotency_key and x_idempotency_key.strip():
        prior_audit = db.query(AuditLog).filter(
            AuditLog.action == "IDEMPOTENT_SUBMISSION",
            AuditLog.entity_id == x_idempotency_key.strip()
        ).first()
        if prior_audit and prior_audit.details_json:
            try:
                cached = json.loads(prior_audit.details_json)
                return cached
            except Exception:
                pass

    ref_id = txn_in.reference_id or f"TXN-{uuid.uuid4().hex[:10].upper()}"
    existing = db.query(Transaction).filter(Transaction.reference_id == ref_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Transaction with reference {ref_id} already exists.")

    items_json = json.dumps([item.model_dump() for item in txn_in.items]) if txn_in.items else "[]"
    
    txn_dict = {
        "reference_id": ref_id,
        "timestamp": datetime.utcnow(),
        "amount": txn_in.amount,
        "currency": txn_in.currency,
        "customer_id": txn_in.customer_id,
        "customer_baseline_amount": txn_in.customer_baseline_amount or 100.0,
        "account_age_days": txn_in.account_age_days or 90,
        "failed_attempts_24h": txn_in.failed_attempts_24h or 0,
        "ip_address": txn_in.ip_address,
        "ip_country": txn_in.ip_country or "US",
        "billing_country": txn_in.billing_country or "US",
        "shipping_country": txn_in.shipping_country or "US",
        "device_fingerprint": txn_in.device_fingerprint,
        "items_json": items_json,
    }

    # Evaluate multi-signal risk engine (Heuristics + Random Forest ML)
    recent_txns = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(50).all()
    history = [
        {
            "id": t.id,
            "reference_id": t.reference_id,
            "customer_id": t.customer_id,
            "ip_address": t.ip_address,
            "timestamp": t.timestamp,
            "amount": t.amount,
            "device_fingerprint": t.device_fingerprint
        }
        for t in recent_txns
    ]

    score, risk_level, triggered_rules, ml_prediction = risk_engine.evaluate_transaction_full(txn_dict, history)
    ai_result = await ai_explainer.generate_explanation(txn_dict, score, risk_level, triggered_rules, ml_prediction)

    txn = Transaction(
        user_id=current_user.id if current_user else None,
        reference_id=ref_id,
        timestamp=txn_dict["timestamp"],
        amount=txn_in.amount,
        currency=txn_in.currency,
        payment_status=txn_in.payment_status or "COMPLETED",
        customer_id=txn_in.customer_id,
        customer_name=txn_in.customer_name,
        customer_email=txn_in.customer_email,
        customer_baseline_amount=txn_in.customer_baseline_amount or 100.0,
        customer_baseline_orders=txn_in.customer_baseline_orders or 5,
        account_age_days=txn_in.account_age_days or 90,
        failed_attempts_24h=txn_in.failed_attempts_24h or 0,
        ip_address=txn_in.ip_address,
        ip_country=txn_in.ip_country or "US",
        billing_country=txn_in.billing_country or "US",
        shipping_country=txn_in.shipping_country or "US",
        device_fingerprint=txn_in.device_fingerprint,
        items_json=items_json,
        is_synthetic=txn_in.is_synthetic,
        source=txn_in.source,
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

    # Cryptographically Chained Audit Event
    record_audit_event(
        db=db,
        action="TRANSACTION_CREATED",
        entity_type="TRANSACTION",
        entity_id=ref_id,
        performed_by=current_user.email if current_user else "api_client",
        details={
            "risk_score": score,
            "risk_level": risk_level,
            "ml_fraud_probability": ml_prediction.get("fraud_probability", 0.0),
            "hybrid_score": ml_prediction.get("hybrid_score", score)
        }
    )

    response_payload = {
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
        "ai_analysis": ai_result
    }

    # Store for idempotency replay if requested
    if x_idempotency_key and x_idempotency_key.strip():
        record_audit_event(
            db=db,
            action="IDEMPOTENT_SUBMISSION",
            entity_type="IDEMPOTENCY_KEY",
            entity_id=x_idempotency_key.strip(),
            performed_by=current_user.email if current_user else "api_client",
            details=response_payload
        )

    db.commit()
    return response_payload

@router.post("/{transaction_id}/analyze", response_model=Dict[str, Any])
async def trigger_ai_analysis(
    transaction_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Re-runs AI explainable analysis on a transaction, querying Gemini if available.
    """
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if not txn.is_synthetic and txn.user_id is not None:
        if not current_user or (current_user.id != txn.user_id and current_user.role != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to analyze this transaction."
            )

    recent_txns = db.query(Transaction).filter(Transaction.id != txn.id).order_by(Transaction.timestamp.desc()).limit(50).all()
    history = [
        {
            "id": t.id,
            "reference_id": t.reference_id,
            "customer_id": t.customer_id,
            "ip_address": t.ip_address,
            "timestamp": t.timestamp,
            "amount": t.amount,
            "device_fingerprint": t.device_fingerprint
        }
        for t in recent_txns
    ]

    txn_dict = {
        "id": txn.id,
        "reference_id": txn.reference_id,
        "timestamp": txn.timestamp,
        "amount": txn.amount,
        "currency": txn.currency,
        "customer_id": txn.customer_id,
        "customer_baseline_amount": txn.customer_baseline_amount,
        "ip_address": txn.ip_address,
        "ip_country": txn.ip_country,
        "billing_country": txn.billing_country,
        "shipping_country": txn.shipping_country,
        "device_fingerprint": txn.device_fingerprint,
        "items_json": txn.items_json,
    }

    score, risk_level, triggered_rules, ml_prediction = risk_engine.evaluate_transaction_full(txn_dict, history)
    ai_result = await ai_explainer.generate_explanation(txn_dict, score, risk_level, triggered_rules, ml_prediction)

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
    
    # Update transaction score and level
    txn.risk_score = score
    txn.risk_level = risk_level
    txn.ml_fraud_probability = ml_prediction.get("fraud_probability", 0.0)
    txn.hybrid_score = ml_prediction.get("hybrid_score", score)

    record_audit_event(
        db=db,
        action="TRANSACTION_AI_ANALYSIS_RERUN",
        entity_type="TRANSACTION",
        entity_id=txn.reference_id,
        performed_by=current_user.email if current_user else "analyst",
        details={
            "risk_score": score,
            "ml_fraud_probability": ml_prediction.get("fraud_probability", 0.0),
            "hybrid_score": ml_prediction.get("hybrid_score", score)
        }
    )
    db.commit()

    return {
        "transaction_id": txn.id,
        "deterministic_score": score,
        "risk_level": risk_level,
        "ml_fraud_probability": ml_prediction.get("fraud_probability", 0.0),
        "hybrid_score": ml_prediction.get("hybrid_score", score),
        "feature_attributions": ml_prediction.get("top_attributions", []),
        "triggered_rules": rules_payload,
        "ai_analysis": ai_result
    }

@router.post("/{transaction_id}/review", response_model=Dict[str, Any])
def record_review_action(
    transaction_id: int,
    action_in: ReviewActionRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Records merchant review decision (Mark Reviewed, Escalate for Human Review).
    Audit trail with cryptographically chained SHA-256 hashes and HMAC signatures.
    """
    valid_statuses = ("REVIEWED_SAFE", "ESCALATED_HUMAN_REVIEW", "UNREVIEWED")
    if action_in.review_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid review status. Must be one of: {', '.join(valid_statuses)}"
        )

    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if not txn.is_synthetic and txn.user_id is not None:
        if not current_user or (current_user.id != txn.user_id and current_user.role != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to review this transaction."
            )

    old_status = txn.review_status
    txn.review_status = action_in.review_status
    txn.review_notes = action_in.notes
    txn.reviewed_at = datetime.utcnow()
    txn.reviewer = current_user.full_name if current_user else (action_in.reviewer or "Merchant Reviewer")

    # Cryptographically chained audit event
    record_audit_event(
        db=db,
        action="TRANSACTION_REVIEW_UPDATED",
        entity_type="TRANSACTION",
        entity_id=txn.reference_id,
        performed_by=txn.reviewer,
        details={
            "old_status": old_status,
            "new_status": txn.review_status,
            "notes": txn.review_notes,
            "reviewer": txn.reviewer,
            "risk_score": txn.risk_score
        }
    )
    db.commit()

    return {
        "status": "success",
        "message": f"Transaction marked as {txn.review_status}",
        "transaction_id": txn.id,
        "reference_id": txn.reference_id,
        "review_status": txn.review_status,
        "reviewed_at": txn.reviewed_at.isoformat(),
        "notes": txn.review_notes
    }
