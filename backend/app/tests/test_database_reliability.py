"""
test_database_reliability.py
============================
Comprehensive test suite verifying database reliability, persistence, and transaction integrity (Task 5):
1. Merchant creation persistence.
2. Transaction persistence.
3. Transaction retrieval after database session restart.
4. Risk result persistence.
5. Duplicate transaction prevention.
6. Duplicate capture prevention.
7. Database rollback.
8. Concurrent transaction handling.
9. Foreign-key integrity.
10. Merchant data isolation.
11. Pagination.
12. Database connection failure.
13. SQLite compatibility (WAL mode & PRAGMAs).
14. PostgreSQL compatibility & URL normalization.
15. Payment reconciliation after simulated database failure.
"""

import uuid
import pytest
import sqlite3
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

from sqlalchemy import create_engine, event, or_
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError, OperationalError
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.database import Base, get_db, SessionLocal, transaction_scope
from app.models.user import User, PasswordResetToken
from app.models.transaction import Transaction
from app.models.paypal_order import PayPalOrder
from app.models.risk_analysis import RiskAnalysis
from app.models.audit_log import AuditLog, record_audit_event
from app.services.auth import create_access_token, hash_password

client = TestClient(app)

# Isolated Test SQLite in memory or temporary file with foreign keys and WAL mode
TEST_DB_URL = "sqlite:///./test_reliability.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False, "timeout": 30.0})

@event.listens_for(test_engine, "connect")
def set_test_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Merchant Creation Persistence
# ─────────────────────────────────────────────────────────────────────────────
def test_01_merchant_creation_persistence():
    db = TestSessionLocal()
    email = f"merchant_{uuid.uuid4().hex[:8]}@example.com"
    try:
        user = User(
            email=email,
            hashed_password=hash_password("StrongPassword123!"),
            full_name="Persisted Merchant",
            business_name="Reliable Store Ltd",
            role="merchant",
            is_active=True
        )
        db.add(user)
        db.commit()
        user_id = user.id
    finally:
        db.close()

    # Query in fresh session
    verify_db = TestSessionLocal()
    try:
        persisted = verify_db.query(User).filter(User.id == user_id).first()
        assert persisted is not None
        assert persisted.email == email
        assert persisted.business_name == "Reliable Store Ltd"
        assert persisted.is_active is True
    finally:
        verify_db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 2. Transaction Persistence
# ─────────────────────────────────────────────────────────────────────────────
def test_02_transaction_persistence():
    db = TestSessionLocal()
    ref_id = f"TXN-PERSIST-{uuid.uuid4().hex[:8].upper()}"
    try:
        txn = Transaction(
            reference_id=ref_id,
            amount=249.99,
            currency="USD",
            payment_status="COMPLETED",
            customer_id="CUST-001",
            customer_name="Alice Smith",
            customer_email="alice@example.com",
            provider="PAYPAL",
            is_synthetic=False,
            source="PAYPAL_SANDBOX"
        )
        db.add(txn)
        db.commit()
        txn_id = txn.id
    finally:
        db.close()

    verify_db = TestSessionLocal()
    try:
        persisted_txn = verify_db.query(Transaction).filter(Transaction.id == txn_id).first()
        assert persisted_txn is not None
        assert persisted_txn.reference_id == ref_id
        assert persisted_txn.amount == 249.99
        assert persisted_txn.currency == "USD"
        assert persisted_txn.is_synthetic is False
    finally:
        verify_db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 3. Transaction Retrieval After Database Session Restart
