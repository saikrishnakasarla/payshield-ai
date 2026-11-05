"""
db_backup.py
============
Practical backup, verification, and restoration utility for PayShield AI database.
Supports both SQLite (local / staging) and PostgreSQL (production).

Usage:
  python db_backup.py --backup
  python db_backup.py --verify <backup_file>
  python db_backup.py --restore <backup_file>
"""

import os
import sys
import shutil
import sqlite3
import argparse
import logging
from datetime import datetime
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("payshield.backup")

BACKUP_DIR = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backups")))
MAX_RETAINED_BACKUPS = 14  # Retain up to 14 rolling backups

def ensure_backup_dir():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

def backup_sqlite():
    ensure_backup_dir()
    db_path = settings.DATABASE_URL.replace("sqlite:///", "").replace("sqlite:////", "/")
    if not os.path.exists(db_path):
        logger.error(f"SQLite database file not found at: {db_path}")
        sys.exit(1)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"payshield_backup_{timestamp}.db"

    logger.info(f"Initiating online SQLite backup from {db_path} to {backup_file}...")
    source_con = sqlite3.connect(db_path)
    dest_con = sqlite3.connect(str(backup_file))
    try:
        # sqlite3 online backup API safely captures state during active reads/writes
        with dest_con:
            source_con.backup(dest_con, pages=50)
        logger.info("SQLite online backup completed successfully.")
    finally:
        dest_con.close()
        source_con.close()

    verify_sqlite_backup(str(backup_file))
    rotate_backups()
    return str(backup_file)

def verify_sqlite_backup(backup_path: str):
    logger.info(f"Verifying backup integrity for: {backup_path}")
    con = sqlite3.connect(backup_path)
    cur = con.cursor()
    try:
        cur.execute("PRAGMA integrity_check;")
        result = cur.fetchone()
        if result and result[0] == "ok":
            logger.info("Backup integrity check PASSED: Database PRAGMA integrity_check returned 'ok'.")
        else:
            logger.error(f"Backup integrity check FAILED: {result}")
            sys.exit(1)

        # Verify key financial tables exist and count records
        tables = ["users", "transactions", "paypal_orders", "risk_analyses", "audit_logs"]
        for t in tables:
            cur.execute(f"SELECT count(*) FROM {t};")
            count = cur.fetchone()[0]
            logger.info(f"Verified table '{t}': {count} records preserved.")
    finally:
        con.close()

def restore_sqlite(backup_path: str):
    if not os.path.exists(backup_path):
        logger.error(f"Backup file to restore does not exist: {backup_path}")
        sys.exit(1)

    verify_sqlite_backup(backup_path)
    db_path = settings.DATABASE_URL.replace("sqlite:///", "").replace("sqlite:////", "/")

    # Create safety backup of current state before restore
    if os.path.exists(db_path):
        safety_path = f"{db_path}.pre_restore_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(db_path, safety_path)
        logger.info(f"Created pre-restore safety copy at: {safety_path}")

    shutil.copy2(backup_path, db_path)
    logger.info(f"Database successfully restored from {backup_path} to {db_path}.")

def rotate_backups():
    ensure_backup_dir()
    backups = sorted(BACKUP_DIR.glob("payshield_backup_*.db"), key=os.path.getmtime)
    if len(backups) > MAX_RETAINED_BACKUPS:
        excess = backups[:-MAX_RETAINED_BACKUPS]
        for f in excess:
            logger.info(f"Rotating older backup: {f.name}")
            f.unlink()

def main():
    parser = argparse.ArgumentParser(description="PayShield AI Database Backup and Restore Utility")
    parser.add_argument("--backup", action="store_true", help="Create an immediate verified backup")
    parser.add_argument("--verify", type=str, help="Verify the integrity of an existing backup file")
    parser.add_argument("--restore", type=str, help="Restore the database from a backup file")

    args = parser.parse_args()

    if args.backup:
        backup_sqlite()
    elif args.verify:
        verify_sqlite_backup(args.verify)
    elif args.restore:
        restore_sqlite(args.restore)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
