import abc
from typing import Dict, Any, Optional

class BasePaymentAdapter(abc.ABC):
    """
    Abstract payment adapter interface standardizing payment lifecycles
    across PayPal Sandbox, Stripe Test Mode, Razorpay Test Mode, and Adyen Test.
    """
    provider_name: str

    @abc.abstractmethod
    def is_configured(self) -> bool:
        """Returns True if provider has valid test credentials configured."""
        pass

    @abc.abstractmethod
    def is_mock_mode(self) -> bool:
        """Returns True if operating under simulation mode."""
        pass

    @abc.abstractmethod
    async def create_payment_order(
        self,
        amount: float,
        currency: str,
        customer_email: str,
        customer_name: str,
        item_name: str = "Test Checkout",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates an order, checkout session, or PaymentIntent with the provider.
        Returns:
            {
                "order_id": str,
                "amount": float,
                "currency": str,
                "status": str,
                "client_secret": Optional[str],
                "mode": str, # "live_test" or "sandbox_simulator"
                "raw_response": dict
            }
        """
        pass

    @abc.abstractmethod
    async def verify_and_capture_payment(
        self,
        payment_id: str,
        order_id: Optional[str] = None,
        expected_amount: Optional[float] = None,
        expected_currency: Optional[str] = "USD",
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Verifies payment execution server-side with provider test API or simulator.
        Returns:
            {
                "transaction_id": str,
                "order_id": str,
                "amount": float,
                "currency": str,
                "status": "COMPLETED" | "FAILED" | "PENDING" | "DECLINED" | "REQUIRES_ACTION",
                "payer_email": str,
                "payer_name": str,
                "payment_method": "CARD" | "UPI" | "WALLET",
                "verified": bool,
                "raw_response": dict
            }
        """
        pass
