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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unified Multi-Gateway Checkout</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Multi-Provider
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Universal sandbox test harness evaluating PayPal, Stripe, Razorpay & Adyen transactions through PayShield AI's fraud detection engine.
          </p>
        </div>

        <button
          onClick={loadProviders}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition focus-ring self-start sm:self-auto"
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
                  ? 'bg-blue-50/70 border-blue-500 text-slate-900 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">{info?.display_name || prov}</span>
                {info?.is_configured ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    LIVE SANDBOX
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    TEST SIMULATOR
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                {info?.description || 'Test gateway environment'}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-mono text-slate-600 font-medium">{info?.currencies.join(', ')}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Checkout Panel & Test Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Payment Simulator Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {currentProviderInfo?.display_name || selectedProvider} Test Payment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simulate real or mock payments with server-side signature validation
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Environment</span>
                <p className="text-xs font-semibold text-slate-800">
                  {currentProviderInfo?.is_configured ? 'Official Sandbox API' : 'Deterministic Mock Mode'}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono font-medium">{currency}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                >
                  {(currentProviderInfo?.currencies || ['USD', 'EUR', 'INR', 'GBP']).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Supported Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    paymentMethod === 'CARD'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Credit/Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    paymentMethod === 'UPI'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> UPI (India Test)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    paymentMethod === 'WALLET'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Wallet className="w-4 h-4" /> Digital Wallet
                </button>
              </div>
            </div>

            {/* Test Scenario Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
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
                    className={`py-2 px-2.5 rounded-xl border text-center text-xs font-semibold transition ${
                      selectedScenario === s.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleExecutePayment}
              disabled={processing || amount <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-ring"
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
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> PayShield AI Risk Result
            </h3>

            {result ? (
              <div className="space-y-4">
                {/* Status banner */}
                <div className={`p-4 rounded-xl border ${
                  result.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : result.status === 'PENDING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <XCircle className="w-5 h-5 shrink-0 text-rose-600" />}
                    <div>
                      <h4 className="font-bold text-sm">{result.provider} {result.status}</h4>
                      <p className="text-xs opacity-90 mt-0.5">{result.message}</p>
                    </div>
                  </div>
                </div>

                {/* Score Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Risk Score</span>
                    <span className={`font-mono font-bold text-base ${
                      result.risk_evaluation.score >= 70 ? 'text-rose-600' :
                      result.risk_evaluation.score >= 35 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {result.risk_evaluation.score} / 100
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Fraud Tier</span>
                    <span className="font-bold text-slate-900">{result.risk_evaluation.risk_level}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">ML Fraud Probability</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {(result.risk_evaluation.ml_fraud_probability * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Hybrid Ensemble Score</span>
                    <span className="font-mono text-slate-900 font-semibold">{result.risk_evaluation.hybrid_score}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
                    <span className="text-slate-600">Reference</span>
                    <span className="font-mono text-slate-700">{result.reference_id}</span>
                  </div>
                </div>

                {/* Triggered Rules */}
                {result.risk_evaluation.triggered_rules && result.risk_evaluation.triggered_rules.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700">Triggered Rules:</span>
                    <div className="space-y-1.5">
                      {result.risk_evaluation.triggered_rules.map((rule, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex justify-between font-medium text-slate-800">
                            <span>{rule.rule_name}</span>
                            <span className="text-amber-600 font-bold font-mono">+{rule.score_points} pts</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{rule.description || rule.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigation Link */}
                {onSelectTransaction && result.transaction_id && (
                  <button
                    onClick={() => onSelectTransaction(result.transaction_id)}
                    className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 border border-blue-200 transition flex items-center justify-center gap-1.5 focus-ring cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Investigation Dossier
                  </button>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Layers className="w-8 h-8 mx-auto stroke-1 text-slate-400" />
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
