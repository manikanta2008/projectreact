from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from database import get_db
from models import AptitudeProgress, User
from schemas import AptitudeProgressRequest

router = APIRouter(
    prefix="/aptitude-progress",
    tags=["Aptitude Progress"]
)

# =====================================================
# SAVE / UPDATE PROGRESS
# =====================================================
@router.post("/save")
def save_progress(data: AptitudeProgressRequest, db: Session = Depends(get_db)):
    try:
        print(f"--- Saving Progress: User {data.user_id}, Topic {data.topic_id} ---")
        
        user_exists = db.query(User).filter(User.id == data.user_id).first()
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User ID {data.user_id} does not exist."
            )

        existing = db.query(AptitudeProgress).filter(
            AptitudeProgress.user_id == data.user_id,
            AptitudeProgress.topic_id == data.topic_id
        ).first()

        if existing:
            existing.completed = True
            db.commit()
            return {"success": True, "message": "Already Completed / Updated Successfully"}

        progress = AptitudeProgress(
            user_id=data.user_id,
            topic_id=data.topic_id,
            completed=True
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

        return {"success": True, "message": "Progress Saved Successfully"}

    except HTTPException as http_err:
        raise http_err
    except SQLAlchemyError as db_err:
        db.rollback()
        print("DATABASE ERROR ON SAVE:", str(db_err))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database operational error: {str(db_err)}"
        )

# =====================================================
# GET USER PROGRESS (UPDATED TO PREVENT 404)
# =====================================================
@router.get("/{user_id}")
def get_progress(user_id: int, db: Session = Depends(get_db)):
    try:
        progress = db.query(AptitudeProgress).filter(
            AptitudeProgress.user_id == user_id
        ).all()
        
        # CRITICAL FIX: If no progress records exist yet, return an empty list []
        # instead of letting the application crash or return a 404 error.
        if not progress:
            return []
            
        return progress
        
    except SQLAlchemyError as db_err:
        print("DATABASE ERROR ON FETCH:", str(db_err))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve progress entries."
        )