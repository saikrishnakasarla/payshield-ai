from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class PayPalOrderCreateRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Order total in USD, validated by backend")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    item_name: str = Field(default="Sandbox Digital License")
    customer_email: Optional[str] = "sandbox-buyer@business.example.com"
    customer_name: Optional[str] = "Sandbox Test Customer"

class PayPalOrderCaptureRequest(BaseModel):
    order_id: str = Field(..., description="PayPal Order ID returned by PayPal SDK")

class PayPalOrderResponse(BaseModel):
    paypal_order_id: str
    status: str
    amount: float
    currency: str
    created_at: datetime
    capture_id: Optional[str] = None
    payer_email: Optional[str] = None
    payer_name: Optional[str] = None
    transaction_id: Optional[int] = None
    verified_by_backend: bool = True
    risk_evaluation: Optional[Dict[str, Any]] = None
    message: str = "Order processed successfully in PayPal Sandbox"

class PayPalStatusResponse(BaseModel):
    is_configured: bool
    mode: str
    client_id_configured: bool
    client_secret_configured: bool
    mock_mode: bool
    api_endpoint: str

class PayPalConfigResponse(BaseModel):
    client_id: Optional[str] = None
    currency: str = "USD"
    environment: str = "sandbox"
    mock_mode: bool
    is_configured: bool
