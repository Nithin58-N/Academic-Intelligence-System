"""
Database Setup and Session Management
Uses SQLite with synchronous SQLAlchemy (no aiosqlite needed)
"""

from datetime import datetime
from typing import Generator

from sqlalchemy import (
    Column, DateTime, Integer, String, Text, Float, Boolean, JSON, create_engine
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from utils.config import settings

# Use synchronous SQLite (no aiosqlite dependency)
SYNC_DB_URL = settings.DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")

engine = create_engine(
    SYNC_DB_URL,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    preferred_language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    doc_type = Column(String(50))
    subject = Column(String(100))
    semester = Column(String(20))
    total_pages = Column(Integer)
    total_chunks = Column(Integer)
    status = Column(String(20), default="processing")
    uploaded_by = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True)
    user_id = Column(Integer)
    title = Column(String(200))
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True)
    role = Column(String(20))
    content = Column(Text)
    language = Column(String(10))
    sources = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class PYQAnalysis(Base):
    __tablename__ = "pyq_analyses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer)
    question_text = Column(Text)
    frequency = Column(Integer, default=1)
    importance_score = Column(Float, default=0.0)
    category = Column(String(50))
    module = Column(String(100))
    marks = Column(Integer)
    years_appeared = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class GeneratedNote(Base):
    __tablename__ = "generated_notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    content = Column(Text)
    note_type = Column(String(50))
    subject = Column(String(100))
    language = Column(String(10))
    document_ids = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
