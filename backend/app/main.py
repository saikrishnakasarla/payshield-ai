from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.seed_data import seed_database
from app.middleware.logging_middleware import (
    StructuredLoggingMiddleware,
    LogSanitizationFilter,
    get_correlation_id
)
from app.middleware.security_headers import SecurityHeadersMiddleware

# Routers
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_transactions import router as transactions_router
from app.api.routes_paypal import router as paypal_router
from app.api.routes_insights import router as insights_router
from app.api.routes_settings import router as settings_router
from app.api.routes_auth import router as auth_router
from app.api.routes_audit import router as audit_router
from app.api.routes_benchmark import router as benchmark_router
from app.api.routes_scenarios import router as scenarios_router
from app.api.routes_payments import router as payments_router
from app.api.routes_health import router as health_router

# Configure logging with sensitive data redaction filter
logging.basicConfig(level=logging.INFO)
root_logger = logging.getLogger()
sanitization_filter = LogSanitizationFilter()
for handler in root_logger.handlers:
    handler.addFilter(sanitization_filter)

logger = logging.getLogger("payshield.app")

# In development and testing, automatically ensure tables exist and optional seed data is loaded.
# In production, database schemas are managed deterministically via Alembic migrations.
if not settings.is_production:
    Base.metadata.create_all(bind=engine)
    # Seed only if explicitly configured or running in interactive local dev
    if settings.SEED_DATABASE or (not settings.is_testing and settings.APP_ENV == "development"):
        with SessionLocal() as init_db:
            seed_database(init_db, force=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"PayShield AI Engine started. Environment: {settings.APP_ENV}. Debug: {settings.DEBUG}")
    yield
    logger.info("PayShield AI Engine shutting down gracefully.")

app = FastAPI(
    title="PayShield AI — Production Risk Intelligence Engine",
    description="Explainable AI & Deterministic Payment Risk Monitoring for PayPal Merchants",
    version="1.0.0",
    lifespan=lifespan
)

# 1. Structured Logging Middleware (attaches X-Request-ID, tracks latency, logs request telemetry)
app.add_middleware(StructuredLoggingMiddleware)

# 2. Security Headers Middleware (HSTS, nosniff, frameguard, payload size validation)
app.add_middleware(SecurityHeadersMiddleware)

# 3. CORS Configuration
allowed_origins = [
    settings.FRONTEND_ORIGIN.rstrip("/"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
if settings.CORS_ALLOWED_ORIGINS:
    for extra in settings.CORS_ALLOWED_ORIGINS.split(","):
        extra_clean = extra.strip().rstrip("/")
        if extra_clean:
            allowed_origins.append(extra_clean)

# Deduplicate
allowed_origins = list(dict.fromkeys(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "Content-Disposition"]
)

# Centralized safe exception handler: prevents internal stack trace leaks to API consumers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None) or get_correlation_id() or "unknown"
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path} [request_id={req_id}]: {exc}",
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred during processing. Please contact support quoting this request ID.",
            "request_id": req_id,
            "status_code": 500
        }
    )

# Include Core API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(transactions_router)
app.include_router(paypal_router)
app.include_router(insights_router)
app.include_router(settings_router)
app.include_router(audit_router)
app.include_router(benchmark_router)
app.include_router(scenarios_router)
app.include_router(payments_router)

@app.get("/")
def root():
    return {
        "service": "PayShield AI Core Engine",
        "docs_url": "/docs",
        "health_url": "/health",
        "environment": settings.APP_ENV,
        "status": "active"
    }
