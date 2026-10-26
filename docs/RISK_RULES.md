# PayShield AI — Deterministic Risk Engine Specification

## Design Philosophy
Risk scoring in PayShield AI is **deterministic, explainable, and bounded between 0 and 100**. Rather than relying on opaque black-box AI outputs to invent scores, PayShield AI calculates risk using transparent, documented heuristic rules. Google Gemini is then tasked with articulating plain-English evidence, identifying ambiguities, and recommending merchant verification actions.

> **Disclaimer**: These heuristic scores represent statistical pattern variances for demonstration and merchant review; they do not constitute certified fraud probability or legal proof of malicious intent.

---

## Heuristic Rules Catalog

| Rule ID | Rule Name | Condition | Score Contribution | Category |
| :--- | :--- | :--- | :--- | :--- |
| `RULE_AMOUNT_BASELINE` | Baseline Amount Discrepancy | Amount ≥ 3.0× customer's historical average | **+35 pts** | Amount Anomaly |
| `RULE_VELOCITY_SPIKE` | High Velocity Activity | ≥ 3 payment attempts within a 10-minute window | **+25 pts** | Velocity |
| `RULE_DUPLICATE_ORDER_REF`| Duplicate Reference / Device | Identical reference ID or exact amount + device fingerprint match | **+30 pts** | Integrity |
| `RULE_ORDER_ITEM_MISMATCH`| Order Calculation Mismatch | Checkout amount differs from sum of line items by > $0.05 | **+20 pts** | Cart Integrity |
| `RULE_GEO_IP_ANOMALY` | Geolocation Inconsistency | Client IP country differs from billing country | **+22 pts** | Geolocation |
| `RULE_HIGH_FREQUENCY_BURST`| Automated Burst Traffic | ≥ 4 transactions submitted in under 60 seconds | **+18 pts** | Automation |

---

## Score Bounding & Tiers
- **Score Formula**:
  $$\text{Score} = \min(100, \max(0, \sum \text{Triggered Rule Points}))$$

- **Risk Tiers**:
  - **LOW RISK (0 – 34 pts)**: Normal transaction pattern. Recommended for immediate standard fulfillment.
  - **MEDIUM RISK (35 – 69 pts)**: Single significant deviation (e.g. substantial baseline increase or foreign IP). Requires quick merchant check.
  - **HIGH RISK (70 – 100 pts)**: Compound anomalies (e.g. high value + velocity sequence + geographic mismatch). Recommended for human escalation or address confirmation prior to shipment.
