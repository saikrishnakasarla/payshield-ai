from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List, Optional
import uuid
import json
import logging

from app.database import get_db
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.models.audit_log import record_audit_event
from app.models.user import User
from app.schemas.multi_payment import (
    MultiPaymentCreateRequest,
    MultiPaymentVerifyRequest,
    MultiPaymentCreateResponse,
    MultiPaymentVerifyResponse,
    ProviderStatusItem
)
from app.services.paypal_service import paypal_service
from app.services.stripe_service import stripe_service
from app.services.razorpay_service import razorpay_service
from app.services.adyen_service import adyen_service
from app.services.auth import get_optional_current_user
from app.risk_engine.engine import risk_engine
from app.services.ai_explainer import ai_explainer
from app.config import settings

logger = logging.getLogger("payshield.gateway")

router = APIRouter(prefix="/api/payments", tags=["Multi-Gateway Payments"])

@router.get("/providers", response_model=List[ProviderStatusItem])
def get_payment_providers_status():
    """
    Returns live connection and configuration status for all supported payment gateways.
    Never marks a provider as configured if its credentials are missing.
    """
    return [
        ProviderStatusItem(
            provider="PAYPAL",
            display_name="PayPal Sandbox",
            is_configured=paypal_service.is_configured(),
            mock_mode=paypal_service.is_mock_mode(),
            supported_methods=["PayPal Wallet", "Pay Later", "Debit/Credit Card"],
            currencies=["USD", "EUR", "GBP", "CAD", "AUD"],
            description="Verified PayPal Sandbox smart buttons with instant order capture."
        ),
        ProviderStatusItem(
            provider="STRIPE",
            display_name="Stripe Test Mode",
            is_configured=stripe_service.is_configured(),
            mock_mode=stripe_service.is_mock_mode(),
            supported_methods=["Test Credit Cards", "3D Secure", "Apple Pay / Google Pay Sim"],
            currencies=["USD", "EUR", "GBP", "INR", "CAD"],
            description="Stripe PaymentIntents test mode with test cards and 3DS challenge simulation."
        ),
        ProviderStatusItem(
            provider="RAZORPAY",
            display_name="Razorpay Test Mode",
            is_configured=razorpay_service.is_configured(),
            mock_mode=razorpay_service.is_mock_mode(),
            supported_methods=["UPI (VPA Simulation)", "Test Cards", "NetBanking"],
            currencies=["INR", "USD"],
            description="Indian payment gateway testing with UPI ID simulation and webhook signatures."
        ),
        ProviderStatusItem(
            provider="ADYEN",
            display_name="Adyen Test Environment",
            is_configured=adyen_service.is_configured(),
            mock_mode=adyen_service.is_mock_mode(),
            supported_methods=["Global Cards", "iDEAL", "SEPA Direct Debit"],
            currencies=["EUR", "USD", "GBP"],
            description="Adyen enterprise test checkout sessions and webhook simulation."
        )
    ]

