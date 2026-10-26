import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { PayPalSandboxCheckout } from '../features/payments/PayPalSandboxCheckout';
import { fetchPayPalTransactions } from '../lib/api';
import { RiskBadge } from '../components/RiskBadge';
import { RiskLevel } from '../lib/types';
import {
  CheckCircle2,
  RefreshCw,
  Database,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
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
      // Refresh the list then open the dossier
      refreshPayPalTxns();
      onSelectTransaction(txnId);
    },
    [refreshPayPalTxns, onSelectTransaction]
  );

  return (
    <div className="space-y-6">
      <Header
        title="PayPal Sandbox Checkout & Interceptor"
        subtitle="Simulate real PayPal Orders API checkout with backend capture & instant AI risk screening"
      />

      <DemoNoticeBadge />

      <PayPalSandboxCheckout onTransactionCaptured={handleTransactionCaptured} />

      {/* ── Real PayPal Sandbox Transactions Panel ── */}
      <div className="bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Verified PayPal Sandbox Captures
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                  DATABASE PERSISTED
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {txnCount} real PayPal capture{txnCount !== 1 ? 's' : ''} stored — separate from synthetic demo data
              </p>
            </div>
          </div>

          <button
            onClick={refreshPayPalTxns}
            disabled={isLoadingTxns}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#1F293D] text-slate-300 hover:text-slate-100 text-xs font-mono transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTxns ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error State */}
        {txnError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{txnError}</span>
          </div>
        )}

        {/* Last refreshed indicator */}
        {lastRefresh && !txnError && (
          <p className="text-[10px] text-slate-500 font-mono">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {/* Transactions table */}
        {paypalTxns.length === 0 && !isLoadingTxns ? (
          <div className="p-10 text-center text-slate-500 font-mono text-xs border border-dashed border-[#1F293D] rounded-xl">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-semibold text-slate-400">No real PayPal captures yet</p>
            <p className="text-slate-600 mt-1">
              Complete a checkout above to see captured transactions here.
            </p>
            <p className="text-slate-700 mt-1 text-[10px]">
              (Offline simulator transactions do not appear here — only real Sandbox API captures do)
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1F293D]">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1F293D] bg-[#0B0E14]">
                  <th className="text-left px-3 py-2.5 text-slate-400 font-semibold">Txn ID</th>
                  <th className="text-left px-3 py-2.5 text-slate-400 font-semibold">PayPal Order</th>
                  <th className="text-left px-3 py-2.5 text-slate-400 font-semibold">Capture ID</th>
                  <th className="text-right px-3 py-2.5 text-slate-400 font-semibold">Amount</th>
                  <th className="text-left px-3 py-2.5 text-slate-400 font-semibold">Payer</th>
                  <th className="text-center px-3 py-2.5 text-slate-400 font-semibold">Risk</th>
                  <th className="text-left px-3 py-2.5 text-slate-400 font-semibold">Timestamp</th>
                  <th className="text-center px-3 py-2.5 text-slate-400 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paypalTxns.map((txn, idx) => (
                  <tr
                    key={txn.transaction_id}
                    className={`border-b border-[#1F293D] hover:bg-[#18202F] transition-colors ${
                      idx % 2 === 0 ? 'bg-[#0B0E14]' : 'bg-[#0D1117]'
                    }`}
                  >
                    <td className="px-3 py-2.5 text-cyan-400 font-bold">#{txn.transaction_id}</td>
                    <td className="px-3 py-2.5 text-slate-300 truncate max-w-[120px]" title={txn.paypal_order_id || 'N/A'}>
                      {txn.paypal_order_id
                        ? txn.paypal_order_id.slice(0, 16) + '…'
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 truncate max-w-[120px]" title={txn.capture_id || 'N/A'}>
                      {txn.capture_id
                        ? txn.capture_id.slice(0, 16) + '…'
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-emerald-400 font-bold">
                        ${txn.amount.toFixed(2)}
                      </span>
                      <span className="text-slate-500 ml-1">{txn.currency}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-slate-200">{txn.payer_name || '—'}</div>
                      <div className="text-slate-500 text-[10px]">{txn.payer_email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <RiskBadge
                        level={txn.risk_level as RiskLevel}
                        score={txn.risk_score}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                      {new Date(txn.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => onSelectTransaction(txn.transaction_id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all text-[10px] font-bold mx-auto"
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
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0B0E14] border border-[#1F293D]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 font-mono">
            <span className="text-emerald-400 font-bold">Data Integrity:</span> Only server-verified
            PayPal Sandbox captures appear in this table. Offline simulator transactions are clearly
            labeled and kept in the Transaction Monitor separately.
          </p>
        </div>
      </div>
    </div>
  );
};
