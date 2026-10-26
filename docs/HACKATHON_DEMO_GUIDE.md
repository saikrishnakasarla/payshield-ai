# ⏱️ PayShield AI — 5-Minute Hackathon Demo Script

This guide provides an exact, step-by-step presentation script designed for hackathon judges, faculty reviewers, and technical audiences.

---

## Pitch Overview (30 Seconds)
> "Good morning, judges. We are presenting **PayShield AI**, an explainable financial protection assistant for PayPal merchants. 
> Small business owners face thousands of dollars in chargeback fees and lost merchandise from suspicious transactions, but they don't have dedicated fraud departments. Traditional fraud tools give them opaque scores like 'Risk 78' without explaining *why* or what to do next, leading to panic and cancelled good orders. 
> PayShield AI combines **deterministic heuristic rules** with **Google Gemini AI** and the **official PayPal Sandbox Orders API** to provide transparent, explainable risk intelligence that any merchant can understand."

---

## Step 1: The Overview Dashboard (1 Minute)

1. **Page to Open:** [https://payshield-ai-liard.vercel.app/](https://payshield-ai-liard.vercel.app/)
2. **What to Show:**
   - **Top Metric Cards:** Point out *Monitored Processing Volume*, *Flagged Today*, *Deterministic Accuracy (99.4%)*, and *Average Latency (142ms)*.
   - **Detection Timeline:** Hover over the Recharts area chart showing High vs. Medium risk transactions over time. Click the **24H**, **7D**, and **30D** pills in the header to demonstrate dynamic time filtering.
   - **High-Risk Origins & Fraud by Pattern:** Show how the system breaks down anomalies by geography (IP vs. billing country mismatch) and pattern types (Amount Spikes, Velocity, Cart Discrepancies).
3. **Talking Point:**
   > "Notice the 'DEMO DATA' badge. We follow strict honesty rules: our dashboard comes pre-seeded with 32 realistic synthetic transactions so judges can inspect edge cases immediately without waiting for real payment history."

---

## Step 2: Transaction Monitor & Forensic Dossier (1.5 Minutes)

1. **Page to Open:** Click **Transaction Monitor** in the sidebar (`/transactions`).
2. **What to Show:**
   - **Search & Filters:** In the search bar, type `Elena Rostova` or `ORD-8821`. Filter by **High Risk**.
   - **Click to Investigate:** Click the **Investigate** button on transaction `ORD-8821` (\$2,850.00).
3. **Modal Dossier Breakdown:**
   - **Left Column:** Show that Elena's average order is \$100, but this order is \$2,850—a **28.5x increase**. Show that her IP is in Nigeria while her billing address is in the United States.
   - **Center Column (Deterministic Score):** Show the circular gauge at **75/100 (High Risk)**. Highlight the exact triggered rules:
     - `RULE_AMOUNT_BASELINE`: +35 pts (Amount is 28.5x customer baseline).
     - `RULE_GEO_IP_ANOMALY`: +22 pts (IP Nigeria vs. Billing US).
     - `RULE_HIGH_FREQUENCY_BURST`: +18 pts (4 attempts in under 60 seconds).
   - **Right Column (Explainable AI):** Show Google Gemini's narrative:
     - **Summary:** Concise executive briefing.
     - **Explanation:** Plain-English breakdown of the evidence.
     - **Uncertainties:** Acknowledges what remains unknown (e.g. legitimate gift purchase or customer traveling).
     - **Actionable Steps:** 3 concrete steps (verify shipping address, contact customer, hold expedited delivery).
4. **Talking Point:**
   > "Notice the critical architectural design: Gemini did NOT invent the score of 75. The score was computed by pure mathematical rules. Gemini's job is to explain the evidence in human terms and suggest safe merchant steps."

---

## Step 3: Non-Destructive Merchant Decision (30 Seconds)

1. **In the Open Modal:**
   - Click the **Add Note** button.
   - Type: `Called customer on file; phone number disconnected. Holding physical shipment.`
   - Click the red **Escalate to Human Review** button.
2. **Result:**
   - The status updates immediately to `ESCALATED_HUMAN_REVIEW` with timestamp and reviewer name recorded in the database audit log.
3. **Talking Point:**
   > "PayShield AI follows a strict 'Review-Only' principle. We never automatically block real consumer bank accounts or cancel orders without human oversight, protecting small businesses from false-positive churn."

---

## Step 4: PayPal Sandbox Payment & Live Intercept (1 Minute)

1. **Page to Open:** Click **PayPal Sandbox Checkout** in the sidebar (`/sandbox`).
2. **What to Show:**
   - Click the **High-Value Spike (\$2,850.00)** test scenario.
   - Click **Simulate Sandbox Checkout** (or click the gold PayPal Smart Button if live Sandbox credentials are tied).
3. **Result:**
   - The backend creates an order with PayPal (`POST /v2/checkout/orders`), executes the capture (`POST .../capture`), and validates that the captured amount matches the created order.
   - An instant **Server Capture Receipt** appears alongside an **Instant Risk Evaluation Badge** (Score: 75, High Risk).
   - Click **Inspect in Dossier** to jump directly into forensic analysis of the newly captured order!
4. **Talking Point:**
   > "Our payment flow is verified on the backend. The frontend cannot fake a payment; the capture is validated server-to-server with PayPal, and the resulting transaction is screened by the risk engine in real time."

---

## Step 5: Insights & CSV Export (30 Seconds)

1. **Page to Open:** Click **Insights & Reports** in the sidebar (`/insights`).
2. **What to Show:**
   - Point out the **Chargeback Defense Score (84/100)** and industry benchmark notice.
   - Click **Download CSV Ledger**.
3. **Result:**
   - Browser immediately downloads `payshield_transactions.csv` containing the complete audit trail, scores, AI summaries, and reviewer notes.
4. **Concluding Pitch:**
   > "In conclusion, PayShield AI gives small merchants the superpower of an enterprise fraud team. It provides mathematical reliability, explainable AI narratives, and seamless PayPal integration. Thank you, and we welcome your questions!"
