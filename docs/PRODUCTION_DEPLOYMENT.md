# PayShield AI — Production Deployment, Monitoring & Operations Guide

This guide describes the complete procedure for deploying **PayShield AI** to production with high availability, database persistence, PayPal payment compliance, structured observability, and zero downtime.

---

## 1. System Architecture Overview

```
                          [ Internet / Merchant Browsers ]
                                         │
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │            Vercel Edge Network           │
                    │   - Static Asset CDN (Vite React SPA)    │
                    │   - HTTPS Enforcement & HSTS             │
                    │   - WAF / Rate Limiting                  │
                    └────────────────────┬─────────────────────┘
                                         │
                   /api/*                │                 /*
          ┌──────────────────────────────┴──────────────────────────────┐
          ▼                                                             ▼
┌──────────────────────────────────────┐              ┌─────────────────────────────────┐
│     FastAPI Core Engine (Python)     │              │     Optimized React Frontend    │
│  - Structured Logging Middleware     │              │  - Lazy-Loaded Route Bundles    │
│  - Correlation ID Tracing            │              │  - Vendor Chunk Splitting       │
│  - Security Headers (nosniff, DENY)  │              │  - Dynamic API Base Resolution  │
│  - Multi-Signal Risk Engine          │              │  - Responsive Semicircular UI   │
│  - Grounded AI Explainer             │              └─────────────────────────────────┘
└──────────────────┬───────────────────┘
                   │
    ┌──────────────┼──────────────────────────────┐
    ▼              ▼                              ▼
┌────────────┐ ┌─────────────────────────┐ ┌────────────────────────┐
│ PostgreSQL │ │ PayPal REST API (v2)    │ │ Google Gemini API      │
│  Database  │ │ - Sandbox & Live Orders │ │ - Grounded AI Explains │
│ (Managed)  │ │ - Webhook Signature Val │ │ - Offline Rule Fallback│
└────────────┘ └─────────────────────────┘ └────────────────────────┘
```

---

## 2. Environment Matrix

PayShield AI enforces four strictly defined runtime tiers via `APP_ENV`:

| Tier | `APP_ENV` | Database | PayPal Mode | Simulator Fallback | Insecure Secret Allowed |
|---|---|---|---|:---:|:---:|
| **Local Dev** | `development` | SQLite or PostgreSQL | `sandbox` | Yes (if no creds) | Yes (dev warning) |
| **Testing** | `testing` | In-memory or SQLite | `sandbox` | Yes (for mock tests)| Yes |
| **Staging** | `staging` | Managed PostgreSQL | `sandbox` | No (requires sandbox creds) | No (rejected) |
| **Production** | `production` | Managed PostgreSQL | `live` or `sandbox`* | **Strictly Forbidden (Fatal error)** | **Strictly Forbidden (Fatal error)** |

*\* Note: PayPal Sandbox mode is permitted in production only during preliminary merchant certification trials with real PayPal Sandbox accounts, never with mock simulator fallback.*

---

## 3. Managed PostgreSQL Cloud Database Setup

Production financial and risk records **must never use ephemeral storage** (such as serverless `/tmp` or local SQLite files). Use a managed PostgreSQL service:

### Recommended Providers:
1. **Neon Serverless PostgreSQL (Recommended for Vercel):**
   - Instant branching, connection pooling, and auto-scaling.
   - Built-in connection string: `postgresql://user:password@ep-name.region.aws.neon.tech/payshield_prod?sslmode=require`
2. **Supabase PostgreSQL:**
   - Transaction pooler port `6543` for serverless environments.
3. **AWS RDS / Aurora PostgreSQL:**
   - Standard Multi-AZ deployment.

