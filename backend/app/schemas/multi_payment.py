from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class MultiPaymentCreateRequest(BaseModel):
    provider: str = Field(..., description="PAYPAL, STRIPE, RAZORPAY, or ADYEN")
    amount: float = Field(..., gt=0, le=100000, description="Transaction amount")
    currency: str = Field("USD", description="Currency code (USD, INR, EUR, etc.)")
    customer_email: str = Field("shopper@example.com", description="Customer email")
    customer_name: str = Field("Test Shopper", description="Customer full name")
    item_name: str = Field("Digital Product", description="Product or service title")
    metadata: Optional[Dict[str, Any]] = None

class MultiPaymentVerifyRequest(BaseModel):
    provider: str = Field(..., description="PAYPAL, STRIPE, RAZORPAY, or ADYEN")
    payment_id: str = Field(..., description="Provider payment/capture/charge ID")
    order_id: Optional[str] = Field(None, description="Provider order ID or PaymentIntent ID")
    signature: Optional[str] = Field(None, description="Signature for Razorpay or Webhooks")
    amount: Optional[float] = Field(None, description="Expected verified amount")
    currency: Optional[str] = Field("USD", description="Expected currency")
    customer_email: Optional[str] = "shopper@example.com"
    customer_name: Optional[str] = "Test Shopper"
    test_scenario: Optional[str] = Field(None, description="SUCCESS, DECLINED, PENDING, 3DS, SUSPICIOUS")
    payment_method: Optional[str] = Field("CARD", description="CARD, UPI, WALLET")
    # Extended fraud telemetry
    ip_address: Optional[str] = "192.168.1.1"
    ip_country: Optional[str] = "US"
    billing_country: Optional[str] = "US"
    shipping_country: Optional[str] = "US"
    account_age_days: Optional[int] = 90
    failed_attempts_24h: Optional[int] = 0
    device_fingerprint: Optional[str] = None

class ProviderStatusItem(BaseModel):
    provider: str
    display_name: str
    is_configured: bool
    mock_mode: bool
    supported_methods: List[str]
    currencies: List[str]
    description: str

class MultiPaymentCreateResponse(BaseModel):
    provider: str
    order_id: str
    amount: float
    currency: str
    status: str
    client_secret: Optional[str] = None
    key_id: Optional[str] = None
    mode: str
    raw_response: Dict[str, Any]

class MultiPaymentVerifyResponse(BaseModel):
    success: bool
    status: str
    provider: str
    transaction_id: int
    reference_id: str
    provider_transaction_id: Optional[str]
    provider_order_id: Optional[str]
    amount: float
    currency: str
    payment_method: str
    risk_evaluation: Dict[str, Any]
    ai_explanation: Optional[Dict[str, Any]] = None
    message: str
