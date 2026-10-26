# PayShield AI — Architecture & Technical Design

## Overview
**PayShield AI** is an explainable AI-powered financial protection assistant built specifically for small businesses using PayPal. It bridges deterministic risk scoring with Google Gemini conversational intelligence to provide merchants with transparent, verifiable fraud risk recommendations.

```mermaid
flowchart TB
    subgraph Browser ["Merchant Browser (React UI)"]
        Dashboard["Overview Dashboard"]
        Monitor["Transaction Monitor"]
        Investigate["Transaction Investigation Modal"]
        Checkout["PayPal Sandbox Checkout Flow"]
        Insights["Insights & Reports"]
    end

    subgraph Backend ["FastAPI Protection Core (Python)"]
        API["FastAPI Endpoints"]
        AuthValidator["Amount & Currency Server Validator"]
        
        subgraph Engine ["Deterministic Risk Engine"]
            Rules["6 Heuristic Rule Evaluators"]
            ScoreCalc["Score Aggregator (Bounded 0-100)"]
        end

        subgraph AI ["Explainable AI Intelligence"]
            Gemini["Google Gemini 1.5 Flash"]
            Fallback["Offline Rule Explainer"]
        end

        subgraph Storage ["SQLite / PostgreSQL Storage"]
            DB[(Database Tables)]
        end
    end

    subgraph PayPalCloud ["PayPal Developer Sandbox"]
        PP_API["api-m.sandbox.paypal.com"]
    end

    %% Interactions
    Dashboard -->|GET /api/dashboard/summary| API
    Monitor -->|GET /api/transactions| API
    Investigate -->|POST /api/transactions/:id/analyze| API
    Investigate -->|POST /api/transactions/:id/review| API
    
    Checkout -->|POST /api/paypal/orders| API
    API --> AuthValidator
    AuthValidator -->|Create Order| PP_API
    PP_API -->|Buyer Approval URL| Checkout
    Checkout -->|POST /api/paypal/orders/:id/capture| API
    API -->|Capture Payment| PP_API
    PP_API -->|Status: COMPLETED| API
    
    API --> Engine
    Engine --> Rules
    Rules --> ScoreCalc
    ScoreCalc --> AI
    AI --> Gemini
    Gemini -.->|On Key Missing / Offline| Fallback
    AI --> Storage
    API --> Storage
```

## Core Security & Honesty Safeguards
1. **Never Assume Fraud**: The engine scores transactions into Low, Medium, and High risk tiers with explicit evidence and confidence limitations.
2. **Review-Only Actions**: Merchandising actions ("Mark Reviewed Safe", "Escalate to Human Review") record database audit logs without destructive bank blocking.
3. **Server-Side Payment Validation**: Transaction amounts and currencies are enforced by FastAPI before transmitting orders to PayPal's Orders API.
4. **Secret Isolation**: Secrets (`GEMINI_API_KEY`, `PAYPAL_CLIENT_SECRET`) reside exclusively in backend environment variables.
5. **Deterministic Foundation**: AI text explains the evidence produced by the deterministic engine; it cannot alter payment totals or override scores.