### Connection Pooling Configuration:
In [`backend/app/database.py`](file:///C:/Users/USER/Downloads/SAI%20Projects/Antigravity/payshield-ai/backend/app/database.py), connection pooling is pre-tuned for serverless concurrency:
* `pool_size=10`: Persistent connections maintained per worker.
* `max_overflow=20`: Burst capacity for traffic spikes.
* `pool_pre_ping=True`: Probes connections before issuance, eliminating dead socket errors.
* `pool_recycle=1800`: Refreshes connections every 30 minutes to prevent cloud firewall disconnects.
* `connect_args={"sslmode": "require"}`: Enforced automatically for all cloud providers.

### Executing Database Migrations:
Never execute migrations through ad-hoc raw SQL in production. Use the configured Alembic environment:
```bash
cd backend
python -m alembic upgrade head
```

---

## 4. Production Deployment on Vercel

The root [`vercel.json`](file:///C:/Users/USER/Downloads/SAI%20Projects/Antigravity/payshield-ai/vercel.json) routes incoming requests between the frontend React SPA and the FastAPI Python serverless backend.

### Step 1: Push Repository to GitHub
Ensure the latest code is on `main`:
```bash
git push origin main
```

### Step 2: Configure Environment Variables in Vercel Dashboard
In the Vercel Dashboard, navigate to **Project Settings $\to$ Environment Variables** and add:

```env
APP_ENV=production
DEBUG=false
DATABASE_URL=postgresql://your_user:your_password@ep-cool.region.aws.neon.tech/payshield_prod?sslmode=require
SECRET_KEY=generate_at_least_32_characters_random_hex_string_here
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_MOCK_SIMULATOR=false
FRONTEND_ORIGIN=https://your-production-domain.vercel.app
GEMINI_API_KEY=your_optional_gemini_api_key
```

### Step 3: Deploy
Trigger a deployment from the Vercel Dashboard or CLI:
```bash
vercel --prod
```

---

## 5. PayPal Developer Configuration & Webhook Registration

### 1. Create a Sandbox / Live REST App
1. Log into the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications).
2. Under **Apps & Credentials**, select **Sandbox** (or **Live**).
3. Click **Create App**, name it `PayShield AI Production Engine`, and note:
   - **Client ID**
   - **Secret**

### 2. Register Webhooks
1. In your PayPal app page, click **Add Webhook**.
2. **Webhook URL:** `https://your-production-domain.vercel.app/api/paypal/webhook`
3. **Event Types to Subscribe:**
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
4. Copy the generated **Webhook ID** into `PAYPAL_WEBHOOK_ID`.

---

## 6. SRE Health Checks & Monitoring

PayShield AI provides standardized endpoints for load balancers and uptime probes:

| Endpoint | Method | Purpose | Success Code | Unhealthy Code |
|---|:---:|---|:---:|:---:|
| `/health/live` | `GET` | Process liveness (Kubernetes liveness probe) | `200 OK` | Process non-responsive |
| `/health/ready` | `GET` | Database readiness (traffic routing gate) | `200 OK` | `503 Service Unavailable` |
| `/health` | `GET` | Consolidated subsystem health summary | `200 OK` | `503 Service Unavailable` |
| `/health/diagnostics` | `GET` | Safe runtime configuration status (zero secrets) | `200 OK` | - |
| `/health/metrics` | `GET` | Request throughput, latencies & payment telemetry | `200 OK` | - |

### Probing Readiness via cURL:
```bash
curl -i https://your-domain.vercel.app/health/ready
```
**Example Response:**
```json
{
  "status": "ready",
  "database": "connected",
  "latency_ms": 3.42,
  "timestamp": "2026-11-05T10:30:00Z"
}
```

---

## 7. Structured Logging & Correlation IDs

Every incoming request is tagged with an `X-Request-ID` header. If absent, a unique UUID (`req_a1b2c3d4e5f6`) is generated automatically.

### Tracing a Single Transaction Across Layers:
1. Search your log aggregator (Datadog, Papertrail, Vercel Logs) for the `request_id`:
```json
{"request_id": "req_84f932e1", "method": "POST", "path": "/api/paypal/orders/ORD-123/capture", "status_code": 200, "duration_ms": 142.3}
```
2. The same `request_id` is linked to database operations, PayPal API captures, and AI risk evaluations.

### PII & Secret Redaction Guarantee:
The built-in `LogSanitizationFilter` strips:
- JWT Bearer tokens $\to$ `Bearer [REDACTED_TOKEN]`
- Passwords $\to$ `"password": "[REDACTED_PASSWORD]"`
- Client Secrets $\to$ `"client_secret": "[REDACTED_SECRET]"`
- Card PANs $\to$ `[REDACTED_CARD_NUMBER]`

---

## 8. Backup & Disaster Recovery

### Online SQLite / Local Backup Utility:
For non-cloud environments, run:
```bash
python backend/scripts/db_backup.py
```
This leverages SQLite's online vacuum API to capture consistent point-in-time snapshots in `backend/backups/`.

### Cloud PostgreSQL Automated Backups:
When running on Neon or Supabase:
- Continuous point-in-time restore (PITR) is enabled by default.
- Manual branch snapshots should be created prior to executing database migrations:
```bash
neon branches create --name pre_migration_backup
```

---

## 9. SRE Troubleshooting & Runbook

### Issue: `/health/ready` returns 503
1. Check `DATABASE_URL` connectivity and SSL parameters:
   - Ensure `sslmode=require` is present in the connection string.
2. Verify cloud database network policies (allow `0.0.0.0/0` or Vercel IP ranges).
3. Inspect connection pool saturation: verify active connections in your database console.

### Issue: Payment capture completes, but Gemini explanation times out
* **Expected Behavior:** Payment capture **will not fail**.
* The risk engine automatically falls back to `_generate_rule_and_ml_fallback` with `is_fallback: True`.
* The dashboard displays an amber `Fallback Mode` badge while keeping transaction records 100% consistent.

### Issue: Webhook verification returns 400
1. Verify `PAYPAL_WEBHOOK_ID` matches the exact webhook registered in PayPal Developer Dashboard.
2. In local development or testing without webhook certificates, simulated webhooks operate safely under development mode.
