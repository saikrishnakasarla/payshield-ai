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
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-medium"
            role="status"
            aria-label="Review Status: Safe"
          >
            <CheckCircle className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            Safe
          </span>
        );
      case 'ESCALATED_HUMAN_REVIEW':
        return (
          <span 
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-mono font-semibold"
            role="status"
            aria-label="Review Status: Escalated for Human Review"
          >
            <ShieldAlert className="w-3 h-3 text-rose-600" aria-hidden="true" />
            Escalated
          </span>
        );
      default:
        return (
          <span 
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono"
            role="status"
            aria-label="Review Status: Unreviewed"
          >
            <Clock className="w-3 h-3 text-slate-500" aria-hidden="true" />
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
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" aria-hidden="true" />
        <p className="text-xs font-mono font-medium text-slate-600">Loading verified transaction records...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-slate-800 font-sans">No transactions match current filters</h3>
        <p className="text-xs text-slate-500 mt-1">Try clearing search parameters or adjusting risk filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Mobile Card List (Optimized for viewports under 768px) */}
      <div className="block md:hidden divide-y divide-slate-100" role="list" aria-label="Transactions mobile card list">
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
            className="p-4 space-y-3 hover:bg-slate-50 transition-colors cursor-pointer focus-ring"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-900">
                <span>{txn.reference_id}</span>
                {txn.source === 'PAYPAL_SANDBOX' || txn.provider === 'PAYPAL' ? (
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                    PAYPAL
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold border border-slate-200">
                    DEMO
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {formatDate(txn.timestamp)}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="min-w-0 flex-1 mr-3">
                <div className="font-semibold text-slate-900 truncate">{txn.customer_name}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{txn.customer_email} • {txn.ip_country}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold text-slate-900 text-sm">
                  ${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-slate-500 font-medium">{txn.currency}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <RiskBadge level={txn.risk_level} score={txn.risk_score} size="sm" />
                {txn.ml_fraud_probability !== undefined && (
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-blue-700 border border-slate-300 hover:bg-blue-50 text-xs font-semibold min-h-[44px] shadow-sm transition-all focus-ring"
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
          <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
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
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                onClick={() => onSelectTransaction(txn.id)}
              >
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                  <span>{txn.reference_id}</span>
                  {txn.provider === 'STRIPE' ? (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold">
                      STRIPE
                    </span>
                  ) : txn.provider === 'RAZORPAY' ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                      RAZORPAY
                    </span>
                  ) : txn.provider === 'ADYEN' ? (
                    <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-mono font-bold">
                      ADYEN
                    </span>
                  ) : txn.source === 'PAYPAL_SANDBOX' || txn.provider === 'PAYPAL' ? (
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                      PAYPAL
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold border border-slate-200">
                      DEMO
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-slate-500 font-mono">
                  {formatDate(txn.timestamp)}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">{txn.customer_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                    <span>{txn.customer_email}</span>
                    <span>•</span>
                    <span className="text-slate-700 font-medium">{txn.ip_country}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                  ${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] font-normal text-slate-500">{txn.currency}</span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-1 items-start">
                    <RiskBadge level={txn.risk_level} score={txn.risk_score} size="sm" />
                    {txn.ml_fraud_probability !== undefined && (
                      <span className="text-[10px] font-mono text-teal-700 font-semibold">
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white group-hover:bg-blue-600 group-hover:text-white text-slate-700 border border-slate-300 group-hover:border-blue-600 transition-all font-semibold text-xs shadow-sm focus-ring"
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
        className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono"
        aria-label="Pagination Navigation"
      >
        <div>
          Showing page <span className="font-bold text-slate-900">{page}</span> of{' '}
          <span className="font-bold text-slate-900">{pages}</span> ({total} total transactions)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm focus-ring"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm focus-ring"
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