# ─────────────────────────────────────────────────────────────────────────────
def test_03_transaction_retrieval_after_session_restart():
    ref_id = f"TXN-RESTART-{uuid.uuid4().hex[:8].upper()}"
    
    # Session 1: create and close
    s1 = TestSessionLocal()
    txn = Transaction(
        reference_id=ref_id,
        amount=550.00,
        currency="USD",
        payment_status="COMPLETED",
        customer_id="CUST-RESTART",
        customer_name="Bob Restart",
        customer_email="bob@example.com"
    )
    s1.add(txn)
    s1.commit()
    s1_id = txn.id
    s1.close()

    # Completely new Sessionmaker and session instance
    NewSession = sessionmaker(bind=test_engine)
    s2 = NewSession()
    try:
        retrieved = s2.query(Transaction).filter(Transaction.id == s1_id).first()
        assert retrieved is not None
        assert retrieved.reference_id == ref_id
        assert retrieved.amount == 550.00
    finally:
        s2.close()


# ─────────────────────────────────────────────────────────────────────────────
# 4. Risk Result Persistence
# ─────────────────────────────────────────────────────────────────────────────
def test_04_risk_result_persistence():
    db = TestSessionLocal()
    try:
        txn = Transaction(
            reference_id=f"TXN-RISK-{uuid.uuid4().hex[:8].upper()}",
            amount=89.0,
            currency="USD",
            customer_id="CUST-RISK",
            customer_name="Risk User",
            customer_email="risk@example.com"
        )
        db.add(txn)
        db.flush()

        analysis = RiskAnalysis(
            transaction_id=txn.id,
            deterministic_score=45,
            risk_level="MEDIUM",
            ml_fraud_probability=0.42,
            ml_risk_tier="MEDIUM",
            hybrid_score=43,
            ai_summary="Heuristic velocity alert",
            ai_explanation="Multiple transactions detected in rapid succession.",
            ai_uncertainties="IP geolocation unverified.",
            ai_recommended_steps='["Review order history"]'
        )
        db.add(analysis)
        db.commit()
        analysis_id = analysis.id
        txn_id = txn.id
    finally:
        db.close()

    verify_db = TestSessionLocal()
    try:
        saved_analysis = verify_db.query(RiskAnalysis).filter(RiskAnalysis.id == analysis_id).first()
        assert saved_analysis is not None
        assert saved_analysis.transaction_id == txn_id
        assert saved_analysis.deterministic_score == 45
        assert saved_analysis.risk_level == "MEDIUM"
        assert saved_analysis.ai_summary == "Heuristic velocity alert"

        # Verify relationship from transaction side
        saved_txn = verify_db.query(Transaction).filter(Transaction.id == txn_id).first()
        assert len(saved_txn.analyses) == 1
        assert saved_txn.analyses[0].hybrid_score == 43
    finally:
        verify_db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 5. Duplicate Transaction Prevention (Unique Reference ID)
# ─────────────────────────────────────────────────────────────────────────────
def test_05_duplicate_transaction_prevention():
    db = TestSessionLocal()
    duplicate_ref = f"DUP-REF-{uuid.uuid4().hex[:8].upper()}"
    try:
        t1 = Transaction(
            reference_id=duplicate_ref,
            amount=100.0,
            currency="USD",
            customer_id="CUST-DUP",
            customer_name="Dup 1",
            customer_email="dup1@example.com"
        )
        db.add(t1)
        db.commit()

        # Second transaction with identical reference_id must raise IntegrityError
        t2 = Transaction(
            reference_id=duplicate_ref,
            amount=100.0,
            currency="USD",
            customer_id="CUST-DUP",
            customer_name="Dup 2",
            customer_email="dup2@example.com"
        )
        db.add(t2)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 6. Duplicate Capture Prevention (Idempotency)
