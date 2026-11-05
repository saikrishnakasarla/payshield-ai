"""
test_auth_hardening_and_isolation.py
====================================
Comprehensive verification suite for Task 3:
1. Valid login.
2. Invalid password.
3. Nonexistent account.
4. Expired JWT.
5. Invalid JWT signature.
6. Missing authentication.
7. Registration without auto-login.
8. Merchant A accessing Merchant B's transaction.
9. Merchant A accessing Merchant B's order.
10. Merchant A accessing Merchant B's risk analysis.
11. Unauthorized settings modification.
12. Unauthorized CSV export.
13. Access after logout.
"""

import uuid
import json
import pytest
import jwt
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.models.paypal_order import PayPalOrder
from app.services.auth import hash_password, create_access_token, revoke_token, _revoked_tokens


client = TestClient(app)


@pytest.fixture
def auth_merchants():
    """Sets up two isolated test merchants and generates their access tokens."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:8]

        user_a = User(
            email=f"merchant_a_{suffix}@testcorp.com",
            hashed_password=hash_password("PasswordA123!"),
            full_name="Merchant Alpha",
            business_name="Alpha Corp",
            role="merchant",
            is_active=True
        )
        user_b = User(
            email=f"merchant_b_{suffix}@testcorp.com",
            hashed_password=hash_password("PasswordB123!"),
            full_name="Merchant Beta",
            business_name="Beta Corp",
            role="merchant",
            is_active=True
        )
        user_viewer = User(
            email=f"viewer_{suffix}@testcorp.com",
            hashed_password=hash_password("ViewerPass123!"),
            full_name="Guest Viewer",
            business_name="Audit Viewers Inc",
            role="viewer",
            is_active=True
        )

        db.add_all([user_a, user_b, user_viewer])
        db.commit()
        db.refresh(user_a)
        db.refresh(user_b)
        db.refresh(user_viewer)

        token_a = create_access_token({"sub": str(user_a.id), "email": user_a.email, "role": user_a.role})
        token_b = create_access_token({"sub": str(user_b.id), "email": user_b.email, "role": user_b.role})
        token_viewer = create_access_token({"sub": str(user_viewer.id), "email": user_viewer.email, "role": user_viewer.role})

        return {
            "merchant_a": user_a,
            "merchant_b": user_b,
            "viewer": user_viewer,
            "token_a": token_a,
            "token_b": token_b,
            "token_viewer": token_viewer,
            "headers_a": {"Authorization": f"Bearer {token_a}"},
            "headers_b": {"Authorization": f"Bearer {token_b}"},
            "headers_viewer": {"Authorization": f"Bearer {token_viewer}"}
        }
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 1: Valid Login
# ─────────────────────────────────────────────────────────────────────────────
def test_01_valid_login():
    """Valid login returns 200, JWT access token, and user profile."""
    uid = uuid.uuid4().hex[:8]
    email = f"valid_login_{uid}@example.com"
    password = "StrongSecurePassword123!"

    reg_res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "Valid Tester"}
    )
    assert reg_res.status_code == 201

    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"].lower() == "bearer"
    assert data["user"]["email"] == email


# ─────────────────────────────────────────────────────────────────────────────
# TEST 2: Invalid Password
# ─────────────────────────────────────────────────────────────────────────────
def test_02_invalid_password():
    """Invalid password returns generic 401 error."""
    uid = uuid.uuid4().hex[:8]
    email = f"pwd_test_{uid}@example.com"
    password = "CorrectPassword123!"

    client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "Password Tester"}
    )

    bad_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "CompletelyWrongPassword!"}
    )
    assert bad_login.status_code == 401
    assert "Invalid email or password" in bad_login.json()["detail"]


# ─────────────────────────────────────────────────────────────────────────────
# TEST 3: Nonexistent Account
# ─────────────────────────────────────────────────────────────────────────────
def test_03_nonexistent_account():
    """Nonexistent account returns identical 401 without user enumeration."""
    ghost_email = f"ghost_{uuid.uuid4().hex[:12]}@nonexistentdomain.org"

    res = client.post(
        "/api/auth/login",
        json={"email": ghost_email, "password": "SomePassword123!"}
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


# ─────────────────────────────────────────────────────────────────────────────
# TEST 4: Expired JWT
# ─────────────────────────────────────────────────────────────────────────────
def test_04_expired_jwt(auth_merchants):
    """Expired JWT is rejected with 401 on strict and optional auth endpoints."""
    expired_payload = {
        "sub": str(auth_merchants["merchant_a"].id),
        "email": auth_merchants["merchant_a"].email,
        "exp": datetime.now(timezone.utc) - timedelta(hours=2)
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm="HS256")
    expired_headers = {"Authorization": f"Bearer {expired_token}"}

    # Strict auth endpoint
    res_strict = client.get("/api/auth/me", headers=expired_headers)
    assert res_strict.status_code == 401
    assert "expired" in res_strict.json()["detail"].lower()

    # Optional auth endpoint MUST NOT fallback to anonymous when invalid credentials are provided
    res_optional = client.get("/api/transactions", headers=expired_headers)
    assert res_optional.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# TEST 5: Invalid JWT Signature
# ─────────────────────────────────────────────────────────────────────────────
def test_05_invalid_jwt_signature(auth_merchants):
    """Forged or tampered JWT signature is rejected with 401."""
    tampered_payload = {
        "sub": str(auth_merchants["merchant_a"].id),
        "email": auth_merchants["merchant_a"].email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=2)
    }
    # Encoded with wrong secret key
    forged_token = jwt.encode(tampered_payload, "completely-wrong-fake-secret-key-123", algorithm="HS256")
    forged_headers = {"Authorization": f"Bearer {forged_token}"}

    res_strict = client.get("/api/auth/me", headers=forged_headers)
    assert res_strict.status_code == 401

    # Optional auth endpoint must reject rather than silently fall back to anonymous
    res_optional = client.get("/api/transactions", headers=forged_headers)
    assert res_optional.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# TEST 6: Missing Authentication
# ─────────────────────────────────────────────────────────────────────────────
def test_06_missing_authentication():
    """Protected endpoints reject requests without authentication headers or cookies with 401."""
    anon_client = TestClient(app)

    res_me = anon_client.get("/api/auth/me")
    assert res_me.status_code == 401

    res_thresholds = anon_client.post(
        "/api/settings/thresholds",
        json={"baseline_multiplier": 3.0, "velocity_window_minutes": 10, "medium_risk_score": 35, "high_risk_score": 70}
    )
    assert res_thresholds.status_code == 401

    res_reset = anon_client.post("/api/demo/reset")
    assert res_reset.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# TEST 7: Registration Without Auto-Login
# ─────────────────────────────────────────────────────────────────────────────
def test_07_registration_without_auto_login():
    """Registration creates account but does NOT authenticate session or issue tokens."""
    uid = uuid.uuid4().hex[:8]
    email = f"no_autologin_{uid}@example.com"
    password = "ManualLoginRequired123!"

    reg_client = TestClient(app)
    res = reg_client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "No Auto Login Tester"}
    )
    assert res.status_code == 201
    data = res.json()

    # Must NOT contain access token
    assert "access_token" not in data
    assert "token" not in data

    # Must NOT have set an authentication cookie
    assert "access_token" not in reg_client.cookies

    # Immediate access to protected route must fail with 401
    me_res = reg_client.get("/api/auth/me")
    assert me_res.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# TEST 8: Merchant A Accessing Merchant B's Transaction
# ─────────────────────────────────────────────────────────────────────────────
def test_08_merchant_a_accessing_merchant_b_transaction(auth_merchants):
    """Merchant A cannot read, review, or analyze Merchant B's transactions (403 Forbidden)."""
    db = SessionLocal()
    try:
        # Create private transaction belonging to Merchant B
        ref_id = f"TX-B-{uuid.uuid4().hex[:6].upper()}"
        txn_b = Transaction(
            user_id=auth_merchants["merchant_b"].id,
            reference_id=ref_id,
            timestamp=datetime.utcnow(),
            amount=350.00,
            currency="USD",
            payment_status="COMPLETED",
            customer_id="CUST-B-99",
            customer_name="Beta Customer",
            customer_email="beta.buyer@example.com",
            customer_baseline_amount=100.0,
            risk_score=25,
            risk_level="LOW",
            source="PAYPAL_SANDBOX",
            is_synthetic=False
        )
        db.add(txn_b)
        db.commit()
        db.refresh(txn_b)
        txn_b_id = txn_b.id

        # Merchant A attempts to inspect Merchant B's transaction
        get_res = client.get(f"/api/transactions/{txn_b_id}", headers=auth_merchants["headers_a"])
        assert get_res.status_code == 403
        assert "permission" in get_res.json()["detail"].lower()

        # Merchant A attempts to review Merchant B's transaction
        review_res = client.post(
            f"/api/transactions/{txn_b_id}/review",
            headers=auth_merchants["headers_a"],
            json={"review_status": "REVIEWED_SAFE", "notes": "Unauthorized review attempt"}
        )
        assert review_res.status_code == 403

        # Merchant A attempts to re-analyze Merchant B's transaction
        analyze_res = client.post(
            f"/api/transactions/{txn_b_id}/analyze",
            headers=auth_merchants["headers_a"]
        )
        assert analyze_res.status_code == 403
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 9: Merchant A Accessing Merchant B's Order
# ─────────────────────────────────────────────────────────────────────────────
def test_09_merchant_a_accessing_merchant_b_order(auth_merchants):
    """Merchant A cannot read or capture Merchant B's PayPal orders (403 Forbidden)."""
    db = SessionLocal()
    try:
        order_id = f"ORDER-B-{uuid.uuid4().hex[:10].upper()}"
        order_b = PayPalOrder(
            user_id=auth_merchants["merchant_b"].id,
            paypal_order_id=order_id,
            status="CREATED",
            amount=175.00,
            currency="USD"
        )
        db.add(order_b)
        db.commit()

        # Merchant A tries to read Merchant B's order
        get_res = client.get(f"/api/paypal/orders/{order_id}", headers=auth_merchants["headers_a"])
        assert get_res.status_code == 403
        assert "permission" in get_res.json()["detail"].lower()

        # Merchant A tries to capture Merchant B's order
        cap_res = client.post(f"/api/paypal/orders/{order_id}/capture", headers=auth_merchants["headers_a"])
        assert cap_res.status_code == 403
        assert "another merchant" in cap_res.json()["detail"].lower()
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 10: Merchant A Accessing Merchant B's Risk Analysis
# ─────────────────────────────────────────────────────────────────────────────
def test_10_merchant_a_accessing_merchant_b_risk_analysis(auth_merchants):
    """Merchant A cannot view Merchant B's risk analyses directly (403 Forbidden)."""
    db = SessionLocal()
    try:
        # Create private transaction and analysis for Merchant B
        txn_b = Transaction(
            user_id=auth_merchants["merchant_b"].id,
            reference_id=f"TX-ANALYSIS-{uuid.uuid4().hex[:6].upper()}",
            timestamp=datetime.utcnow(),
            amount=89.00,
            currency="USD",
            payment_status="COMPLETED",
            customer_id="CUST-ANALYZE-B",
            customer_name="Beta Analyze Buyer",
            customer_email="beta.analyze@example.com",
            customer_baseline_amount=100.0,
            risk_score=40,
            risk_level="MEDIUM",
            source="PAYPAL_SANDBOX",
            is_synthetic=False
        )
        db.add(txn_b)
        db.flush()

        analysis_b = RiskAnalysis(
            transaction_id=txn_b.id,
            deterministic_score=40,
            risk_level="MEDIUM",
            triggered_rules_json=json.dumps([{"rule_id": "RULE_GEO_IP", "score_points": 20}]),
            ai_summary="Merchant B confidential risk assessment."
        )
        db.add(analysis_b)
        db.commit()
        db.refresh(analysis_b)

        # Merchant A attempts to access risk analysis via transaction route
        res_txn_analysis = client.get(
            f"/api/transactions/{txn_b.id}/analysis",
            headers=auth_merchants["headers_a"]
        )
        assert res_txn_analysis.status_code == 403

        # Merchant A attempts to access risk analysis via direct ID route
        res_direct_analysis = client.get(
            f"/api/transactions/risk-analysis/{analysis_b.id}",
            headers=auth_merchants["headers_a"]
        )
        assert res_direct_analysis.status_code == 403
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 11: Unauthorized Settings Modification
# ─────────────────────────────────────────────────────────────────────────────
def test_11_unauthorized_settings_modification(auth_merchants):
    """Users with unauthorized roles (e.g. viewer) cannot modify settings (403 Forbidden)."""
    # Viewer tries to modify thresholds
    res_thresh = client.post(
        "/api/settings/thresholds",
        headers=auth_merchants["headers_viewer"],
        json={"baseline_multiplier": 4.5, "velocity_window_minutes": 20, "medium_risk_score": 40, "high_risk_score": 80}
    )
    assert res_thresh.status_code == 403
    assert "merchants and administrators" in res_thresh.json()["detail"].lower()

    # Viewer tries to reset demo database
    res_reset = client.post(
        "/api/demo/reset",
        headers=auth_merchants["headers_viewer"]
    )
    assert res_reset.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# TEST 12: Unauthorized CSV Export
