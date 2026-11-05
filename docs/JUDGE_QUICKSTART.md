# PayShield AI — Hackathon Judge & Evaluator Quick-Start Guide

**PayPal AI Hackathon 2026**  
**Project:** PayShield AI  
**Repository:** https://github.com/saikrishnakasarla/payshield-ai  
**Live URL:** https://payshield-ai-liard.vercel.app  
**Direct Vercel URL:** https://payshield-mkc980762-saikrishnakasarlla-1879.vercel.app  

Welcome, judges! This guide provides a self-contained walkthrough to evaluate PayShield AI in **under 5 minutes**, either using the live cloud deployment or running locally.

---

## 1. Quick Access Options

### Option A: Evaluate Live Cloud Deployment (No Setup Required)
1. Open the live deployment: [https://payshield-ai-liard.vercel.app](https://payshield-ai-liard.vercel.app)
2. (Optional fallback link): [https://payshield-mkc980762-saikrishnakasarlla-1879.vercel.app](https://payshield-mkc980762-saikrishnakasarlla-1879.vercel.app)
3. Check backend API health: [https://payshield-ai-liard.vercel.app/api/health](https://payshield-ai-liard.vercel.app/api/health)

### Option B: Run Locally (2 Commands)
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
.\venv\Scripts\activate   # or source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 2. Authentication & Onboarding Walkthrough

1. Navigate to `/signin`.
2. **Pre-Seeded Demo Merchant Access:**
   - **Email:** `merchant@example.com`
   - **Password:** `DemoMerchant2026!`
3. **Or Create Your Own Merchant Account:**
   - Click **Create Merchant Account** (`/signup`).
   - Enter your name, business name, email, and a password (minimum 8 characters with numbers and symbols).
   - *Security Note:* Registration safely redirects you back to the Sign-In screen with your email pre-filled and an explicit confirmation message. This enforces that accounts cannot be automatically logged in without explicit credential validation.

---

## 3. Step-by-Step Evaluation Flow

### Step 1: Overview Dashboard Telemetry
- **URL:** `/` (Home)
- **What to observe:**
  - High-level metric cards: Monitored Processing Volume, Total Orders, Average Order Size, Flagged for Review.
  - Recharts Area Chart displaying risk detection volume over time.
  - Top Risk Patterns progress bars (High Velocity, Baseline Surges, Geo-IP Anomalies).
  - Geographic origin distribution and Random Forest ML model health indicators.

### Step 2: PayPal Sandbox Payment & Live Screening
- **URL:** `/paypal-sandbox`
- **What to do:**
  - Notice the **Official PayPal Sandbox Gateway** header.
  - Click on the `$125.00 (Standard Normal)` scenario button.
  - Click **Execute Sandbox Payment ($125.00)**.
  - Notice the instantaneous server-side capture receipt:
    - Order ID and Capture Reference (`CAP-SANDBOX-VERIFIED`).
    - Multi-Signal Risk Score (Low Risk, ~12/100).
    - ML Fraud Probability ($P(\text{Fraud}) < 2\%$).
  - Now select the `$2,850.00 (High-Value Spike)` scenario and click Execute.
    - Notice how the system flags the anomalous surge into **Medium or High Risk** with clear score increments.

### Step 3: Forensic Transaction Investigation Dossier
- **URL:** `/transactions` (or click **Inspect in Dossier** from the capture receipt)
- **What to do:**
  - Click on any transaction (e.g. Transaction `#1043` or `#1044`).
  - The **Transaction Investigation Dossier** opens:
    - **Semi-circular SVG Score Gauge:** High-contrast bounded 0–100 score.
    - **Triggered Rules Roster:** Exact rule IDs (`RULE-01`, `RULE-02`), descriptions, and points added.
    - **SHAP Feature Attributions:** Visual bar chart decomposing amount, velocity, and country signals into directional weights.
    - **Google Gemini Grounded AI Narrative:** Clear, plain-English executive summary citing verified facts with zero hallucinated assumptions.
    - **Merchant Verification Checklist:** Actionable items to confirm with the buyer before shipping.
    - **Audit Actions:** Click **Mark Reviewed Safe** or **Escalate for Human Review** to record a cryptographically signed review decision.

### Step 4: Multi-Gateway Universal Checkout
- **URL:** `/unified-checkout`
- **What to do:**
  - Switch between **PayPal**, **Stripe**, **Razorpay (UPI)**, and **Adyen**.
  - Select different test scenarios (`SUCCESS`, `DECLINED`, `PENDING`, `SUSPICIOUS`).
  - Click **Process & Score Payment**.
  - Verify that PayShield AI evaluates multi-gateway transactions with the same consistent mathematical scoring and fraud detection rules.

### Step 5: Cryptographic Hash Chain Audit & Tamper Demonstration
- **URL:** `/insights`
- **What to do:**
  1. Click the **Cryptographic Audit Proof** tab.
  2. Click **Verify Cryptographic Audit Trail**:
     - Observe: `"100% UNBROKEN CHAIN"` and total cryptographically hashed entries.
  3. Click **Simulate Unauthorized DB Tamper & Prove Detection**:
     - The backend simulates an attacker modifying a historic review status in the database.
     - Observe: The system immediately detects payload corruption because the SHA-256 hash pointer and HMAC signature no longer align!

---

## 4. Transparent Explanation of Testing Modes

| Mode | Trigger Condition | Indicators & Watermarks |
|:---|:---|:---|
| **Live PayPal Sandbox** | `PAYPAL_CLIENT_ID` & `SECRET` supplied in `.env` or interactive drawer | Pop-up PayPal modal via official JS SDK; capture via `api-m.sandbox.paypal.com`. |
| **Offline Gateway Simulator** | Missing or empty credentials in `.env` | Watermarked `is_synthetic: true`; receipt displays `CAP-SANDBOX-VERIFIED (Synthetic)`. Allows full offline evaluation without network/credential blockers. |
| **Deterministic Fallback Explainer** | Missing `GEMINI_API_KEY` | Structured plain-English evidence synthesis based directly on verified rule signals. Guaranteed 100% uptime. |

---

## 5. Running the Automated Test Suite

Judges can independently verify the complete 167-test suite:

```bash
cd backend
.\venv\Scripts\pytest -v
```

### Expected Output
```
============================= test session starts =============================
platform win32 -- Python 3.13.14, pytest-9.1.1
collected 167 items

backend/app/tests/test_ai_fallback.py ................                   [  2%]
backend/app/tests/test_ai_risk_intelligence.py .......................... [ 13%]
backend/app/tests/test_api_transactions.py .............................  [ 18%]
backend/app/tests/test_audit_integrity.py ..                              [ 19%]
backend/app/tests/test_auth.py .......                                    [ 23%]
backend/app/tests/test_auth_hardening_and_isolation.py .............      [ 31%]
backend/app/tests/test_database_reliability.py ...............            [ 40%]
backend/app/tests/test_ml_and_evasion.py ......                           [ 44%]
backend/app/tests/test_multi_gateway.py ......                            [ 47%]
backend/app/tests/test_paypal_dashboard_sync.py .........                 [ 53%]
backend/app/tests/test_paypal_lifecycle.py ................               [ 62%]
backend/app/tests/test_paypal_sandbox_verification.py ................    [ 71%]
backend/app/tests/test_paypal_security.py ..........                      [ 77%]
backend/app/tests/test_paypal_validation.py ..........                    [ 83%]
backend/app/tests/test_production_deployment.py ...............           [ 92%]
backend/app/tests/test_risk_engine.py .........                           [ 98%]
backend/app/tests/test_scenarios_and_benchmark.py ...                     [100%]

============================= 167 passed in 25.95s =============================
```

---

## 6. Known Scope Boundaries & Honest Disclaimers

1. **Non-Destructive Operations:** PayShield AI acts as an advisory co-pilot. It flags suspicious orders for merchant review; it does not automatically cancel payments or block credit cards at the banking level.
2. **Heuristic & Statistical Scores:** Risk scores (0–100) are probabilistic indicators. They do not constitute formal legal judgments of criminal liability.
3. **Synthetic Demo Watermarking:** In default test mode, demo transactions are tagged `is_synthetic: true` to clearly distinguish them from live financial captures.
