import pytest
import json
from app.database import SessionLocal, Base, engine
from app.models.audit_log import AuditLog, record_audit_event, verify_audit_trail_integrity

def test_audit_log_cryptographic_chaining():
    db = SessionLocal()
    try:
        # Create test entries
        e1 = record_audit_event(db, "TEST_ACTION_1", "TRANSACTION", "TXN-TEST-1", "tester", {"test": 1})
        db.commit()

        e2 = record_audit_event(db, "TEST_ACTION_2", "TRANSACTION", "TXN-TEST-2", "tester", {"test": 2})
        db.commit()

        assert e2.previous_hash == e1.entry_hash
        assert e1.signature is not None
        assert e2.signature is not None

        # Verify integrity
        integrity = verify_audit_trail_integrity(db)
        assert integrity["is_valid"] is True
        assert len(integrity["tampered_records"]) == 0
    finally:
        db.close()

def test_audit_log_detects_tampering():
    db = SessionLocal()
    try:
        e1 = record_audit_event(db, "TEST_ACTION_TAMPER", "TRANSACTION", "TXN-TAMPER", "tester", {"original": True})
        db.commit()

        # Maliciously alter payload directly in database
        original_details = e1.details_json
        e1.details_json = json.dumps({"tampered": True})
        db.commit()

        # Integrity verification must catch tampering
        integrity = verify_audit_trail_integrity(db)
        assert integrity["is_valid"] is False
        assert len(integrity["tampered_records"]) > 0

        # Repair
        e1.details_json = original_details
        db.commit()
    finally:
        db.close()
