import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_user_registration_and_login():
    client = TestClient(app)
    uid = uuid.uuid4().hex[:8]
    email = f"merchant.{uid}@example.com"
    password = "StrongPassword123!"

    # 1. Register - must NOT issue token or authenticate session
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Secure Merchant",
            "business_name": "Secure Merchant LLC"
        }
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" not in reg_data
    assert "message" in reg_data
    assert reg_data["user"]["email"] == email
    assert reg_data["user"]["full_name"] == "Secure Merchant"

    # Verify registration does NOT authenticate client session
    pre_login_me = client.get("/api/auth/me")
    assert pre_login_me.status_code == 401

    # 2. Reject duplicate email
    dup_res = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Another Merchant",
            "business_name": "Duplicate LLC"
        }
    )
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"].lower()

    # 3. Login with bad password
    bad_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPassword123!"}
    )
    assert bad_login.status_code == 401

    # 4. Login with correct password
    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert token is not None

    # 5. Access /api/auth/me with explicit header
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 6. /api/auth/me without token or cookie fails
    anon_client = TestClient(app)
    anon_me = anon_client.get("/api/auth/me")
    assert anon_me.status_code == 401

def test_password_reset_flow():
    client = TestClient(app)
    uid = uuid.uuid4().hex[:8]
    email = f"reset.{uid}@example.com"
    init_pass = "InitialPassword123!"
    new_pass = "UpdatedPassword456!"

    # Register
    client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": init_pass,
            "full_name": "Reset Tester",
            "business_name": "Reset Testing Co"
        }
    )

    # Request reset token
    forgot_res = client.post(
        "/api/auth/forgot-password",
        json={"email": email}
    )
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json().get("reset_token")
    assert reset_token is not None

    # Reset password with valid token
    reset_res = client.post(
        "/api/auth/reset-password",
        json={"token": reset_token, "new_password": new_pass}
    )
    assert reset_res.status_code == 200

    # Old password no longer works
    old_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": init_pass}
    )
    assert old_login.status_code == 401

    # New password works
    new_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": new_pass}
    )
    assert new_login.status_code == 200

def test_protected_admin_endpoints():
    anon_client = TestClient(app)
    # 1. Unauthenticated threshold update rejected
    anon_threshold = anon_client.post(
        "/api/settings/thresholds",
        json={"baseline_multiplier": 4.0, "velocity_window_minutes": 15, "medium_risk_score": 35, "high_risk_score": 70}
    )
    assert anon_threshold.status_code == 401

    # 2. Unauthenticated demo reset rejected
    anon_reset = anon_client.post("/api/demo/reset")
    assert anon_reset.status_code == 401

    # 3. Authenticated user can access
    auth_client = TestClient(app)
    uid = uuid.uuid4().hex[:8]
    admin_email = f"admin.{uid}@example.com"
    admin_pass = "PasswordAdmin123!"
    reg = auth_client.post(
        "/api/auth/register",
        json={
            "email": admin_email,
            "password": admin_pass,
            "full_name": "Admin Tester",
            "business_name": "Admin Org"
        }
    )
    assert reg.status_code == 201
    assert "access_token" not in reg.json()

    # Manual login required to authenticate
    login_res = auth_client.post("/api/auth/login", json={"email": admin_email, "password": admin_pass})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    auth_threshold = auth_client.post(
        "/api/settings/thresholds",
        headers=headers,
        json={"baseline_multiplier": 3.5, "velocity_window_minutes": 12, "medium_risk_score": 35, "high_risk_score": 70}
    )
    assert auth_threshold.status_code == 200
    assert auth_threshold.json()["status"] == "success"

def test_invalid_or_expired_jwt_rejected():
    import jwt
    from datetime import datetime, timedelta, timezone
    from app.config import settings

    client = TestClient(app)

    # 1. Malformed token
    res_malformed = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer not.a.valid.jwt.token"}
    )
    assert res_malformed.status_code == 401

    # 2. Expired token
    expired_payload = {
        "sub": "user@example.com",
        "exp": datetime.now(timezone.utc) - timedelta(hours=2)
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm="HS256")
    res_expired = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res_expired.status_code == 401

