from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.database import get_db
from app.config import settings
from app.services.seed_data import seed_database
from app.services.paypal_service import paypal_service
from app.services.auth import get_current_user, get_optional_current_user
from app.models.user import User

router = APIRouter(prefix="/api", tags=["Settings & System"])

class ThresholdUpdateRequest(BaseModel):
    baseline_multiplier: float = Field(3.0, ge=1.5, le=10.0)
    velocity_window_minutes: int = Field(10, ge=1, le=60)
    medium_risk_score: int = Field(35, ge=10, le=50)
    high_risk_score: int = Field(70, ge=50, le=90)

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    return {
        "status": "healthy",
        "service": "PayShield AI Core API",
        "database": "connected",
        "paypal_mode": settings.PAYPAL_MODE,
        "paypal_configured": paypal_service.is_configured(),
        "mock_simulator": settings.PAYPAL_MOCK_SIMULATOR,
        "gemini_configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "demo"),
        "version": "1.0.0-hackathon"
    }

@router.get("/settings")
def get_system_settings(current_user: User = Depends(get_optional_current_user)):
    return {
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "authenticated": current_user is not None,
        "user_email": current_user.email if current_user else None,
        "paypal": {
            "mode": settings.PAYPAL_MODE,
            "is_configured": paypal_service.is_configured(),
            "mock_mode": paypal_service.is_mock_mode(),
            "client_id_preview": f"{settings.PAYPAL_CLIENT_ID[:8]}..." if settings.PAYPAL_CLIENT_ID and len(settings.PAYPAL_CLIENT_ID) > 8 else "Not Configured",
            "api_endpoint": settings.PAYPAL_BASE_URL
        },
        "ai": {
            "model": settings.GEMINI_MODEL,
            "is_configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "demo"),
            "fallback_active": not bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "demo")
        },
        "thresholds": {
            "baseline_multiplier": settings.BASELINE_AMOUNT_MULTIPLIER,
            "velocity_window_minutes": settings.VELOCITY_WINDOW_MINUTES,
            "medium_risk_score": settings.MEDIUM_RISK_SCORE,
            "high_risk_score": settings.HIGH_RISK_SCORE
        }
    }

@router.post("/settings/thresholds")
def update_thresholds(
    req: ThresholdUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    settings.BASELINE_AMOUNT_MULTIPLIER = req.baseline_multiplier
    settings.VELOCITY_WINDOW_MINUTES = req.velocity_window_minutes
    settings.MEDIUM_RISK_SCORE = req.medium_risk_score
    settings.HIGH_RISK_SCORE = req.high_risk_score
    return {
        "status": "success",
        "message": f"Risk engine thresholds updated by {current_user.email}.",
        "current_thresholds": {
            "baseline_multiplier": settings.BASELINE_AMOUNT_MULTIPLIER,
            "velocity_window_minutes": settings.VELOCITY_WINDOW_MINUTES,
            "medium_risk_score": settings.MEDIUM_RISK_SCORE,
            "high_risk_score": settings.HIGH_RISK_SCORE
        }
    }

@router.post("/demo/reset")
def reset_demo_database(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Safely resets synthetic demo transactions back to clean seed state. Requires authenticated merchant or admin.
    """
    res = seed_database(db, force=True)
    return {
        "status": "success",
        "message": f"Database seed reset initiated by {current_user.email}.",
        "details": res
    }
