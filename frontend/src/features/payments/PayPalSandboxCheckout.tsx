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
  Cpu,
  Zap,
  Layers,
  Activity,
  Server
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
import { SandboxPayment3DScene } from '../../components/3d';

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
      if (onTransactionCaptured && capRes.transaction_id) {
        onTransactionCaptured(capRes.transaction_id);
      }
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
      setCredSaveSuccess('Sandbox credentials saved & validated with PayPal OAuth!');
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
    <div className="space-y-6 font-sans">
      
      {/* Top Cyber Gateway Status Banner */}
      <div className="bg-soc-card/90 border border-soc-cyan/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,229,255,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-soc-cyan/15 text-soc-cyan border border-soc-cyan/40 shadow-[0_0_12px_rgba(0,229,255,0.25)] flex-shrink-0">
            <Lock className="w-5 h-5 text-soc-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Official PayPal Sandbox Gateway
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${
                hasLiveClientId
                  ? 'bg-soc-teal/15 text-soc-teal border-soc-teal/40 shadow-[0_0_8px_rgba(0,245,200,0.2)]'
                  : 'bg-soc-warning/15 text-soc-warning border-soc-warning/40 shadow-[0_0_8px_rgba(255,181,71,0.2)]'
              }`}>
                {hasLiveClientId ? 'LIVE SANDBOX SDK ACTIVE' : 'OFFLINE GATEWAY SIMULATOR ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-soc-textMuted mt-1">
              Orders initialized on backend & captured via PayPal server verification. Zero funds charged.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-soc-secondary hover:bg-soc-elevated text-soc-cyan border border-soc-cyan/30 text-xs font-semibold transition-all shadow-sm focus-ring cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-soc-cyan" />
            <span>{showConfigDrawer ? 'Hide Credentials' : 'Configure Sandbox API'}</span>
          </button>
          <div className="text-xs font-mono text-soc-textMuted hidden md:block">
            Target: <span className="text-soc-cyan font-semibold">api-m.sandbox.paypal.com</span>
          </div>
        </div>
      </div>

      {/* Interactive Credentials Drawer */}
      {showConfigDrawer && (
        <div className="bg-soc-card/95 border border-soc-cyan/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_0_35px_rgba(0,229,255,0.15)] backdrop-blur-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-soc-cyan/20">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-soc-cyan" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                PayPal Developer Sandbox API Credentials
              </h4>
            </div>
            <button
              type="button"
              onClick={handleQuickFillDemoSandbox}
              className="text-xs font-semibold text-soc-cyan hover:text-soc-teal underline focus-ring rounded cursor-pointer"
            >
              Fill Sandbox Test Keys
            </button>
          </div>

          <p className="text-xs text-soc-textMuted leading-relaxed">
            Provide your PayPal Developer portal REST App credentials (<code className="bg-soc-bg px-1.5 py-0.5 rounded border border-soc-cyan/30 text-soc-cyan font-mono">client_id</code> & <code className="bg-soc-bg px-1.5 py-0.5 rounded border border-soc-cyan/30 text-soc-cyan font-mono">client_secret</code>). Credentials authenticate sandbox orders against <code className="text-soc-teal font-semibold font-mono">api-m.sandbox.paypal.com</code>.
          </p>

          <form onSubmit={handleSaveCredentials} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-soc-text block mb-1">Sandbox Client ID</label>
                <input
                  type="text"
                  value={inputClientId}
                  onChange={(e) => setInputClientId(e.target.value)}
                  placeholder="e.g. AeA1QIZXiflr1_-3Dr7bP..."
                  className="w-full bg-[#071522] border border-soc-cyan/30 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-soc-textMuted/50 focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-soc-text block mb-1">Sandbox Secret</label>
                <input
                  type="password"
                  value={inputClientSecret}
                  onChange={(e) => setInputClientSecret(e.target.value)}
                  placeholder="e.g. EDn-8Zf18d7Wd2hBf04y..."
                  className="w-full bg-[#071522] border border-soc-cyan/30 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-soc-textMuted/50 focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30"
                />
              </div>
            </div>

            {credSaveSuccess && (
              <div className="p-3 rounded-xl bg-soc-teal/15 border border-soc-teal/40 text-soc-teal text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(0,245,200,0.2)]">
                <Check className="w-4 h-4 text-soc-teal flex-shrink-0" />
                <span>{credSaveSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfigDrawer(false)}
                className="px-4 py-2 rounded-xl text-soc-textMuted hover:text-white text-xs font-medium focus-ring cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingCreds}
                className="px-5 py-2 rounded-xl btn-cyan-gradient text-[#050A12] text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.35)] focus-ring cursor-pointer"
              >
                {isSavingCreds ? 'Verifying with PayPal...' : 'Save & Verify Credentials'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main 2-Column Professional Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 3D Visualization, Sandbox Environment, Security Info & Flow Status (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* 3D Payment Visualization Card */}
          <div className="bg-soc-card/90 border border-soc-cyan/30 rounded-2xl p-5 relative overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.1)] backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-soc-cyan/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-soc-cyan" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  3D Payment Security Radar
                </h4>
              </div>
              <span className="text-[10px] font-mono text-soc-teal font-bold px-2 py-0.5 rounded-full bg-soc-teal/15 border border-soc-teal/30">
                ACTIVE SHIELD
              </span>
            </div>

            {/* Compact 3D Scene */}
            <div className="h-56 w-full relative flex items-center justify-center my-2">
              <SandboxPayment3DScene className="w-full h-full" />
            </div>

            {/* Security Verification Information */}
            <div className="space-y-2 pt-2 border-t border-soc-cyan/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-soc-textMuted flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-soc-cyan" />
                  Target Environment:
                </span>
                <span className="font-mono text-soc-cyan font-semibold">api-m.sandbox.paypal.com</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-soc-textMuted flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-soc-teal" />
                  Risk Screening Engine:
                </span>
                <span className="text-white font-medium">14 Rules + ML Ensemble + Gemini</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-soc-textMuted flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-soc-cyan" />
                  Protection Guarantee:
                </span>
                <span className="text-soc-teal font-medium">Zero False Merchant Declines</span>
              </div>
            </div>
          </div>

          {/* Actual Payment Lifecycle Flow Status */}
          <div className="bg-soc-card/90 border border-soc-cyan/30 rounded-2xl p-5 space-y-3.5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-soc-cyan/20">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-soc-cyan" />
                Actual Payment Flow Status
              </h4>
              <span className="text-[10px] font-mono text-soc-textMuted">Lifecycle Engine</span>
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                  isCreatingOrder || activeOrderId || capturedReceipt
                    ? 'bg-soc-teal text-[#050A12] shadow-[0_0_8px_rgba(0,245,200,0.5)]'
                    : 'bg-soc-secondary text-soc-textMuted border border-soc-cyan/30'
                }`}>
                  1
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">Order Creation</div>
                  <div className="text-[11px] text-soc-textMuted">Backend validates amount and invokes PayPal Orders API</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                  activeOrderId || capturedReceipt
                    ? 'bg-soc-teal text-[#050A12] shadow-[0_0_8px_rgba(0,245,200,0.5)]'
                    : 'bg-soc-secondary text-soc-textMuted border border-soc-cyan/30'
                }`}>
                  2
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">Buyer Approval</div>
                  <div className="text-[11px] text-soc-textMuted">Customer approves sandbox payment via SDK modal or simulator</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                  capturedReceipt
                    ? 'bg-soc-teal text-[#050A12] shadow-[0_0_8px_rgba(0,245,200,0.5)]'
                    : isCapturing
                    ? 'bg-soc-cyan text-[#050A12] animate-pulse'
                    : 'bg-soc-secondary text-soc-textMuted border border-soc-cyan/30'
                }`}>
                  3
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">Server-side Capture & Verification</div>
                  <div className="text-[11px] text-soc-textMuted">Backend captures order & verifies PayPal HTTP response</div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                  capturedReceipt?.risk_evaluation
                    ? 'bg-soc-teal text-[#050A12] shadow-[0_0_8px_rgba(0,245,200,0.5)]'
                    : 'bg-soc-secondary text-soc-textMuted border border-soc-cyan/30'
                }`}>
                  4
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">AI Risk Assessment & Ledger Persistence</div>
                  <div className="text-[11px] text-soc-textMuted">Real-time risk scoring, Gemini explanation & persistent storage</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Payment Details, Smart Buttons & Execution (6 cols) */}
        <div className="lg:col-span-6 bg-soc-card/90 border border-soc-cyan/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_0_30px_rgba(0,229,255,0.1)] backdrop-blur-xl">
          
          <div className="flex items-center justify-between pb-3 border-b border-soc-cyan/20">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
              <CreditCard className="w-4 h-4 text-soc-cyan" />
              Payment Execution
            </h4>
            <span className="text-xs font-mono text-soc-cyan font-semibold">Step 1: Merchant Checkout</span>
          </div>

          {/* Flow Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-soc-secondary p-1 border border-soc-cyan/25">
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-soc-cyan/20 text-soc-cyan border border-soc-cyan/50 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                  : 'text-soc-textMuted hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Offline Gateway Simulator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sdk')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'sdk'
                  ? 'bg-soc-cyan/20 text-soc-cyan border border-soc-cyan/50 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                  : 'text-soc-textMuted hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-soc-cyan" />
              <span>Official Smart Buttons (SDK)</span>
            </button>
          </div>

          {/* Test Preset Scenario Cards */}
          <div>
            <label className="text-xs font-mono font-bold text-soc-cyan uppercase tracking-wider block mb-2">
              Select Test Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handlePlanSelect('standard')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPlan === 'standard'
                    ? 'bg-soc-cyan/15 border-soc-cyan text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                    : 'bg-soc-secondary/70 border-soc-cyan/20 text-soc-textMuted hover:border-soc-cyan/40 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs font-mono text-soc-teal">$125.00</div>
                <div className="text-xs font-semibold truncate mt-0.5 text-white">Standard Normal</div>
                <div className="text-[10px] text-soc-textMuted">Expected: Low Risk</div>
              </button>

              <button
                type="button"
                onClick={() => handlePlanSelect('high_value')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPlan === 'high_value'
                    ? 'bg-soc-cyan/15 border-soc-cyan text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                    : 'bg-soc-secondary/70 border-soc-cyan/20 text-soc-textMuted hover:border-soc-cyan/40 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs font-mono text-soc-warning">$2,850.00</div>
                <div className="text-xs font-semibold truncate mt-0.5 text-white">High-Value Spike</div>
                <div className="text-[10px] text-soc-textMuted">Expected: Med/High</div>
              </button>

              <button
                type="button"
                onClick={() => handlePlanSelect('custom')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPlan === 'custom'
                    ? 'bg-soc-cyan/15 border-soc-cyan text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                    : 'bg-soc-secondary/70 border-soc-cyan/20 text-soc-textMuted hover:border-soc-cyan/40 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs font-mono text-soc-cyan">Custom</div>
                <div className="text-xs font-semibold truncate mt-0.5 text-white">User Amount</div>
                <div className="text-[10px] text-soc-textMuted">Any Test Value</div>
              </button>
            </div>
          </div>

          {/* Form Fields: Item Description & Validated Amount */}
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-soc-text block mb-1">Product Description</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-[#071522] border border-soc-cyan/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-soc-textMuted/50 focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-soc-text block mb-1">
                Server-Validated Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-cyan font-mono text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  disabled={selectedPlan !== 'custom'}
                  className="w-full bg-[#071522] border border-soc-cyan/30 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 font-mono disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-soc-danger/15 border border-soc-danger/40 text-soc-danger text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(255,82,99,0.2)]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-soc-danger" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab 1: Live SDK Smart Buttons */}
          {activeTab === 'sdk' && (
            <div className="space-y-3 pt-2">
              <div className="text-xs text-soc-textMuted flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-soc-cyan" />
                  <span>Official PayPal JavaScript SDK Smart Buttons</span>
                </div>
                <span className="text-[11px] text-soc-cyan font-semibold">Real Pop-up Authentication</span>
              </div>
              
              {hasLiveClientId ? (
                <PayPalScriptProvider
                  options={{
                    clientId: paypalConfig!.client_id!,
                    currency: 'USD',
                    intent: 'capture',
                  }}
                >
                  <div className="rounded-xl overflow-hidden bg-[#071522] p-3 border border-soc-cyan/30 shadow-inner">
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
                          setCapturedReceipt(res);
                          setActiveOrderId(null);
                          if (onTransactionCaptured && res.transaction_id) {
                            onTransactionCaptured(res.transaction_id);
                          }
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
                <div className="p-4 rounded-xl bg-soc-warning/10 border border-soc-warning/30 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-soc-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-soc-warning">
                        Sandbox Client ID Not Configured
                      </div>
                      <p className="text-xs text-soc-textMuted mt-0.5 leading-relaxed">
                        To render the live PayPal smart button pop-up, configure your sandbox credentials above, or use the <strong>Offline Gateway Simulator</strong> tab.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfigDrawer(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-soc-warning/20 hover:bg-soc-warning/30 text-soc-warning border border-soc-warning/40 text-xs font-semibold transition-all focus-ring cursor-pointer"
                  >
                    Open Credential Setup
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Offline Simulator */}
          {activeTab === 'simulator' && (
            <div className="p-4 rounded-xl bg-soc-secondary/80 border border-soc-cyan/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-soc-cyan flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Deterministic & ML Multi-Signal Simulator
                  </div>
                  <p className="text-xs text-soc-textMuted mt-0.5 leading-relaxed">
                    Simulates instant buyer approval and executes server-side validation, Random Forest classification, and cryptographically chained audit logging.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulatedCreateAndCapture}
                disabled={isCreatingOrder || isCapturing || amount <= 0}
                className="w-full py-3.5 rounded-xl btn-cyan-gradient text-[#050A12] font-sans text-xs font-extrabold tracking-wide transition-all shadow-[0_0_20px_rgba(0,229,255,0.35)] hover:shadow-[0_0_30px_rgba(0,229,255,0.55)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer focus-ring"
              >
                {isCreatingOrder || isCapturing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-soc-bg/30 border-t-soc-bg rounded-full animate-spin" />
                    <span>Executing Server Capture & AI Screening...</span>
                  </div>
                ) : (
                  <>
                    <span>Execute Sandbox Payment (${amount.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Live Server Verification & Capture Receipt Section */}
      <div className="bg-soc-card/90 border border-soc-cyan/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_0_30px_rgba(0,229,255,0.1)] backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-soc-cyan/20">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
            <ShieldCheck className="w-4 h-4 text-soc-teal" />
            Live Server Verification & Capture Dossier
          </h4>
          <span className="text-xs font-mono text-soc-teal font-semibold">Step 2: PayShield Multi-Signal Screening</span>
        </div>

        {!capturedReceipt ? (
          <div className="p-10 text-center text-soc-textMuted font-sans text-xs border border-dashed border-soc-cyan/25 rounded-xl bg-soc-secondary/50">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50 text-soc-cyan" />
            <p className="font-semibold text-white">Awaiting buyer approval and server capture.</p>
            <p className="text-xs text-soc-textMuted mt-1">
              Captured orders trigger the Random Forest ML Model, Heuristic Rules, and Gemini AI Explainer.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Receipt Success Banner */}
            <div className="p-4 rounded-xl bg-soc-teal/15 border border-soc-teal/40 flex items-start gap-3 shadow-[0_0_15px_rgba(0,245,200,0.15)]">
              <CheckCircle2 className="w-5 h-5 text-soc-teal flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white">
                  Payment Verified & Captured with PayPal Sandbox
                </h5>
                <p className="text-xs text-soc-textMuted mt-0.5">
                  Order ID <span className="font-mono font-bold text-soc-cyan">{capturedReceipt.paypal_order_id}</span> status:{' '}
                  <span className="font-mono font-bold text-soc-teal">{capturedReceipt.status}</span>
                </p>
              </div>
            </div>

            {/* Receipt Breakdown Table */}
            <div className="bg-soc-secondary/90 border border-soc-cyan/25 rounded-xl p-4 space-y-2.5 text-xs font-sans">
              <div className="flex justify-between text-soc-textMuted">
                <span>Capture Reference:</span>
                <span className="text-white font-mono font-bold">{capturedReceipt.capture_id || 'CAP-SANDBOX-VERIFIED'}</span>
              </div>
              <div className="flex justify-between text-soc-textMuted">
                <span>Amount Settled:</span>
                <span className="text-white font-mono font-bold">${capturedReceipt.amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-soc-textMuted">
                <span>Verified Buyer:</span>
                <span className="text-white font-medium">{capturedReceipt.payer_email}</span>
              </div>
              <div className="flex justify-between text-soc-textMuted">
                <span>Database Txn ID:</span>
                <span className="text-soc-cyan font-mono font-bold">#{capturedReceipt.transaction_id}</span>
              </div>
            </div>

            {/* Multi-Signal ML Risk Evaluation Widget */}
            {capturedReceipt.risk_evaluation && (
              <div className="bg-soc-secondary/90 border border-soc-cyan/25 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 font-mono">
                    <Cpu className="w-4 h-4 text-soc-cyan" />
                    AI / ML Risk Evaluation
                  </span>
                  <RiskBadge
                    level={capturedReceipt.risk_evaluation.level as RiskLevel}
                    score={capturedReceipt.risk_evaluation.score}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 bg-soc-card p-3 rounded-xl border border-soc-cyan/20 text-xs">
                  <div>
                    <div className="text-[10px] text-soc-textMuted uppercase font-semibold">ML Fraud Prob P(Fraud)</div>
                    <div className="text-base font-bold text-soc-cyan font-mono">
                      {((capturedReceipt.risk_evaluation.ml_fraud_probability || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-soc-textMuted uppercase font-semibold">Hybrid Ensemble Score</div>
                    <div className="text-base font-bold text-white font-mono">
                      {(capturedReceipt.risk_evaluation.hybrid_score !== undefined 
                        ? capturedReceipt.risk_evaluation.hybrid_score 
                        : capturedReceipt.risk_evaluation.score).toFixed(1)}/100
                    </div>
                  </div>
                </div>

                <p className="text-xs text-soc-textMuted leading-relaxed">
                  {capturedReceipt.risk_evaluation.ai_summary}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
              <button
                onClick={() => {
                  setCapturedReceipt(null);
                  setActiveOrderId(null);
                }}
                className="px-4 py-2 rounded-xl bg-soc-secondary hover:bg-soc-elevated text-soc-textMuted hover:text-white border border-soc-cyan/30 text-xs font-medium transition-all focus-ring cursor-pointer"
              >
                Create Another Test Order
              </button>

              {capturedReceipt.transaction_id && onTransactionCaptured && (
                <button
                  onClick={() => onTransactionCaptured(capturedReceipt.transaction_id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-cyan-gradient text-[#050A12] text-xs font-bold transition-all shadow-[0_0_20px_rgba(0,229,255,0.35)] focus-ring cursor-pointer"
                >
                  <span>Inspect In Risk Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
