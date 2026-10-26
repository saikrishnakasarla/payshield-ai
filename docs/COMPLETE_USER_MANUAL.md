# 📘 PayShield AI — Complete User Manual & Interactive Element Inventory

This document serves as the complete operational guide for the **PayShield AI** web application. It documents every page, workflow, and interactive element across the entire user interface.

---

## 1. Complete Inventory of All Interactive Elements

The following table provides an exhaustive audit of every button, icon, link, dropdown, filter, and modal control in PayShield AI.

| UI Element | Page / Component | Purpose | How to Use | Actual Action / API Called | Expected Result | Status | Source Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Shield Logo** | Sidebar (`Sidebar.tsx`) | Return to Overview Dashboard | Click icon at top left | Navigation to `/` | Loads Overview Dashboard | Verified Working | `frontend/src/components/Sidebar.tsx` |
| **Overview Nav Link** | Sidebar (`Sidebar.tsx`) | Navigate to main analytics | Click Grid icon | Navigation to `/` | Overview Dashboard rendered | Verified Working | `frontend/src/components/Sidebar.tsx` |
| **Transaction Monitor Link** | Sidebar (`Sidebar.tsx`) | Open transaction ledger | Click Bell/List icon | Navigation to `/transactions` | Transaction Monitor page loaded | Verified Working | `frontend/src/components/Sidebar.tsx` |
| **PayPal Sandbox Link** | Sidebar (`Sidebar.tsx`) | Open payment test simulator | Click CreditCard icon | Navigation to `/sandbox` | Sandbox Checkout view rendered | Verified Working | `frontend/src/components/Sidebar.tsx` |
| **Insights Link** | Sidebar (`Sidebar.tsx`) | View risk reports & export | Click BarChart icon | Navigation to `/insights` | Insights & Defense page loaded | Verified Working | `frontend/src/components/Sidebar.tsx` |
| **Settings Link** | Sidebar (`Sidebar.tsx`) | Configure heuristic rules | Click Sliders icon | Navigation to `/settings` | Settings & Rules view loaded | Verified Working | `frontend/src/components/Sidebar.tsx` |
| **User Profile Pill** | Sidebar (`Sidebar.tsx`) | View current logged-in user | Click avatar circle | Navigation to `/settings` | Directs to settings/profile | Verified Working | `frontend/src/components/Sidebar.tsx` |
| **Merchant Sign In (Sidebar)** | Sidebar (`Sidebar.tsx`) | Sign in when unauthenticated | Click LogIn icon | Navigation to `/signin` | Opens Sign-In form | Verified Working | `frontend/src/components/Sidebar.tsx` |
| **Merchant Sign In (Header)** | Header (`Header.tsx`) | Login shortcut | Click button in header | Navigation to `/signin` | Opens Sign-In form | Verified Working | `frontend/src/components/Header.tsx` |
| **Header Sign Out Button** | Header (`Header.tsx`) | Terminate merchant session | Click LogOut icon next to name | Clears token & cookie | Session ended; redirects to unauthenticated state | Verified Working | `frontend/src/components/Header.tsx` |
| **Timeframe Pills (24H, 7D, 30D)**| Header (`Header.tsx`) | Filter dashboard timeframe | Click 24H, 7D, or 30D | `GET /api/dashboard/summary?timeframe={tf}` | Recharts timeline & metrics re-render for selected period | Verified Working | `frontend/src/components/Header.tsx` |
| **Test Sandbox Header Button** | Header (`Header.tsx`) | Quick navigation to checkout | Click "Test Sandbox" pill | Navigation to `/sandbox` | Opens PayPal Sandbox view | Verified Working | `frontend/src/components/Header.tsx` |
| **Reset Demo Header Button** | Header (`Header.tsx`) | Restore clean 32 seed txns | Click "Reset Demo" | `POST /api/demo/reset` | Resets SQLite database; reloads current page | Verified Working (Requires Auth) | `frontend/src/components/Header.tsx` |
| **Recent Flagged Item Card** | Overview (`OverviewDashboard.tsx`) | Inspect flagged order dossier | Click any transaction card | Sets `selectedTransactionId` | Opens Transaction Investigation Modal | Verified Working | `frontend/src/pages/OverviewDashboard.tsx` |
| **Search Bar** | Monitor (`TransactionFilters.tsx`) | Search by ID, name, email, IP | Type query in input field | `GET /api/transactions?search={val}` | Filters table rows dynamically | Verified Working | `frontend/src/features/transactions/TransactionFilters.tsx` |
| **Risk Tier Dropdown** | Monitor (`TransactionFilters.tsx`) | Filter by Low, Med, High | Select option from dropdown | `GET /api/transactions?risk_level={val}` | Filters table by risk severity | Verified Working | `frontend/src/features/transactions/TransactionFilters.tsx` |
| **Review Status Dropdown** | Monitor (`TransactionFilters.tsx`) | Filter by review progress | Select status from dropdown | `GET /api/transactions?review_status={val}`| Filters by Unreviewed/Safe/Escalated | Verified Working | `frontend/src/features/transactions/TransactionFilters.tsx` |
| **Sort Field Dropdown** | Monitor (`TransactionFilters.tsx`) | Sort by time, amount, score | Select field from dropdown | `GET /api/transactions?sort_by={val}` | Reorders table items | Verified Working | `frontend/src/features/transactions/TransactionFilters.tsx` |
| **Sort Order Toggle** | Monitor (`TransactionFilters.tsx`) | Toggle ASC / DESC | Click sort arrow icon | Toggles `sortOrder` state | Inverts sorting direction | Verified Working | `frontend/src/features/transactions/TransactionFilters.tsx` |
| **Table Row Click** | Monitor (`TransactionTable.tsx`) | Open investigation dossier | Click anywhere on table row | Sets `selectedTransactionId` | Opens Investigation Modal | Verified Working | `frontend/src/features/transactions/TransactionTable.tsx` |
| **"Investigate" Button** | Monitor (`TransactionTable.tsx`) | Open investigation dossier | Click Eye "Investigate" button | Sets `selectedTransactionId` | Opens Investigation Modal | Verified Working | `frontend/src/features/transactions/TransactionTable.tsx` |
| **Pagination Previous** | Monitor (`TransactionTable.tsx`) | View prior page of orders | Click left chevron `<` | `GET /api/transactions?page={p-1}` | Renders prior page rows | Verified Working | `frontend/src/features/transactions/TransactionTable.tsx` |
| **Pagination Next** | Monitor (`TransactionTable.tsx`) | View next page of orders | Click right chevron `>` | `GET /api/transactions?page={p+1}` | Renders next page rows | Verified Working | `frontend/src/features/transactions/TransactionTable.tsx` |
| **Standard \$125 Test Plan** | Sandbox (`PayPalSandboxCheckout.tsx`)| Select low-risk scenario | Click "Standard Normal" card | Updates amount state to 125.00 | Pre-fills \$125.00 USD | Verified Working | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **High-Value \$2,850 Test Plan**| Sandbox (`PayPalSandboxCheckout.tsx`)| Select spike risk scenario | Click "High-Value Spike" card | Updates amount state to 2850.00 | Pre-fills \$2,850.00 USD | Verified Working | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **Custom Test Plan** | Sandbox (`PayPalSandboxCheckout.tsx`)| Enter custom test amount | Click "Custom" card | Unlocks amount input field | Allows arbitrary numeric input | Verified Working | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **Item Description Input** | Sandbox (`PayPalSandboxCheckout.tsx`)| Custom order line item | Type custom item name | Updates `itemName` state | Sets item name sent to PayPal | Verified Working | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **Amount Input Field** | Sandbox (`PayPalSandboxCheckout.tsx`)| Specify custom payment amount | Type numeric dollar value | Updates `amount` state | Sets amount validated server-side | Verified Working | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **PayPal Smart Buttons** | Sandbox (`PayPalSandboxCheckout.tsx`)| Official PayPal approval popup| Click yellow PayPal button | `createOrder` $\to$ SDK popup $\to$ `onApprove` | Executes real Sandbox capture | Runtime Verification Req (Live Key) | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **Simulate Sandbox Checkout** | Sandbox (`PayPalSandboxCheckout.tsx`)| Offline test checkout | Click amber simulation button | `POST /api/paypal/orders` $\to$ `POST .../capture` | Verifies order and scores immediately | Verified Working | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **"Create Another Test Order"** | Sandbox (`PayPalSandboxCheckout.tsx`)| Clear receipt & reset form | Click button below receipt | Clears `capturedReceipt` state | Resets checkout form | Verified Working | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **"Inspect in Dossier" Button** | Sandbox (`PayPalSandboxCheckout.tsx`)| Jump directly to new order | Click cyan action button | Calls `onTransactionCaptured(id)` | Opens Investigation Modal for new txn | Verified Working | `frontend/src/features/payments/PayPalSandboxCheckout.tsx` |
| **Download CSV Ledger Button** | Insights (`InsightsReports.tsx`)| Export complete CSV audit | Click "Download CSV Ledger" | `window.open('/api/insights/export-csv')` | Browser downloads `payshield_transactions.csv` | Verified Working | `frontend/src/pages/InsightsReports.tsx` |
| **Save Thresholds Button** | Settings (`SettingsDocs.tsx`) | Save custom rule thresholds | Click "Save Thresholds" | `POST /api/settings/thresholds` | Persists thresholds; updates runtime memory | Verified Working (Requires Auth) | `frontend/src/pages/SettingsDocs.tsx` |
| **Re-Seed Database Button** | Settings (`SettingsDocs.tsx`) | Restore 32 seed transactions | Click "Reset to Clean 32 Seed" | `POST /api/demo/reset` | Resets SQLite database | Verified Working (Requires Auth) | `frontend/src/pages/SettingsDocs.tsx` |
| **Modal Close Button (X)** | Modal (`TransactionInvestigationModal.tsx`)| Close investigation dossier | Click X icon in top right | Calls `onClose()` | Closes modal overlay | Verified Working | `frontend/src/features/transactions/TransactionInvestigationModal.tsx` |
| **"Re-analyze with AI" Button**| Modal (`AIExplanationCard.tsx`) | Trigger fresh Gemini synthesis | Click Sparkles "Re-analyze" | `POST /api/transactions/{id}/analyze` | Fetches fresh AI explanation | Verified Working | `frontend/src/features/risk/AIExplanationCard.tsx` |
| **"Add Note" / "Hide Note"** | Modal (`TransactionInvestigationModal.tsx`)| Expand audit note box | Click "Add Note" button | Toggles `showNoteInput` state | Displays textarea for merchant note | Verified Working | `frontend/src/features/transactions/TransactionInvestigationModal.tsx` |
| **"Mark Reviewed Safe"** | Modal (`TransactionInvestigationModal.tsx`)| Record benign resolution | Click green "Mark Reviewed Safe" | `POST /api/transactions/{id}/review` | Updates status to `REVIEWED_SAFE` | Verified Working | `frontend/src/features/transactions/TransactionInvestigationModal.tsx` |
| **"Escalate to Human Review"**| Modal (`TransactionInvestigationModal.tsx`)| Flag order for follow-up | Click red "Escalate" button | `POST /api/transactions/{id}/review` | Updates status to `ESCALATED_HUMAN_REVIEW` | Verified Working | `frontend/src/features/transactions/TransactionInvestigationModal.tsx` |
| **Show/Hide Password Icons** | Auth (`SignIn.tsx`, `SignUp.tsx`) | Toggle password visibility | Click Eye / EyeOff icon | Toggles `showPassword` state | Switches input between text and password | Verified Working | `frontend/src/pages/auth/SignIn.tsx` |
| **Sign In Submit Button** | Auth (`SignIn.tsx`) | Authenticate merchant | Click "Sign In" | `POST /api/auth/login` | Authenticates; saves JWT; redirects to app | Verified Working | `frontend/src/pages/auth/SignIn.tsx` |
| **Sign Up Submit Button** | Auth (`SignUp.tsx`) | Register new merchant | Click "Create Account" | `POST /api/auth/register` | Registers; saves JWT; redirects to app | Verified Working | `frontend/src/pages/auth/SignUp.tsx` |
| **Forgot Password Link** | Auth (`SignIn.tsx`) | Recover account password | Click "Forgot password?" | Navigation to `/forgot-password` | Opens password recovery form | Verified Working | `frontend/src/pages/auth/SignIn.tsx` |
| **Request Reset Token Button** | Auth (`ForgotPassword.tsx`) | Generate password reset token | Click "Send Reset Instructions" | `POST /api/auth/forgot-password` | Generates token; displays copy button | Verified Working | `frontend/src/pages/auth/ForgotPassword.tsx` |
| **Copy Token Button** | Auth (`ForgotPassword.tsx`) | Copy dev token to clipboard | Click copy icon button | Copies token to clipboard | Visual checkmark confirmation shown | Verified Working | `frontend/src/pages/auth/ForgotPassword.tsx` |
| **Reset Password Submit** | Auth (`ResetPassword.tsx`) | Change account password | Click "Reset Password" | `POST /api/auth/reset-password` | Updates password; redirects to login | Verified Working | `frontend/src/pages/auth/ResetPassword.tsx` |

