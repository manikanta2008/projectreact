from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    mobile = Column(String, unique=True, nullable=False)
    dob = Column(Date)
    password = Column(String, nullable=False)


class CodingProgress(Base):
    __tablename__ = "coding_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    question_id = Column(Integer, nullable=False)
    completed = Column(Boolean, default=True)


class AptitudeProgress(Base):
    __tablename__ = "aptitude_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    topic_id = Column(Integer, nullable=False)
    completed = Column(Boolean, default=True)