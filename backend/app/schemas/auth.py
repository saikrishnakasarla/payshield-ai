from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2, max_length=128)
    business_name: Optional[str] = Field(default="Merchant Store", max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    business_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RegisterResponse(BaseModel):
    message: str = "Account created successfully. Please sign in with your credentials."
    user: UserResponse

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None  # Included in development/test mode for automated flows

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

class PasswordResetResponse(BaseModel):
    message: str

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    business_name: Optional[str] = None
