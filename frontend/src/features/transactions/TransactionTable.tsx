import React from 'react';
import { Transaction } from '../../lib/types';
import { RiskBadge } from '../../components/RiskBadge';
import { ChevronLeft, ChevronRight, Eye, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  page: number;
  pages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onSelectTransaction: (txnId: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading,
  page,
  pages,
  total,
  onPageChange,
  onSelectTransaction,
}) => {
  const getReviewStatusBadge = (status: string) => {
    switch (status) {
      case 'REVIEWED_SAFE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
            <CheckCircle className="w-3 h-3" />
            Safe
          </span>
        );
      case 'ESCALATED_HUMAN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-mono font-medium shadow-[0_0_8px_rgba(244,63,94,0.2)]">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            Escalated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-mono">
            <Clock className="w-3 h-3" />
            Unreviewed
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#121721] border border-[#1F293D] rounded-2xl p-12 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono">Loading transaction records...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-[#121721] border border-[#1F293D] rounded-2xl p-12 text-center">
        <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No transactions match current filters</h3>
        <p className="text-xs text-slate-500 mt-1">Try clearing search parameters or adjusting risk filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121721] border border-[#1F293D] rounded-2xl overflow-hidden shadow-lg">
      {/* Mobile Card List (Optimized for viewports under 768px) */}
      <div className="block md:hidden divide-y divide-[#1F293D]/70">
        {transactions.map((txn) => (
          <div
            key={txn.id}
            onClick={() => onSelectTransaction(txn.id)}
            className="p-4 space-y-3 hover:bg-[#18202F]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-100">
                <span>{txn.reference_id}</span>
                {txn.source === 'PAYPAL_SANDBOX' ? (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono">
                    SANDBOX
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono border border-slate-700">
                    DEMO
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {formatDate(txn.timestamp)}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="min-w-0 flex-1 mr-3">
                <div className="font-medium text-slate-200 truncate">{txn.customer_name}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{txn.customer_email} • {txn.ip_country}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold text-slate-100 text-sm">
                  ${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-slate-500">{txn.currency}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <RiskBadge level={txn.risk_level} score={txn.risk_score} size="sm" />
                {txn.ml_fraud_probability !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    ML P(Fraud): {(txn.ml_fraud_probability * 100).toFixed(0)}%
                  </span>
                )}
                {getReviewStatusBadge(txn.review_status)}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTransaction(txn.id);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B0E14] text-cyan-300 border border-[#1F293D] hover:border-cyan-500/40 text-xs font-medium min-h-[44px] shadow-sm transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Investigate</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Table View (Visible on >= 768px viewports) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0E14] text-slate-400 uppercase font-mono tracking-wider border-b border-[#1F293D]">
            <tr>
              <th className="py-3.5 px-4">Order Ref</th>
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Customer & IP</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Risk Evaluation</th>
              <th className="py-3.5 px-4">Review Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F293D]/60 text-slate-300">
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className="hover:bg-[#18202F]/80 transition-colors cursor-pointer group"
                onClick={() => onSelectTransaction(txn.id)}
              >
                <td className="py-3.5 px-4 font-mono font-medium text-slate-100 flex items-center gap-2">
                  <span>{txn.reference_id}</span>
                  {txn.source === 'PAYPAL_SANDBOX' ? (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono">
                      SANDBOX
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
                      DEMO
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">
                  {formatDate(txn.timestamp)}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-200">{txn.customer_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                    <span>{txn.customer_email}</span>
                    <span>•</span>
                    <span className="text-slate-400">{txn.ip_country}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                  ${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] font-normal text-slate-500">{txn.currency}</span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-1 items-start">
                    <RiskBadge level={txn.risk_level} score={txn.risk_score} size="sm" />
                    {txn.ml_fraud_probability !== undefined && (
                      <span className="text-[10px] font-mono text-cyan-400">
                        ML: {(txn.ml_fraud_probability * 100).toFixed(1)}% | Hyb: {(txn.hybrid_score || txn.risk_score).toFixed(0)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {getReviewStatusBadge(txn.review_status)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTransaction(txn.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B0E14] group-hover:bg-rose-500/15 group-hover:text-rose-300 text-slate-400 border border-[#1F293D] group-hover:border-rose-500/30 transition-all font-medium text-xs shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Investigate</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-[#0B0E14] px-4 py-3 border-t border-[#1F293D] flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          Showing page <span className="font-bold text-slate-200">{page}</span> of{' '}
          <span className="font-bold text-slate-200">{pages}</span> ({total} total transactions)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-[#121721] border border-[#1F293D] hover:bg-[#18202F] text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-all"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="p-1.5 rounded-lg bg-[#121721] border border-[#1F293D] hover:bg-[#18202F] text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-all"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
