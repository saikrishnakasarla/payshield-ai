# 🏗️ PayShield AI — Technical Architecture & System Design

This document details the architectural blueprints, communication flows, database relationships, and component mapping for the **PayShield AI** platform.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Browser Layer"]
        SPA["React 18 + Vite SPA"]
        PP_SDK["@paypal/react-paypal-js SDK"]
        Recharts["Recharts Visualization Engine"]
        Framer["Framer Motion Animation Core"]
    end

    subgraph Edge ["Deployment & Edge Routing (Vercel)"]
        Router["Vercel Multi-Service Router (vercel.json)"]
        Rewrites["/api/* -> Backend Service | /* -> Frontend SPA"]
    end

    subgraph BackendCore ["FastAPI Application Core (Python 3.11+)"]
        API["FastAPI REST Endpoints"]
        Auth["JWT Auth Service (bcrypt + HS256)"]
        Limiter["Sliding-Window IP Rate Limiter"]
        
        subgraph RiskEngineCore ["Deterministic Risk Engine"]
            Rules["6 Heuristic Rules (Bounded 0-100)"]
            Evaluator["Rule Evaluator"]
        end
        
        subgraph AIServiceCore ["Explainable AI Service"]
            Gemini["Google Gemini 1.5 Flash"]
            Fallback["Deterministic Rule Fallback"]
        end
        
        subgraph PayPalCore ["PayPal Service Client"]
            PP_Client["OAuth2 & Orders v2 Handler"]
            Webhook["Cryptographic Signature Verifier"]
        end
    end

    subgraph DataStore ["Persistence Layer"]
        DB[(SQLite / PostgreSQL Engine)]
        Users["Users & Reset Tokens"]
        Txns["Transactions & Line Items"]
        Analyses["Risk Analyses & Audit Logs"]
        Orders["PayPal Orders & Captures"]
    end

    subgraph ExternalCloud ["Third-Party External Services"]
        PayPalAPI["PayPal Developer Sandbox API (api-m.sandbox.paypal.com)"]
        GoogleAI["Google AI Studio API (generativelanguage.googleapis.com)"]
    end

    SPA --> Router
    Router --> Rewrites
    Rewrites -->|Static HTML/JS| SPA
    Rewrites -->|REST Requests| API
    
    API --> Auth
    API --> Limiter
    API --> Evaluator
    Evaluator --> Rules
    API --> Gemini
    Gemini -.->|On Timeout/Error| Fallback
    API --> PP_Client
    
    PP_Client -->|Create & Capture Orders| PayPalAPI
    PayPalAPI -->|Webhook Notifications| Webhook
    Webhook --> API
    
    Gemini -->|Structured JSON Prompt| GoogleAI
    
    API --> DB
    DB --- Users
    DB --- Txns
    DB --- Analyses
    DB --- Orders
