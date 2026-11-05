# 🛡️ PayShield AI — Explainable Payment Risk Intelligence for PayPal Merchants

> **PayPal AI Hackathon 2026 Submission**  
> *An explainable AI financial protection platform that screens payment transactions with deterministic mathematical heuristics, scores fraud probability via machine learning, explains risk in plain English using Google Gemini, and empowers merchants with non-destructive review tools.*

[![CI Test Suite](https://img.shields.io/badge/pytest-167%20passed-emerald.svg)](backend/app/tests)
[![Frontend Build](https://img.shields.io/badge/vite-compiled-blue.svg)](frontend)
[![WCAG 2.2](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-blueviolet.svg)](docs/FRONTEND_UI_UX_AUDIT.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌐 Live Verification & Links

- **Live Application Deployment:** [https://payshield-ai-liard.vercel.app](https://payshield-ai-liard.vercel.app)
- **Direct Vercel Deployment:** [https://payshield-mkc980762-saikrishnakasarlla-1879.vercel.app](https://payshield-mkc980762-saikrishnakasarlla-1879.vercel.app)
- **Public GitHub Repository:** [https://github.com/saikrishnakasarla/payshield-ai](https://github.com/saikrishnakasarla/payshield-ai)
- **Backend API Health Probe:** [https://payshield-ai-liard.vercel.app/api/health](https://payshield-ai-liard.vercel.app/api/health)
- **Interactive OpenAPI Documentation:** Available locally at `http://127.0.0.1:8000/docs`

---

## 📖 Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Proposed Solution](#2-proposed-solution)
3. [Target Users](#3-target-users)
4. [Key Features](#4-key-features)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [PayPal Integration Details](#7-paypal-integration-details)
8. [AI/ML Architecture](#8-aiml-architecture)
9. [Risk Scoring Explanation](#9-risk-scoring-explanation)
10. [Database Architecture & Migrations](#10-database-architecture--migrations)
11. [Security, Isolation & Privacy](#11-security-isolation--privacy)
12. [Visual Interface & Screenshots](#12-visual-interface--screenshots)
13. [Installation & Prerequisites](#13-installation--prerequisites)
14. [Local Development Commands](#14-local-development-commands)
15. [Environment Configuration (`.env`)](#15-environment-configuration-env)
16. [Automated Testing Instructions](#16-automated-testing-instructions)
17. [Hackathon Demo Instructions](#17-hackathon-demo-instructions)
18. [Honesty Disclaimers & Known Limitations](#18-honesty-disclaimers--known-limitations)
19. [Future Roadmap & Next Steps](#19-future-roadmap--next-steps)
20. [License](#20-license)

---

## 1. Problem Statement

Small and medium-sized merchants (SMBs) processing payments face a double-edged fraud crisis:
1. **Crippling Chargebacks:** A single undetected stolen card or structuring evasion scheme can trigger costly bank dispute fees ($15–$50 per chargeback) and put merchant accounts at risk of termination by payment processors.
2. **Opaque "Black-Box" Denials:** Existing anti-fraud tools provide single-number risk scores without actionable explanations, forcing merchants to guess why legitimate buyers were flagged.
3. **Severe False-Positive Churn:** Traditional rules-based filters frequently block innocent customers (e.g., customers traveling abroad or buying gifts), causing permanent customer loss and lost revenue.

---

## 2. Proposed Solution

**PayShield AI** acts as an intelligent, transparent risk co-pilot for online merchants:
- **Transparent Heuristics:** Evaluates 6 deterministic rules (velocity, baseline surge, geo-IP mismatch, structuring evasion, burst frequency, item mismatch) mapped strictly between 0 and 100.
- **Machine Learning Screening:** Employs a Random Forest classifier trained on class-imbalanced fraud vectors to calculate an independent probability of fraud $P(\text{Fraud})$.
- **Grounded AI Explanations:** Uses Google Gemini 1.5 Flash to synthesize complex evidence into structured plain-English rationales. Crucially, Gemini is constrained to cite only verified database facts, preventing AI hallucinations.
- **Non-Destructive Merchant Decision Support:** Flags suspicious transactions for human review ("Mark Reviewed Safe", "Escalate") without automatically declining payments or blocking customer cards.

---

## 3. Target Users

- **Independent E-Commerce Merchants:** Shopify, WooCommerce, and custom web shops that need enterprise-grade fraud intelligence without enterprise pricing.
- **Digital Goods & SaaS Creators:** Software, courses, and digital subscription sellers vulnerable to instant card testing and chargeback fraud.
- **Merchant Risk Analysts & Operations Teams:** Fraud managers who require explainable forensic audit trails to contest disputed charges and preserve merchant standing.

---

## 4. Key Features

- **End-to-End PayPal Orders v2 Lifecycle:** Real server-side order creation, official PayPal JavaScript SDK Smart Buttons approval, backend capture verification, and signature-checked webhook listeners.
- **Offline Gateway Simulator:** When sandbox API keys are absent, the platform activates a deterministic simulator that generates synthetic orders (`is_synthetic: true`) so evaluators can test without external blockers.
- **Multi-Gateway Universal Checkout:** Unified adapter supporting PayPal, Stripe, Razorpay (UPI), and Adyen with deterministic test scenarios (`SUCCESS`, `DECLINED`, `PENDING`, `SUSPICIOUS`).
- **Explainable Investigation Dossier:** Interactive investigation modal with SVG risk gauge, rule breakdown, ML fraud probability, and SHAP feature attributions.
- **Cryptographic Hash Chain Audit Trail:** RFC 6962-inspired SHA-256 and HMAC-SHA256 chained transaction ledger with an interactive live tampering demonstration.
- **Enterprise Multi-Tenant Isolation:** Complete merchant isolation with tenant-scoped tables, bcrypt hashing, and sliding-window rate limiting.
- **FinTech SaaS UI & WCAG 2.2 AA Compliance:** Clean light slate/navy interface with non-color geometric risk badges, 15.8:1 text contrast, full keyboard navigation, and responsive optimization across 10 viewports (320px–1920px).

---

## 5. System Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               PayShield AI Web Frontend               │
                                    │       (React 18, Vite, TypeScript, Tailwind CSS)       │
                                    └───────────────────────────┬────────────────────────────┘
                                                                │ HTTP / JSON (JWT Session)
                                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           FastAPI Backend Core (Python 3.11+)                                       │
│                                                                                                                     │
│   ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐               │
│   │   Auth & Merchant Scope   │      │   PayPal Order & Webhook  │      │   Universal Gateway API   │               │
│   │   (JWT, Tenant Isolation) │      │   (v2 Orders Client)      │      │   (Stripe, Razorpay, etc) │               │
│   └─────────────┬─────────────┘      └─────────────┬─────────────┘      └─────────────┬─────────────┘               │
│                 │                                  │                                  │                             │
│                 └──────────────────────────────────┼──────────────────────────────────┘                             │
│                                                    ▼                                                                │
│                                      ┌───────────────────────────┐                                                  │
│                                      │   Server-Side Capture &   │                                                  │
│                                      │   Payment Verification    │                                                  │
│                                      └─────────────┬─────────────┘                                                  │
│                                                    │                                                                │
│                                                    ▼                                                                │
│                                      ┌───────────────────────────┐                                                  │
│                                      │   Hybrid Risk Engine      │                                                  │
│                                      │ ┌───────────────────────┐ │                                                  │
│                                      │ │ Deterministic Rules   │ │                                                  │
│                                      │ │ (0-100 Bounded Rules) │ │                                                  │
│                                      │ └───────────┬───────────┘ │                                                  │
│                                      │             │             │                                                  │
│                                      │ ┌───────────▼───────────┐ │                                                  │
│                                      │ │ Random Forest ML      │ │                                                  │
│                                      │ │ Classifier P(Fraud)   │ │                                                  │
│                                      │ └───────────┬───────────┘ │                                                  │
│                                      │             │             │                                                  │
│                                      │ ┌───────────▼───────────┐ │                                                  │
│                                      │ │ Google Gemini 1.5 AI  │ │                                                  │
│                                      │ │ Explainable Narratives│ │                                                  │
│                                      │ └───────────────────────┘ │                                                  │
│                                      └─────────────┬─────────────┘                                                  │
│                                                    │                                                                │
│                                                    ▼                                                                │
│                                      ┌───────────────────────────┐                                                  │
│                                      │ Cryptographic Audit Trail │                                                  │
│                                      │ (SHA-256 / HMAC Chained)  │                                                  │
│                                      └─────────────┬─────────────┘                                                  │
│                                                    │                                                                │
└────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
                                      ┌───────────────────────────┐
                                      │   Relational Persistence  │
                                      │   (SQLite / PostgreSQL)   │
                                      └───────────────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/architecture-diagram.mmd`](docs/architecture-diagram.mmd) for detailed sequence diagrams and component definitions.

---

## 6. Technology Stack

| Layer | Technologies | Purpose |
|:---|:---|:---|
| **Frontend Framework** | React 18, TypeScript 5.6, Vite 5.4 | Fast, type-safe client with component modularity |
| **Styling & Icons** | Tailwind CSS 3.4, Lucide React, Framer Motion | Light FinTech SaaS theme, accessible iconography, reduced-motion animations |
| **Data Visualization** | Recharts 2.13 | High-contrast detection volume trends and fraud distribution charts |
| **Payment SDK** | `@paypal/react-paypal-js` | Official PayPal client-side SDK rendering PayPal Smart Buttons |
| **Backend Core** | Python 3.11+ / 3.13, FastAPI, Uvicorn, Pydantic v2 | High-throughput asynchronous REST API and strict request validation |
| **Machine Learning** | Scikit-learn, NumPy, Joblib | Random Forest classifier and SHAP attribution vectors |
| **LLM & Explainability** | Google GenAI SDK (`google-generativeai`), Gemini 1.5 Flash | Grounded evidence synthesis with deterministic fallback |
| **Database & ORM** | SQLAlchemy 2.0, Alembic 1.20 | Declarative ORM, version-controlled migrations, dual SQLite / PostgreSQL support |
| **Security & Auth** | Passlib (bcrypt), PyJWT, Python-JOSE | Secure password hashing, token validation, and tenant isolation |
| **Testing** | Pytest 9.1, Pytest-Asyncio, HTTPX | 167 automated unit, security, and integration tests |

---

## 7. PayPal Integration Details

PayShield AI integrates directly with the **PayPal REST Orders v2 API**:

1. **Order Initiation:** The merchant frontend requests order creation (`POST /api/paypal/create-order`). The backend validates the amount, currency, and line items, then issues a creation request to `api-m.sandbox.paypal.com`.
2. **Buyer Approval:** The customer reviews and approves the order via the official PayPal pop-up modal powered by PayPal Smart Buttons.
3. **Server-Side Capture:** The frontend receives the buyer approval callback and requests capture (`POST /api/paypal/capture-order`). The backend captures funds independently via PayPal's server endpoint.
4. **Instant Screening:** Once PayPal returns `status: COMPLETED`, the verified capture payload is immediately dispatched to the PayShield Risk Engine before order fulfillment.
5. **Webhook Ingestion:** Real-time webhook events (`PAYMENT.CAPTURE.COMPLETED`) are ingested (`POST /api/paypal/webhook`), validated with transmission signatures, and checked for idempotency to prevent double-processing.
6. **Graceful Simulator Fallback:** If developer sandbox keys are not configured, the backend seamlessly falls back to the **Offline Gateway Simulator**, allowing full evaluation without external API blockers.

---

## 8. AI/ML Architecture

```
                    ┌─────────────────────────┐
                    │ Captured PayPal Payment │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
  ┌─────────────────────────────┐  ┌─────────────────────────────┐
  │ 6 Deterministic Rules       │  │ Preprocessed Feature Vector │
  │ (Velocity, Geo-IP, Spikes)  │  │ (Amount, Velocity, Country) │
  └──────────────┬──────────────┘  └──────────────┬──────────────┘
                 │ (0-100 pts)                    │ (Features)
                 ▼                                ▼
  ┌─────────────────────────────┐  ┌─────────────────────────────┐
  │ Rule Heuristic Score        │  │ Random Forest Classifier    │
  │ R_score                     │  │ (Trained on Imbalanced Data)│
  └──────────────┬──────────────┘  └──────────────┬──────────────┘
                 │                                │ P(Fraud) [0.0 - 1.0]
                 └───────────────┬────────────────┘
                                 ▼
                 ┌─────────────────────────────┐
                 │    Hybrid Ensemble Score    │
                 │ 0.5 * R_score + 0.5 * P*100 │
                 └──────────────┬──────────────┘
                                 │
                                 ▼
                 ┌─────────────────────────────┐
                 │  Google Gemini 1.5 Explainer │
                 │  (Grounded on Facts Only)   │
                 └─────────────────────────────┘
```

1. **Layer 1: Deterministic Engine:** Evaluates transparent rules with strict point caps.
2. **Layer 2: Random Forest ML:** Evaluates non-linear correlations (e.g., subthreshold transaction structuring) missed by simple rules.
3. **Layer 3: Ensemble Blending:** Computes a balanced hybrid risk score combining rule evidence and statistical probability.
4. **Layer 4: Gemini 1.5 Explanation:** Synthesizes why the transaction was scored, highlights verified risk factors, and outputs an actionable merchant verification checklist.

---

## 9. Risk Scoring Explanation

Transactions are assigned a final score between **0 and 100**, categorized into three distinct operational tiers:

| Risk Tier | Score Range | Icon & Badge | Operational Action |
|:---|:---:|:---:|:---|
| **Low Risk (Safe)** | 0 – 34 | `CheckCircle2` Green | Standard transaction. Clear for automatic order fulfillment. |
| **Medium Risk (Review)** | 35 – 69 | `AlertTriangle` Amber | Elevated anomaly. Flag for manual merchant inspection before shipping. |
| **High Risk (Danger)** | 70 – 100 | `ShieldAlert` Red | Severe multi-signal risk. Delay fulfillment and contact buyer to verify identity. |

### Deterministic Rule Roster

- **RULE-01: Baseline Surge (+35 pts):** Order exceeds 3× customer baseline volume.
- **RULE-02: Velocity Spike (+25 pts):** ≥3 purchases attempted within a 10-minute sliding window.
- **RULE-03: Geo-IP Anomaly (+20 pts):** Connection IP country diverges from shipping/billing address.
- **RULE-04: Structuring Evasion (+30 pts):** Rapid burst of sub-threshold charges ($95–$99) designed to evade standard $100 reporting limits.
- **RULE-05: High-Frequency Burst (+20 pts):** Multiple rapid transactions executed under 60 seconds.
- **RULE-06: Order Item Mismatch (+15 pts):** Discrepancy between declared cart items and charged total.

---

## 10. Database Architecture & Migrations

PayShield AI uses SQLAlchemy 2.0 with Alembic version-controlled migrations:
- **`users`:** Merchant accounts, hashed passwords, roles (`merchant`, `admin`), timestamps.
- **`merchants`:** Multi-tenant profile, PayPal credentials (stored encrypted/server-side), configuration.
- **`transactions`:** Complete payment ledger with customer info, amount, currency, status, and synthetic flag.
- **`paypal_orders`:** Tracking PayPal order IDs, capture IDs, and verification statuses.
- **`risk_analyses`:** Forensic scores, triggered rules, ML probabilities, and Gemini explanations.
- **`audit_logs`:** RFC 6962-compliant hash-chained events (`previous_hash`, `current_hash`, `hmac_signature`).

### Database Flexibility
- **Development & Local Testing:** SQLite in Write-Ahead Logging (`WAL`) mode with foreign key enforcement.
- **Production & Staging:** Fully compatible with PostgreSQL (Neon, Supabase, AWS RDS, GCP Cloud SQL).

---

## 11. Security, Isolation & Privacy

- **Zero Secret Leakage:** Client secrets, API tokens, and signing keys are never returned in API responses, never logged, and never included in frontend bundles.
- **Tenant Isolation:** Every order and analysis is strictly tied to `merchant_id`. Cross-merchant access requests return HTTP 403 Forbidden.
- **Brute-Force Defense:** Sliding-window rate limiting on authentication and checkout endpoints (HTTP 429).
- **Audit Tamper Proofing:** Every audit log entry is linked to its predecessor via SHA-256 hash chaining. If any historical record is modified in the database, the cryptographic chain breaks instantly.
- **PII Minimization:** Card numbers and CVVs are processed directly by PayPal; PayShield AI never receives, handles, or stores raw payment card data.

See [`docs/SECURITY.md`](docs/SECURITY.md) for full vulnerability disclosure policy and security architecture.

---

## 12. Visual Interface & Screenshots

PayShield AI features a modern, accessible FinTech SaaS design system:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PayShield AI  │  Overview  │  Transactions  │  PayPal Sandbox  │  Unified Checkout  │  Settings │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐                   │
│   │ Monitored Volume     │  │ Screened Orders      │  │ Flagged for Review   │                   │
│   │ $34,850.00           │  │ 128                  │  │ 12                   │                   │
│   └──────────────────────┘  └──────────────────────┘  └──────────────────────┘                   │
│                                                                                                  │
│   ┌────────────────────────────────────────────────────────┐ ┌────────────────────────────────┐  │
│   │ 📈 Risk Detection Trend (Recharts Area Graph)          │ │ ⚠️ Top Risk Patterns           │  │
│   │                                                        │ │ High Velocity Spike: 38%       │  │
│   │                                                        │ │ Baseline Surge: 29%            │  │
│   │                                                        │ │ Geo-IP Mismatch: 18%           │  │
│   └────────────────────────────────────────────────────────┘ └────────────────────────────────┘  │
│                                                                                                  │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │ Recent Transactions Table (Zebra hover, geometric badges, mobile card collapse)           │  │
│   │ #1042 │ $125.00 USD │ customer@ex.com │ [● Low Risk: 12]    │ Mar 12 14:30 │ [ Inspect ]   │  │
│   │ #1043 │ $2,850.00   │ buyer@ex.com    │ [▲ High Risk: 85]   │ Mar 12 14:32 │ [ Inspect ]   │  │
│   └───────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

See [`docs/SCREENSHOT_CHECKLIST.md`](docs/SCREENSHOT_CHECKLIST.md) for full instructions on capturing high-resolution interface views.

---

## 13. Installation & Prerequisites

- **Python:** 3.11 or higher (tested on 3.11, 3.12, 3.13)
- **Node.js:** 18 or higher (with npm)
- **Git**

---

## 14. Local Development Commands

### 1. Clone the Repository
```bash
git clone https://github.com/saikrishnakasarla/payshield-ai.git
cd payshield-ai
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Alembic migrations to head
python -m alembic upgrade head

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```
*Backend is accessible at `http://127.0.0.1:8000`. OpenAPI docs: `http://127.0.0.1:8000/docs`.*

### 3. Frontend Setup
In a second terminal:
```bash
cd frontend

# Install dependencies
npm install

# Build verification check
npm run build

# Start Vite development server
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

---

## 15. Environment Configuration (`.env`)

Copy `.env.example` to `backend/.env`:

```env
APP_NAME="PayShield AI"
APP_ENV="development"
DEBUG=true

# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="sqlite:///./payshield.db"

# JWT Secret Key (Generate with: python -c "import secrets; print(secrets.token_hex(32))")
SECRET_KEY="generate-a-secure-32-char-random-key-for-local-development"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Optional: Google Gemini API Key (leaves empty to use deterministic fallback explainer)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"

# Optional: PayPal Developer Sandbox Credentials (leaves empty for offline simulator)
PAYPAL_MODE="sandbox"
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
PAYPAL_MOCK_SIMULATOR=False

# Configurable Risk Engine Thresholds
BASELINE_AMOUNT_MULTIPLIER=3.0
VELOCITY_WINDOW_MINUTES=10
MEDIUM_RISK_SCORE=35
HIGH_RISK_SCORE=70
```

---

## 16. Automated Testing Instructions

Execute the comprehensive 167-test suite:

```bash
cd backend
.\venv\Scripts\pytest -v
```

### Test Suite Summary
- **167 tests passed (0 failed, 100% pass rate)**
- **Coverage Areas:**
  - PayPal Orders v2 creation, capture, and status endpoints.
  - Webhook listener signature verification and replay defense.
  - Multi-gateway checkout adapter (Stripe, Razorpay, Adyen).
  - Deterministic risk engine rules and score bounds (0–100 invariant).
  - Random Forest ML classifier fraud probability predictions.
  - Gemini AI explainer service with deterministic offline fallback.
  - Authentication, JWT issuance, password hashing, and tenant isolation.
  - Database reliability, SQLAlchemy session management, and Alembic migrations.
  - Cryptographic audit hash chain and malicious tampering detection.
  - Production readiness, health checks, and security headers.

---

## 17. Hackathon Demo Instructions

For judges and evaluators reviewing the live application or running locally:

1. **Sign In / Onboarding:**
   - Navigate to `/signin`.
   - Use test merchant credentials or register a new account at `/signup`. (Registration automatically redirects to sign in for authentication safety).
2. **Explore the Overview Dashboard:**
   - Inspect high-level metrics, Recharts risk detection timeline, and top triggered fraud patterns.
3. **Execute a Sandbox Payment:**
   - Go to **PayPal Sandbox** (`/paypal-sandbox`).
   - Select the `$125.00 (Standard Normal)` scenario or `$2,850.00 (High-Value Spike)`.
   - Click **Execute Sandbox Payment**.
   - Notice the verified capture receipt with database transaction ID and instant AI risk evaluation.
4. **Inspect the Forensic Investigation Dossier:**
   - Click **Inspect In Dossier**.
   - Review the semi-circular SVG score gauge, triggered rule point breakdown, ML fraud probability, and Gemini narrative explanation.
   - Click **Mark Reviewed Safe** or **Escalate for Human Review** to record an audit action.
5. **Verify Cryptographic Audit Proof:**
   - Navigate to **Insights & Reports** (`/insights`).
   - Select the **Cryptographic Audit Proof** tab.
   - Click **Verify Cryptographic Audit Trail** to verify the unbroken SHA-256 chain.
   - Click **Simulate Unauthorized DB Tamper** to watch the system detect simulated database tampering in real time.

See [`docs/JUDGE_QUICKSTART.md`](docs/JUDGE_QUICKSTART.md) and [`docs/HACKATHON_DEMO_SCRIPT.md`](docs/HACKATHON_DEMO_SCRIPT.md) for full click-by-click scripts.

---

## 18. Honesty Disclaimers & Known Limitations

1. **Decision Support, Not Legal Advice:** PayShield AI generates heuristic risk indicators to assist human merchant decisions. It does not replace certified KYC/AML banking compliance.
2. **Review-Only Non-Destructive Operation:** The platform does not automatically block customer credit cards or cancel payments at the processor level; it flags suspicious orders for merchant review.
3. **Sandbox Simulator Disclosure:** When external PayPal credentials are not configured in `.env`, the platform operates in the **Offline Gateway Simulator**. Simulated captures are clearly watermarked as synthetic (`is_synthetic: true`).
4. **AI Grounding Guarantee:** Google Gemini is constrained to explain only verified facts extracted from database telemetry. When unconfigured, the system automatically uses the deterministic fallback explainer without degrading uptime.

---

## 19. Future Roadmap & Next Steps

- **Dispute Auto-Evidence Packager:** Automatically compile transaction logs, delivery carrier tracking, and cryptographic audit proofs into a standardized PDF package for PayPal Chargeback Resolution.
- **Merchant Consortium Fraud Ring Graph:** Anonymized graph network analysis detecting syndicates attempting card-testing across multiple independent PayShield merchants.
- **WebAuthn / Passkeys:** Hardware FIDO2 security key authentication for merchant administrative access.
- **Native Shopify & WooCommerce Plugins:** One-click marketplace extensions for zero-code merchant integration.

---

## 20. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

*PayShield AI — Developed for the PayPal AI Hackathon 2026.*
