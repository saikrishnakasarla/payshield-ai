import time
import json
import uuid
import re
import logging
from contextvars import ContextVar
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.services.metrics import metrics

# Context variable for request correlation across asynchronous calls and logger formatters
correlation_id_ctx: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)

def get_correlation_id() -> Optional[str]:
    return correlation_id_ctx.get()

# Sensitive data redaction regexes
REDACT_PATTERNS = [
    (re.compile(r'(?i)(bearer\s+)[A-Za-z0-9\-_\.]+', re.IGNORECASE), r'\1[REDACTED_TOKEN]'),
    (re.compile(r'(?i)("password"\s*:\s*)"[^"]+"'), r'\1"[REDACTED_PASSWORD]"'),
    (re.compile(r'(?i)("client_secret"\s*:\s*)"[^"]+"'), r'\1"[REDACTED_SECRET]"'),
    (re.compile(r'(?i)("api_key"\s*:\s*)"[^"]+"'), r'\1"[REDACTED_KEY]"'),
    (re.compile(r'(?i)("secret_key"\s*:\s*)"[^"]+"'), r'\1"[REDACTED_KEY]"'),
    (re.compile(r'\b(?:\d[ -]*?){13,16}\b'), r'[REDACTED_CARD_NUMBER]'),
]

def sanitize_log_message(msg: str) -> str:
    """Masks authorization tokens, passwords, card numbers, and API secrets from log text."""
    if not isinstance(msg, str):
        return msg
    sanitized = msg
    for pattern, replacement in REDACT_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    return sanitized

class LogSanitizationFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = sanitize_log_message(record.msg)
        record.request_id = get_correlation_id() or "-"
        return True

logger = logging.getLogger("payshield.access")

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract or generate X-Request-ID
        request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        correlation_id_ctx.set(request_id)
        request.state.request_id = request_id

        start_time = time.perf_counter()
        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            metrics.record_request(method, 500, duration_ms)
            logger.error(
                f"Unhandled server error on {method} {path} [request_id={request_id}]: {exc}",
                exc_info=True
            )
            raise

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        metrics.record_request(method, status_code, duration_ms)

        # Attach Correlation ID to response headers
        response.headers["X-Request-ID"] = request_id

        # Skip spamming logs on repetitive health probe endpoints
        if path not in ("/health/live", "/health"):
            log_data = {
                "request_id": request_id,
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else "unknown"
            }
            logger.info(json.dumps(log_data))

        return response
