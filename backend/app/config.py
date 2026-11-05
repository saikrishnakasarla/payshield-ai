from pydantic_settings import BaseSettings
from pydantic import model_validator, ConfigDict
from typing import Optional, Dict, Any, List
import os

class Settings(BaseSettings):
    APP_NAME: str = "PayShield AI"
    APP_ENV: str = "development"  # development, testing, staging, production
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./payshield.db"
    SEED_DATABASE: bool = False  # Set to True only when explicitly desiring seed data
    
    # Security & Authentication
    SECRET_KEY: str = "payshield-hackathon-super-secret-jwt-key-2026-secure-random"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    CORS_ALLOWED_ORIGINS: Optional[str] = None  # Comma-separated extra origins
    
    # AI Engine (Google Gemini)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # PayPal Configuration
    PAYPAL_ENV: str = "sandbox"  # sandbox or live
    PAYPAL_MODE: str = "sandbox"  # sandbox or live
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com"
    PAYPAL_WEBHOOK_ID: Optional[str] = None
    PAYPAL_MOCK_SIMULATOR: bool = True  # Allowed ONLY in development/testing
    
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
    CRITICAL_RISK_SCORE: int = 85

    # Operational & SRE Config
    REQUEST_TIMEOUT_SECONDS: float = 30.0
    METRICS_ENABLED: bool = True

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in ("production", "prod")

    @property
    def is_staging(self) -> bool:
        return self.APP_ENV.lower() in ("staging", "sandbox")

    @property
    def is_testing(self) -> bool:
        return self.APP_ENV.lower() in ("testing", "test")

    @model_validator(mode="after")
    def validate_production_security(self):
        env_lower = self.APP_ENV.lower()
        is_prod = env_lower in ("production", "prod")
        
        insecure_defaults = [
            "secret",
            "change-me",
            "password",
            "12345678",
            "payshield-hackathon-super-secret-jwt-key-2026-secure-random",
            "jwt-secret-placeholder"
        ]

        # Automatic URL schema normalization (postgres:// -> postgresql://)
        if self.DATABASE_URL.startswith("postgres://"):
            object.__setattr__(self, "DATABASE_URL", self.DATABASE_URL.replace("postgres://", "postgresql://", 1))

        # Check Vercel serverless environment mapping
        if os.environ.get("VERCEL"):
            persistent_url = os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_URL")
            if persistent_url and not persistent_url.startswith("sqlite"):
                if persistent_url.startswith("postgres://"):
                    persistent_url = persistent_url.replace("postgres://", "postgresql://", 1)
                object.__setattr__(self, "DATABASE_URL", persistent_url)
            elif is_prod:
                raise ValueError(
                    "FATAL DATABASE CONFIGURATION: Ephemeral /tmp SQLite storage cannot be used for "
                    "permanent financial transaction records in production. "
                    "Please configure a persistent PostgreSQL database connection via POSTGRES_URL or DATABASE_URL."
                )
            elif self.DATABASE_URL == "sqlite:///./payshield.db":
                object.__setattr__(self, "DATABASE_URL", "sqlite:////tmp/payshield.db")

        # Strict Production Enforcement
        if is_prod:
            # 1. Enforce Non-Ephemeral Database
            if self.DATABASE_URL.startswith("sqlite") or ":memory:" in self.DATABASE_URL:
                raise ValueError(
                    "FATAL DATABASE CONFIGURATION: Ephemeral /tmp SQLite storage cannot be used for "
                    "permanent financial transaction records in production. "
                    "Please configure a persistent PostgreSQL connection via DATABASE_URL or POSTGRES_URL."
                )

            # 2. Enforce High-Entropy JWT Secret
            if not self.SECRET_KEY or self.SECRET_KEY.strip() in insecure_defaults:
                raise ValueError(
                    "FATAL SECURITY VIOLATION: Insecure or default development SECRET_KEY detected in production. "
                    "You must provide a high-entropy secret (min 32 chars) via the SECRET_KEY environment variable."
                )
            if len(self.SECRET_KEY.strip()) < 32:
                raise ValueError(
                    "FATAL SECURITY VIOLATION: SECRET_KEY must be at least 32 characters long for production security."
                )

            # 3. Prevent Simulator Fallback in Production
            if self.PAYPAL_MOCK_SIMULATOR:
                raise ValueError(
                    "FATAL PAYMENT CONFIGURATION: PAYPAL_MOCK_SIMULATOR cannot be enabled in production. "
                    "Real payment processing requires PAYPAL_MOCK_SIMULATOR=false with valid credentials."
                )

            # 4. Require valid credentials in live PayPal mode
            if self.PAYPAL_MODE == "live":
                if not self.PAYPAL_CLIENT_ID or not self.PAYPAL_CLIENT_SECRET:
                    raise ValueError(
                        "FATAL PAYMENT CONFIGURATION: Live PayPal mode requires valid PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
                    )

            # 5. Disable debug mode in production
            object.__setattr__(self, "DEBUG", False)

        return self

    def get_public_diagnostics(self) -> Dict[str, Any]:
        """
        Safe configuration diagnostics for production monitoring.
        Never returns passwords, secrets, tokens, or PII.
        """
        is_pg = self.DATABASE_URL.startswith("postgresql") or self.DATABASE_URL.startswith("postgres")
        db_type = "PostgreSQL" if is_pg else "SQLite"
        
        return {
            "application": self.APP_NAME,
            "environment": self.APP_ENV,
            "debug_mode": self.DEBUG,
            "database": {
                "engine": db_type,
                "is_persistent": is_pg,
                "is_sqlite": not is_pg,
                "connection_configured": bool(self.DATABASE_URL)
            },
            "gateways": {
                "paypal": {
                    "mode": self.PAYPAL_MODE,
                    "simulator_active": self.PAYPAL_MOCK_SIMULATOR,
                    "credentials_configured": bool(self.PAYPAL_CLIENT_ID and self.PAYPAL_CLIENT_SECRET),
                    "webhook_configured": bool(self.PAYPAL_WEBHOOK_ID)
                },
                "stripe": {
                    "configured": bool(self.STRIPE_SECRET_KEY),
                    "test_mode": True if (self.STRIPE_SECRET_KEY or "").startswith("sk_test_") else False
                },
                "razorpay": {
                    "configured": bool(self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET)
                },
                "adyen": {
                    "configured": bool(self.ADYEN_API_KEY)
                }
            },
            "services": {
                "gemini_ai": {
                    "configured": bool(self.GEMINI_API_KEY),
                    "model": self.GEMINI_MODEL,
                    "fallback_available": True
                },
                "audit_trail": {
                    "tamper_evident_chaining": True
                }
            }
        }

    model_config = ConfigDict(env_file=".env", extra="allow")

settings = Settings()
