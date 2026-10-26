# PayShield AI — PayPal Sandbox Setup & Configuration Guide

PayShield AI integrates server-side with PayPal's REST Orders v2 API in the Sandbox environment (`https://api-m.sandbox.paypal.com`).

---

## 1. Out-of-the-Box Sandbox Simulator
You can run and evaluate PayShield AI **immediately without any credentials**.
When `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` are not set in `.env`, PayShield AI operates in **Sandbox Simulator Mode**:
- Generates realistic `PAYPAL-SANDBOX-XXXXXXXX` order references.
- Simulates server-side authorization and capture receipts with realistic timestamps and IDs.
- Evaluates the captured transaction in real time with the Deterministic Risk Engine and Gemini AI.

---

## 2. Connecting Real PayPal Sandbox Credentials
To connect live PayPal Sandbox credentials:

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/).
2. Navigate to **Apps & Credentials** > **Sandbox**.
3. Click **Create App**, give it a name (e.g., `PayShield-AI-App`), and choose your sandbox business account.
4. Copy the **Client ID** and **Secret**.
5. Create or edit `backend/.env` (or root `.env`):
   ```env
   PAYPAL_MODE=sandbox
   PAYPAL_CLIENT_ID=your_sandbox_client_id_here
   PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
   PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
   ```
6. Restart the backend:
   ```bash
   python run.py
   ```
7. Visit the **Settings** page in PayShield AI — it will now display `Live Sandbox Active`!

---

## 3. Recommended Sandbox Testing Scenarios
Use the default Sandbox Personal account created in your PayPal Developer dashboard:
- **Scenario A (Normal Order)**:
  - Select the `$125.00` standard package in the checkout page.
  - Approve payment with your Sandbox personal buyer account.
  - Observe that PayShield AI verifies the capture with PayPal and issues a **LOW RISK** score.
- **Scenario B (Baseline Anomaly)**:
  - Select the `$2,850.00` high-value package.
  - Approve payment.
  - Observe that PayShield AI intercepts the order, flags `RULE_AMOUNT_BASELINE`, and prompts for merchant verification.