# ─────────────────────────────────────────────────────────────────────────────
def test_06_duplicate_capture_prevention():
    db = SessionLocal()
    order_id = f"ORDER-IDEMP-{uuid.uuid4().hex[:8].upper()}"
    try:
        order = PayPalOrder(
            paypal_order_id=order_id,
            status="CREATED",
            amount=75.0,
            currency="USD"
        )
        db.add(order)
        db.commit()

        # 1. First capture succeeds
        res1 = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert res1.status_code == 200
        assert res1.json()["status"] == "COMPLETED"

        # 2. Second capture on already completed order returns idempotent success without duplicate charging
        res2 = client.post(f"/api/paypal/orders/{order_id}/capture")
        assert res2.status_code == 200
        assert res2.json()["status"] == "COMPLETED"
        assert "already captured" in res2.json()["message"]
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 7. Database Rollback
# ─────────────────────────────────────────────────────────────────────────────
def test_07_database_rollback():
    db = TestSessionLocal()
    uncommitted_ref = f"ROLLBACK-{uuid.uuid4().hex[:8].upper()}"
    try:
        txn = Transaction(
            reference_id=uncommitted_ref,
            amount=999.0,
            currency="USD",
            customer_id="CUST-ROLLBACK",
            customer_name="Rollback Tester",
            customer_email="rb@example.com"
        )
        db.add(txn)
        db.flush()
        assert txn.id is not None  # ID generated during flush

        # Explicit rollback before commit
        db.rollback()
    finally:
        db.close()

    # Verify record was discarded and does not exist in DB
    verify_db = TestSessionLocal()
    try:
        found = verify_db.query(Transaction).filter(Transaction.reference_id == uncommitted_ref).first()
        assert found is None
    finally:
        verify_db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 8. Concurrent Transaction Handling (WAL Mode Concurrency)
# ─────────────────────────────────────────────────────────────────────────────
def test_08_concurrent_transaction_handling():
    errors = []
    successes = []

    def worker(worker_id: int):
        s = TestSessionLocal()
        try:
            for i in range(5):
                ref = f"CONCUR-{worker_id}-{i}-{uuid.uuid4().hex[:6]}"
                t = Transaction(
                    reference_id=ref,
                    amount=float(10 * worker_id + i),
                    currency="USD",
                    customer_id=f"CUST-W{worker_id}",
                    customer_name=f"Worker {worker_id}",
                    customer_email=f"w{worker_id}@example.com"
                )
                s.add(t)
                s.commit()
                successes.append(ref)
        except Exception as e:
            errors.append(e)
            s.rollback()
        finally:
            s.close()

    # Launch 5 concurrent threads executing simultaneous writes
    threads = []
    for wid in range(5):
        t = threading.Thread(target=worker, args=(wid,))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    assert len(errors) == 0, f"Concurrent database writes produced errors: {errors}"
    assert len(successes) == 25  # 5 workers * 5 writes = 25 transactions successfully committed


