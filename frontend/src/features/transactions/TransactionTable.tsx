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
          <span 
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-soc-teal/15 text-soc-teal border border-soc-teal/30 text-xs font-mono font-medium shadow-[0_0_8px_rgba(0,245,200,0.15)]"
            role="status"
            aria-label="Review Status: Safe"
          >
            <CheckCircle className="w-3 h-3 text-soc-teal" aria-hidden="true" />
            Safe
          </span>
        );
      case 'ESCALATED_HUMAN_REVIEW':
        return (
          <span 
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-soc-danger/15 text-soc-danger border border-soc-danger/30 text-xs font-mono font-semibold shadow-[0_0_8px_rgba(255,82,99,0.15)]"
            role="status"
            aria-label="Review Status: Escalated for Human Review"
          >
            <ShieldAlert className="w-3 h-3 text-soc-danger" aria-hidden="true" />
            Escalated
          </span>
        );
      default:
        return (
          <span 
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-soc-secondary text-soc-textMuted border border-soc-cyan/20 text-xs font-mono"
            role="status"
            aria-label="Review Status: Unreviewed"
          >
            <Clock className="w-3 h-3 text-soc-textMuted" aria-hidden="true" />
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
      <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-12 text-center text-soc-textMuted shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-2 border-soc-cyan/20 border-t-soc-cyan rounded-full animate-spin mb-3 shadow-[0_0_12px_rgba(0,229,255,0.3)]" aria-hidden="true" />
        <p className="text-xs font-mono font-medium text-soc-cyan">Loading verified transaction records...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-12 text-center shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <ShieldAlert className="w-10 h-10 text-soc-textMuted mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-white font-sans">No transactions match current filters</h3>
        <p className="text-xs text-soc-textMuted mt-1">Try clearing search parameters or adjusting risk filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-md">
      {/* Mobile Card List (Optimized for viewports under 768px) */}
      <div className="block md:hidden divide-y divide-soc-cyan/15" role="list" aria-label="Transactions mobile card list">
        {transactions.map((txn) => (
          <div
            key={txn.id}
            onClick={() => onSelectTransaction(txn.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTransaction(txn.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Inspect transaction ${txn.reference_id}, amount $${txn.amount}`}
            className="p-4 space-y-3 hover:bg-soc-elevated/70 transition-colors cursor-pointer focus-ring"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                <span className="text-soc-cyan">{txn.reference_id}</span>
                {txn.source === 'PAYPAL_SANDBOX' || txn.provider === 'PAYPAL' ? (
                  <span className="px-1.5 py-0.5 rounded bg-[#0079C1]/20 text-[#00E5FF] border border-[#0079C1]/40 text-[10px] font-mono font-bold">
                    PAYPAL
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-soc-secondary text-soc-textMuted text-[10px] font-mono font-semibold border border-soc-cyan/20">
                    DEMO
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-soc-textMuted">
                {formatDate(txn.timestamp)}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="min-w-0 flex-1 mr-3">
                <div className="font-semibold text-white truncate">{txn.customer_name}</div>
                <div className="text-[11px] text-soc-textMuted font-mono truncate">{txn.customer_email} • {txn.ip_country}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold text-white text-sm">
                  ${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-soc-textMuted font-medium">{txn.currency}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <RiskBadge level={txn.risk_level} score={txn.risk_score} size="sm" />
                {txn.ml_fraud_probability !== undefined && (
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-soc-teal/15 text-soc-teal border border-soc-teal/30">
                    ML: {(txn.ml_fraud_probability * 100).toFixed(0)}%
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-soc-secondary text-soc-cyan border border-soc-cyan/30 hover:bg-soc-cyan hover:text-soc-bg text-xs font-semibold min-h-[44px] shadow-sm transition-all focus-ring cursor-pointer"
                aria-label={`Investigate transaction ${txn.reference_id}`}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Investigate</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Table View (Visible on >= 768px viewports) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs" aria-label="Transactions table">
          <thead className="bg-soc-secondary/90 text-soc-textMuted uppercase font-mono tracking-wider border-b border-soc-cyan/20">
            <tr>
              <th scope="col" className="py-3.5 px-4 font-semibold">Order Ref</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Timestamp</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Customer & IP</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Amount</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Risk Evaluation</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Review Status</th>
              <th scope="col" className="py-3.5 px-4 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soc-cyan/15 text-soc-text">
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className="hover:bg-soc-elevated/70 transition-colors cursor-pointer group"
                onClick={() => onSelectTransaction(txn.id)}
              >
                <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                  <span className="group-hover:text-soc-cyan transition-colors">{txn.reference_id}</span>
                  {txn.provider === 'STRIPE' ? (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
                      STRIPE
                    </span>
                  ) : txn.provider === 'RAZORPAY' ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      RAZORPAY
                    </span>
                  ) : txn.provider === 'ADYEN' ? (
                    <span className="px-1.5 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-bold">
                      ADYEN
                    </span>
                  ) : txn.source === 'PAYPAL_SANDBOX' || txn.provider === 'PAYPAL' ? (
                    <span className="px-1.5 py-0.5 rounded bg-[#0079C1]/20 text-[#00E5FF] border border-[#0079C1]/40 text-[10px] font-mono font-bold">
                      PAYPAL
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-soc-secondary text-soc-textMuted text-[10px] font-mono font-semibold border border-soc-cyan/20">
                      DEMO
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-soc-textMuted font-mono">
                  {formatDate(txn.timestamp)}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-white">{txn.customer_name}</div>
                  <div className="text-[11px] text-soc-textMuted font-mono flex items-center gap-1.5 mt-0.5">
                    <span>{txn.customer_email}</span>
                    <span>•</span>
                    <span className="text-soc-cyan font-medium">{txn.ip_country}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-white">
                  ${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] font-normal text-soc-textMuted">{txn.currency}</span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-1 items-start">
                    <RiskBadge level={txn.risk_level} score={txn.risk_score} size="sm" />
                    {txn.ml_fraud_probability !== undefined && (
                      <span className="text-[10px] font-mono text-soc-teal font-semibold">
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTransaction(txn.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-soc-secondary text-soc-cyan border border-soc-cyan/30 group-hover:bg-soc-cyan group-hover:text-soc-bg transition-all font-semibold text-xs shadow-sm focus-ring cursor-pointer"
                    aria-label={`Investigate transaction ${txn.reference_id}`}
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Investigate</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <nav 
        className="bg-soc-secondary/80 px-4 py-3 border-t border-soc-cyan/20 flex items-center justify-between text-xs text-soc-textMuted font-mono"
        aria-label="Pagination Navigation"
      >
        <div>
          Showing page <span className="font-bold text-white">{page}</span> of{' '}
          <span className="font-bold text-white">{pages}</span> ({total} total transactions)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-soc-card border border-soc-cyan/30 hover:bg-soc-elevated text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm focus-ring cursor-pointer"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="p-1.5 rounded-lg bg-soc-card border border-soc-cyan/30 hover:bg-soc-elevated text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm focus-ring cursor-pointer"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
};
