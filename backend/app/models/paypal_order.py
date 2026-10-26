from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class PayPalOrder(Base):
    __tablename__ = "paypal_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    paypal_order_id = Column(String(64), unique=True, index=True, nullable=False)
    capture_id = Column(String(64), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(String(32), default="CREATED", index=True) # CREATED, APPROVED, COMPLETED, FAILED, CANCELLED
    payer_email = Column(String(128), nullable=True)
    payer_name = Column(String(128), nullable=True)
    raw_response_json = Column(Text, nullable=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    captured_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="paypal_orders")
