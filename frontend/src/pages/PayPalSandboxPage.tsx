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
    <div className="space-y-6 font-sans">
      <Header
        title="PayPal Sandbox Checkout & Interceptor"
        subtitle="Simulate real PayPal Orders API checkout with backend capture & instant AI risk screening"
      />

      <DemoNoticeBadge />

      <PayPalSandboxCheckout onTransactionCaptured={handleTransactionCaptured} />

      {/* ── Real PayPal Sandbox Transactions Panel ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Verified PayPal Sandbox Captures
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                  DATABASE PERSISTED
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {txnCount} real PayPal capture{txnCount !== 1 ? 's' : ''} stored — strictly isolated from synthetic demo data
              </p>
            </div>
          </div>

          <button
            onClick={refreshPayPalTxns}
            disabled={isLoadingTxns}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition-all disabled:opacity-50 focus-ring self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTxns ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error State */}
        {txnError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{txnError}</span>
          </div>
        )}

        {/* Last refreshed indicator */}
        {lastRefresh && !txnError && (
          <p className="text-[11px] text-slate-500 font-mono">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {/* Transactions table */}
        {paypalTxns.length === 0 && !isLoadingTxns ? (
          <div className="p-10 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-semibold text-slate-700">No real PayPal captures yet</p>
            <p className="text-slate-500 mt-1">
              Complete a checkout above to see captured transactions here.
            </p>
            <p className="text-slate-400 mt-1 text-[11px]">
              (Offline simulator transactions do not appear here — only real Sandbox API captures do)
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
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
              <tbody className="divide-y divide-slate-100">
                {paypalTxns.map((txn, idx) => (
                  <tr
                    key={txn.transaction_id}
                    className="hover:bg-slate-50 transition-colors bg-white"
                  >
                    <td className="px-3.5 py-3 text-blue-600 font-bold font-mono">#{txn.transaction_id}</td>
                    <td className="px-3.5 py-3 text-slate-700 font-mono truncate max-w-[120px]" title={txn.paypal_order_id || 'N/A'}>
                      {txn.paypal_order_id
                        ? txn.paypal_order_id.slice(0, 16) + '…'
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3.5 py-3 text-slate-700 font-mono truncate max-w-[120px]" title={txn.capture_id || 'N/A'}>
                      {txn.capture_id
                        ? txn.capture_id.slice(0, 16) + '…'
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <span className="text-slate-900 font-bold font-mono">
                        ${txn.amount.toFixed(2)}
                      </span>
                      <span className="text-slate-400 ml-1 font-mono text-[11px]">{txn.currency}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="text-slate-900 font-medium">{txn.payer_name || '—'}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{txn.payer_email}</div>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <RiskBadge
                        level={txn.risk_level as RiskLevel}
                        score={txn.risk_score}
                      />
                    </td>
                    <td className="px-3.5 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(txn.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <button
                        onClick={() => onSelectTransaction(txn.transaction_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all text-xs font-semibold focus-ring"
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
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            <span className="text-slate-900 font-semibold">Data Integrity:</span> Only server-verified
            PayPal Sandbox captures appear in this table. Offline simulator transactions are clearly
            labeled and kept in the Transaction Monitor separately.
          </p>
        </div>
      </div>
    </div>
  );
};