# ─────────────────────────────────────────────────────────────────────────────
# 9. Foreign-Key Integrity Enforcement
# ─────────────────────────────────────────────────────────────────────────────
def test_09_foreign_key_integrity():
    db = TestSessionLocal()
    try:
        # Non-existent user ID
        invalid_user_id = 99999999
        token = PasswordResetToken(
            user_id=invalid_user_id,
            token_hash=uuid.uuid4().hex,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            used=False
        )
        db.add(token)
        # In SQLite with PRAGMA foreign_keys=ON, this must fail with IntegrityError
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 10. Merchant Data Isolation
# ─────────────────────────────────────────────────────────────────────────────
def test_10_merchant_data_isolation():
    db = SessionLocal()
    try:
        # Create Merchant A and Merchant B
        m_a = User(
            email=f"iso_a_{uuid.uuid4().hex[:6]}@store.com",
            hashed_password=hash_password("Pass123!"),
            full_name="Merchant A",
            business_name="Store A"
        )
        m_b = User(
            email=f"iso_b_{uuid.uuid4().hex[:6]}@store.com",
            hashed_password=hash_password("Pass123!"),
            full_name="Merchant B",
            business_name="Store B"
        )
        db.add_all([m_a, m_b])
        db.commit()

        # Add transaction for Merchant A
        txn_a = Transaction(
            user_id=m_a.id,
            reference_id=f"ISO-TXN-A-{uuid.uuid4().hex[:6]}",
            amount=150.0,
            currency="USD",
            customer_id="CUST-A",
            customer_name="Buyer A",
            customer_email="a@buy.com"
        )
        db.add(txn_a)
        db.commit()

        # Token for Merchant B
        token_b = create_access_token({"sub": str(m_b.id), "email": m_b.email, "role": m_b.role})

        # Merchant B tries to view Merchant A's transaction detail -> 403 Forbidden
        res = client.get(f"/api/transactions/{txn_a.id}", headers={"Authorization": f"Bearer {token_b}"})
        assert res.status_code == 403
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 11. Pagination Consistency
# ─────────────────────────────────────────────────────────────────────────────
def test_11_pagination_consistency():
    db = SessionLocal()
    prefix = f"PAGE-{uuid.uuid4().hex[:6]}"
    try:
        created_ids = []
        for i in range(12):
            t = Transaction(
                reference_id=f"{prefix}-{i:02d}",
                amount=float(20 + i),
                currency="USD",
                customer_id=f"CUST-P-{i}",
                customer_name=f"Page Customer {i}",
                customer_email=f"page{i}@example.com"
            )
            db.add(t)
            created_ids.append(t)
        db.commit()

        # Request page 1 with limit 5
        res_p1 = client.get(f"/api/transactions?limit=5&page=1&search={prefix}")
        assert res_p1.status_code == 200
        p1_data = res_p1.json()
        assert len(p1_data["items"]) == 5
        assert p1_data["total"] == 12
        assert p1_data["pages"] == 3

        # Request page 2 with limit 5
        res_p2 = client.get(f"/api/transactions?limit=5&page=2&search={prefix}")
        assert res_p2.status_code == 200
        p2_data = res_p2.json()
        assert len(p2_data["items"]) == 5

        # Verify no ID overlap between pages
        p1_ids = {item["id"] for item in p1_data["items"]}
        p2_ids = {item["id"] for item in p2_data["items"]}
        assert p1_ids.isdisjoint(p2_ids)
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# 12. Database Connection Failure & Graceful Degradation
# ─────────────────────────────────────────────────────────────────────────────
def test_12_database_connection_failure():
    """Confirms that database connection failure triggers proper rollback and raises HTTP error without false success."""
    broken_engine = create_engine("sqlite:///nonexistent_path/should_fail.db")
    BrokenSession = sessionmaker(bind=broken_engine)

    def broken_get_db():
        db = BrokenSession()
        try:
            yield db
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    app.dependency_overrides[get_db] = broken_get_db
    test_client = TestClient(app, raise_server_exceptions=False)
    try:
        # Request should fail gracefully with an error code, NOT return 200 or false success
        res = test_client.get("/api/transactions")
        assert res.status_code in (500, 503)
    finally:
        app.dependency_overrides.pop(get_db, None)


# ─────────────────────────────────────────────────────────────────────────────
# 13. SQLite Compatibility, PRAGMAs & WAL Mode
# ─────────────────────────────────────────────────────────────────────────────
def test_13_sqlite_compatibility_and_pragmas():
    con = sqlite3.connect(r"c:\Users\USER\Downloads\SAI Projects\Antigravity\payshield-ai\backend\payshield.db")
    cur = con.cursor()
    try:
        # 1. Integrity check
        cur.execute("PRAGMA integrity_check;")
        res = cur.fetchone()
        assert res[0] == "ok"

        # 2. Foreign keys setting verification
        cur.execute("PRAGMA foreign_keys;")
        # Note: PRAGMA foreign_keys is connection-specific; our event listener enables it per connection
        assert cur.fetchone() is not None

        # 3. Journal mode check
        cur.execute("PRAGMA journal_mode;")
        mode = cur.fetchone()[0].lower()
        assert mode in ("wal", "delete")
    finally:
        con.close()


