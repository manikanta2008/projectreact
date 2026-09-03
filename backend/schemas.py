from pydantic import BaseModel, EmailStr
from datetime import date
from typing import List, Optional

# ==========================
# USER SCHEMAS
# ==========================
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    dob: date
    password: str


class LoginRequest(BaseModel):
    emailOrMobile: str
    password: str


class ProfileResponse(BaseModel):
    name: str
    email: str
    mobile: str
    dob: date


class ProfileUpdate(BaseModel):
    name: str
    mobile: str
    dob: Optional[date] = None  # Enforced as 'date' type rather than 'str' to align with models.py

# ==========================
# INTERVIEW SCHEMAS
# ==========================
class InterviewRequest(BaseModel):
    resume_text: str


class InterviewChatRequest(BaseModel):
    resume_text: str
    conversation: list
    user_answer: str


# ==========================
# PROGRESS SCHEMAS
# ==========================
class ProgressRequest(BaseModel):
    user_id: int
    question_id: int


class AptitudeProgressRequest(BaseModel):
    user_id: int
    topic_id: int
    