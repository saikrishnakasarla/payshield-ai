# PayShield AI — Security, Privacy & Trust Architecture

**Document Version:** 2.0  
**Target:** FinTech Application Security, Payment Integrity & Privacy Policy  
**Project:** PayShield AI (PayPal AI Hackathon 2026)  

---

## 1. Security Architecture Principles

PayShield AI is architected from the ground up on the principle of **Defense-in-Depth**. As a payment risk intelligence platform, protecting merchant data, buyer privacy, and financial credentials is core to its operational integrity.

---

## 2. Authentication & Session Management

- **Password Hashing:** Passwords are never stored in plaintext. They are hashed using **bcrypt** via Passlib with adaptive work factors (12 rounds minimum), mitigating offline dictionary and rainbow table attacks.
- **Session Tokens:** Authentication generates cryptographically signed JSON Web Tokens (JWT) using HMAC-SHA256. 
- **Token Lifespan:** Access tokens are time-bounded (`ACCESS_TOKEN_EXPIRE_MINUTES=1440`, 24 hours) and must be supplied via the `Authorization: Bearer <token>` HTTP header on all protected API routes.
- **Registration Flow:** User registration strictly creates the account record without issuing an active token. The user is redirected back to the Sign-In page to authenticate explicitly, preventing accidental session hijacking.

---

## 3. Merchant-Level Data Isolation (Multi-Tenancy)

- **Tenant Scoping:** Every merchant is assigned an isolated database identity (`merchant_id`).
- **Query Boundary Enforcement:** All transaction lookups, rule configurations, and audit logs are bounded by `WHERE merchant_id = current_user.id`.
- **Cross-Tenant Access Defense:** If a merchant attempts to read, capture, or analyze an order belonging to another tenant, the backend intercepts the query and rejects it with `HTTP 403 Forbidden` (`"Access denied: Transaction belongs to another merchant account"`).

---

## 4. Payment Verification & Integrity

- **Server-Side Validation:** All order amounts, currency ISO codes, and line items are validated by the FastAPI backend before creating orders with PayPal's API. Client-side price tampering is mathematically impossible.
- **Independent Capture:** Funds are never captured on the client side. The frontend receives only an approval token from the PayPal pop-up and requests capture from the backend. The backend communicates directly with `https://api-m.sandbox.paypal.com` to verify payment completion.
- **Non-Destructive Review Operations:** PayShield AI acts as an advisory co-pilot. It flags suspicious orders for manual merchant review ("Mark Reviewed Safe", "Escalate to Human Review") and **never** automatically cancels payments or blocks real customer cards at the banking level, eliminating false-positive revenue churn.

---

## 5. PayPal Credential Protection

- **Server-Side Storage Only:** Credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`) reside exclusively in server-side environment variables or encrypted backend records.
- **Redaction in API Responses:** API endpoints that return configuration status (such as `GET /api/paypal/credentials`) strictly redact the Client Secret and display only a 12-character preview (`client_id_preview`) of the Client ID.
- **Zero Frontend Bundle Exposure:** Build tooling verifies that client-side Vite bundles never contain secret keys, certificates, or private environment variables.

---

## 6. Webhook Signature Verification & Idempotency

- **Cryptographic Signature Verification:** Webhook payloads received at `/api/paypal/webhook` are verified using PayPal transmission headers (`PAYPAL-AUTH-ALGO`, `PAYPAL-CERT-URL`, `PAYPAL-TRANSMISSION-SIG`). The server validates the cryptographic signature against PayPal's public certificate chain before processing events.
- **Replay Protection & Idempotency:** Every incoming event contains an ID (`event_id`). The system checks the `processed_webhook_events` table before processing. If an event has already been recorded, the handler returns `HTTP 200 OK` immediately without re-triggering transactions or modifying financial state.

---

## 7. Database Integrity & Persistence

- **Foreign Key Enforcement:** SQLite runs in Write-Ahead Logging (`WAL`) mode with `PRAGMA foreign_keys = ON;`. In production, PostgreSQL enforces relational referential integrity across all models.
- **Atomic Transactions:** SQLAlchemy unit-of-work patterns wrap multi-table modifications inside atomic database transactions (`session.commit()` with rollback on failure), preventing partial database states.
- **Declarative Migrations:** Schema evolution is strictly managed via Alembic version-controlled migrations under `backend/alembic`.

---

## 8. Cryptographic Hash Chain Audit Trail

PayShield AI implements an RFC 6962-inspired **Tamper-Evident Audit Trail**:
- Every audit event computes a cryptographic SHA-256 hash incorporating the current record payload, the preceding event's hash (`previous_hash`), and a UTC timestamp:
  $$\text{Hash}_n = \text{SHA-256}(\text{RecordPayload} \parallel \text{Hash}_{n-1} \parallel \text{Timestamp})$$
- The hash is further signed using the merchant's HMAC-SHA256 secret.
- **Mathematical Tamper Detection:** If an unauthorized database administrator or attacker modifies any historical transaction row in the database, the cryptographic chain breaks. The automated verification endpoint (`/api/audit/verify`) detects the corruption instantly.

---

## 9. PII Minimization & Customer Privacy

- **PCI-DSS Scope Minimization:** Credit card numbers, expiration dates, and CVV codes are entered directly by consumers into PayPal's hosted iframe/modal. PayShield AI **never receives, processes, or stores raw payment card data**.
- **Data Minimization:** Only transaction reference IDs, sanitized buyer email addresses, billing country codes, and IP addresses are retained for fraud detection heuristics.
- **Synthetic Data Isolation:** Demo scenarios and benchmark transactions are explicitly watermarked (`is_synthetic: true`) and kept distinct from genuine Sandbox API captures.

---

## 10. AI Safety & Grounding Boundaries

- **Zero Hallucination Guarantee:** The Google Gemini 1.5 Flash explainer is governed by a strict system prompt that confines the model to summarize only verified database facts (e.g. numerical velocity counts, IP country, baseline multipliers). The model is forbidden from inventing hypothetical buyer behaviors or claiming real-world criminal guilt.
- **Deterministic Fallback:** If the external Gemini API is unreachable, times out, or lacks an API key, the system automatically activates the **Deterministic Rule Explainer**. This ensures 100% service uptime and zero downtime dependency on external LLM availability.

---

## 11. Production Configuration & Security Headers

In production environments (`APP_ENV=production`), the application enforces:
- `DEBUG=false`: Stack traces and internal exception details are suppressed.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `X-Frame-Options: DENY`: Protects against clickjacking attacks.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`: Mandates HTTPS.
- `X-Request-ID`: Injects a unique UUID into every HTTP response for distributed request tracing.
- **CORS Allowlist:** Cross-Origin Resource Sharing is strictly constrained to approved production domains (`FRONTEND_ORIGIN`).

---

## 12. Responsible Vulnerability Disclosure

If you discover a security vulnerability in PayShield AI, please report it responsibly:
- **Contact:** Open a private security advisory on GitHub or email the development team at `security@payshield.ai`.
- **Response Timeline:** We acknowledge vulnerability reports within 24 hours and aim to release remediation patches within 72 hours.
- **Guidelines:** Please do not disclose vulnerabilities publicly or exploit them against demo environments before a patch is published.
