export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReviewStatus = 'UNREVIEWED' | 'REVIEWED_SAFE' | 'ESCALATED_HUMAN_REVIEW';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  business_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface PayPalConfig {
  client_id: string | null;
  currency: string;
  environment: string;
  mock_mode: boolean;
  is_configured: boolean;
}

export interface Transaction {
  id: number;
  user_id?: number | null;
  reference_id: string;
  timestamp: string;
  amount: number;
  currency: string;
  payment_status: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_baseline_amount: number;
  customer_baseline_orders: number;
  ip_address: string;
  ip_country: string;
  billing_country: string;
  shipping_country: string;
  device_fingerprint?: string;
  items_json: string;
  is_synthetic: boolean;
  source: string;
  risk_score: number;
  risk_level: RiskLevel;
  review_status: ReviewStatus;
  review_notes?: string;
  reviewed_at?: string;
  reviewer?: string;
  // Multi-gateway fields
  provider?: string;
  provider_transaction_id?: string;
  provider_order_id?: string;
  payment_method?: string;
  // ML & multi-signal telemetry
  ml_fraud_probability?: number;
  hybrid_score?: number;
  account_age_days?: number;
  failed_attempts_24h?: number;
  feature_attributions_json?: string;
}

export interface PaymentProviderStatus {
  provider: 'PAYPAL' | 'STRIPE' | 'RAZORPAY' | 'ADYEN';
  display_name: string;
  is_configured: boolean;
  mock_mode: boolean;
  supported_methods: string[];
  currencies: string[];
  description: string;
}

export interface MultiPaymentVerifyResult {
  success: boolean;
  status: string;
  provider: string;
  transaction_id: number;
  reference_id: string;
  provider_transaction_id?: string;
  provider_order_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  risk_evaluation: {
    score: number;
    risk_level: RiskLevel;
    ml_fraud_probability: number;
    hybrid_score: number;
    triggered_rules: TriggeredRule[];
  };
  ai_explanation?: any;
  message: string;
}

export interface TriggeredRule {
  rule_id: string;
  rule_name: string;
  description: string;
  score_points: number;
  category: string;
  evidence: string;
}

export interface RiskAnalysis {
  id?: number;
  deterministic_score: number;
  risk_level: RiskLevel;
  triggered_rules: TriggeredRule[];
  ai_summary: string;
  ai_explanation: string;
  ai_uncertainties: string;
  ai_recommended_steps: string[];
  model_used: string;
  created_at?: string;
  // Calibrated ML classification
  ml_fraud_probability?: number;
  hybrid_score?: number;
  ml_risk_tier?: string;
  feature_attributions?: Record<string, number>;
  fact_registry?: {
    verified_facts: Array<{ label: string; value: any; category: string }>;
    statistical_inferences: Array<{ feature: string; value: any; risk_implication: string }>;
    system_uncertainties: string[];
  };
}

export interface MetricCardData {
  title: string;
  value: string;
  numeric_value: number;
  change_pct: string;
  change_direction: string;
  badge_label: string;
  badge_color: 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
}

export interface RiskTimelinePoint {
  timestamp_label: string;
  low_risk: number;
  medium_risk: number;
  high_risk: number;
  total_volume: number;
}

export interface RiskPatternStat {
  pattern_name: string;
  volume_formatted: string;
  raw_amount: number;
  percentage: number;
  color_hex: string;
}

export interface GeoRiskStat {
  country: string;
  country_code: string;
  attempts: number;
  flag_rate: number;
}

export interface ModelHealthStat {
  metric: string;
  value: string;
  description: string;
}

export interface DashboardSummary {
  timeframe: string;
  is_demo: boolean;
  metrics: Record<string, MetricCardData>;
  timeline: RiskTimelinePoint[];
  risk_by_pattern: RiskPatternStat[];
  high_risk_origins: GeoRiskStat[];
  model_health: ModelHealthStat[];
  recent_flagged: Array<{
    id: number;
    reference_id: string;
    amount: number;
    currency: string;
    risk_score: number;
    risk_level: RiskLevel;
    timestamp: string;
    customer_name: string;
    ip_country: string;
  }>;
  total_transactions: number;
  flagged_count: number;
  review_queue_count: number;
}

