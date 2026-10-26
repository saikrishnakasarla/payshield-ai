from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
import hashlib
import hmac
import json
from typing import Dict, Any, Tuple, Optional
from app.database import Base
from app.config import settings

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(64), index=True, nullable=False)
    entity_type = Column(String(32), nullable=False) # TRANSACTION, PAYPAL_ORDER, SYSTEM
    entity_id = Column(String(64), nullable=False)
    details_json = Column(Text, nullable=True)
    performed_by = Column(String(64), default="system")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Cryptographic Tamper-Evidence
    previous_hash = Column(String(64), nullable=True)
    entry_hash = Column(String(64), nullable=True)
    signature = Column(String(64), nullable=True)

    @classmethod
    def compute_hash(
        cls,
        action: str,
        entity_type: str,
        entity_id: str,
        performed_by: str,
        details_str: str,
        timestamp_str: str,
        prev_hash: str
    ) -> str:
        payload = f"{action}|{entity_type}|{entity_id}|{performed_by}|{details_str}|{timestamp_str}|{prev_hash}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @classmethod
    def compute_signature(cls, entry_hash: str) -> str:
        key = settings.SECRET_KEY.encode("utf-8")
        return hmac.new(key, entry_hash.encode("utf-8"), hashlib.sha256).hexdigest()

def record_audit_event(
    db,
    action: str,
    entity_type: str,
    entity_id: str,
    performed_by: str,
    details: Any
) -> AuditLog:
    """
    Creates an immutable, cryptographically chained audit log entry.
    Each entry references the SHA-256 hash of the preceding entry.
    """
    last_entry = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_entry.entry_hash if last_entry and last_entry.entry_hash else GENESIS_HASH
    
    details_str = json.dumps(details) if not isinstance(details, str) else details
    now = datetime.utcnow()
    timestamp_str = now.isoformat()

    entry_hash = AuditLog.compute_hash(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        performed_by=performed_by,
        details_str=details_str,
        timestamp_str=timestamp_str,
        prev_hash=prev_hash
    )
    sig = AuditLog.compute_signature(entry_hash)

    log_entry = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        performed_by=performed_by,
        details_json=details_str,
        timestamp=now,
        previous_hash=prev_hash,
        entry_hash=entry_hash,
        signature=sig
    )
    db.add(log_entry)
    db.flush()
    return log_entry

def verify_audit_trail_integrity(db) -> Dict[str, Any]:
    """
    Cryptographically verifies the entire sequential audit log chain.
    Detects any unauthorized insertion, deletion, or tampering.
    """
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {
            "status": "VALID",
            "is_valid": True,
            "total_entries": 0,
            "message": "Audit log is empty."
        }

    expected_prev = GENESIS_HASH
    tampered_records = []

    for idx, entry in enumerate(logs):
        # 1. Verify previous hash chain pointer
        if entry.previous_hash != expected_prev:
            tampered_records.append({
                "id": entry.id,
                "action": entry.action,
                "reason": f"Broken chain pointer: expected previous hash {expected_prev[:12]}..., found {str(entry.previous_hash)[:12]}..."
            })

        # 2. Re-compute and verify hash
        timestamp_str = entry.timestamp.isoformat() if entry.timestamp else ""
        expected_hash = AuditLog.compute_hash(
            action=entry.action,
            entity_type=entry.entity_type,
            entity_id=entry.entity_id,
            performed_by=entry.performed_by,
            details_str=entry.details_json or "",
            timestamp_str=timestamp_str,
            prev_hash=entry.previous_hash or GENESIS_HASH
        )

        if entry.entry_hash and entry.entry_hash != expected_hash:
            tampered_records.append({
                "id": entry.id,
                "action": entry.action,
                "reason": "Payload hash mismatch (record was modified after creation)"
            })

        # 3. Verify HMAC signature
        if entry.entry_hash:
            expected_sig = AuditLog.compute_signature(entry.entry_hash)
            if entry.signature and entry.signature != expected_sig:
                tampered_records.append({
                    "id": entry.id,
                    "action": entry.action,
                    "reason": "Invalid cryptographic HMAC signature"
                })

        expected_prev = entry.entry_hash or expected_hash

    is_valid = len(tampered_records) == 0
    return {
        "status": "VERIFIED_SECURE" if is_valid else "CORRUPTED",
        "is_valid": is_valid,
        "total_entries": len(logs),
        "genesis_hash": GENESIS_HASH[:16] + "...",
        "head_hash": (logs[-1].entry_hash[:16] + "...") if logs and logs[-1].entry_hash else "None",
        "tampered_records": tampered_records,
        "verification_timestamp": datetime.utcnow().isoformat(),
        "algorithm": "SHA-256 Chaining + HMAC-SHA256"
    }
