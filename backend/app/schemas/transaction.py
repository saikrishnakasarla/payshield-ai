from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class OrderItem(BaseModel):
    name: str
    price: float
    quantity: int

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be greater than zero")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    customer_id: str
    customer_name: str
    customer_email: str
    customer_baseline_amount: Optional[float] = 100.0
    customer_baseline_orders: Optional[int] = 5
    account_age_days: Optional[int] = 90
    failed_attempts_24h: Optional[int] = 0
    ip_address: Optional[str] = "192.168.1.1"
    ip_country: Optional[str] = "US"
    billing_country: Optional[str] = "US"
    shipping_country: Optional[str] = "US"
    device_fingerprint: Optional[str] = None
    items: Optional[List[OrderItem]] = []

class TransactionCreate(TransactionBase):
    reference_id: Optional[str] = None
    is_synthetic: bool = True
    source: str = "SYNTHETIC_DEMO"

class TransactionRead(BaseModel):
    id: int
    reference_id: str
    timestamp: datetime
    amount: float
    currency: str
    payment_status: str
    customer_id: str
    customer_name: str
    customer_email: str
    customer_baseline_amount: float
    customer_baseline_orders: int
    account_age_days: Optional[int] = 90
    failed_attempts_24h: Optional[int] = 0
    ip_address: Optional[str]
    ip_country: str
    billing_country: str
    shipping_country: str
    device_fingerprint: Optional[str]
    items_json: str
    is_synthetic: bool
    source: str
    risk_score: int
    risk_level: str
    ml_fraud_probability: Optional[float] = 0.0
    hybrid_score: Optional[int] = 0
    review_status: str
    review_notes: Optional[str]
    reviewed_at: Optional[datetime]
    reviewer: Optional[str]

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    total: int
    items: List[TransactionRead]
    page: int
    limit: int
    pages: int