---

## 2. Page-by-Page Operational Guide

### 1. Overview Dashboard (`/`)
- **Purpose:** Primary telemetry monitoring command center for real-time transaction volume, risk trends, geographic origin anomalies, and detection accuracy.
- **When to Use:** Daily monitoring, executive presentations, and checking current system health.
- **Key Actions:**
  - Switch time horizons between **24H**, **7D**, and **30D** using the header pills.
  - Hover over the Recharts area chart to view precise High vs. Medium risk counts at specific timestamps.
  - Click any card in the **Recent Flagged** section to immediately open the full investigation dossier for that transaction.

### 2. Transaction Monitor (`/transactions`)
- **Purpose:** Comprehensive, sortable, and filterable ledger containing all recorded payment transactions (both synthetic demo records and real PayPal Sandbox payments).
- **When to Use:** Investigating multiple orders, searching for specific customer names or transaction IDs, and filtering the review queue.
- **Key Actions:**
  - **Search:** Enter an Order Reference (e.g. `ORD-8821`), customer name (`Elena Rostova`), or email in the search box.
  - **Filter by Risk:** Select **High Risk**, **Medium Risk**, or **Low Risk** from the dropdown.
  - **Filter by Review Status:** Select **Unreviewed**, **Reviewed Safe**, or **Escalated** to manage merchant workflow.
  - **Investigate:** Click the **Investigate** button or anywhere on the row to launch the investigation dossier modal.

