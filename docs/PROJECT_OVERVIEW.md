# 🛡️ PayShield AI — Project Overview & Strategic Blueprint

## 1. Executive Summary & Student-Friendly Introduction

**PayShield AI** is an explainable, AI-powered financial protection assistant built specifically for small and medium-sized online merchants using PayPal. 

Imagine you are running an online store. Every day, dozens or hundreds of orders come in through PayPal. Most of them are from legitimate, honest customers. But occasionally, unusual orders appear:
- A customer who usually buys \$50 worth of goods suddenly places a \$2,850 order.
- Five orders are submitted within two minutes from the same device under different names.
- A card registered in the United States is being charged from an IP address located in a foreign country.
- The items listed in the cart sum up to \$100, but the payment amount charged is \$500.

Enterprise companies like Amazon or Netflix have dedicated 50-person fraud teams and multi-million-dollar machine learning systems to detect these anomalies. **Small businesses do not.** When small merchants face suspicious activity, they either:
1. Blindly trust the payments, risking costly chargeback fees, loss of inventory, and PayPal account penalties; or
2. Rely on opaque fraud scoring tools that give a number (like "Score: 78") without explaining *why* it is risky, causing merchants to panic and cancel legitimate orders, alienating good customers.

**PayShield AI bridges this critical gap.** It evaluates payment activity using transparent, deterministic rules (yielding a predictable 0–100 risk score), uses **Google Gemini AI** to translate the technical evidence into plain, understandable English summaries with concrete verification steps, and integrates directly with the official **PayPal Orders v2 API** to intercept and screen transactions server-side.

---

## 2. Project Metadata

- **Project Title:** PayShield AI (Explainable Financial Protection Assistant for PayPal Merchants)
- **Domain:** Fintech (Financial Technology), Payment Systems, Cybersecurity, Applied Artificial Intelligence
- **Subdomain:** Transaction Risk Intelligence, Fraud Anomaly Detection, Merchant Decision Support Systems
- **Target Audience:** Small and Medium Businesses (SMBs), independent e-commerce merchants, digital creators, SaaS startups using PayPal
- **Development Context:** Built and submitted for the **PayPal AI Hackathon**

---

## 3. Project Objectives

1. **Explainable Risk Intelligence:** Provide plain-English, evidence-grounded narratives instead of mysterious "black box" risk scores, enabling non-technical merchants to understand why an order is unusual.
2. **Transparent Mathematical Grounding:** Separate numeric scoring from narrative generation. Scoring is calculated deterministically ($0-100$) using verifiable heuristic rules, guaranteeing zero AI hallucination of risk numbers.
3. **Official PayPal Sandbox Interception:** Demonstrate real payment flows using the official `@paypal/react-paypal-js` Smart Buttons and backend server-to-server Order Creation and Capture verification.
4. **Non-Destructive Merchant Workflow:** Adopt a strict "Review-Only" philosophy. PayShield AI provides audit trails, verification checklists, and investigation dossiers without automatically blocking consumer bank accounts or cancelling payments without human authorization.
5. **Zero-Downtime Offline Resiliency:** Guarantee full system availability via deterministic rule fallback when external AI APIs or sandbox credentials are unconfigured or experiencing network timeouts.

---

## 4. Problem Statement

### The Problem Small Merchants Face
In digital commerce, processing card-not-present (CNP) transactions carries inherent financial and operational risks. When an unauthorized or fraudulent purchase occurs, the merchant—not the payment processor or cardholder—typically absorbs the financial loss through chargeback fees, lost merchandise, and payment dispute penalties.

### Why Manual Review Is Difficult
Small business owners wear many hats: they handle marketing, customer support, fulfillment, and accounting. They cannot manually cross-check IP locations, previous average order baselines, and timestamp velocities for every single checkout in real time.

### The Need for Understandable Explanations Over Raw Scores
Traditional fraud filters output abstract numbers (e.g., `Risk: 82`). A raw number does not tell the merchant:
- Is this a legitimate returning customer buying holiday gifts?
- Is this an address discrepancy caused by a buyer traveling abroad?
- What exact evidence triggered the score?
- What specific step should the merchant take before shipping the item?

Without context, merchants suffer from "false positive churn"—cancelling valid orders out of fear.

