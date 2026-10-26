from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel
import json
import uuid

from app.database import get_db
from app.models.paypal_order import PayPalOrder
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.models.audit_log import AuditLog, record_audit_event
from app.models.user import User
from app.schemas.paypal import (
    PayPalOrderCreateRequest,
    PayPalOrderCaptureRequest,
    PayPalOrderResponse,
    PayPalStatusResponse,
    PayPalConfigResponse
)
from app.services.paypal_service import paypal_service
from app.services.auth import get_optional_current_user
from app.risk_engine.engine import risk_engine
from app.services.ai_explainer import ai_explainer
from app.config import settings

class PayPalCredentialsUpdateRequest(BaseModel):
    client_id: str
    client_secret: str
    mock_simulator: Optional[bool] = False

router = APIRouter(prefix="/api/paypal", tags=["PayPal"])

@router.put("/credentials", response_model=Dict[str, Any])
async def update_paypal_credentials(
    creds_in: PayPalCredentialsUpdateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Dynamically configures PayPal Sandbox credentials at runtime for demonstrations.
    Validates credentials directly against the PayPal Sandbox OAuth endpoint.
    """
    c_id = creds_in.client_id.strip()
    c_secret = creds_in.client_secret.strip()

    if not c_id or not c_secret:
        raise HTTPException(status_code=400, detail="Client ID and Client Secret cannot be empty.")

    # Apply to service
    settings.PAYPAL_CLIENT_ID = c_id
    settings.PAYPAL_CLIENT_SECRET = c_secret
    settings.PAYPAL_MOCK_SIMULATOR = creds_in.mock_simulator
    paypal_service.client_id = c_id
    paypal_service.client_secret = c_secret

    # Verify credentials via OAuth
    token = await paypal_service.get_access_token()
    is_valid = token is not None

    record_audit_event(
        db=db,
        action="PAYPAL_CREDENTIALS_CONFIGURED",
        entity_type="SYSTEM_CONFIGURATION",
        entity_id="PAYPAL_GATEWAY",
        performed_by=current_user.email if current_user else "merchant_admin",
        details={
            "client_id_preview": c_id[:8] + "...",
            "verification_status": "SUCCESS" if is_valid else "FAILED_OAUTH"
        }
    )
    db.commit()

    if not is_valid:
        return {
            "status": "warning",
            "is_valid": False,
            "message": "Credentials updated, but PayPal OAuth authentication failed. Please check your Sandbox Client ID and Secret.",
            "client_id_preview": c_id[:8] + "..."
        }

    return {
        "status": "success",
        "is_valid": True,
        "message": "PayPal Sandbox credentials successfully verified with api-m.sandbox.paypal.com! Live SDK smart buttons are active.",
        "client_id_preview": c_id[:8] + "...",
        "environment": "sandbox"
    }

@router.get("/config", response_model=PayPalConfigResponse)
def get_paypal_config():
    """
    Returns public PayPal SDK client configuration safely without exposing secrets.
    Used by frontend @paypal/react-paypal-js ScriptProvider.
    """
    client_id = settings.PAYPAL_CLIENT_ID if paypal_service.is_configured() else None
    return PayPalConfigResponse(
        client_id=client_id,
        currency="USD",
        environment=settings.PAYPAL_ENV,
        mock_mode=paypal_service.is_mock_mode(),
        is_configured=paypal_service.is_configured()
    )

@router.get("/status", response_model=PayPalStatusResponse)
def get_paypal_status():
    """
    Returns PayPal Sandbox configuration readiness safely without exposing credentials.
    """
    configured = paypal_service.is_configured()
    return PayPalStatusResponse(
        is_configured=configured,
        mode=settings.PAYPAL_MODE,
        client_id_configured=bool(settings.PAYPAL_CLIENT_ID and settings.PAYPAL_CLIENT_ID.strip() not in ("", "placeholder", "demo")),
        client_secret_configured=bool(settings.PAYPAL_CLIENT_SECRET and settings.PAYPAL_CLIENT_SECRET.strip() not in ("", "placeholder", "demo")),
        mock_mode=paypal_service.is_mock_mode(),
        api_endpoint=settings.PAYPAL_BASE_URL
    )

@router.post("/orders", response_model=PayPalOrderResponse)
async def create_paypal_order(
    order_in: PayPalOrderCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a PayPal Sandbox order.
    Server strictly validates amount and currency before communicating with PayPal API.
    """
    if order_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Order amount must be greater than zero.")
    if order_in.amount > 100000:
        raise HTTPException(status_code=400, detail="Sandbox test orders cannot exceed $100,000.")

    try:
        result = await paypal_service.create_order(
            amount=order_in.amount,
            currency=order_in.currency,
            item_name=order_in.item_name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    paypal_order = PayPalOrder(
        user_id=current_user.id if current_user else None,
        paypal_order_id=result["order_id"],
        amount=order_in.amount,
        currency=order_in.currency.upper(),
        status="CREATED",
        payer_email=order_in.customer_email,
        payer_name=order_in.customer_name,
        raw_response_json=json.dumps(result.get("raw_response", {}))
    )
    db.add(paypal_order)

    record_audit_event(
        db=db,
        action="PAYPAL_ORDER_CREATED",
        entity_type="PAYPAL_ORDER",
        entity_id=result["order_id"],
        performed_by=current_user.email if current_user else "anonymous_checkout",
        details={
            "amount": order_in.amount,
            "currency": order_in.currency,
            "mode": result.get("mode")
        }
    )
    db.commit()
    db.refresh(paypal_order)

    return PayPalOrderResponse(
        paypal_order_id=result["order_id"],
        status=result.get("status", "CREATED"),
        amount=order_in.amount,
        currency=order_in.currency.upper(),
        created_at=paypal_order.created_at,
        verified_by_backend=True,
        message=f"Order created on backend ({result.get('mode')}). Ready for buyer approval."
    )

@router.post("/orders/{order_id}/capture", response_model=PayPalOrderResponse)
async def capture_paypal_order(
    order_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Captures authorized PayPal payment on the server after buyer approval.
    Rejects unknown orders with 404 (never creates orders on capture).
    Verifies amount, currency, and capture status with PayPal.
    Screens the resulting transaction with PayShield AI Risk Engine.
    """
    db_order = db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found. Capture requires a valid, pre-created order."
        )

    # Idempotent return for already captured orders
    if db_order.status == "COMPLETED":
        return PayPalOrderResponse(
            paypal_order_id=db_order.paypal_order_id,
            status=db_order.status,
            amount=db_order.amount,
            currency=db_order.currency,
            created_at=db_order.created_at,
            capture_id=db_order.capture_id,
            payer_email=db_order.payer_email,
            payer_name=db_order.payer_name,
            transaction_id=db_order.transaction_id,
            verified_by_backend=True,
            message="Order was already captured and verified."
        )

    # Execute server capture
    capture_res = await paypal_service.capture_order(
        order_id=order_id,
        expected_amount=db_order.amount,
        expected_currency=db_order.currency
    )
    
    if capture_res.get("status") != "COMPLETED":
        db_order.status = "FAILED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PayPal capture failed: {capture_res.get('error', 'Status was not COMPLETED')}"
        )

    # Amount and Currency Validation
    captured_amount = capture_res.get("amount")
    captured_currency = capture_res.get("currency")
    if captured_amount is not None and abs(float(captured_amount) - db_order.amount) > 0.01:
        db_order.status = "FAILED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount mismatch: Order created for {db_order.amount} {db_order.currency}, but captured {captured_amount} {captured_currency}."
        )

    if captured_currency and captured_currency.upper() != db_order.currency.upper():
        db_order.status = "FAILED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Currency mismatch: Order created with {db_order.currency}, but captured with {captured_currency}."
        )

    # Update order record
    db_order.status = "COMPLETED"
    db_order.capture_id = capture_res.get("capture_id")
    db_order.captured_at = datetime.utcnow()
    db_order.payer_email = capture_res.get("payer_email") or db_order.payer_email
    db_order.payer_name = capture_res.get("payer_name") or db_order.payer_name
    db_order.raw_response_json = json.dumps(capture_res.get("raw_response", {}))

    # Associate user_id if order did not have one but user is logged in
    if not db_order.user_id and current_user:
        db_order.user_id = current_user.id

    # Create real Transaction record for monitoring
    ref_id = f"PP-{order_id[-8:]}"
    items_json = json.dumps([{"name": "PayPal Sandbox Goods", "price": db_order.amount, "quantity": 1}])
    
    txn_dict = {
        "reference_id": ref_id,
        "timestamp": datetime.utcnow(),
        "amount": db_order.amount,
        "currency": db_order.currency,
        "customer_id": f"PP-{uuid.uuid4().hex[:6].upper()}",
        "customer_baseline_amount": 100.0,
        "ip_address": "127.0.0.1",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "items_json": items_json,
    }

    # Evaluate multi-signal risk engine (Deterministic Rules + Random Forest ML)
    recent_txns = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(20).all()
    history = [{"customer_id": t.customer_id, "timestamp": t.timestamp, "ip_address": t.ip_address} for t in recent_txns]
    score, risk_level, triggered_rules, ml_prediction = risk_engine.evaluate_transaction_full(txn_dict, history)
    ai_res = await ai_explainer.generate_explanation(txn_dict, score, risk_level, triggered_rules, ml_prediction)

    txn = Transaction(
        user_id=db_order.user_id,
        reference_id=ref_id,
        timestamp=txn_dict["timestamp"],
        amount=db_order.amount,
        currency=db_order.currency,
        payment_status="COMPLETED",
        customer_id=txn_dict["customer_id"],
        customer_name=db_order.payer_name or "PayPal Sandbox Buyer",
        customer_email=db_order.payer_email or "buyer@sandbox.paypal.com",
        customer_baseline_amount=100.0,
        customer_baseline_orders=5,
        account_age_days=90,
        failed_attempts_24h=0,
        ip_address="127.0.0.1",
        ip_country="US",
        billing_country="US",
        shipping_country="US",
        device_fingerprint=f"pp-sdk-{order_id[-6:]}",
        items_json=items_json,
        is_synthetic=False,
        source="PAYPAL_SANDBOX",
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
        ai_summary=ai_res["summary"],
        ai_explanation=ai_res["explanation"],
        ai_uncertainties=ai_res["uncertainties"],
        ai_recommended_steps=json.dumps(ai_res["recommended_steps"]),
        model_used=ai_res["model_used"]
    )
    db.add(analysis)

    db_order.transaction_id = txn.id
    
    # Cryptographically Chained Audit Event
    record_audit_event(
        db=db,
        action="PAYPAL_PAYMENT_CAPTURED",
        entity_type="PAYPAL_ORDER",
        entity_id=order_id,
        performed_by=current_user.email if current_user else "server_capture",
        details={
            "amount": db_order.amount,
            "currency": db_order.currency,
            "capture_id": db_order.capture_id,
            "risk_score": score,
            "ml_fraud_probability": ml_prediction.get("fraud_probability", 0.0),
            "hybrid_score": ml_prediction.get("hybrid_score", score)
        }
    )
    db.commit()

    return PayPalOrderResponse(
        paypal_order_id=order_id,
        status="COMPLETED",
        amount=db_order.amount,
        currency=db_order.currency,
        created_at=db_order.created_at,
        capture_id=db_order.capture_id,
        payer_email=db_order.payer_email,
        payer_name=db_order.payer_name,
        transaction_id=txn.id,
        verified_by_backend=True,
        risk_evaluation={
            "score": score,
            "level": risk_level,
            "ml_fraud_probability": ml_prediction.get("fraud_probability", 0.0),
            "hybrid_score": ml_prediction.get("hybrid_score", score),
            "feature_attributions": ml_prediction.get("top_attributions", []),
            "ai_summary": ai_res["summary"],
            "explanation_source": ai_res.get("explanation_source", "grounded_rule_ml_fallback"),
            "recommended_action": ai_res.get("recommended_action", "approve")
        },
        message="Payment verified with PayPal Sandbox and screened by PayShield AI Multi-Signal Engine."
    )

@router.get("/orders/{order_id}", response_model=Dict[str, Any])
def get_paypal_order(
    order_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves stored order details. Enforces ownership for authenticated users.
    """
    db_order = db.query(PayPalOrder).filter(PayPalOrder.paypal_order_id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="PayPal order not found.")

    if db_order.user_id is not None:
        if not current_user or (current_user.id != db_order.user_id and current_user.role != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this order."
            )

    return {
        "paypal_order_id": db_order.paypal_order_id,
        "status": db_order.status,
        "amount": db_order.amount,
        "currency": db_order.currency,
        "capture_id": db_order.capture_id,
        "payer_email": db_order.payer_email,
        "payer_name": db_order.payer_name,
        "created_at": db_order.created_at.isoformat(),
        "captured_at": db_order.captured_at.isoformat() if db_order.captured_at else None,
        "transaction_id": db_order.transaction_id
    }

@router.post("/webhook")
async def paypal_webhook_listener(request: Request, db: Session = Depends(get_db)):
    """
    Receives and cryptographically verifies PayPal webhook notifications.
    """
    raw_body = await request.body()
    try:
        body_dict = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in webhook request")

    headers = dict(request.headers)
    is_valid = await paypal_service.verify_webhook_signature(headers, body_dict)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="PayPal webhook signature verification failed."
        )

    event_type = body_dict.get("event_type", "UNKNOWN")
    resource_id = body_dict.get("resource", {}).get("id", "UNKNOWN")

    record_audit_event(
        db=db,
        action="PAYPAL_WEBHOOK_RECEIVED",
        entity_type="PAYPAL_EVENT",
        entity_id=resource_id,
        performed_by="paypal_webhook",
        details={"event_type": event_type, "verified": True}
    )
    db.commit()

    return {"status": "success", "event_type": event_type, "verified": True}
