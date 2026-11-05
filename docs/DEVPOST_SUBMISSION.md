# PayShield AI — Devpost Hackathon Submission Draft

**Hackathon:** PayPal AI Hackathon 2026  
**Category:** Artificial Intelligence / Financial Security / E-Commerce Innovation  

---

## 1. Project Title
**PayShield AI — Explainable Payment Risk Intelligence for PayPal Merchants**

## 2. Short Tagline
*An explainable AI financial protection platform that screens PayPal transactions with deterministic mathematical heuristics, scores fraud probability via machine learning, and synthesizes grounded forensic explanations in plain English using Google Gemini.*

---

## 3. Project Inspiration

Small e-commerce businesses are the lifeblood of the digital economy, and millions depend on PayPal to power their daily sales. However, smaller merchants operate without the massive fraud departments and million-dollar risk teams employed by multinational retailers. When hit by a surge of stolen credit cards or automated card-testing bots, independent merchants face crushing bank chargeback fees ($15–$50 per occurrence) and risk having their payment processing terminated.

Worse, the few commercial anti-fraud tools available behave like opaque black boxes. They issue single-number scores without telling the merchant *why* a customer was flagged. Frustrated merchants either approve transactions blindly—risking devastating chargebacks—or cancel suspicious orders indiscriminately, losing legitimate buyers to false positives.

We built **PayShield AI** to give every small online merchant their own transparent, explainable, and non-destructive AI risk co-pilot.

---

## 4. Problem Statement

1. **Catastrophic Chargeback Losses:** E-commerce fraud accounts for tens of billions in annual merchant losses, with SMBs suffering disproportionate operational strain.
2. **Opaque "Black-Box" Fraud Detection:** Merchants cannot contest disputes or make informed fulfillment decisions without explainable reasoning.
3. **Severe False-Positive Churn:** Traditional rigid rules blindly reject legitimate shoppers (e.g., customers traveling abroad, using corporate VPNs, or purchasing gifts).
4. **Dispute Inefficiency:** Assembling evidence for PayPal dispute resolution is manual, fragmented, and time-consuming.

---

## 5. What PayShield AI Does

PayShield AI seamlessly intercepts and evaluates payment transactions across a four-layer intelligence pipeline:

- **Server-Side Validation:** Validates order items, amounts, and currency codes server-side before initiating PayPal Orders v2 transactions.
- **Deterministic Heuristic Screening:** Evaluates 6 transparent rules (velocity spikes, baseline multiplier anomalies, geo-IP country mismatches, structuring evasion, burst frequency, item total mismatches) bounded between 0 and 100.
- **Machine Learning Fraud Probability:** Employs a Random Forest classifier trained on class-imbalanced transaction vectors to predict an independent probability of fraud $P(\text{Fraud})$.
- **Grounded AI Explanations via Google Gemini:** Synthesizes evidence into structured plain-English rationales, verified fact summaries, and actionable merchant checklists. Gemini is constrained to cite only verified database facts with zero hallucinations.
- **Non-Destructive Review Support:** Flags transactions into Low, Medium, and High risk tiers without destructive bank blocking or customer card declines. Merchants can record auditable actions ("Mark Reviewed Safe", "Escalate for Human Review").
- **Cryptographic Hash Chain Audit Trail:** Links every transaction decision in an RFC 6962 SHA-256 and HMAC-SHA256 chained ledger with an interactive live tampering demonstration.
- **Multi-Gateway Universal Checkout:** Evaluates payments across PayPal, Stripe, Razorpay (UPI), and Adyen with deterministic scenario testing.

---

## 6. How It Was Built

- **Frontend Application:** Built with **React 18**, **TypeScript 5.6**, and **Vite 5.4**. Styled with a custom FinTech SaaS design system using **Tailwind CSS**, **Lucide React**, and **Framer Motion**, meeting **WCAG 2.2 AA accessibility** (15.8:1 contrast, non-color geometric risk badges, visible focus rings, responsive across 10 viewports from 320px to 1920px).
- **Backend Core:** Developed with **Python 3.11+ / 3.13**, **FastAPI**, **Pydantic v2**, and **Uvicorn** for high-throughput asynchronous execution.
- **Database & Persistence:** **SQLAlchemy 2.0** declarative ORM paired with **Alembic 1.20** declarative migrations. Dual database compatibility: SQLite in Write-Ahead Logging (`WAL`) mode for development and full PostgreSQL support for production.
- **Security & Multi-Tenancy:** Password hashing via **bcrypt**, JWT bearer authentication, multi-tenant merchant isolation with foreign key constraints, sliding-window rate limiting, and zero client-side secret exposure.

---

## 7. How PayPal Is Integrated

PayShield AI integrates deeply with the **PayPal REST Orders v2 API**:
1. **Server-Side Order Creation (`/api/paypal/create-order`):** The backend creates orders directly against `api-m.sandbox.paypal.com` with server-validated pricing, preventing client-side DOM tampering.
2. **Official PayPal Smart Buttons:** The frontend renders official PayPal Smart Buttons using `@paypal/react-paypal-js` for a secure, native buyer approval experience.
3. **Independent Server Capture (`/api/paypal/capture-order`):** The backend independently executes capture against PayPal's server upon buyer approval, verifying `status: COMPLETED` before recording the transaction.
4. **Signature-Verified Webhook Ingestion (`/api/paypal/webhook`):** Ingests asynchronous `PAYMENT.CAPTURE.COMPLETED` events, validates PayPal cryptographic transmission signatures, and enforces idempotency to prevent duplicate transaction recording.
5. **Offline Gateway Simulator:** When sandbox API keys are not supplied, the backend seamlessly switches to a deterministic simulator that watermarks orders as synthetic (`is_synthetic: true`), enabling complete evaluator testing without external blockers.

