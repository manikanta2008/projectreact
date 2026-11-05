from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import jwt
from dotenv import load_dotenv

from datetime import datetime, timezone, timedelta
import json
import os
import bcrypt

# Load environment variables
load_dotenv()

# Database and models
from database import engine, get_db
from models import Base, User
from schemas import UserCreate, LoginRequest, ProfileUpdate

# Import routers
from interview import router as interview_router
from CodingProgress import router as coding_progress_router
from AptitudeProgress import router as aptitude_progress_router


# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is missing")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)
)


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Interview Preparation Portal API",
    description="SkillForge - Interview Preparation Platform",
    version="1.0.0"
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://skillforge-frontend-eight.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# DATABASE INITIALIZATION
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# PASSWORD HASHING
# ==========================================

def hash_password(password: str) -> str:

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must not exceed 72 bytes"
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        return False

    try:
        return bcrypt.checkpw(
            password_bytes,
            hashed_password.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


# ==========================================
# REGISTER ROUTERS
# ==========================================

app.include_router(interview_router)
app.include_router(coding_progress_router)
app.include_router(aptitude_progress_router)


# ==========================================
# JWT TOKEN GENERATION
# ==========================================

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ==========================================
# HOME / HEALTH CHECK
# ==========================================

@app.get("/")
def home():

    return {
        "status": "healthy",
        "message": "SkillForge Backend Running Successfully"
    }


# ==========================================
# USER REGISTRATION
# ==========================================

@app.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # Check existing email
    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Check existing mobile
    existing_mobile = db.query(User).filter(
        User.mobile == user.mobile
    ).first()

    if existing_mobile:
        raise HTTPException(
            status_code=400,
            detail="Mobile already registered"
        )

    # Create new user
    new_user = User(
        name=user.name,
        email=user.email,
        mobile=user.mobile,
        dob=user.dob,
        password=hash_password(user.password)
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to register user. Please try again."
        )

    return {
        "message": "User registered successfully"
    }


# ==========================================
# USER LOGIN
# ==========================================

@app.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        (User.email == request.emailOrMobile) |
        (User.mobile == request.emailOrMobile)
    ).first()

    if not user or not verify_password(
        request.password,
        user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.name,
        "email": user.email
    }


# ==========================================
# GET USER PROFILE
# ==========================================

@app.get("/profile/{email}")
def get_profile(
    email: str,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "name": user.name,
        "email": user.email,
        "mobile": user.mobile,
        "dob": user.dob
    }


# ==========================================
# UPDATE USER PROFILE
# ==========================================

@app.put("/profile/{email}")
def update_profile(
    email: str,
    updated_data: ProfileUpdate,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.name = updated_data.name
    user.mobile = updated_data.mobile

    if updated_data.dob:
        user.dob = updated_data.dob

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "name": user.name,
            "email": user.email,
            "mobile": user.mobile,
            "dob": user.dob
        }
    }


# ==========================================
# CODING QUESTIONS
# ==========================================

@app.get("/coding-questions")
def get_coding_questions():

    file_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "Data.json"
    )

    try:

        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)

    except FileNotFoundError:

        raise HTTPException(
            status_code=404,
            detail="Coding questions file not found"
        )

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="Invalid coding questions JSON file"
        )


# ==========================================
# APTITUDE TOPICS
# ==========================================

@app.get("/aptitude-topics")
def get_aptitude_topics():

    file_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "Aptitude.json"
    )

    try:

        with open(file_path, "r", encoding="utf-8") as file:
            topics = json.load(file)

        return {
            "success": True,
            "count": len(topics),
            "topics": topics
        }

    except FileNotFoundError:

        raise HTTPException(
            status_code=404,
            detail="Aptitude file not found"
        )

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="Invalid aptitude JSON file"
        )