# ─────────────────────────────────────────────────────────────────────────────
def test_12_unauthorized_csv_export(auth_merchants):
    """Cross-merchant CSV export attempts and unauthenticated IDOR exports are rejected."""
    # 1. Unauthenticated IDOR export attempt with merchant_id parameter
    anon_idor = client.get(f"/api/insights/export-csv?merchant_id={auth_merchants['merchant_b'].id}")
    assert anon_idor.status_code in (401, 403)

    # 2. Merchant A attempting to export Merchant B's CSV via merchant_id query parameter
    cross_export = client.get(
        f"/api/insights/export-csv?merchant_id={auth_merchants['merchant_b'].id}",
        headers=auth_merchants["headers_a"]
    )
    assert cross_export.status_code == 403
    assert "another merchant" in cross_export.json()["detail"].lower()

    # 3. Export with an expired token is rejected with 401
    expired_token = jwt.encode(
        {"sub": str(auth_merchants["merchant_a"].id), "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    expired_export = client.get("/api/insights/export-csv", headers={"Authorization": f"Bearer {expired_token}"})
    assert expired_export.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# TEST 13: Access After Logout
# ─────────────────────────────────────────────────────────────────────────────
def test_13_access_after_logout():
    """Logged-out tokens are immediately revoked; subsequent requests return 401."""
    uid = uuid.uuid4().hex[:8]
    email = f"logout_test_{uid}@example.com"
    password = "LogoutPassword123!"

    # Register and login
    client.post("/api/auth/register", json={"email": email, "password": password, "full_name": "Logout Tester"})
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Access before logout succeeds
    me_before = client.get("/api/auth/me", headers=headers)
    assert me_before.status_code == 200

    # 2. Logout using the token
    logout_res = client.post("/api/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # 3. Access after logout fails with 401 on strict auth
    me_after = client.get("/api/auth/me", headers=headers)
    assert me_after.status_code == 401
    assert "revoked" in me_after.json()["detail"].lower()

    # 4. Access after logout on optional auth endpoint also fails with 401 (no silent fallback)
    optional_after = client.get("/api/transactions", headers=headers)
    assert optional_after.status_code == 401
