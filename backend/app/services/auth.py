import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Set

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User, PasswordResetToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# In-memory revocation cache for logged-out / revoked tokens
_revoked_tokens: Set[str] = set()


def revoke_token(token: str) -> None:
    """Revokes a JWT token so it can no longer be used for authenticated access."""
    if token:
        clean = token.replace("Bearer ", "").strip()
        if clean:
            h = hashlib.sha256(clean.encode("utf-8")).hexdigest()
            _revoked_tokens.add(h)


def is_token_revoked(token: str) -> bool:
    """Checks whether a token has been revoked / logged out."""
    if not token:
        return False
    clean = token.replace("Bearer ", "").strip()
    if not clean:
        return False
    h = hashlib.sha256(clean.encode("utf-8")).hexdigest()
    return h in _revoked_tokens


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decodes and verifies a JWT token against SECRET_KEY.
    Raises jwt.PyJWTError on expiration, signature mismatch, or malformed data.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # Allow token from Authorization header or 'access_token' cookie
    auth_token = token
    if not auth_token:
        cookie_token = request.cookies.get("access_token")
        if cookie_token:
            auth_token = cookie_token[7:] if cookie_token.startswith("Bearer ") else cookie_token

    if not auth_token or not auth_token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_token = auth_token.strip()

    # Reject revoked tokens (post-logout access)
    if is_token_revoked(auth_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked or session has been terminated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(auth_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.InvalidSignatureError, jwt.DecodeError, jwt.PyJWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature or malformed token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Resolves authenticated user if credentials are supplied.
    If NO credentials (no Authorization header, no cookie, no parameter token) are provided,
    returns None for anonymous public access.
    If credentials ARE provided but invalid, expired, revoked, or malformed,
    strictly raises HTTPException(401) to prevent authentication bypass.
    """
    auth_header = request.headers.get("authorization")
    has_auth_header = bool(auth_header and auth_header.strip())
    has_cookie = "access_token" in request.cookies
    has_param_token = bool(token and token.strip())

    if not has_auth_header and not has_cookie and not has_param_token:
        return None

    # Credentials WERE supplied -> validate strictly; do NOT swallow authentication errors!
    return await get_current_user(request=request, token=token, db=db)