---

## 8. How AI & Machine Learning Are Integrated

The core innovation of PayShield AI is the **hybrid synergy between deterministic mathematics and explainable AI**:

- **The Deterministic Layer:** Computes an invariant 0–100 heuristic risk score using 6 documented rules.
- **The Machine Learning Layer:** A pre-trained Random Forest classifier evaluates multi-dimensional correlations and non-linear patterns (such as micro-burst card testing) that simple rules miss.
- **The Hybrid Ensemble:** Blends rule points and statistical probability:
  $$\text{Hybrid Score} = 0.5 \times \text{RuleScore} + 0.5 \times (P(\text{Fraud}) \times 100)$$
- **Google Gemini 1.5 Flash:** Rather than using AI as an arbitrary decision-maker, Gemini acts as a forensic translator. It ingests the exact signals and SHAP feature attributions, explaining the risk factors in plain English and creating an interactive verification checklist for the merchant.
- **Zero Hallucination Constraint:** The Gemini system prompt strictly prohibits inferring external unverified facts. If the Gemini API is unreachable, the system automatically falls back to an offline deterministic explainer with 100% availability.

---

## 9. Challenges We Faced

1. **Balancing False Positives vs. Fraud Detection:** Strict rules blocked legitimate travelers; loose rules allowed structured $98 micro-attacks. We solved this by implementing hybrid ensemble blending (rules + Random Forest ML) and directional SHAP feature attributions.
2. **Eliminating LLM Hallucinations in High-Stakes Finance:** LLMs can easily fabricate "customer criminal history" if unconstrained. We solved this by implementing strict structured evidence schemas and a deterministic fallback engine that only processes verified database facts.
3. **Ensuring Flawless Multi-Tenant Merchant Isolation:** Enforcing cross-merchant security required comprehensive query boundary validation and unit tests verifying that Merchant B cannot capture or view Merchant A's PayPal orders.
4. **Meeting WCAG 2.2 AA in Financial Data Visualization:** Designing risk indicators that do not rely solely on red/yellow/green required creating a multi-attribute badge system (distinct geometric icons + textual labels + score pills + ARIA statuses).

---

## 10. Accomplishments That We're Proud Of

- **167 / 167 Passing Tests:** Built a comprehensive automated test suite covering PayPal lifecycles, security isolation, ML models, Gemini fallback, database reliability, and production observability.
- **Cryptographic Hash Chain Tamper Proofing:** Implemented an RFC 6962 SHA-256 + HMAC-SHA256 audit log with an interactive live tampering demonstration that proves instant corruption detection.
- **Zero Hallucinations:** Engineered a strictly bounded AI explainer that never invents non-existent facts.
- **Production-Ready Architecture:** Complete with Alembic database migrations, Vercel multi-service routing, security headers (`nosniff`, `DENY`, `HSTS`), and health probes.

---

## 11. What Makes It Innovative

- **Explainability Over Black Boxes:** Moves beyond single-number risk scores by providing merchants with clear, evidence-based plain-English rationales.
- **Non-Destructive Co-Pilot:** Protects merchants from false-positive churn by offering structured review options rather than aggressive automated payment cancellations.
- **Cryptographic Trust Proof:** Provides an immutable, mathematically verifiable audit trail that merchants can use to win chargeback disputes.
- **Dual Offline / Online Resilience:** Seamlessly transitions between live PayPal Sandbox APIs and an offline gateway simulator, ensuring continuous evaluation readiness.

---

## 12. What's Next for PayShield AI

- **PayPal Dispute Auto-Packager:** One-click compilation of transaction telemetry, shipping tracking, and cryptographic audit proofs into standardized PDF evidence for PayPal Dispute Resolution.
- **Merchant Fraud Ring Consortium:** Anonymized privacy-preserving graph analysis to detect syndicates card-testing across multiple independent stores.
- **Native E-Commerce Plugins:** Native extensions for Shopify, WooCommerce, and BigCommerce.
- **WebAuthn / FIDO2 Passkeys:** Hardware-backed biometric authentication for merchant administrative consoles.

---

## 13. Built With

`react` `typescript` `vite` `tailwind-css` `fastapi` `python` `paypal-rest-api` `paypal-smart-buttons` `google-gemini` `scikit-learn` `sqlalchemy` `alembic` `recharts` `lucide-react` `framer-motion` `pytest` `docker` `vercel`

---

## 14. Project Links & Verification

- **Public GitHub Repository:** [https://github.com/saikrishnakasarla/payshield-ai](https://github.com/saikrishnakasarla/payshield-ai)
- **Live Web Application:** [https://payshield-ai-liard.vercel.app](https://payshield-ai-liard.vercel.app)
- **Direct Vercel Deployment:** [https://payshield-mkc980762-saikrishnakasarlla-1879.vercel.app](https://payshield-mkc980762-saikrishnakasarlla-1879.vercel.app)
- **Demo Video URL:** *[Insert YouTube / Vimeo Link here upon recording]*
