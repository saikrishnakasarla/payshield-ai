import time
import sqlite3
from typing import Tuple, Optional
from contextlib import contextmanager
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False, "timeout": 30.0},
        echo=False
    )

    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        # Enforce foreign key constraints and enable WAL mode for crash resilience in SQLite
        if isinstance(dbapi_connection, sqlite3.Connection):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()
else:
    # Production PostgreSQL connection pool configuration
    # Support SSL parameters for Neon, Supabase, AWS RDS
    connect_args = {}
    db_url = settings.DATABASE_URL
    if "sslmode=" not in db_url and ("neon.tech" in db_url or "supabase" in db_url or "aws" in db_url or "pooler" in db_url):
        connect_args["sslmode"] = "require"

    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Prevent broken/dropped connections via keep-alive pings
        pool_recycle=1800,   # Recycle connections every 30 minutes
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    FastAPI dependency that yields a database session with automatic rollback on unhandled errors.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@contextmanager
def transaction_scope(db: Session = None):
    """
    Transactional scope context manager for atomic operations with guaranteed commit or rollback.
    """
    session = db or SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        if db is None:
            session.close()

def check_database_connection(timeout_seconds: float = 3.0) -> Tuple[bool, float, Optional[str]]:
    """
    Safely probes database connectivity with a lightweight ping.
    Returns: (is_healthy, latency_ms, error_message)
    """
    start_time = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return True, latency_ms, None
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return False, latency_ms, str(e)
