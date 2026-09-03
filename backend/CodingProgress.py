from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import CodingProgress
from schemas import ProgressRequest

router = APIRouter(
    prefix="/coding",
    tags=["Coding Progress"]
)


@router.post("/progress")
def save_progress(
    progress: ProgressRequest,
    db: Session = Depends(get_db)
):

    existing = db.query(CodingProgress).filter(
        CodingProgress.user_id == progress.user_id,
        CodingProgress.question_id == progress.question_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()

        return {
            "completed": False
        }

    new_progress = CodingProgress(
        user_id=progress.user_id,
        question_id=progress.question_id,
        completed=True
    )

    db.add(new_progress)
    db.commit()

    return {
        "completed": True
    }


@router.get("/progress/{user_id}")
def get_progress(
    user_id: int,
    db: Session = Depends(get_db)
):

    progress = db.query(CodingProgress).filter(
        CodingProgress.user_id == user_id
    ).all()

    return [
        {
            "question_id": p.question_id
        }
        for p in progress
    ]