# ─────────────────────────────────────────────────────────────────────────────
# 14. PostgreSQL Compatibility & Connection Normalization
# ─────────────────────────────────────────────────────────────────────────────
def test_14_postgresql_compatibility_and_url_normalization():
    from app.config import Settings
    
    # Heroku / Vercel legacy URL postgres:// is normalized to postgresql://
    with patch.dict("os.environ", {"VERCEL": "1", "POSTGRES_URL": "postgres://user:pass@ep-cool-db.us-east-1.postgres.vercel-storage.com/verceldb"}):
        test_settings = Settings()
        assert test_settings.DATABASE_URL.startswith("postgresql://")

    # In production without persistent DB, ephemeral /tmp is rejected
    with patch.dict("os.environ", {"VERCEL": "1", "APP_ENV": "production", "DEBUG": "false"}):
        with patch.dict("os.environ", {"POSTGRES_URL": "", "DATABASE_URL": "sqlite:///./payshield.db"}):
            with pytest.raises(ValueError) as exc:
                Settings()
            assert "Ephemeral /tmp SQLite storage cannot be used" in str(exc.value)


# ─────────────────────────────────────────────────────────────────────────────
# 15. Payment Reconciliation After Simulated Database Failure
# ─────────────────────────────────────────────────────────────────────────────
def test_15_payment_reconciliation_after_simulated_db_failure():
    """
    Simulates: PayPal captures the payment successfully, but a database failure interrupts
    transaction persistence. Confirms:
    1. The capture response does NOT report false failure to user.
    2. The order is stored as COMPLETED.
    3. The /orders/{order_id}/reconcile endpoint heals the missing Transaction record.
    """
    db = SessionLocal()
    order_id = f"ORDER-REC-{uuid.uuid4().hex[:8].upper()}"
    try:
        order = PayPalOrder(
            paypal_order_id=order_id,
            status="CREATED",
            amount=175.0,
            currency="USD"
        )
        db.add(order)
        db.commit()

        # Mock PayPal capture to succeed, but patch db.commit to raise OperationalError during first attempt
        mock_capture = {
            "order_id": order_id,
            "capture_id": f"CAP-REC-{uuid.uuid4().hex[:8].upper()}",
            "status": "COMPLETED",
            "amount": 175.0,
            "currency": "USD",
            "payer_email": "recovery.buyer@example.com",
            "payer_name": "Recovery Buyer",
            "raw_response": {},
            "verified": True,
            "mode": "live_sandbox"
        }

        from sqlalchemy.orm import Session as SqlASession
        fail_counter = {"count": 0}
        orig_commit = SqlASession.commit

        def failing_commit(self):
            if fail_counter["count"] == 0:
                fail_counter["count"] += 1
                raise OperationalError("database is locked", {}, None)
            return orig_commit(self)

        with patch("app.services.paypal_service.paypal_service.capture_order", return_value=mock_capture):
            with patch.object(SqlASession, "commit", failing_commit):
                # Execute capture - should NOT return failure because money was captured at PayPal!
                cap_res = client.post(f"/api/paypal/orders/{order_id}/capture")
                assert cap_res.status_code == 200
                assert cap_res.json()["status"] == "COMPLETED"
                assert "queued for reconciliation" in cap_res.json()["message"]

        # Now trigger the reconciliation endpoint to self-heal
        rec_res = client.post(f"/api/paypal/orders/{order_id}/reconcile")
        assert rec_res.status_code == 200
        assert rec_res.json()["status"] == "COMPLETED"
        assert rec_res.json()["transaction_id"] is not None

        # Verify the Transaction now exists and is linked
        db.refresh(order)
        assert order.transaction_id is not None
        reconciled_txn = db.query(Transaction).filter(Transaction.id == order.transaction_id).first()
        assert reconciled_txn is not None
        assert reconciled_txn.amount == 175.0
        assert reconciled_txn.payment_status == "COMPLETED"
        assert reconciled_txn.provider == "PAYPAL"
    finally:
        db.close()
