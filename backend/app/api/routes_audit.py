from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

from app.database import get_db
from app.models.audit_log import AuditLog, verify_audit_trail_integrity, record_audit_event, GENESIS_HASH
from app.models.user import User
from app.services.auth import get_optional_current_user

router = APIRouter(prefix="/api/audit", tags=["Security & Audit"])

@router.get("/verify", response_model=Dict[str, Any])
def run_audit_integrity_verification(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Cryptographically verifies the SHA-256 hash chaining and HMAC-SHA256 signatures
    of all stored audit log events from the genesis record to the current head.
    Proves that records are immutable and tamper-resistant.
    """
    result = verify_audit_trail_integrity(db)
    return result

@router.get("/logs", response_model=Dict[str, Any])
def list_audit_logs(
    limit: int = Query(25, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns recent cryptographically signed audit trail logs with entry hashes and signatures.
    """
    total = db.query(AuditLog).count()
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    
    entries = []
    for l in logs:
        entries.append({
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "performed_by": l.performed_by,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "details": l.details_json,
            "previous_hash": (l.previous_hash[:16] + "...") if l.previous_hash else "None",
            "entry_hash": (l.entry_hash[:16] + "...") if l.entry_hash else "None",
            "signature": (l.signature[:16] + "...") if l.signature else "None"
        })

    return {
        "total": total,
        "returned": len(entries),
        "entries": entries,
        "is_chained": True,
        "hash_algorithm": "SHA-256 + HMAC-SHA256"
    }

@router.post("/tamper-test", response_model=Dict[str, Any])
def simulate_audit_tampering_demonstration(
    db: Session = Depends(get_db)
):
    """
    Security Demonstration Endpoint:
    Simulates an unauthorized database attacker attempting to modify a historic merchant review decision.
    Demonstrates how PayShield AI's cryptographic chaining immediately detects payload modification.
    Automatically self-repairs after demonstration.
    """
    latest = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    if not latest:
        # Create a test log
        record_audit_event(db, "SECURITY_PROBE", "SYSTEM", "SYS-001", "sec_tester", {"probe": "initial"})
        db.commit()
        latest = db.query(AuditLog).order_by(AuditLog.id.desc()).first()

    original_details = latest.details_json

    # 1. Simulate malicious database tamper
    latest.details_json = json.dumps({"unauthorized_tamper": True, "altered_by": "malicious_actor"})
    db.commit()

    # 2. Run verification to demonstrate detection
    tampered_verification = verify_audit_trail_integrity(db)

    # 3. Restore original content
    latest.details_json = original_details
    db.commit()

    # 4. Re-verify clean state
    clean_verification = verify_audit_trail_integrity(db)

    return {
        "demonstration": "Tamper-Evident Audit Proof",
        "description": "Artificially injected unauthorized payload modification into audit record to prove cryptographic detection.",
        "tamper_detected": not tampered_verification["is_valid"],
        "tamper_evidence": tampered_verification.get("tampered_records", []),
        "self_repair_status": "RESTORED_AND_CLEAN",
        "post_repair_integrity": clean_verification["status"]
    }
