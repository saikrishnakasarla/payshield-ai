# PayShield AI — Screenshot & Visual Asset Checklist

**Auditor:** FinTech UI/UX Architect & Submission Specialist  
**Design Standard:** Light FinTech SaaS Theme (`#F8FAFC` slate canvas, pure white cards, corporate navy and royal blue accents)  
**Standard Resolution:** 1920×1080 (Desktop), 390×844 (Mobile)  

---

## 1. Required Visual Assets & Capturing Guidance

To ensure the submission showcases the **actual working application** rather than fabricated mockups, capture screenshots using the following exact paths and viewports:

| # | Asset Name | Target Route | Viewport | Key Visual Elements to Include |
|:---:|:---|:---|:---:|:---|
| **1** | `01_login_page.png` | `/signin` | 1920×1080 | Split card: Left navy branding panel with SSL guarantee; Right clean white card with email/password fields, visible focus ring, and password visibility toggle. |
| **2** | `02_merchant_dashboard.png` | `/` | 1920×1080 | Monitored processing volume, screened order counts, Recharts area trend graph, high-risk geographic origins list, and model health stats. |
| **3** | `03_transaction_monitor.png` | `/transactions` | 1920×1080 | Filter bar with search, status dropdowns, Low/Med/High risk badges, zebra-hover table rows, and synthetic demo indicators. |
| **4** | `04_transaction_investigation.png`| `/transactions` (Modal Open) | 1920×1080 | Full investigation dossier: semi-circular SVG score gauge (e.g. 85/100), triggered rules list with exact points added (`+35`, `+25`), and review action buttons. |
| **5** | `05_ai_explanation.png` | `/transactions` (Modal Zoom) | 1920×1080 | Zoomed view of Google Gemini 1.5 explainable narrative, SHAP feature attribution bar, verified facts ledger, and interactive checklist. |
| **6** | `06_paypal_sandbox_checkout.png`| `/paypal-sandbox` | 1920×1080 | Two-column layout: Test plan buttons (`$125`, `$2,850`, `Custom`), PayPal Smart Buttons SDK, server verification receipt with transaction ID. |
| **7** | `07_mobile_dashboard.png` | `/` | 390×844 | Mobile responsive view: Mobile header bar with hamburger menu, stacked metric cards, collapsed transaction rows with 44px touch targets. |
| **8** | `08_risk_classification.png` | `/insights` | 1920×1080 | Operational Insights tab showing Chargeback Defense Score, Risk Distribution pie/bars, and Top Triggered Rules table. |
| **9** | `09_cryptographic_audit.png` | `/insights` (Audit Tab) | 1920×1080 | Cryptographic Hash Chain card showing "100% UNBROKEN CHAIN", SHA-256 specs, and live Tamper Detection demonstration results. |

---

## 2. Step-by-Step Instructions for Capturing Locally

If capturing from your local development environment:

### Step 1: Start Application
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 2: Open Browser in Clean Mode
1. Open Google Chrome or Microsoft Edge.
2. Open DevTools (`F12`), toggle Device Toolbar (`Ctrl+Shift+M` or `Cmd+Shift+M`).
3. Set dimension to **Responsive: 1920 × 1080** (Desktop) and **iPhone 14 / Pixel 7: 390 × 844** (Mobile).
4. Navigate to `http://localhost:5173`.
5. Sign in using `merchant@example.com` / `DemoMerchant2026!`.

### Step 3: Capture Full-Resolution Screenshots
In Chrome DevTools:
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac).
- Type `Capture full size screenshot` or `Capture screenshot`.
- Save files under `docs/screenshots/` following the naming convention above.

---

## 3. Privacy & Sanitization Checklist

Before attaching screenshots to the Devpost submission or public documentation:
- [ ] Ensure **no live API secrets** (e.g. `PAYPAL_CLIENT_SECRET`, `GEMINI_API_KEY`) are visible on screen or in browser developer consoles.
- [ ] Ensure no real personal bank account numbers, passwords, or personal email addresses are shown.
- [ ] Confirm all displayed sample transactions use mock or synthetic data watermarks (`@example.com`).
