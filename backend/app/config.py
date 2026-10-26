from pydantic_settings import BaseSettings
from pydantic import model_validator
from pydantic import ConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    APP_NAME: str = "PayShield AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./payshield.db"
    
    # Security & Authentication
    SECRET_KEY: str = "payshield-hackathon-super-secret-jwt-key-2026-secure-random"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    
    # AI Engine (Google Gemini)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # PayPal Configuration (Sandbox)
    PAYPAL_ENV: str = "sandbox"
    PAYPAL_MODE: str = "sandbox"
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com"
    PAYPAL_WEBHOOK_ID: Optional[str] = None
    PAYPAL_MOCK_SIMULATOR: bool = True  # Enabled by default as graceful fallback when credentials not configured

    # Stripe Configuration (Test Mode)
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Razorpay Configuration (Test Mode)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None

    # Adyen Configuration (Test Environment)
    ADYEN_API_KEY: Optional[str] = None
    ADYEN_CLIENT_KEY: Optional[str] = None
    ADYEN_MERCHANT_ACCOUNT: Optional[str] = None
    ADYEN_HMAC_KEY: Optional[str] = None
    ADYEN_ENVIRONMENT: str = "TEST"
    
    # Configurable Risk Engine Heuristic Thresholds
    BASELINE_AMOUNT_MULTIPLIER: float = 3.0
    VELOCITY_WINDOW_MINUTES: int = 10
    VELOCITY_THRESHOLD_COUNT: int = 3
    HIGH_FREQUENCY_WINDOW_SECONDS: int = 60
    HIGH_FREQUENCY_THRESHOLD_COUNT: int = 4
    
    # Risk Score Boundaries
    MEDIUM_RISK_SCORE: int = 35
    HIGH_RISK_SCORE: int = 70

    @model_validator(mode="after")
    def validate_production_security(self):
        env_lower = self.APP_ENV.lower()
        is_production = env_lower in ("production", "prod") or not self.DEBUG
        
        insecure_defaults = [
            "secret",
            "change-me",
            "password",
            "12345678",
            "payshield-hackathon-super-secret-jwt-key-2026-secure-random",
            "jwt-secret-placeholder"
        ]
        
        # In Vercel serverless environment, redirect SQLite to writable /tmp directory
        if os.environ.get("VERCEL") and self.DATABASE_URL == "sqlite:///./payshield.db":
            object.__setattr__(self, "DATABASE_URL", "sqlite:////tmp/payshield.db")

        if is_production:
            if not self.SECRET_KEY or self.SECRET_KEY.strip() in insecure_defaults:
                raise ValueError(
                    "FATAL SECURITY VIOLATION: Default development SECRET_KEY detected in production environment. "
                    "You must provide a high-entropy secret (min 32 chars) via the SECRET_KEY environment variable."
                )
            if len(self.SECRET_KEY.strip()) < 32:
                raise ValueError(
                    "FATAL SECURITY VIOLATION: SECRET_KEY must be at least 32 characters long for production security."
                )
        return self

    model_config = ConfigDict(env_file=".env", extra="allow")

settings = Settings()
