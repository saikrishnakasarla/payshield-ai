import {
  DashboardSummary,
  Transaction,
  RiskAnalysis,
  InsightsData,
  PayPalStatus,
  PayPalConfig,
  User,
  AuthResponse,
  RegisterResponse,
  PublicBenchmarkResponse,
  AuditVerificationResponse,
  ShowcaseScenario,
  SimulateScenarioResponse
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export function getStoredToken(): string | null {
  return localStorage.getItem('payshield_auth_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('payshield_auth_token', token);
  } else {
    localStorage.removeItem('payshield_auth_token');
  }
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponseError(res: Response, defaultMessage: string): Promise<never> {
  const errorData = await res.json().catch(() => ({}));
  const msg = errorData.detail || errorData.message || defaultMessage;
  throw new Error(msg);
}

// Authentication APIs
export async function registerApi(data: {
  email: string;
  password: string;
  full_name: string;
  business_name?: string;
}): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed');
  }
  const result: RegisterResponse = await res.json();
  // Security rule: Registration MUST NOT establish an authenticated session.
  return result;
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Invalid email or password');
  }
  const result: AuthResponse = await res.json();
  setStoredToken(result.access_token);
  return result;
}

export async function logoutApi(): Promise<void> {
  setStoredToken(null);
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Session expired or unauthorized');
  return res.json();
}

export async function forgotPasswordApi(email: string): Promise<{ message: string; reset_token?: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Password reset request failed');
  }
  return res.json();
}

export async function resetPasswordApi(data: {
  token: string;
  new_password: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Password reset failed');
  }
  return res.json();
}

// Dashboard & Transaction APIs
export async function fetchDashboardSummary(timeframe: string = '24h'): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary?timeframe=${timeframe}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to load dashboard summary');
  return res.json();
}

export async function fetchTransactions(params: {
  page?: number;
  limit?: number;
  search?: string;
  risk_level?: string;
  review_status?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<{ total: number; items: Transaction[]; page: number; limit: number; pages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.search) query.append('search', params.search);
  if (params.risk_level && params.risk_level !== 'ALL') query.append('risk_level', params.risk_level);
  if (params.review_status && params.review_status !== 'ALL') query.append('review_status', params.review_status);
  if (params.sort_by) query.append('sort_by', params.sort_by);
  if (params.sort_order) query.append('sort_order', params.sort_order);

  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to fetch transactions');
  return res.json();
}

export async function fetchTransactionDetail(id: number): Promise<{
  transaction: Transaction & { items: Array<{ name: string; price: number; quantity: number }> };
  latest_analysis: RiskAnalysis;
  risk_analysis?: RiskAnalysis;
  evidence_breakdown?: any;
  timeline?: any[];
  customer_history?: any[];
}> {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, `Failed to load transaction #${id}`);
  return res.json();
}

export async function analyzeTransactionWithAI(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/transactions/${id}/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to run AI risk analysis');
  return res.json();
}

export async function submitReviewAction(
  id: number,
  review_status: 'REVIEWED_SAFE' | 'ESCALATED_HUMAN_REVIEW',
  notes: string,
  reviewer: string = 'Merchant User'
): Promise<any> {
  const res = await fetch(`${API_BASE}/transactions/${id}/review`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ review_status, notes, reviewer }),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to update review status');
  return res.json();
}

export async function fetchInsights(): Promise<InsightsData> {
  const res = await fetch(`${API_BASE}/insights`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to load insights');
  return res.json();
}

// PayPal Integration APIs
export async function fetchPayPalStatus(): Promise<PayPalStatus> {
  const res = await fetch(`${API_BASE}/paypal/status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to get PayPal status');
  return res.json();
}

export async function fetchPayPalConfig(): Promise<PayPalConfig> {
  const res = await fetch(`${API_BASE}/paypal/config`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to get PayPal public configuration');
  return res.json();
}

export async function createPayPalOrder(amount: number, itemName: string): Promise<any> {
  const res = await fetch(`${API_BASE}/paypal/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      amount,
      currency: 'USD',
      item_name: itemName,
      customer_email: 'sandbox.buyer@business.example.com',
      customer_name: 'Sandbox Test Buyer'
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Backend failed to create PayPal order');
  }
  return res.json();
}

export async function capturePayPalOrder(orderId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/paypal/orders/${orderId}/capture`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Backend failed to capture PayPal order');
  }
  return res.json();
}

// Settings & System APIs
export async function resetDemoDatabase(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to reset demo database');
  }
  return res.json();
}

export async function fetchSettings(): Promise<any> {
  const res = await fetch(`${API_BASE}/settings`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to load settings');
  return res.json();
}

export async function updateThresholds(thresholds: {
  baseline_multiplier: number;
  velocity_window_minutes: number;
  medium_risk_score: number;
  high_risk_score: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/thresholds`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(thresholds),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update thresholds');
  }
  return res.json();
}