```

---

## 2. End-to-End Payment & Screening Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Merchant
    participant UI as React Frontend SPA
    participant API as FastAPI Backend
    participant PP as PayPal Sandbox REST API
    participant Engine as Deterministic Risk Engine
    participant Gemini as Google Gemini AI
    participant DB as SQLite / PostgreSQL Database

    Note over Customer,DB: 1. Order Creation & Buyer Approval
    Customer->>UI: Selects item and initiates checkout
    UI->>API: POST /api/paypal/orders {amount, currency, item_name}
    API->>PP: POST /v2/checkout/orders (intent: CAPTURE)
    PP-->>API: Returns {order_id, status: "CREATED"}
    API->>DB: Stores PayPalOrder (status: "CREATED")
    API-->>UI: Returns {paypal_order_id, verified_by_backend: true}
    
    UI->>PP: Opens PayPal Modal / Smart Button approval
    Customer->>PP: Approves payment in Sandbox window
    PP-->>UI: Returns buyer approval {orderID}

    Note over Customer,DB: 2. Server Capture & Amount Validation
    UI->>API: POST /api/paypal/orders/{orderID}/capture
    API->>DB: Queries stored order by orderID (Rejects unknown with 404)
    API->>PP: POST /v2/checkout/orders/{orderID}/capture
    PP-->>API: Returns {capture_id, status: "COMPLETED", amount, currency}
    
    API->>API: Validates amount & currency against original order (Rejects deviations with 400)
    API->>DB: Updates PayPalOrder (status: "COMPLETED", capture_id)

    Note over Customer,DB: 3. Instant Risk Evaluation & AI Narrative
    API->>Engine: Evaluates transaction against 6 heuristic rules
    Engine-->>API: Returns {score: 75, level: "HIGH", triggered_rules: [...]}
    
    alt Gemini API Key Available
        API->>Gemini: Requests structured JSON explanation grounded in triggered rules
        Gemini-->>API: Returns {summary, explanation, uncertainties, recommended_steps}
    else API Key Missing or Timeout
        API->>API: Generates structured rule-based fallback
    end
    
    API->>DB: Inserts Transaction & RiskAnalysis records
    API-->>UI: Returns captured receipt + Instant Risk Badge
    
    Note over Customer,DB: 4. Merchant Investigation & Review
    Customer->>UI: Clicks "Inspect in Dossier"
    UI->>API: GET /api/transactions/{id}
    API->>DB: Fetches complete transaction, line items, and audit history
    API-->>UI: Renders Investigation Dossier Modal
    Customer->>UI: Clicks "Mark Reviewed Safe" or "Escalate"
    UI->>API: POST /api/transactions/{id}/review {status, notes, reviewer}
    API->>DB: Updates review_status & creates AuditLog
    API-->>UI: Confirms updated audit state
```

---

## 3. Database Entity Relationship (ER) Model

```mermaid
erDiagram
    User ||--o{ PasswordResetToken : owns
    User ||--o{ Transaction : monitors
    User ||--o{ PayPalOrder : creates
    Transaction ||--o{ RiskAnalysis : receives
    Transaction ||--o{ AuditLog : logs

    User {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string business_name
        string role
        boolean is_active
        datetime created_at
    }

    PasswordResetToken {
        int id PK
        int user_id FK
        string token_hash UK
        datetime expires_at
        boolean used
        datetime created_at
    }

    Transaction {
        int id PK
        int user_id FK
        string reference_id UK
        datetime timestamp
        float amount
        string currency
        string payment_status
        string customer_id
        string customer_name
        string customer_email
        float customer_baseline_amount
        int customer_baseline_orders
        string ip_address
        string ip_country
        string billing_country
        string shipping_country
        string device_fingerprint
        text items_json
        boolean is_synthetic
        string source
        int risk_score
        string risk_level
        string review_status
        text review_notes
        datetime reviewed_at
        string reviewer
    }

    RiskAnalysis {
        int id PK
        int transaction_id FK
        datetime evaluated_at
        int deterministic_score
        string risk_level
        text triggered_rules_json
        text ai_summary
        text ai_explanation
        text ai_uncertainties
        text recommended_steps_json
        string recommended_action
        string model_used
        string explanation_source
    }

    PayPalOrder {
        int id PK
        int user_id FK
        string paypal_order_id UK
        string status
        float amount
        string currency
        string capture_id
        string payer_email
        string payer_name
        int transaction_id
        text raw_response_json
        datetime created_at
        datetime captured_at
    }

    AuditLog {
        int id PK
        string action
        string entity_type
        string entity_id
        string performed_by
        text details_json
        datetime timestamp
    }
```

---

## 4. API Endpoint Reference

