from pydantic import BaseModel, validator
from typing import Optional
from datetime import date


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AdminSignupRequest(BaseModel):
    name: str
    email: str
    password: str
    admin_secret: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class OnboardingUpdateRequest(BaseModel):
    step: int
    completed: Optional[bool] = False


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None

    @validator("gender")
    def valid_gender(cls, v):
        if v and v not in {"male", "female", "other", "prefer_not_to_say"}:
            raise ValueError("Invalid gender value")
        return v

    @validator("name")
    def name_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Name cannot be empty")
        return v


class DeleteAccountRequestOTP(BaseModel):
    pass  # No body needed — user is authenticated


class ConfirmDeleteAccount(BaseModel):
    otp: str
