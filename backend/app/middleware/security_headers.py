from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.config import settings

MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Check Content-Length to prevent payload exhaustion DOS attacks
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_REQUEST_SIZE:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": "Payload Too Large",
                            "detail": f"Request size exceeds maximum allowed threshold of {MAX_REQUEST_SIZE // (1024*1024)}MB."
                        }
                    )
            except (ValueError, TypeError):
                pass

        response = await call_next(request)

        # Standard FinTech Hardening Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Enforce HSTS in production environments
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response
