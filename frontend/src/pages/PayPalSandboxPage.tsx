import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { PayPalSandboxCheckout } from '../features/payments/PayPalSandboxCheckout';
import { fetchPayPalTransactions } from '../lib/api';
import { RiskBadge } from '../components/RiskBadge';
import { RiskLevel } from '../lib/types';
import { SandboxPayment3DScene } from '../components/3d';
import {
  CheckCircle2,
  RefreshCw,
  Database,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Zap,
  Lock,
  Layers
} from 'lucide-react';

interface PayPalSandboxPageProps {
  onSelectTransaction: (txnId: number) => void;
}

type PayPalTxn = {
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
};

export const PayPalSandboxPage: React.FC<PayPalSandboxPageProps> = ({
  onSelectTransaction,
}) => {
  const [paypalTxns, setPaypalTxns] = useState<PayPalTxn[]>([]);
  const [txnCount, setTxnCount] = useState<number>(0);
  const [isLoadingTxns, setIsLoadingTxns] = useState<boolean>(false);
  const [txnError, setTxnError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshPayPalTxns = useCallback(async () => {
    setIsLoadingTxns(true);
    setTxnError(null);
    try {
      const res = await fetchPayPalTransactions(50);
      setPaypalTxns(res.transactions);
      setTxnCount(res.count);
      setLastRefresh(new Date());
    } catch (err: any) {
      setTxnError(err.message || 'Failed to load PayPal transactions');
    } finally {
      setIsLoadingTxns(false);
    }
  }, []);

  // Load PayPal transactions on mount and after each capture
  useEffect(() => {
    refreshPayPalTxns();
  }, [refreshPayPalTxns]);

  const handleTransactionCaptured = useCallback(
    (txnId: number) => {
      refreshPayPalTxns();
      onSelectTransaction(txnId);
    },
    [refreshPayPalTxns, onSelectTransaction]
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <Header
        title="Secure Sandbox Checkout"
        subtitle="Experience intelligent payment protection before processing transactions."
      />

      {/* Sandbox Hero with 3D Payment Security Scene matching requirements */}
      <div className="w-full rounded-3xl bg-gradient-to-r from-soc-card/95 via-soc-secondary/85 to-soc-card/95 border border-soc-cyan/30 p-5 sm:p-7 relative overflow-hidden shadow-[0_0_35px_rgba(0,229,255,0.1)] backdrop-blur-xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-soc-cyan/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-soc-teal/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          
          {/* Left Text & Mission Control */}
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soc-cyan/15 border border-soc-cyan/40 text-soc-cyan text-xs font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(0,229,255,0.2)]">
              <ShieldCheck className="w-4 h-4 text-soc-cyan animate-pulse" />
              <span>PAYPAL SANDBOX // ORDERS API v2 ACTIVE</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans leading-tight">
              Secure Sandbox <span className="text-transparent bg-clip-text bg-gradient-to-r from-soc-cyan to-soc-teal">Checkout</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-soc-textMuted max-w-2xl leading-relaxed">
              Experience intelligent payment protection before processing live transactions. All test orders are server-verified against PayPal Sandbox and evaluated through PayShield's multi-signal risk engine with zero merchant false declines.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-soc-secondary border border-soc-cyan/30 text-soc-cyan text-xs font-mono font-semibold">
                <Lock className="w-3.5 h-3.5 text-soc-teal" />
                <span>Isolated Sandbox Environment</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-soc-secondary border border-soc-cyan/30 text-soc-textMuted text-xs font-mono">
                <Zap className="w-3.5 h-3.5 text-soc-cyan" />
                <span>Zero Real Funds Charged</span>
              </div>
            </div>
          </div>

          {/* Right Interactive 3D Payment Security Scene */}
          <div className="lg:col-span-4 h-52 sm:h-60 w-full relative flex items-center justify-center">
            <SandboxPayment3DScene className="w-full h-full" />
          </div>

        </div>
      </div>

      <DemoNoticeBadge />

      {/* Main 2-Column Professional Sandbox Checkout & Verification Section */}
      <PayPalSandboxCheckout onTransactionCaptured={handleTransactionCaptured} />

      {/* Real PayPal Sandbox Transactions Panel */}
      <div className="bg-soc-card/90 border border-soc-cyan/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_0_30px_rgba(0,229,255,0.08)] backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-soc-cyan/20 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-soc-cyan/15 text-soc-cyan border border-soc-cyan/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Verified PayPal Sandbox Captures
                <span className="px-2.5 py-0.5 rounded-full bg-soc-teal/15 text-soc-teal border border-soc-teal/30 text-[10px] font-semibold font-mono">
                  DATABASE PERSISTED
                </span>
              </h4>
              <p className="text-xs text-soc-textMuted mt-0.5">
                {txnCount} real PayPal capture{txnCount !== 1 ? 's' : ''} stored — strictly isolated from synthetic demo data
              </p>
            </div>
          </div>

          <button
            onClick={refreshPayPalTxns}
            disabled={isLoadingTxns}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-soc-secondary hover:bg-soc-elevated border border-soc-cyan/30 text-soc-cyan hover:text-white text-xs font-semibold transition-all disabled:opacity-50 focus-ring self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTxns ? 'animate-spin text-soc-cyan' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Error State */}
        {txnError && (
          <div className="p-3.5 rounded-xl bg-soc-danger/15 border border-soc-danger/30 text-soc-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-soc-danger" />
            <span>{txnError}</span>
          </div>
        )}

        {/* Last refreshed indicator */}
        {lastRefresh && !txnError && (
          <p className="text-[11px] text-soc-textMuted font-mono">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {/* Transactions table */}
        {paypalTxns.length === 0 && !isLoadingTxns ? (
          <div className="p-10 text-center text-soc-textMuted text-xs border border-dashed border-soc-cyan/30 rounded-xl bg-soc-secondary/40">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50 text-soc-cyan" />
            <p className="font-semibold text-white">No real PayPal captures yet</p>
            <p className="text-soc-textMuted mt-1">
              Complete a checkout above to see captured transactions here.
            </p>
            <p className="text-soc-textMuted/70 mt-1 text-[11px]">
              (Offline simulator transactions are kept in the Transaction Monitor separately)
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-soc-cyan/20">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-soc-cyan/20 bg-soc-secondary/90 text-soc-textMuted font-semibold font-mono uppercase">
                  <th className="text-left px-3.5 py-3">Txn ID</th>
                  <th className="text-left px-3.5 py-3">PayPal Order</th>
                  <th className="text-left px-3.5 py-3">Capture ID</th>
                  <th className="text-right px-3.5 py-3">Amount</th>
                  <th className="text-left px-3.5 py-3">Payer</th>
                  <th className="text-center px-3.5 py-3">Risk</th>
                  <th className="text-left px-3.5 py-3">Timestamp</th>
                  <th className="text-center px-3.5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soc-cyan/15 text-soc-text">
                {paypalTxns.map((txn) => (
                  <tr
                    key={txn.transaction_id}
                    className="hover:bg-soc-elevated/70 transition-colors bg-soc-card/60"
                  >
                    <td className="px-3.5 py-3 text-soc-cyan font-bold font-mono">#{txn.transaction_id}</td>
                    <td className="px-3.5 py-3 text-white font-mono truncate max-w-[120px]" title={txn.paypal_order_id || 'N/A'}>
                      {txn.paypal_order_id
                        ? txn.paypal_order_id.slice(0, 16) + '…'
                        : <span className="text-soc-textMuted">—</span>}
                    </td>
                    <td className="px-3.5 py-3 text-white font-mono truncate max-w-[120px]" title={txn.capture_id || 'N/A'}>
                      {txn.capture_id
                        ? txn.capture_id.slice(0, 16) + '…'
                        : <span className="text-soc-textMuted">—</span>}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <span className="text-white font-bold font-mono">
                        ${txn.amount.toFixed(2)}
                      </span>
                      <span className="text-soc-textMuted ml-1 font-mono text-[11px]">{txn.currency}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="text-white font-medium">{txn.payer_name || '—'}</div>
                      <div className="text-soc-textMuted text-[11px] font-mono">{txn.payer_email}</div>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <RiskBadge
                        level={txn.risk_level as RiskLevel}
                        score={txn.risk_score}
                      />
                    </td>
                    <td className="px-3.5 py-3 text-soc-textMuted font-mono text-[11px] whitespace-nowrap">
                      {new Date(txn.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <button
                        onClick={() => onSelectTransaction(txn.transaction_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-soc-secondary hover:bg-soc-cyan hover:text-soc-bg text-soc-cyan border border-soc-cyan/30 transition-all text-xs font-semibold focus-ring cursor-pointer"
                        title="Open investigation dossier"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Integrity notice */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-soc-secondary/80 border border-soc-cyan/20">
          <CheckCircle2 className="w-4 h-4 text-soc-teal flex-shrink-0 mt-0.5" />
          <p className="text-xs text-soc-textMuted leading-relaxed">
            <span className="text-white font-semibold">Data Integrity:</span> Only server-verified
            PayPal Sandbox captures appear in this table. Offline simulator transactions are clearly
            labeled and kept in the Transaction Monitor separately.
          </p>
        </div>
      </div>
    </div>
  );
};
