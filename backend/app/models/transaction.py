from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reference_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    
    payment_status = Column(String(32), default="COMPLETED", index=True) # COMPLETED, PENDING, FLAGGED, REFUNDED
    customer_id = Column(String(64), index=True, nullable=False)
    customer_name = Column(String(128), nullable=False)
    customer_email = Column(String(128), nullable=False)
    customer_baseline_amount = Column(Float, default=100.0)
    customer_baseline_orders = Column(Integer, default=5)
    
    # Extended Multi-Signal Heuristics & Evasion Defense Telemetry
    account_age_days = Column(Integer, default=90)
    failed_attempts_24h = Column(Integer, default=0)
    ip_address = Column(String(64), nullable=True)
    ip_country = Column(String(64), default="US")
    billing_country = Column(String(64), default="US")
    shipping_country = Column(String(64), default="US")
    device_fingerprint = Column(String(64), nullable=True)
    items_json = Column(Text, default="[]") # JSON list of {name, price, quantity}
    
    is_synthetic = Column(Boolean, default=True)
    source = Column(String(32), default="SYNTHETIC_DEMO") # SYNTHETIC_DEMO, PAYPAL_SANDBOX, STRIPE_TEST, RAZORPAY_TEST, ADYEN_TEST, PUBLIC_BENCHMARK
    provider = Column(String(32), default="PAYPAL", index=True) # PAYPAL, STRIPE, RAZORPAY, ADYEN, DEMO
    provider_transaction_id = Column(String(128), nullable=True, index=True) # capture ID, ch_xxx, pay_xxx, pspReference
    provider_order_id = Column(String(128), nullable=True, index=True) # order ID, pi_xxx, order_xxx
    payment_method = Column(String(32), default="CARD") # CARD, UPI, WALLET, NETBANKING
    
    # Risk Engine Scores
    risk_score = Column(Integer, default=0) # Deterministic Rule Score (0 to 100)
    risk_level = Column(String(16), default="LOW") # LOW, MEDIUM, HIGH
    ml_fraud_probability = Column(Float, default=0.0) # ML model P(fraud)
    hybrid_score = Column(Integer, default=0) # 60% ML + 40% Rules
    
    # Merchant Review Workflow & Audit Association
    review_status = Column(String(32), default="UNREVIEWED", index=True) # UNREVIEWED, REVIEWED_SAFE, ESCALATED_HUMAN_REVIEW
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer = Column(String(64), default="Merchant User")

    # Relationships
    user = relationship("User", back_populates="transactions")
    analyses = relationship("RiskAnalysis", back_populates="transaction", cascade="all, delete-orphan")
