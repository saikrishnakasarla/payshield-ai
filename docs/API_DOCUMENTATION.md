# PayShield AI — REST API Documentation

Base URL: `http://127.0.0.1:8000/api`

### 1. Health & Configuration
- **`GET /health`**
  - Returns backend readiness, database connection, PayPal Sandbox mode, and Gemini AI status.
- **`GET /settings`**
  - Returns non-sensitive configuration parameters and current rule thresholds.
- **`POST /settings/thresholds`**
  - Request Body:
    ```json
    {
      "baseline_multiplier": 3.0,
      "velocity_window_minutes": 10,
      "medium_risk_score": 35,
      "high_risk_score": 70
    }
    ```
- **`POST /demo/reset`**
  - Resets and re-seeds the database with 32 deterministic synthetic demo records.

---

### 2. Overview Dashboard
- **`GET /dashboard/summary?timeframe=24h`**
  - Query parameters: `timeframe` (`24h`, `7d`, `30d`, `all`)
  - Returns metric cards (Risk Volume, Flagged Today, Accuracy, Latency, Under Review), Recharts timeline points, risk pattern breakdowns, high-risk origins, and recent flagged transactions.

---

### 3. Transactions & Investigation
- **`GET /transactions`**
  - Query parameters:
    - `page` (int, default 1)
    - `limit` (int, default 10)
    - `search` (string: order ID, email, name, IP)
    - `risk_level` (`ALL`, `LOW`, `MEDIUM`, `HIGH`)
    - `review_status` (`ALL`, `UNREVIEWED`, `REVIEWED_SAFE`, `ESCALATED_HUMAN_REVIEW`)
    - `sort_by` (`timestamp`, `amount`, `risk_score`)
    - `sort_order` (`asc`, `desc`)
- **`GET /transactions/{transaction_id}`**
  - Returns complete transaction metadata, line items, and latest explainable AI risk analysis.
- **`POST /transactions`**
  - Creates a transaction, immediately triggers the deterministic risk engine, calls Gemini (or fallback), and persists analysis.
- **`POST /transactions/{transaction_id}/analyze`**
  - Re-evaluates risk and refreshes the explainable AI analysis for a transaction.
- **`POST /transactions/{transaction_id}/review`**
  - Submits merchant review decision (`REVIEWED_SAFE`, `ESCALATED_HUMAN_REVIEW`), notes, and stores an audit trail.

---

### 4. PayPal Sandbox Integration
- **`GET /paypal/status`**
  - Checks PayPal Sandbox connection readiness safely without exposing credentials.
- **`POST /paypal/orders`**
  - Request Body:
    ```json
    {
      "amount": 125.00,
      "currency": "USD",
      "item_name": "Cloud Security Suite"
    }
    ```
  - Validates amount and creates PayPal Orders v2 resource on backend.
- **`POST /paypal/orders/{order_id}/capture`**
  - Executes server-side capture, verifies `COMPLETED` status, and runs transaction through PayShield AI's Risk Engine.
- **`GET /paypal/orders/{order_id}`**
  - Inspects persisted PayPal order and capture reference details.

---

### 5. Insights & Reports
- **`GET /insights`**
  - Returns aggregated processing stats, chargeback defense readiness score, top triggered rules, and AI executive summary.
- **`GET /insights/export-csv`**
  - Streams a downloadable CSV of all transactions, risk scores, and review logs.