### 3. Transaction Investigation Dossier (Modal Overlay)
- **Purpose:** Deep-dive forensic dossier for an individual transaction.
- **When to Use:** Deciding whether to fulfill an order, contact a customer, or hold shipment.
- **Key Sections:**
  - **Left Column (Details):** Amount, customer email, historical average baseline comparison, IP address vs. billing country, and line item breakdown.
  - **Center Column (Deterministic Heuristics):** Circular SVG risk gauge ($0-100$) and itemized breakdown of triggered rules showing exact point contributions and empirical evidence.
  - **Right Column (AI Explanation):** Plain-English executive summary, explanation of evidence, uncertainties analysis, and actionable merchant checklist generated by Gemini.
  - **Bottom Actions:**
    - Click **Add Note** to record human investigation reasoning.
    - Click **Mark Reviewed Safe** if customer verification succeeds.
    - Click **Escalate to Human Review** if suspicious signals warrant manual follow-up.

### 4. PayPal Sandbox Checkout & Interceptor (`/sandbox`)
- **Purpose:** Demonstrable checkout flow connecting the official PayPal Sandbox to the PayShield backend.
- **When to Use:** Demonstrating live payment capture and immediate risk scoring during a presentation or hackathon judging session.
- **Key Actions:**
  - Choose a preset test scenario (**Standard Normal \$125**, **High-Value Spike \$2,850**, or **Custom Amount**).
  - If a live `PAYPAL_CLIENT_ID` is present, click the official gold PayPal button to log in with a Sandbox buyer account and approve payment.
  - If operating offline or without credentials, click **Simulate Sandbox Checkout**.
  - Review the instant server-side capture receipt and instant risk scoring badge.
  - Click **Inspect In Dossier** to view the newly captured order in the investigation modal.

### 5. Insights & Chargeback Defense (`/insights`)
- **Purpose:** Aggregated risk intelligence, chargeback readiness benchmarking, and audit export.
- **When to Use:** Preparing monthly security reviews or exporting data for banking disputes.
- **Key Actions:**
  - Review the **Chargeback Defense Score** (benchmarked against the $1.0\%$ industry chargeback threshold).
  - Inspect the **Top Triggered Heuristic Rules** table across your entire transaction portfolio.
  - Click **Download CSV Ledger** to immediately download `payshield_transactions.csv` containing full audit records and reviewer timestamps.

### 6. Settings & Rule Configuration (`/settings`)
- **Purpose:** Customize the risk engine's mathematical thresholds, verify API credentials status, and manage the demo database.
- **When to Use:** Adjusting sensitivity for high-volume seasons (e.g., Black Friday) or resetting the demo database before a presentation.
- **Key Actions:**
  - Adjust the **Baseline Amount Multiplier** (e.g., from $3.0\times$ to $4.0\times$).
  - Adjust the **Velocity Window** (e.g., from $10$ minutes to $15$ minutes).
  - Click **Save Thresholds** (requires logged-in merchant account).
  - Click **Reset to Clean 32 Seed Transactions** to restore reproducible test data.