/**
 * Fetches real PayPal Sandbox captures from the dedicated dashboard endpoint.
 * These are transactions that were genuinely captured via PayPal API (not simulated).
 * They appear here separately from synthetic demo data.
 */
export async function fetchPayPalTransactions(limit: number = 50): Promise<{
  count: number;
  transactions: Array<{
    transaction_id: number;
    reference_id: string;
    paypal_order_id: string | null;
    capture_id: string | null;
    amount: number;
    currency: string;
    payment_status: string;
    payer_email: string;
    payer_name: string;
    risk_score: number;
    risk_level: string;
    review_status: string;
    timestamp: string;
    source: string;
    is_synthetic: boolean;
  }>;
  source_filter: string;
  note: string;
}> {
  const res = await fetch(`${API_BASE}/dashboard/paypal-transactions?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to fetch PayPal transactions');
  return res.json();
}

// ==========================================
// Public Fraud Benchmark & Evaluation APIs
// ==========================================
export async function fetchPublicBenchmark(): Promise<PublicBenchmarkResponse> {
  const res = await fetch(`${API_BASE}/benchmark/public-dataset`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to load public dataset benchmark evaluation');
  return res.json();
}

// ==========================================
// Decision Showcase Scenarios APIs
// ==========================================
export async function fetchShowcaseScenarios(): Promise<{
  total_scenarios: number;
  scenarios: ShowcaseScenario[];
  rubric_coverage: Record<string, string>;
}> {
  const res = await fetch(`${API_BASE}/scenarios/showcase`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to load showcase scenarios');
  return res.json();
}

export async function simulateScenario(scenarioId: string): Promise<SimulateScenarioResponse> {
  const res = await fetch(`${API_BASE}/scenarios/simulate/${scenarioId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, `Failed to simulate showcase scenario: ${scenarioId}`);
  return res.json();
}

// ==========================================
// Security & Cryptographic Audit APIs
// ==========================================
export async function verifyAuditTrail(): Promise<AuditVerificationResponse> {
  const res = await fetch(`${API_BASE}/audit/verify`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to verify cryptographic audit trail');
  return res.json();
}

export async function fetchAuditLogs(limit: number = 25): Promise<{
  total: number;
  returned: number;
  entries: Array<{
    id: number;
    action: string;
    entity_type: string;
    entity_id: string;
    performed_by: string;
    timestamp: string;
    details: string;
    previous_hash: string;
    entry_hash: string;
    signature: string;
  }>;
  is_chained: boolean;
  hash_algorithm: string;
}> {
  const res = await fetch(`${API_BASE}/audit/logs?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to fetch signed audit trail logs');
  return res.json();
}

export async function runAuditTamperTest(): Promise<{
  demonstration: string;
  description: string;
  tamper_detected: boolean;
  tamper_evidence: any[];
  self_repair_status: string;
  reverified_clean: boolean;
}> {
  const res = await fetch(`${API_BASE}/audit/tamper-test`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to run audit tampering demonstration');
  return res.json();
}

// ==========================================
// PayPal Credentials Update API
// ==========================================
export async function updatePayPalCredentials(credentials: {
  client_id: string;
  client_secret: string;
}): Promise<PayPalStatus> {
  const res = await fetch(`${API_BASE}/paypal/credentials`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(credentials),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to update PayPal credentials');
  return res.json();
}

// ==========================================
// Multi-Gateway Universal Payments APIs
// ==========================================
export async function fetchPaymentProviders(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/payments/providers`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to fetch payment providers');
  return res.json();
}

export async function createUniversalPayment(data: {
  provider: string;
  amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  item_name: string;
  metadata?: Record<string, any>;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/payments/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to create payment order');
  return res.json();
}

export async function verifyUniversalPayment(data: {
  provider: string;
  payment_id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  customer_email?: string;
  customer_name?: string;
  test_scenario?: string;
  payment_method?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleResponseError(res, 'Failed to verify payment outcome');
  return res.json();
}
