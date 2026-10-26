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
  Layers
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
      // 1. Create payment order server-side
      const orderData = await createUniversalPayment({
        provider: selectedProvider,
        amount,
        currency,
        customer_email: customerEmail,
        customer_name: customerName,
        item_name: itemName,
      });

      // 2. Server-side verify payment with scenario
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Unified Multi-Gateway Checkout</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Multi-Provider
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Universal sandbox test harness evaluating PayPal, Stripe, Razorpay & Adyen transactions through PayShield AI's fraud detection engine.
          </p>
        </div>

        <button
          onClick={loadProviders}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Providers
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
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/90 border-blue-500/80 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white">{info?.display_name || prov}</span>
                {info?.is_configured ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE SANDBOX
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    TEST SIMULATOR
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {info?.description || 'Test gateway environment'}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="font-mono text-slate-500">{info?.currencies.join(', ')}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Checkout Panel & Test Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Payment Simulator Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {currentProviderInfo?.display_name || selectedProvider} Test Payment
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simulate real or mock payments with server-side signature validation
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Environment</span>
                <p className="text-xs font-mono font-bold text-slate-200">
                  {currentProviderInfo?.is_configured ? 'Official Sandbox API' : 'Deterministic Mock Mode'}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">{currency}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {(currentProviderInfo?.currencies || ['USD', 'EUR', 'INR', 'GBP']).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Supported Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition ${
                    paymentMethod === 'CARD'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Credit/Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition ${
                    paymentMethod === 'UPI'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> UPI (India Test)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition ${
                    paymentMethod === 'WALLET'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Wallet className="w-4 h-4" /> Digital Wallet
                </button>
              </div>
            </div>

            {/* Test Scenario Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Simulated Test Scenario (Deterministic Verification)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'SUCCESS', label: 'Successful Payment', color: 'emerald' },
                  { id: 'DECLINED', label: 'Card Declined / Pin Error', color: 'rose' },
                  { id: 'PENDING', label: 'Awaiting UPI Auth', color: 'amber' },
                  { id: 'SUSPICIOUS', label: 'Suspicious Fraud Pattern', color: 'purple' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScenario(s.id)}
                    className={`py-2 px-2.5 rounded-lg border text-center text-xs font-medium transition ${
                      selectedScenario === s.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleExecutePayment}
              disabled={processing || amount <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> PayShield AI Risk Result
            </h3>

            {result ? (
              <div className="space-y-4">
                {/* Status banner */}
                <div className={`p-4 rounded-xl border ${
                  result.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : result.status === 'PENDING'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                    <div>
                      <h4 className="font-bold text-sm">{result.provider} {result.status}</h4>
                      <p className="text-xs opacity-90 mt-0.5">{result.message}</p>
                    </div>
                  </div>
                </div>

                {/* Score Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Risk Score</span>
                    <span className={`font-mono font-bold text-base ${
                      result.risk_evaluation.score >= 70 ? 'text-rose-400' :
                      result.risk_evaluation.score >= 35 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {result.risk_evaluation.score} / 100
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Fraud Tier</span>
                    <span className="font-bold text-slate-200">{result.risk_evaluation.risk_level}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">ML Fraud Probability</span>
                    <span className="font-mono text-slate-300">
                      {(result.risk_evaluation.ml_fraud_probability * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Hybrid Ensemble Score</span>
                    <span className="font-mono text-slate-300">{result.risk_evaluation.hybrid_score}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs">
                    <span className="text-slate-400">Reference</span>
                    <span className="font-mono text-slate-300">{result.reference_id}</span>
                  </div>
                </div>

                {/* Triggered Rules */}
                {result.risk_evaluation.triggered_rules && result.risk_evaluation.triggered_rules.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">Triggered Rules:</span>
                    <div className="space-y-1.5">
                      {result.risk_evaluation.triggered_rules.map((rule, idx) => (
                        <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs">
                          <div className="flex justify-between font-medium text-slate-200">
                            <span>{rule.rule_name}</span>
                            <span className="text-amber-400">+{rule.score_points} pts</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{rule.description || rule.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigation Link */}
                {onSelectTransaction && result.transaction_id && (
                  <button
                    onClick={() => onSelectTransaction(result.transaction_id)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 transition flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Investigation Dossier
                  </button>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Layers className="w-8 h-8 mx-auto stroke-1" />
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
