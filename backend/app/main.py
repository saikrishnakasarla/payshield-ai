from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.seed_data import seed_database
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_transactions import router as transactions_router
from app.api.routes_paypal import router as paypal_router
from app.api.routes_insights import router as insights_router
from app.api.routes_settings import router as settings_router
from app.api.routes_auth import router as auth_router
from app.api.routes_audit import router as audit_router
from app.api.routes_benchmark import router as benchmark_router
from app.api.routes_scenarios import router as scenarios_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("payshield.app")

# Ensure tables are created immediately
Base.metadata.create_all(bind=engine)
# Ensure seeded data is present
with SessionLocal() as init_db:
    seed_database(init_db, force=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="PayShield AI — Core Protection Engine",
    description="Explainable AI & Deterministic Risk Monitoring for PayPal Merchants (Hackathon Prototype)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - strict origins with credentials support
allowed_origins = [
    settings.FRONTEND_ORIGIN.rstrip("/"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
# Remove duplicates
allowed_origins = list(dict.fromkeys(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include API Routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(transactions_router)
app.include_router(paypal_router)
app.include_router(insights_router)
app.include_router(settings_router)
app.include_router(audit_router)
app.include_router(benchmark_router)
app.include_router(scenarios_router)

@app.get("/")
def root():
    return {
        "service": "PayShield AI Core Engine",
        "docs_url": "/docs",
        "status": "active",
        "disclaimer": "Hackathon Prototype — Demonstration and Review Only"
    }