@router.post("/create", response_model=MultiPaymentCreateResponse)
async def create_payment_order(
    req: MultiPaymentCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Universal order creation endpoint across all supported payment gateways.
    Validates amount (>0) and currency.
    """
    provider = req.provider.upper().strip()

    if provider == "PAYPAL":
        res = await paypal_service.create_order(
            amount=req.amount,
            currency=req.currency,
            item_name=req.item_name
        )
        return MultiPaymentCreateResponse(
            provider="PAYPAL",
            order_id=res["order_id"],
            amount=res["amount"],
            currency=res["currency"],
            status=res["status"],
            mode=res["mode"],
            raw_response=res["raw_response"]
        )

    elif provider == "STRIPE":
        res = await stripe_service.create_payment_order(
            amount=req.amount,
            currency=req.currency,
            customer_email=req.customer_email,
            customer_name=req.customer_name,
            item_name=req.item_name,
            metadata=req.metadata
        )
        return MultiPaymentCreateResponse(
            provider="STRIPE",
            order_id=res["order_id"],
            amount=res["amount"],
            currency=res["currency"],
            status=res["status"],
            client_secret=res.get("client_secret"),
            mode=res["mode"],
            raw_response=res["raw_response"]
        )

    elif provider == "RAZORPAY":
        res = await razorpay_service.create_payment_order(
            amount=req.amount,
            currency=req.currency,
            customer_email=req.customer_email,
            customer_name=req.customer_name,
            item_name=req.item_name,
            metadata=req.metadata
        )
        return MultiPaymentCreateResponse(
            provider="RAZORPAY",
            order_id=res["order_id"],
            amount=res["amount"],
            currency=res["currency"],
            status=res["status"],
            key_id=res.get("key_id"),
            mode=res["mode"],
            raw_response=res["raw_response"]
        )

    elif provider == "ADYEN":
        res = await adyen_service.create_payment_order(
            amount=req.amount,
            currency=req.currency,
            customer_email=req.customer_email,
            customer_name=req.customer_name,
            item_name=req.item_name,
            metadata=req.metadata
        )
        return MultiPaymentCreateResponse(
            provider="ADYEN",
            order_id=res["order_id"],
            amount=res["amount"],
            currency=res["currency"],
            status=res["status"],
            client_secret=res.get("session_data"),
            mode=res["mode"],
            raw_response=res["raw_response"]
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported payment provider '{req.provider}'. Allowed: PAYPAL, STRIPE, RAZORPAY, ADYEN."
        )

@router.post("/verify", response_model=MultiPaymentVerifyResponse)
async def verify_and_record_payment(
    req: MultiPaymentVerifyRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Universal payment verification and fraud analysis endpoint.
    1. Server-side validation with the chosen provider (or test simulator).
    2. Idempotent check (prevents double-crediting).
    3. Evaluates transaction against PayShield AI Risk Engine.
    4. Persists the transaction to database.
    5. Returns normalized transaction payload.
    """
    provider = req.provider.upper().strip()

    # 1. Server-side provider verification
    extra = {
        "test_scenario": req.test_scenario,
        "customer_email": req.customer_email,
        "customer_name": req.customer_name,
        "payment_method": req.payment_method
    }

    if provider == "PAYPAL":
        capture_data = await paypal_service.capture_order(
            order_id=req.order_id or req.payment_id,
            expected_amount=req.amount,
            expected_currency=req.currency
        )
        verified = capture_data.get("verified", False)
        status_val = capture_data.get("status", "FAILED")
        amount = float(capture_data.get("amount", req.amount or 100.0))
        currency = capture_data.get("currency", req.currency or "USD")
        payer_email = capture_data.get("payer_email", req.customer_email)
        payer_name = capture_data.get("payer_name", req.customer_name)
        provider_txn_id = capture_data.get("capture_id")
        provider_order_id = capture_data.get("order_id")
        method = "WALLET" if "paypal" in (req.payment_method or "").lower() else "CARD"
        source_name = "PAYPAL_SANDBOX"

    elif provider == "STRIPE":
        capture_data = await stripe_service.verify_and_capture_payment(
            payment_id=req.payment_id,
            order_id=req.order_id,
            expected_amount=req.amount,
            expected_currency=req.currency,
            extra_data=extra
        )
        verified = capture_data.get("verified", False)
        status_val = capture_data.get("status", "FAILED")
        amount = float(capture_data.get("amount", req.amount or 100.0))
        currency = capture_data.get("currency", req.currency or "USD")
        payer_email = capture_data.get("payer_email", req.customer_email)
        payer_name = capture_data.get("payer_name", req.customer_name)
        provider_txn_id = capture_data.get("transaction_id")
        provider_order_id = capture_data.get("order_id")
        method = capture_data.get("payment_method", "CARD")
        source_name = "STRIPE_TEST"

    elif provider == "RAZORPAY":
        capture_data = await razorpay_service.verify_and_capture_payment(
            payment_id=req.payment_id,
            order_id=req.order_id,
            expected_amount=req.amount,
            expected_currency=req.currency,
            extra_data=extra
        )
        verified = capture_data.get("verified", False)
        status_val = capture_data.get("status", "FAILED")
        amount = float(capture_data.get("amount", req.amount or 500.0))
        currency = capture_data.get("currency", req.currency or "INR")
        payer_email = capture_data.get("payer_email", req.customer_email)
        payer_name = capture_data.get("payer_name", req.customer_name)
        provider_txn_id = capture_data.get("transaction_id")
        provider_order_id = capture_data.get("order_id")
        method = capture_data.get("payment_method", "CARD")
        source_name = "RAZORPAY_TEST"

    elif provider == "ADYEN":
        capture_data = await adyen_service.verify_and_capture_payment(
            payment_id=req.payment_id,
            order_id=req.order_id,
            expected_amount=req.amount,
            expected_currency=req.currency,
            extra_data=extra
        )
        verified = capture_data.get("verified", False)
        status_val = capture_data.get("status", "FAILED")
        amount = float(capture_data.get("amount", req.amount or 100.0))
        currency = capture_data.get("currency", req.currency or "EUR")
        payer_email = capture_data.get("payer_email", req.customer_email)
        payer_name = capture_data.get("payer_name", req.customer_name)
        provider_txn_id = capture_data.get("transaction_id")
        provider_order_id = capture_data.get("order_id")
        method = capture_data.get("payment_method", "CARD")
        source_name = "ADYEN_TEST"

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider {provider}")

    # 2. Idempotency Check
    existing_txn = None
    if provider_txn_id:
        existing_txn = db.query(Transaction).filter(
            Transaction.provider_transaction_id == provider_txn_id
        ).first()

    if existing_txn:
        return MultiPaymentVerifyResponse(
            success=True,
            status=existing_txn.payment_status,
            provider=existing_txn.provider or provider,
            transaction_id=existing_txn.id,
            reference_id=existing_txn.reference_id,
            provider_transaction_id=existing_txn.provider_transaction_id,
            provider_order_id=existing_txn.provider_order_id,
            amount=existing_txn.amount,
            currency=existing_txn.currency,
            payment_method=existing_txn.payment_method or "CARD",
            risk_evaluation={
                "score": existing_txn.risk_score,
                "risk_level": existing_txn.risk_level,
                "ml_fraud_probability": existing_txn.ml_fraud_probability,
                "hybrid_score": existing_txn.hybrid_score,
                "triggered_rules": []
            },
            message="Payment was already verified and recorded in PayShield (idempotent)."
        )

    # 3. PayShield AI Fraud Evaluation
    ref_id = f"TXN-{provider[:3]}-{uuid.uuid4().hex[:8].upper()}"
    hist_txns = db.query(Transaction).filter(
        Transaction.customer_email == payer_email
    ).order_by(Transaction.timestamp.desc()).limit(10).all()

    # Suspicious scenario simulation multiplier
    eval_amount = amount * 4.5 if req.test_scenario == "SUSPICIOUS" else amount

    eval_payload = {
        "amount": eval_amount,
        "currency": currency,
        "customer_baseline_amount": 100.0,
        "account_age_days": 2 if req.test_scenario == "SUSPICIOUS" else (req.account_age_days or 90),
        "failed_attempts_24h": 4 if req.test_scenario == "SUSPICIOUS" else (req.failed_attempts_24h or 0),
        "ip_country": "RU" if req.test_scenario == "SUSPICIOUS" else (req.ip_country or "US"),
        "billing_country": "US" if req.test_scenario == "SUSPICIOUS" else (req.billing_country or "US"),
        "shipping_country": "US" if req.test_scenario == "SUSPICIOUS" else (req.shipping_country or "US"),
        "device_fingerprint": f"fp_{uuid.uuid4().hex[:8]}"
    }

    # Use evaluate_transaction_full to get score, risk_level, rules, and ML results
    history = [{"customer_id": t.customer_id, "timestamp": t.timestamp, "ip_address": t.ip_address} for t in hist_txns]
    det_score, risk_lvl, triggered_rules, ml_prediction = risk_engine.evaluate_transaction_full(eval_payload, history)
    
    ml_prob = ml_prediction.get("fraud_probability", 0.0)
    hybrid = int(round(0.6 * (ml_prob * 100) + 0.4 * det_score))
    
    risk_eval = {
        "score": det_score,
        "risk_level": risk_lvl,
        "ml_fraud_probability": ml_prob,
        "hybrid_score": hybrid,
        "triggered_rules": [
            {
                "rule_id": getattr(r, "rule_id", "RULE"),
                "rule_name": getattr(r, "rule_name", "Risk Rule"),
                "score_points": getattr(r, "score_points", getattr(r, "score", 0)),
                "description": getattr(r, "description", ""),
                "evidence": getattr(r, "evidence", "")
            } if hasattr(r, "rule_name") else r for r in triggered_rules
        ]
    }

    # 4. Save to database
    # Non-synthetic if from real sandbox, synthetic if simulated
    is_synth = (capture_data.get("mode") == "sandbox_simulator")

    txn = Transaction(
        user_id=current_user.id if current_user else None,
        reference_id=ref_id,
        amount=amount,
        currency=currency,
        payment_status=status_val if status_val in ("COMPLETED", "PENDING", "DECLINED", "FAILED") else "COMPLETED",
        customer_id=f"CUST-{uuid.uuid4().hex[:6].upper()}",
        customer_name=payer_name,
        customer_email=payer_email,
        customer_baseline_amount=100.0,
        customer_baseline_orders=5,
        account_age_days=eval_payload["account_age_days"],
        failed_attempts_24h=eval_payload["failed_attempts_24h"],
        ip_address=req.ip_address or "127.0.0.1",
        ip_country=eval_payload["ip_country"],
        billing_country=eval_payload["billing_country"],
        shipping_country=eval_payload["shipping_country"],
        device_fingerprint=eval_payload["device_fingerprint"],
        items_json=json.dumps([{"name": "Verified Checkout Item", "price": amount, "quantity": 1}]),
        is_synthetic=is_synth,
        source=source_name,
        provider=provider,
        provider_transaction_id=provider_txn_id,
        provider_order_id=provider_order_id,
        payment_method=method,
        risk_score=risk_eval["score"],
        risk_level=risk_eval["risk_level"],
        ml_fraud_probability=risk_eval["ml_fraud_probability"],
        hybrid_score=risk_eval["hybrid_score"],
        review_status="FLAGGED" if risk_eval["score"] >= 70 else "UNREVIEWED",
        timestamp=datetime.utcnow()
    )
    db.add(txn)
    db.flush()

    # Risk Analysis breakdown association
    analysis = RiskAnalysis(
        transaction_id=txn.id,
        deterministic_score=risk_eval["score"],
        risk_level=risk_eval["risk_level"],
        triggered_rules_json=json.dumps(risk_eval["triggered_rules"]),
        ml_fraud_probability=risk_eval["ml_fraud_probability"],
        hybrid_score=risk_eval["hybrid_score"],
        ml_risk_tier=risk_eval["risk_level"]
    )
    db.add(analysis)

    # Audit Log
    record_audit_event(
        db=db,
        action=f"{provider}_PAYMENT_{status_val}",
        entity_type="TRANSACTION",
        entity_id=str(txn.id),
        performed_by=payer_email,
        details={
            "provider": provider,
            "provider_txn_id": provider_txn_id,
            "amount": amount,
            "currency": currency,
            "risk_score": risk_eval["score"],
            "status": status_val
        }
    )
    db.commit()
    db.refresh(txn)

    # Explain via Gemini if high risk
    explanation = None
    if risk_eval["score"] >= 50:
        try:
            explanation = ai_explainer.explain_risk(eval_payload, risk_eval)
        except Exception:
            pass

    return MultiPaymentVerifyResponse(
        success=(status_val == "COMPLETED"),
        status=status_val,
        provider=provider,
        transaction_id=txn.id,
        reference_id=txn.reference_id,
        provider_transaction_id=provider_txn_id,
        provider_order_id=provider_order_id,
        amount=amount,
        currency=currency,
        payment_method=method,
        risk_evaluation=risk_eval,
        ai_explanation=explanation,
        message=f"{provider} payment recorded with status {status_val}. Risk Score: {risk_eval['score']}/100 ({risk_eval['risk_level']})."
    )