### The Gap PayShield AI Addresses
PayShield AI provides an accessible, explainable command center that pairs transparent rule-based heuristics with generative AI narrative explanations, giving small business owners the same caliber of risk intelligence enjoyed by enterprise merchants.

> [!IMPORTANT]
> **Honesty & Disclaimer Principle:** PayShield AI identifies *potential risk patterns and anomalies*, not confirmed fraud. It never claims that a transaction is fraudulent with mathematical certainty. All operations are review-only and non-destructive.

---

## 5. Proposed Solution & Processing Pipeline

```
[Customer Checkout] 
       │
       ▼
[PayPal Orders API (Sandbox)]
       │
       ▼ Server-side Capture Verification
[PayShield Backend Interceptor (/api/paypal/orders/{id}/capture)]
       │
       ▼
[Deterministic Risk Engine] ── Evaluates 6 Rules ──► Bounded Score (0–100) & Risk Tier
       │
       ▼ Evidence Context & Rule Flags
[Explainable AI Service] ──── Gemini 1.5 Flash ──► Plain-English Narrative & Actionable Steps
       │
       ▼
[SQLite/PostgreSQL Persistence]
       │
       ▼ Real-time Telemetry
[Merchant Command Center (React UI)] ── Review Dossier ──► Non-destructive Audit Record
```

### Problem $\to$ Solution Mapping

| Real-World Problem | PayShield AI Feature | Source Implementation | Practical Benefit |
| :--- | :--- | :--- | :--- |
| Untracked high-value payment spikes | Baseline Amount Multiplier Rule | `backend/app/risk_engine/rules.py` (`BaselineAmountRule`) | Flags orders $\ge 3\times$ customer's prior baseline, preventing high-ticket chargeback exposure. |
| Rapid automated bot checkout attempts | Velocity Spike & Burst Frequency Rules | `backend/app/risk_engine/rules.py` (`VelocitySpikeRule`, `BurstFrequencyRule`) | Detects $\ge 3$ attempts within 10 minutes or $\ge 4$ in 60 seconds from the same IP/Device. |
| Stolen card used from foreign proxy/VPN | Geolocation Inconsistency Rule | `backend/app/risk_engine/rules.py` (`GeoIPAnomalyRule`) | Detects mismatches between IP origin country and registered card billing country. |
| Client-side price tampering in checkout | Order Item Calculation Mismatch Rule | `backend/app/risk_engine/rules.py` (`OrderItemMismatchRule`) | Flags discrepancies between item quantity/price sum and the total amount charged. |
| Mysterious, uninterpretable risk scores | Grounded Gemini AI Narrative Explainer | `backend/app/services/ai_explainer.py` (`AIExplainerService`) | Generates executive summaries, uncertainty disclosures, and 3 concrete verification steps. |
| System crashing when API key is missing | Deterministic Rule-Based Fallback | `backend/app/services/ai_explainer.py` (`_generate_rule_based_fallback`) | 100% uptime with structured fallback narratives citing exact triggered rules. |
| Insecure client-side payment confirmation | Backend PayPal Capture Validation | `backend/app/services/paypal_service.py` (`capture_order`) | Enforces amount, currency, and capture verification directly with PayPal REST API. |
| Brute-force credential harvesting | Sliding-Window IP Rate Limiter | `backend/app/services/rate_limiter.py` (`InMemoryRateLimiter`) | Prevents automated credential attacks (15 req/min on login, 5 req/5min on password reset). |
| Cross-merchant data tampering | User Ownership Enforcement | `backend/app/api/routes_paypal.py` (`get_paypal_order`) | Prevents authenticated users from viewing or modifying orders belonging to another merchant. |

---

## 6. Core Technologies & Architecture Overview

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React, React Router 6.
- **Backend:** Python 3.11+, FastAPI (ASGI), Pydantic v2, SQLAlchemy, Uvicorn.
- **Database:** SQLite (local development and Vercel serverless `/tmp`) with clean migration compatibility for PostgreSQL.
- **Payments:** PayPal Orders v2 REST API and `@paypal/react-paypal-js` Sandbox SDK.
- **Artificial Intelligence:** Google Gemini (`gemini-1.5-flash`) via structured JSON generation with deterministic offline fallback.
- **Deployment:** Live on Vercel Multi-Service project with serverless ASGI routing.
