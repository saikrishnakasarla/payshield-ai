# PayShield AI — Hackathon Video Demonstration Script

**Target Duration:** Exactly 2 Minutes 45 Seconds (Maximum limit: 2:50)  
**Presenter:** Founder / Product Engineer  
**Resolution:** 1080p (1920×1080) at 60 FPS  
**Target Audience:** PayPal AI Hackathon Judges, FinTech Engineers & E-Commerce Merchants  

---

## Visual & Audio Timeline

### Segment 1: The Problem (0:00 – 0:20) [20s]
**Visual:**  
Camera on presenter or split-screen showing news headlines on e-commerce chargeback surges and small business payment fraud.
**Narration (Audio):**  
> *"Every day, online merchants using PayPal lose billions to fraudulent chargebacks and stolen card testing. But traditional fraud filters are a black box—they either let structured fraud slip through or block legitimate customers, destroying merchant revenue. Small businesses don't need another opaque denial tool. They need an intelligent, explainable financial protection co-pilot."*

---

### Segment 2: The Solution (0:20 – 0:45) [25s]
**Visual:**  
Screen capture transitions to PayShield AI's live dashboard at `payshield-ai-liard.vercel.app`. Sleek light FinTech interface (`#F8FAFC` slate canvas with white cards and royal blue accents).
**Narration (Audio):**  
> *"Meet PayShield AI—an explainable risk intelligence platform built specifically for merchants. PayShield AI continuously monitors payment transactions, evaluates risk using transparent mathematical heuristics, scores fraud probability with machine learning, and explains forensic patterns in plain English using Google Gemini—giving merchants full confidence before fulfilling orders."*

---

### Segment 3: PayPal Sandbox Payment Integration (0:45 – 1:20) [35s]
**Visual:**  
Navigate to the **PayPal Sandbox** page (`/paypal-sandbox`).  
Show the two-column interface:
1. Select the `$125.00 (Standard Normal)` preset and click **Execute Sandbox Payment**. Show instant server capture and receipt.
2. Next, select the `$2,850.00 (High-Value Spike)` scenario and click Execute. Show the live multi-signal screening in action.
*(Explicitly note on-screen watermark: 'Executed via PayShield Sandbox Gateway / Simulator with server-side validation')*
**Narration (Audio):**  
> *"Here in our PayPal Sandbox portal, a merchant or buyer initiates checkout. Our backend strictly validates the amount and currency server-side to prevent client tampering. Once approved, the backend captures the order independently with PayPal's Orders v2 API. Immediately upon capture, PayShield screens the payment across deterministic rules and machine learning, persisting the verified record and forensic evaluation directly to the merchant's ledger."*

---

### Segment 4: AI Risk Intelligence & Gemini Explanations (1:20 – 1:55) [35s]
**Visual:**  
Click **Inspect in Dossier** to open the **Transaction Investigation Modal**.  
1. Zoom in on the semi-circular SVG score gauge showing a High Risk score (e.g. `85/100`).
2. Highlight the **Triggered Rules** (`RULE-01 Baseline Surge +35`, `RULE-02 Velocity Spike +25`).
3. Point to the **ML Fraud Probability P(Fraud): 87.4%** and the SHAP Feature Attribution bar.
4. Highlight the **Grounded Gemini AI Narrative** and the interactive **Verification Checklist**.
**Narration (Audio):**  
> *"Inside the investigation dossier, merchants see exactly why an order was flagged. Instead of a mystery score, PayShield provides a transparent breakdown: our 6 bounded heuristic rules, an independent Random Forest fraud probability, and SHAP feature attributions. Powered by Google Gemini 1.5, our AI Explainer generates a grounded, plain-English summary citing only verified database facts with zero hallucinations, complete with a step-by-step verification checklist."*

---

### Segment 5: Merchant Dashboard & Operational Insights (1:55 – 2:20) [25s]
**Visual:**  
Navigate back to the **Overview Dashboard** (`/`) and then to **Insights & Reports** (`/insights`).  
Show the Recharts detection trend curve, chargeback defense score, and click **Download CSV Ledger**.
**Narration (Audio):**  
> *"On the Overview Dashboard, merchants track real-time telemetry, risk trend curves, and geographic anomaly origins. In the Insights tab, merchants can monitor their Chargeback Defense Readiness Score and export a complete, audit-ready CSV ledger for their accounting and fraud dispute teams."*

---

### Segment 6: Security, Cryptographic Audit & Differentiation (2:20 – 2:40) [20s]
**Visual:**  
Open the **Cryptographic Audit Proof** tab.  
1. Click **Verify Cryptographic Audit Trail** to show `"100% UNBROKEN CHAIN"`.  
2. Click **Simulate Unauthorized DB Tamper** and show instant detection of database corruption.
**Narration (Audio):**  
> *"What sets PayShield AI apart is enterprise security and trust. We enforce strict multi-tenant merchant isolation, webhook signature verification, and an RFC 6962 cryptographic hash-chain audit trail. If any historical record is tampered with in the database, our cryptographic pointers detect it instantly."*

---

### Segment 7: Closing & Value Summary (2:40 – 2:45) [5s]
**Visual:**  
Return to the main overview screen with GitHub repository badge and live URL. Presenter on screen.
**Narration (Audio):**  
> *"PayShield AI: transparent, explainable, and secure payment protection for every PayPal merchant. Thank you!"*