def test_rate_limiting_auth_endpoint():
    from app.services.rate_limiter import limiter
    limiter.reset()

    client = TestClient(app)
    hit_limit = False
    try:
        # The limit is 15 requests per minute
        for i in range(20):
            res = client.post(
                "/api/auth/login",
                json={"email": f"ratelimit_test_{i}@example.com", "password": "WrongPassword123!"}
            )
            if res.status_code == 429:
                hit_limit = True
                assert "Too many" in res.json().get("detail", "")
                break

        assert hit_limit is True, "Rate limiter did not trigger 429 within 20 rapid requests."
    finally:
        limiter.reset()

def test_cross_user_data_isolation():
    from app.config import settings
    original_mock = settings.PAYPAL_MOCK_SIMULATOR
    settings.PAYPAL_MOCK_SIMULATOR = True

    try:
        client_a = TestClient(app)
        uid_a = uuid.uuid4().hex[:8]
        email_a = f"owner_a_{uid_a}@example.com"
        pass_a = "PasswordA123!"
        reg_a = client_a.post(
            "/api/auth/register",
            json={"email": email_a, "password": pass_a, "full_name": "Merchant A"}
        )
        assert reg_a.status_code == 201
        assert "access_token" not in reg_a.json()

        # Login to obtain token
        login_a = client_a.post("/api/auth/login", json={"email": email_a, "password": pass_a})
        assert login_a.status_code == 200
        token_a = login_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Merchant A creates an order
        order_res = client_a.post(
            "/api/paypal/orders",
            headers=headers_a,
            json={"amount": 49.99, "currency": "USD", "item_name": "Private Merchant A Service"}
        )
        assert order_res.status_code == 200
        order_id = order_res.json()["paypal_order_id"]

        # Merchant A can retrieve their order
        get_res_a = client_a.get(f"/api/paypal/orders/{order_id}", headers=headers_a)
        assert get_res_a.status_code == 200
        assert get_res_a.json()["paypal_order_id"] == order_id

        # Merchant B registers
        client_b = TestClient(app)
        uid_b = uuid.uuid4().hex[:8]
        email_b = f"intruder_b_{uid_b}@example.com"
        pass_b = "PasswordB123!"
        reg_b = client_b.post(
            "/api/auth/register",
            json={"email": email_b, "password": pass_b, "full_name": "Merchant B"}
        )
        assert reg_b.status_code == 201
        assert "access_token" not in reg_b.json()

        # Login to obtain token
        login_b = client_b.post("/api/auth/login", json={"email": email_b, "password": pass_b})
        assert login_b.status_code == 200
        token_b = login_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Merchant B tries to retrieve Merchant A's order -> must be 403 Forbidden
        get_res_b = client_b.get(f"/api/paypal/orders/{order_id}", headers=headers_b)
        assert get_res_b.status_code == 403
        assert "permission" in get_res_b.json().get("detail", "").lower()
    finally:
        settings.PAYPAL_MOCK_SIMULATOR = original_mock

def test_registration_validation_rules():
    client = TestClient(app)

    # 1. Reject short password (< 8 chars)
    short_pw = client.post(
        "/api/auth/register",
        json={"email": "short@example.com", "password": "123", "full_name": "Short Pass"}
    )
    assert short_pw.status_code == 422

    # 2. Reject invalid email
    bad_email = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "ValidPassword123!", "full_name": "Bad Email"}
    )
    assert bad_email.status_code == 422

    # 3. Reject missing full name
    no_name = client.post(
        "/api/auth/register",
        json={"email": "noname@example.com", "password": "ValidPassword123!", "full_name": ""}
    )
    assert no_name.status_code == 422


