from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from dotenv import load_dotenv

from datetime import datetime, timezone, timedelta
import json
import os

from database import engine, get_db
from models import Base, User
from schemas import UserCreate, LoginRequest, ProfileUpdate

from interview import router as interview_router
from CodingProgress import router as coding_progress_router
from AptitudeProgress import router as aptitude_progress_router

# Load environment configs
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "mysecretkey")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

app = FastAPI(title="Interview Preparation Portal API")

# Active CORS config layer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Table Initializer 
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Register Routes
app.include_router(interview_router)
app.include_router(coding_progress_router)
app.include_router(aptitude_progress_router)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.get("/")
def home():
    return {"status": "healthy", "message": "Backend Running Successfully"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.mobile == user.mobile).first():
        raise HTTPException(status_code=400, detail="Mobile already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        mobile=user.mobile,
        dob=user.dob,
        password=pwd_context.hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == request.emailOrMobile) | (User.mobile == request.emailOrMobile)
    ).first()

    if not user or not pwd_context.verify(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.name,
        
        "email": user.email
    }

@app.get("/profile/{email}")
def get_profile(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"name": user.name, "email": user.email, "mobile": user.mobile, "dob": user.dob}

@app.put("/profile/{email}")
def update_profile(email: str, updated_data: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = updated_data.name
    user.mobile = updated_data.mobile
    if updated_data.dob:
        user.dob = updated_data.dob

    db.commit()
    db.refresh(user)
    return {
        "message": "Profile updated successfully",
        "user": {"name": user.name, "email": user.email, "mobile": user.mobile, "dob": user.dob}
    }

@app.get("/coding-questions")
def get_coding_questions():
    file_path = os.path.join(os.path.dirname(__file__), "Data.json")
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Coding questions file not found")

@app.get("/aptitude-topics")
def get_aptitude_topics():
    file_path = os.path.join(os.path.dirname(__file__), "aptitude.json")
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            topics = json.load(file)
        return {"success": True, "count": len(topics), "topics": topics}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Aptitude file not found")