export interface InsightsData {
  total_volume: number;
  avg_transaction_amount: number;
  risk_distribution: Record<string, number>;
  top_triggered_rules: Array<{
    rule_id: string;
    name: string;
    count: number;
    points: number;
  }>;
  chargeback_readiness_score: number;
  ai_executive_summary: string;
  insights_generated_at: string;
}

export interface PayPalStatus {
  is_configured: boolean;
  mode: string;
  client_id_configured: boolean;
  client_secret_configured: boolean;
  mock_mode: boolean;
  api_endpoint: string;
}

export interface MetricDefinition {
  formula: string;
  meaning: string;
}

export interface PublicBenchmarkSample {
  id: string;
  ground_truth: 'LEGITIMATE' | 'FRAUDULENT';
  amount: number;
  baseline_ratio: number;
  velocity_10m: number;
  geo_mismatch: boolean;
  account_age_days: number;
  ml_fraud_prob: number;
  ml_predicted: string;
  rules_predicted: string;
  outcome: string;
  note?: string;
}

export interface PublicBenchmarkResponse {
  dataset_name: string;
  evaluation_provenance: string;
  held_out_test_records: number;
  training_records: number;
  fraud_prevalence_pct: number;
  metrics: {
    precision: number;
    recall: number;
    pr_auc: number;
    roc_auc: number;
    f1_score: number;
    brier_score: number;
    false_positive_rate: number;
    missed_fraud_rate: number;
  };
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  system_comparison: {
    rules_only: {
      precision: number;
      recall: number;
      pr_auc: number;
      false_positive_rate: number;
      missed_fraud_rate: number;
      description: string;
    };
    random_forest: {
      precision: number;
      recall: number;
      pr_auc: number;
      false_positive_rate: number;
      missed_fraud_rate: number;
      description: string;
    };
    payshield_hybrid: {
      precision: number;
      recall: number;
      pr_auc: number;
      false_positive_rate: number;
      missed_fraud_rate: number;
      description: string;
    };
  };
  feature_importances: Record<string, number>;
  metric_definitions: Record<string, MetricDefinition>;
  sample_evaluations: PublicBenchmarkSample[];
}

export interface AuditVerificationResponse {
  is_valid: boolean;
  total_records_checked: number;
  verified_at: string;
  status: 'VERIFIED_SECURE' | 'TAMPER_DETECTED' | 'EMPTY_CHAIN';
  tampered_records: Array<{
    record_id: number;
    issue: string;
    action: string;
  }>;
  algorithm: string;
}

export interface ShowcaseScenario {
  id: string;
  title: string;
  badge: string;
  badge_color: 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan';
  description: string;
  customer: string;
  amount: number;
  currency: string;
  customer_baseline: number;
  account_age_days: number;
  failed_attempts_24h: number;
  ip_country: string;
  billing_country: string;
  device: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  expected_model_decision: {
    rule_score: number;
    ml_fraud_probability: number;
    risk_tier: string;
    recommended_action: string;
  };
  recommended_human_action: string;
  audit_guarantee: string;
}

export interface SimulateScenarioResponse {
  scenario_id: string;
  transaction_id: number;
  reference_id: string;
  telemetry_inputs: Record<string, any>;
  model_decision: {
    rule_score: number;
    ml_fraud_probability: number;
    hybrid_score: number;
    risk_tier: RiskLevel;
    recommended_action: string;
  };
  explanation: {
    summary: string;
    uncertainties: string;
    recommended_steps: string[];
    grounded_evidence: string[];
  };
  audit_record: {
    action: string;
    entity_id: string;
    entry_hash: string;
    previous_hash: string;
    signature: string;
    chained: boolean;
  };
}