| Method | Endpoint | Description | Auth Requirement | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, database connection, PayPal/AI config mode | Public | None |
| `POST` | `/api/auth/register` | Register merchant user, hashes password with bcrypt, returns JWT | Public | 15 req/min |
| `POST` | `/api/auth/login` | Verify credentials, issues JWT and HttpOnly cookie | Public | 15 req/min |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated | None |
| `POST` | `/api/auth/forgot-password`| Invalidate old tokens, issue 1-hour reset token | Public | 5 req/5min |
| `POST` | `/api/auth/reset-password` | Validate token hash, update user password | Public | 5 req/5min |
| `GET` | `/api/dashboard/summary` | Telemetry metrics, Recharts timeline, fraud patterns, high-risk origins | Public / Scoped | None |
| `GET` | `/api/transactions` | Paginated transaction ledger with search, tier, and review filters | Public / Scoped | None |
| `GET` | `/api/transactions/{id}` | Detailed transaction metadata, line items, and risk analysis dossier | Public / Scoped | None |
| `POST` | `/api/transactions/{id}/review` | Update review status (`REVIEWED_SAFE`, `ESCALATED`), append audit note | Public / Auth | None |
| `POST` | `/api/transactions/{id}/analyze`| Re-run Gemini AI narrative synthesis for specific transaction | Public / Auth | None |
| `GET` | `/api/paypal/status` | Current PayPal configuration status and simulator flag | Public | None |
| `GET` | `/api/paypal/config` | Client ID and environment target for frontend JS SDK | Public | None |
| `POST` | `/api/paypal/orders` | Create PayPal Sandbox order (intent: CAPTURE) | Public / Auth | None |
| `POST` | `/api/paypal/orders/{id}/capture` | Capture order, validate amount/currency, execute risk screening | Public / Auth | None |
| `GET` | `/api/paypal/orders/{id}` | Inspect order capture details (enforces user ownership) | Authenticated | None |
| `POST` | `/api/paypal/webhook` | Receive & cryptographically verify PayPal Sandbox webhooks | PayPal HMAC | None |
| `GET` | `/api/insights` | Chargeback defense readiness, monitored volume, top triggered rules | Public | None |
| `GET` | `/api/insights/export-csv` | Download complete transaction ledger as CSV | Public | None |
| `GET` | `/api/settings` | Current heuristic thresholds and service integration readiness | Public | None |
| `POST` | `/api/settings/thresholds`| Update heuristic multipliers, windows, and risk floor scores | Authenticated | None |
| `POST` | `/api/demo/reset` | Restore SQLite database to 32 reproducible synthetic demo orders | Authenticated | None |

---

## 5. Feature-to-Code Mapping

| Feature / Capability | Frontend Implementation | Backend Implementation | Database Model |
| :--- | :--- | :--- | :--- |
| **Overview Dashboard** | `frontend/src/pages/OverviewDashboard.tsx` | `backend/app/api/routes_dashboard.py` | `Transaction`, `RiskAnalysis` |
| **Transaction Monitor & Filters** | `frontend/src/features/transactions/` | `backend/app/api/routes_transactions.py` | `Transaction` |
| **Investigation Dossier Modal** | `frontend/src/features/transactions/TransactionInvestigationModal.tsx` | `backend/app/api/routes_transactions.py` (`get_transaction`) | `Transaction`, `RiskAnalysis` |
| **Deterministic Risk Engine** | `frontend/src/features/risk/RiskScoreGauge.tsx` | `backend/app/risk_engine/engine.py` & `rules.py` | In-memory evaluation |
| **Google Gemini AI Explainer** | `frontend/src/features/risk/AIExplanationCard.tsx` | `backend/app/services/ai_explainer.py` | `RiskAnalysis` |
| **PayPal Sandbox Checkout** | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` | `backend/app/api/routes_paypal.py` & `paypal_service.py` | `PayPalOrder`, `Transaction` |
| **PayPal Webhook Verification** | None (Direct HTTP listener) | `backend/app/services/paypal_service.py` (`verify_webhook_signature`) | `AuditLog` |
| **Insights & CSV Export** | `frontend/src/pages/InsightsReports.tsx` | `backend/app/api/routes_insights.py` | `Transaction`, `RiskAnalysis` |
| **Authentication & Tokens** | `frontend/src/pages/auth/` & `auth-context.tsx`| `backend/app/api/routes_auth.py` & `auth.py` | `User`, `PasswordResetToken` |
| **Rate Limiting** | None (Receives HTTP 429) | `backend/app/services/rate_limiter.py` | In-memory sliding window |
| **Settings & Demo Re-seed** | `frontend/src/pages/SettingsDocs.tsx` | `backend/app/api/routes_settings.py` & `routes_dashboard.py` | `Transaction`, `RiskAnalysis` |
