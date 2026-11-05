from fastapi import APIRouter, status, Response
from fastapi.responses import JSONResponse
from datetime import datetime
from app.config import settings
from app.database import check_database_connection
from app.services.metrics import metrics

router = APIRouter(prefix="/health", tags=["Health & Observability"])

@router.get("", status_code=status.HTTP_200_OK)
def get_health_summary():
    """
    Consolidated health status endpoint.
    Reports operational state of core engine, database, and payment subsystem.
    """
    db_ok, db_latency, db_err = check_database_connection(timeout_seconds=3.0)
    
    is_pg = settings.DATABASE_URL.startswith("postgresql") or settings.DATABASE_URL.startswith("postgres")
    db_engine_name = "PostgreSQL" if is_pg else "SQLite"

    is_overall_healthy = db_ok
    status_str = "healthy" if is_overall_healthy else "degraded"
    status_code = status.HTTP_200_OK if is_overall_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    response_payload = {
        "status": status_str,
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0",
        "dependencies": {
            "database": {
                "status": "connected" if db_ok else "unreachable",
                "engine": db_engine_name,
                "latency_ms": db_latency,
                "persistent": is_pg
            },
            "paypal_gateway": {
                "mode": settings.PAYPAL_MODE,
                "status": "configured" if (settings.PAYPAL_CLIENT_ID and settings.PAYPAL_CLIENT_SECRET) else "simulator_fallback",
                "simulator_active": settings.PAYPAL_MOCK_SIMULATOR
            },
            "gemini_ai": {
                "status": "configured" if settings.GEMINI_API_KEY else "offline_fallback_active"
            }
        }
    }
    return JSONResponse(status_code=status_code, content=response_payload)


@router.get("/live", status_code=status.HTTP_200_OK)
def get_liveness():
    """
    Kubernetes / Cloud Orchestrator Liveness Probe.
    Indicates whether the application process is running and responding to HTTP requests.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.get("/ready")
def get_readiness():
    """
    Kubernetes / Cloud Orchestrator Readiness Probe.
    Verifies that critical dependencies (database) are operational before routing traffic.
    Optional services (Gemini, payment simulators) do not block readiness.
    """
    db_ok, db_latency, db_err = check_database_connection(timeout_seconds=3.0)
    if not db_ok:
        metrics.record_database_error()
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unready",
                "reason": "Database connection probe failed.",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

    return {
        "status": "ready",
        "database": "connected",
        "latency_ms": db_latency,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.get("/diagnostics")
def get_safe_diagnostics():
    """
    Configuration and operational diagnostics.
    Safe for SRE inspection: exposes runtime settings without secrets or sensitive tokens.
    """
    return settings.get_public_diagnostics()


@router.get("/metrics")
def get_telemetry_metrics():
    """
    Application performance, error rates, and payment telemetry summary.
    """
    return metrics.get_summary()


@router.get("/test-error")
def test_error_simulation():
    """
    Simulation endpoint to verify centralized 500 error sanitization.
    Raises an unhandled exception containing sensitive internal details.
    """
    raise RuntimeError("Sensitive internal database connection string: postgresql://admin:super_secret_pwd@host/db")
