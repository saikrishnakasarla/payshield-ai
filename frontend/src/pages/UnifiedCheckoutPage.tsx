import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Smartphone,
  Wallet,
  Globe2,
  Lock,
  Layers,
  Zap
} from 'lucide-react';
import { fetchPaymentProviders, createUniversalPayment, verifyUniversalPayment } from '../lib/api';
import { PaymentProviderStatus, MultiPaymentVerifyResult } from '../lib/types';

interface UnifiedCheckoutPageProps {
  onSelectTransaction?: (id: number) => void;
}

export const UnifiedCheckoutPage: React.FC<UnifiedCheckoutPageProps> = ({ onSelectTransaction }) => {
  const [providers, setProviders] = useState<PaymentProviderStatus[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'PAYPAL' | 'STRIPE' | 'RAZORPAY' | 'ADYEN'>('STRIPE');
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(125.00);
  const [currency, setCurrency] = useState<string>('USD');
  const [itemName, setItemName] = useState<string>('Cloud Enterprise License');
  const [customerEmail, setCustomerEmail] = useState<string>('merchant.shopper@example.com');
  const [customerName, setCustomerName] = useState<string>('Alex Johnson');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'WALLET'>('CARD');
  const [selectedScenario, setSelectedScenario] = useState<string>('SUCCESS');
  const [result, setResult] = useState<MultiPaymentVerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await fetchPaymentProviders();
      setProviders(data);
    } catch (err: any) {
      console.error('Failed to load payment providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleProviderSelect = (prov: 'PAYPAL' | 'STRIPE' | 'RAZORPAY' | 'ADYEN') => {
    setSelectedProvider(prov);
    setResult(null);
    setErrorMsg(null);
    if (prov === 'RAZORPAY') {
      setCurrency('INR');
      setPaymentMethod('UPI');
    } else if (prov === 'ADYEN') {
      setCurrency('EUR');
      setPaymentMethod('CARD');
    } else {
      setCurrency('USD');
      setPaymentMethod('CARD');
    }
  };

  const currentProviderInfo = providers.find((p) => p.provider === selectedProvider);

  const handleExecutePayment = async () => {
    setProcessing(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const orderData = await createUniversalPayment({
        provider: selectedProvider,
        amount,
        currency,
        customer_email: customerEmail,
        customer_name: customerName,
        item_name: itemName,
      });

      const verifyRes = await verifyUniversalPayment({
        provider: selectedProvider,
        payment_id: orderData.order_id,
        order_id: orderData.order_id,
        amount,
        currency,
        customer_email: customerEmail,
        customer_name: customerName,
        test_scenario: selectedScenario,
        payment_method: paymentMethod,
      });

      setResult(verifyRes);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment execution failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soc-cyan/20 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Unified Multi-Gateway Checkout</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-soc-teal/15 text-soc-teal border border-soc-teal/30 shadow-[0_0_8px_rgba(0,245,200,0.15)]">
              <ShieldCheck className="w-3.5 h-3.5" /> Multi-Provider
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soc-textMuted mt-1">
            Universal sandbox test harness evaluating PayPal, Stripe, Razorpay & Adyen transactions through PayShield AI's fraud detection engine.
          </p>
        </div>

        <button
          onClick={loadProviders}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-soc-secondary hover:bg-soc-elevated text-soc-text hover:text-white text-xs font-medium border border-soc-cyan/25 transition focus-ring self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-soc-cyan' : ''}`} />
          <span>Refresh Providers</span>
        </button>
      </div>

      {/* Provider Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['PAYPAL', 'STRIPE', 'RAZORPAY', 'ADYEN'] as const).map((prov) => {
          const info = providers.find((p) => p.provider === prov);
          const isSelected = selectedProvider === prov;

          return (
            <button
              key={prov}
              onClick={() => handleProviderSelect(prov)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-soc-card border-soc-cyan text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'bg-soc-secondary/80 border-soc-cyan/20 text-soc-textMuted hover:bg-soc-card hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white">{info?.display_name || prov}</span>
                {info?.is_configured ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-soc-teal/15 text-soc-teal border border-soc-teal/30">
                    LIVE SANDBOX
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-soc-warning/15 text-soc-warning border border-soc-warning/30">
                    TEST SIMULATOR
                  </span>
                )}
              </div>
              <p className="text-xs text-soc-textMuted line-clamp-2">
                {info?.description || 'Test gateway environment'}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-soc-textMuted font-mono">
                <span>{info?.currencies.join(', ')}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Checkout Panel & Test Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Payment Simulator Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-soc-cyan/25 bg-soc-card/90 p-6 space-y-5 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-soc-cyan/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-soc-cyan/15 text-soc-cyan border border-soc-cyan/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {currentProviderInfo?.display_name || selectedProvider} Test Payment
                  </h3>
                  <p className="text-xs text-soc-textMuted">
                    Simulate real or mock payments with server-side signature validation
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-soc-textMuted">Environment</span>
                <p className="text-xs font-semibold text-soc-cyan">
                  {currentProviderInfo?.is_configured ? 'Official Sandbox API' : 'Deterministic Mock Mode'}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-soc-text mb-1 font-sans">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3 py-2 text-white font-mono text-sm focus:bg-soc-secondary focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/20"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-soc-cyan font-mono font-medium">{currency}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-soc-text mb-1 font-sans">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3 py-2 text-white text-sm focus:bg-soc-secondary focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/20 cursor-pointer"
                >
                  {(currentProviderInfo?.currencies || ['USD', 'EUR', 'INR', 'GBP']).map((c) => (
                    <option key={c} value={c} className="bg-soc-secondary text-white">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-soc-text mb-1 font-sans">Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3 py-2 text-white text-sm focus:bg-soc-secondary focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/20 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-soc-text mb-1 font-sans">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3 py-2 text-white text-sm focus:bg-soc-secondary focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/20 font-sans"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-soc-text mb-2 font-sans">Supported Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'bg-soc-cyan/20 border-soc-cyan text-soc-cyan shadow-[0_0_10px_rgba(0,229,255,0.25)]'
                      : 'bg-soc-secondary/80 border-soc-cyan/20 text-soc-textMuted hover:text-white hover:bg-soc-secondary'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Credit/Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'bg-soc-teal/20 border-soc-teal text-soc-teal shadow-[0_0_10px_rgba(0,245,200,0.25)]'
                      : 'bg-soc-secondary/80 border-soc-cyan/20 text-soc-textMuted hover:text-white hover:bg-soc-secondary'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> UPI (India Test)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    paymentMethod === 'WALLET'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                      : 'bg-soc-secondary/80 border-soc-cyan/20 text-soc-textMuted hover:text-white hover:bg-soc-secondary'
                  }`}
                >
                  <Wallet className="w-4 h-4" /> Digital Wallet
                </button>
              </div>
            </div>

            {/* Test Scenario Selector */}
            <div>
              <label className="block text-xs font-semibold text-soc-text mb-2 font-sans">
                Simulated Test Scenario (Deterministic Verification)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'SUCCESS', label: 'Successful Payment' },
                  { id: 'DECLINED', label: 'Card Declined' },
                  { id: 'PENDING', label: 'Awaiting Auth' },
                  { id: 'SUSPICIOUS', label: 'Suspicious Fraud' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScenario(s.id)}
                    className={`py-2 px-2.5 rounded-xl border text-center text-xs font-semibold transition cursor-pointer ${
                      selectedScenario === s.id
                        ? 'btn-cyan-gradient text-soc-bg font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                        : 'bg-soc-secondary/80 border-soc-cyan/20 text-soc-textMuted hover:text-white hover:bg-soc-secondary'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-soc-danger/15 border border-soc-danger/30 text-soc-danger text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-soc-danger" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleExecutePayment}
              disabled={processing || amount <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-cyan-gradient text-soc-bg font-bold text-sm transition shadow-[0_0_20px_rgba(0,229,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-ring"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Server-Side & Scoring Fraud...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Process & Score Payment with {selectedProvider}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Instant Fraud Evaluation Result */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-soc-cyan/25 bg-soc-card/90 p-6 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 font-sans">
              <ShieldCheck className="w-4 h-4 text-soc-teal" /> PayShield AI Risk Result
            </h3>

            {result ? (
              <div className="space-y-4">
                {/* Status banner */}
                <div className={`p-4 rounded-xl border ${
                  result.success 
                    ? 'bg-soc-teal/15 border-soc-teal/40 text-soc-teal' 
                    : result.status === 'PENDING'
                    ? 'bg-soc-warning/15 border-soc-warning/40 text-soc-warning'
                    : 'bg-soc-danger/15 border-soc-danger/40 text-soc-danger'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0 text-soc-teal" /> : <XCircle className="w-5 h-5 shrink-0 text-soc-danger" />}
                    <div>
                      <h4 className="font-bold text-sm text-white">{result.provider} {result.status}</h4>
                      <p className="text-xs opacity-90 mt-0.5">{result.message}</p>
                    </div>
                  </div>
                </div>

                {/* Score Card */}
                <div className="p-4 rounded-xl bg-soc-secondary/80 border border-soc-cyan/20 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-soc-textMuted">Risk Score</span>
                    <span className={`font-bold text-base ${
                      result.risk_evaluation.score >= 70 ? 'text-soc-danger' :
                      result.risk_evaluation.score >= 35 ? 'text-soc-warning' : 'text-soc-teal'
                    }`}>
                      {result.risk_evaluation.score} / 100
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-soc-textMuted">Fraud Tier</span>
                    <span className="font-bold text-white">{result.risk_evaluation.risk_level}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-soc-textMuted">ML Fraud Probability</span>
                    <span className="font-semibold text-white">
                      {(result.risk_evaluation.ml_fraud_probability * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-soc-textMuted">Hybrid Ensemble Score</span>
                    <span className="font-semibold text-soc-cyan">{result.risk_evaluation.hybrid_score}</span>
                  </div>

                  <div className="pt-2 border-t border-soc-cyan/15 flex justify-between text-xs">
                    <span className="text-soc-textMuted">Reference</span>
                    <span className="text-soc-cyan">{result.reference_id}</span>
                  </div>
                </div>

                {/* Triggered Rules */}
                {result.risk_evaluation.triggered_rules && result.risk_evaluation.triggered_rules.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-soc-textMuted">Triggered Rules:</span>
                    <div className="space-y-1.5">
                      {result.risk_evaluation.triggered_rules.map((rule, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-soc-secondary/80 border border-soc-cyan/20 text-xs">
                          <div className="flex justify-between font-medium text-white">
                            <span>{rule.rule_name}</span>
                            <span className="text-soc-danger font-bold font-mono">+{rule.score_points} pts</span>
                          </div>
                          <p className="text-[11px] text-soc-textMuted mt-0.5">{rule.description || rule.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigation Link */}
                {onSelectTransaction && result.transaction_id && (
                  <button
                    onClick={() => onSelectTransaction(result.transaction_id)}
                    className="w-full py-2 px-3 rounded-xl bg-soc-secondary hover:bg-soc-cyan hover:text-soc-bg text-xs font-semibold text-soc-cyan border border-soc-cyan/30 transition flex items-center justify-center gap-1.5 focus-ring cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Investigation Dossier
                  </button>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-soc-textMuted space-y-2">
                <Layers className="w-8 h-8 mx-auto stroke-1 text-soc-cyan/50" />
                <p className="text-xs">
                  Select a provider, configure test payment parameters, and click process to view live server-side fraud analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
