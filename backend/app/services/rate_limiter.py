import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    def __init__(self):
        # Maps bucket_key -> list of timestamp floats
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        
        # Filter timestamps within current sliding window
        valid_timestamps = [ts for ts in self._history[key] if ts > cutoff]
        self._history[key] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            return False

        self._history[key].append(now)
        return True

    def reset(self):
        self._history.clear()

limiter = InMemoryRateLimiter()

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def rate_limit_auth_actions(request: Request):
    """
    Limits authentication requests (login, registration) to 15 per minute per IP.
    """
    ip = get_client_ip(request)
    key = f"auth:{ip}"
    if not limiter.is_allowed(key, max_requests=15, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please wait 60 seconds before trying again."
        )

def rate_limit_password_reset(request: Request):
    """
    Limits password reset requests to 5 per 5 minutes per IP to prevent spam/abuse.
    """
    ip = get_client_ip(request)
    key = f"reset:{ip}"
    if not limiter.is_allowed(key, max_requests=5, window_seconds=300):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please wait 5 minutes before trying again."
        )
