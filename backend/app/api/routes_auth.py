from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, PasswordResetToken
from app.models.audit_log import AuditLog, record_audit_event
from app.schemas.auth import (
    UserRegister, UserLogin, UserResponse, TokenResponse, RegisterResponse,
    ForgotPasswordRequest, ForgotPasswordResponse,
    ResetPasswordRequest, PasswordResetResponse, UpdateProfileRequest
)
from app.services.auth import (
    hash_password, verify_password, create_access_token,
    generate_reset_token, hash_reset_token, get_current_user
)
from app.services.rate_limiter import rate_limit_auth_actions, rate_limit_password_reset
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_auth_actions)]
)
def register(user_in: UserRegister, response: Response, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = hash_password(user_in.password)
    user = User(
        email=email_clean,
        hashed_password=hashed_pw,
        full_name=user_in.full_name.strip(),
        business_name=user_in.business_name.strip() if user_in.business_name else "Merchant Store",
        role="merchant",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log audit entry
    record_audit_event(
        db=db,
        action="REGISTER",
        entity_type="USER",
        entity_id=str(user.id),
        performed_by=user.email,
        details=f"Registered account for {user.full_name} ({user.business_name})"
    )
    db.commit()

    # Crucial Security Rule: Registration MUST NOT establish an authenticated session.
    # Ensure any previous session cookie is cleared.
    response.delete_cookie(key="access_token")

    return RegisterResponse(
        message="Account created successfully. Please sign in with your credentials.",
        user=UserResponse.model_validate(user)
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit_auth_actions)]
)
def login(login_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    email_clean = login_in.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled."
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})

    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    update_in: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_in.full_name is not None and update_in.full_name.strip():
        current_user.full_name = update_in.full_name.strip()
    if update_in.business_name is not None and update_in.business_name.strip():
        current_user.business_name = update_in.business_name.strip()

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    dependencies=[Depends(rate_limit_password_reset)]
)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = body.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    # Generic response that does not disclose whether account exists
    generic_msg = "If an account with that email exists, password reset instructions have been issued."

    if not user:
        return ForgotPasswordResponse(message=generic_msg)

    # Invalidate previous unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).update({"used": True})

    raw_token = generate_reset_token()
    token_hash = hash_reset_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False
    )
    db.add(reset_record)
    db.commit()

    # In development/hackathon mode, provide reset_token for testing without SMTP
    return ForgotPasswordResponse(
        message=generic_msg,
        reset_token=raw_token if settings.DEBUG else None
    )


@router.post(
    "/reset-password",
    response_model=PasswordResetResponse,
    dependencies=[Depends(rate_limit_password_reset)]
)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hash_reset_token(body.token.strip())
    now = datetime.utcnow()

    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).first()

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has expired. Please request a new one."
        )

    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    user.hashed_password = hash_password(body.new_password)
    user.updated_at = now
    reset_record.used = True

    record_audit_event(
        db=db,
        action="PASSWORD_RESET",
        entity_type="USER",
        entity_id=str(user.id),
        performed_by=user.email,
        details="Password was reset using reset token"
    )
    db.commit()

    return PasswordResetResponse(
        message="Password has been reset successfully. You can now log in with your new password."
    )
