import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Sparkles,
  Info,
  Key,
  Sliders,
  Check,
  Cpu
} from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { 
  createPayPalOrder, 
  capturePayPalOrder, 
  fetchPayPalStatus, 
  fetchPayPalConfig,
  updatePayPalCredentials
} from '../../lib/api';
import { PayPalStatus, PayPalConfig, RiskLevel } from '../../lib/types';
import { RiskBadge } from '../../components/RiskBadge';

interface PayPalSandboxCheckoutProps {
  onTransactionCaptured?: (txnId: number) => void;
}

export const PayPalSandboxCheckout: React.FC<PayPalSandboxCheckoutProps> = ({
  onTransactionCaptured,
}) => {
  const [statusInfo, setStatusInfo] = useState<PayPalStatus | null>(null);
  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'sdk' | 'simulator'>('simulator');
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'high_value' | 'custom'>('standard');
  const [amount, setAmount] = useState<number>(125.0);
  const [itemName, setItemName] = useState<string>('Developer Cloud Suite (Pro)');
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedReceipt, setCapturedReceipt] = useState<any | null>(null);

  // Credentials drawer / configuration state
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [inputClientId, setInputClientId] = useState<string>('');
  const [inputClientSecret, setInputClientSecret] = useState<string>('');
  const [isSavingCreds, setIsSavingCreds] = useState<boolean>(false);
  const [credSaveSuccess, setCredSaveSuccess] = useState<string | null>(null);

  const refreshPayPalInfo = async () => {
    try {
      const [status, config] = await Promise.all([fetchPayPalStatus(), fetchPayPalConfig()]);
      setStatusInfo(status);
      setPaypalConfig(config);
      if (config.client_id && config.client_id.trim().length > 10) {
        setActiveTab('sdk');
      }
    } catch (err) {
      console.error('Failed to get PayPal info:', err);
    }
  };

  useEffect(() => {
    refreshPayPalInfo();
  }, []);

  const handlePlanSelect = (plan: 'standard' | 'high_value' | 'custom') => {
    setSelectedPlan(plan);
    setErrorMessage(null);
    if (plan === 'standard') {
      setAmount(125.0);
      setItemName('Developer Cloud Suite (Pro)');
    } else if (plan === 'high_value') {
      setAmount(2850.0);
      setItemName('Enterprise Bulk License & Workstations');
    }
  };

  const handleSimulatedCreateAndCapture = async () => {
    setErrorMessage(null);
    setCapturedReceipt(null);
    setIsCreatingOrder(true);
    try {
      const orderRes = await createPayPalOrder(amount, itemName);
      setActiveOrderId(orderRes.paypal_order_id);
      setIsCapturing(true);
      const capRes = await capturePayPalOrder(orderRes.paypal_order_id);
      setCapturedReceipt(capRes);
      setActiveOrderId(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation checkout failed.');
    } finally {
      setIsCreatingOrder(false);
      setIsCapturing(false);
    }
  };

  const handleSaveCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputClientId.trim() || !inputClientSecret.trim()) {
      setErrorMessage('Both Client ID and Secret are required to connect Sandbox.');
      return;
    }
    setIsSavingCreds(true);
    setErrorMessage(null);
    setCredSaveSuccess(null);
    try {
      const res = await updatePayPalCredentials({
        client_id: inputClientId.trim(),
        client_secret: inputClientSecret.trim(),
      });
      setStatusInfo(res);
      await refreshPayPalInfo();
      setCredSaveSuccess('Sandbox credentials saved & validated successfully!');
      setTimeout(() => setCredSaveSuccess(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to validate credentials with PayPal OAuth.');
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleQuickFillDemoSandbox = () => {
    setInputClientId('AeA1QIZXiflr1_-3Dr7bP577upXd68Z13PvCKzs9w8wYBRnPym50GqdNWVN_n_nhnAhOxHH0DQWBae1n');
    setInputClientSecret('EDn-8Zf18d7Wd2hBf04yC_eB4V-y4u3sZ9b8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f');
  };

  const hasLiveClientId = !!(paypalConfig?.client_id && paypalConfig.client_id.trim().length > 10);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-[#121721] border border-cyan-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Official PayPal Sandbox Gateway</h3>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${
                hasLiveClientId
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {hasLiveClientId ? 'LIVE SANDBOX SDK ACTIVE' : 'OFFLINE SIMULATOR READY'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Orders are generated on the backend and captured via server verification. No actual funds are charged.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] hover:bg-[#18202F] text-slate-300 border border-[#1F293D] text-xs font-mono transition-all"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showConfigDrawer ? 'Hide Credentials' : 'Configure Sandbox API'}</span>
          </button>
          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            Target: <span className="text-slate-200">api-m.sandbox.paypal.com</span>
          </div>
        </div>
      </div>

      {/* Interactive Credentials Drawer */}
      {showConfigDrawer && (
        <div className="bg-[#121721] border border-cyan-500/30 rounded-2xl p-5 space-y-4 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
                PayPal Developer Sandbox Credentials
              </h4>
            </div>
            <button
              type="button"
              onClick={handleQuickFillDemoSandbox}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
            >
              Fill Sandbox Test Keys
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Provide your PayPal Developer portal REST App credentials (<code className="text-slate-200">client_id</code> & <code className="text-slate-200">client_secret</code>). Credentials are encrypted and used solely for authenticating sandbox orders against <code className="text-cyan-400">api-m.sandbox.paypal.com</code>.
          </p>

          <form onSubmit={handleSaveCredentials} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Sandbox Client ID</label>
                <input
                  type="text"
                  value={inputClientId}
                  onChange={(e) => setInputClientId(e.target.value)}
                  placeholder="e.g. AeA1QIZXiflr1_-3Dr7bP..."
                  className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Sandbox Secret</label>
                <input
                  type="password"
                  value={inputClientSecret}
                  onChange={(e) => setInputClientSecret(e.target.value)}
                  placeholder="e.g. EDn-8Zf18d7Wd2hBf04y..."
                  className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {credSaveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{credSaveSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfigDrawer(false)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingCreds}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingCreds ? 'Verifying with PayPal...' : 'Save & Verify Credentials'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main 2-Column Checkout & Verification Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Order Creator (6 cols) */}
        <div className="lg:col-span-6 bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              Sandbox Test Payment
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Step 1: Merchant Checkout</span>
          </div>

          {/* Flow Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-[#0B0E14] p-1 border border-[#1F293D]">
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-[#18202F] text-cyan-300 shadow-sm border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Offline Gateway Simulator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sdk')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'sdk'
                  ? 'bg-[#18202F] text-cyan-300 shadow-sm border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official Smart Buttons (SDK)</span>
            </button>
          </div>

          {/* Test Preset Buttons */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Select Test Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handlePlanSelect('standard')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPlan === 'standard'
                    ? 'bg-rose-500/10 border-rose-500/40 text-slate-100 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'bg-[#0B0E14] border-[#1F293D] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs font-mono text-emerald-400">$125.00</div>
                <div className="text-[11px] truncate mt-0.5">Standard Normal</div>
                <div className="text-[10px] text-slate-500 font-mono">Expected: Low Risk</div>
              </button>

              <button
                type="button"
                onClick={() => handlePlanSelect('high_value')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPlan === 'high_value'
                    ? 'bg-rose-500/10 border-rose-500/40 text-slate-100 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'bg-[#0B0E14] border-[#1F293D] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs font-mono text-amber-400">$2,850.00</div>
                <div className="text-[11px] truncate mt-0.5">High-Value Spike</div>
                <div className="text-[10px] text-slate-500 font-mono">Expected: Med/High</div>
              </button>

              <button
                type="button"
                onClick={() => handlePlanSelect('custom')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPlan === 'custom'
                    ? 'bg-rose-500/10 border-rose-500/40 text-slate-100 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'bg-[#0B0E14] border-[#1F293D] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs font-mono text-cyan-400">Custom</div>
                <div className="text-[11px] truncate mt-0.5">User Amount</div>
                <div className="text-[10px] text-slate-500 font-mono">Any Test Value</div>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Item Description</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Server-Validated Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  disabled={selectedPlan !== 'custom'}
                  className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl pl-8 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 font-mono disabled:opacity-70"
                />
              </div>
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab 1: Live SDK Smart Buttons */}
          {activeTab === 'sdk' && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Official PayPal JavaScript SDK Smart Buttons</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">Real Pop-up Authentication</span>
              </div>
              
              {hasLiveClientId ? (
                <PayPalScriptProvider
                  options={{
                    clientId: paypalConfig!.client_id!,
                    currency: 'USD',
                    intent: 'capture',
                  }}
                >
                  <div className="rounded-xl overflow-hidden bg-[#0B0E14] p-3 border border-[#1F293D]">
                    <PayPalButtons
                      style={{
                        layout: 'vertical',
                        color: 'gold',
                        shape: 'rect',
                        label: 'paypal',
                      }}
                      createOrder={async () => {
                        setErrorMessage(null);
                        setCapturedReceipt(null);
                        try {
                          const res = await createPayPalOrder(amount, itemName);
                          setActiveOrderId(res.paypal_order_id);
                          return res.paypal_order_id;
                        } catch (err: any) {
                          setErrorMessage(err.message || 'Failed to initialize order on server');
                          throw err;
                        }
                      }}
                      onApprove={async (data) => {
                        setIsCapturing(true);
                        setErrorMessage(null);
                        try {
                          const res = await capturePayPalOrder(data.orderID);
                          setCapturedReceipt(capResToReceipt(res));
                          setActiveOrderId(null);
                        } catch (err: any) {
                          setErrorMessage(err.message || 'Payment capture failed');
                        } finally {
                          setIsCapturing(false);
                        }
                      }}
                      onError={(err) => {
                        console.error('PayPal SDK error:', err);
                        setErrorMessage('PayPal checkout encountered an error. Check sandbox credentials.');
                      }}
                      onCancel={() => {
                        setErrorMessage('Buyer approval was cancelled.');
                      }}
                    />
                  </div>
                </PayPalScriptProvider>
              ) : (
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-amber-500/30 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-300 font-mono">
                        Sandbox Client ID Not Configured
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        To render the live PayPal smart button pop-up, configure your sandbox credentials above, or use the <strong>Offline Gateway Simulator</strong> tab.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfigDrawer(true)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-medium transition-all"
                  >
                    Open Credential Setup
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Offline Simulator */}
          {activeTab === 'simulator' && (
            <div className="p-4 rounded-xl bg-[#0B0E14] border border-cyan-500/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-cyan-300 font-mono">
                    Deterministic & ML Multi-Signal Simulator
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Simulates instant buyer approval and executes server-side validation, Random Forest classification, and cryptographically chained audit logging.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulatedCreateAndCapture}
                disabled={isCreatingOrder || isCapturing || amount <= 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-mono text-xs font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreatingOrder || isCapturing ? (
                  <span>Executing Server Capture & Screening...</span>
                ) : (
                  <>
                    <span>Execute Sandbox Payment (${amount.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Server Verification & Capture Receipt (6 cols) */}
        <div className="lg:col-span-6 bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Live Server Verification & Capture
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Step 2: PayShield Multi-Signal Screening</span>
          </div>

          {!capturedReceipt ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-[#1F293D] rounded-xl">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p>Awaiting buyer approval and server capture.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Captured orders trigger the Random Forest ML Model, Heuristic Rules, and Gemini AI Explainer.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Receipt Success Banner */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-300 font-mono">
                    Payment Verified & Captured with PayPal Sandbox
                  </h5>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    Order ID <span className="font-mono font-bold">{capturedReceipt.paypal_order_id}</span> status:{' '}
                    <span className="font-mono font-bold text-emerald-400">{capturedReceipt.status}</span>
                  </p>
                </div>
              </div>

              {/* Receipt Breakdown */}
              <div className="bg-[#0B0E14] border border-[#1F293D] rounded-xl p-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Capture Reference:</span>
                  <span className="text-slate-200 font-bold">{capturedReceipt.capture_id || 'CAP-SANDBOX-VERIFIED'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Amount Settled:</span>
                  <span className="text-slate-100 font-bold">${capturedReceipt.amount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Verified Buyer:</span>
                  <span className="text-slate-200">{capturedReceipt.payer_email}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Database Txn ID:</span>
                  <span className="text-cyan-400 font-bold">#{capturedReceipt.transaction_id}</span>
                </div>
              </div>

              {/* Multi-Signal ML Risk Evaluation Widget */}
              {capturedReceipt.risk_evaluation && (
                <div className="bg-[#18202F] border border-[#2D3A54] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5 font-bold">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      AI / ML Risk Evaluation
                    </span>
                    <RiskBadge
                      level={capturedReceipt.risk_evaluation.level as RiskLevel}
                      score={capturedReceipt.risk_evaluation.score}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#0B0E14] p-3 rounded-xl border border-[#1F293D] text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">ML Fraud Prob P(Fraud)</div>
                      <div className="text-base font-bold text-cyan-400">
                        {((capturedReceipt.risk_evaluation.ml_fraud_probability || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Hybrid Ensemble Score</div>
                      <div className="text-base font-bold text-emerald-400">
                        {(capturedReceipt.risk_evaluation.hybrid_score !== undefined 
                          ? capturedReceipt.risk_evaluation.hybrid_score 
                          : capturedReceipt.risk_evaluation.score).toFixed(1)}/100
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {capturedReceipt.risk_evaluation.ai_summary}
                  </p>
                </div>
              )}

              {/* Jump to Investigation Action */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    setCapturedReceipt(null);
                    setActiveOrderId(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0B0E14] hover:bg-[#18202F] text-slate-300 border border-[#1F293D] text-xs font-mono transition-all"
                >
                  Create Another Test Order
                </button>

                {capturedReceipt.transaction_id && onTransactionCaptured && (
                  <button
                    onClick={() => onTransactionCaptured(capturedReceipt.transaction_id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono transition-all shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                  >
                    <span>Inspect In Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

function capResToReceipt(res: any): any {
  return res;
}
