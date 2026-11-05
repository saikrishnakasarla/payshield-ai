import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  riskLevel: string;
  onRiskLevelChange: (val: string) => void;
  provider?: string;
  onProviderChange?: (val: string) => void;
  reviewStatus: string;
  onReviewStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: string;
  onSortOrderToggle: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  search,
  onSearchChange,
  riskLevel,
  onRiskLevelChange,
  provider,
  onProviderChange,
  reviewStatus,
  onReviewStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <label htmlFor="transaction-search-input" className="sr-only">
          Search Transactions
        </label>
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="transaction-search-input"
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Order ID, customer, email, or IP..."
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs text-slate-900 placeholder-slate-400 focus-ring transition-all font-mono"
        />
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {/* Risk Level Filter */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 min-h-[44px] text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <label htmlFor="risk-filter-select" className="text-slate-600 font-medium text-[11px]">Risk:</label>
          </div>
          <select
            id="risk-filter-select"
            value={riskLevel}
            onChange={(e) => onRiskLevelChange(e.target.value)}
            className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Tiers</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>

        {/* Provider Filter */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 min-h-[44px] text-xs">
          <label htmlFor="provider-filter-select" className="text-slate-600 font-medium text-[11px]">Gateway:</label>
          <select
            id="provider-filter-select"
            value={provider || 'ALL'}
            onChange={(e) => onProviderChange && onProviderChange(e.target.value)}
            className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Gateways</option>
            <option value="PAYPAL">PayPal</option>
            <option value="STRIPE">Stripe</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="ADYEN">Adyen</option>
          </select>
        </div>

        {/* Review Status Filter */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 min-h-[44px] text-xs">
          <label htmlFor="review-filter-select" className="text-slate-600 font-medium text-[11px]">Review:</label>
          <select
            id="review-filter-select"
            value={reviewStatus}
            onChange={(e) => onReviewStatusChange(e.target.value)}
            className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNREVIEWED">Unreviewed</option>
            <option value="REVIEWED_SAFE">Reviewed Safe</option>
            <option value="ESCALATED_HUMAN_REVIEW">Escalated</option>
          </select>
        </div>

        {/* Sort By Field */}
        <div className="w-full sm:w-auto flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 min-h-[44px] text-xs">
          <label htmlFor="sort-field-select" className="text-slate-600 font-medium text-[11px]">Sort:</label>
          <select
            id="sort-field-select"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="timestamp">Timestamp</option>
            <option value="amount">Amount</option>
            <option value="risk_score">Risk Score</option>
          </select>

          <button
            type="button"
            onClick={onSortOrderToggle}
            className="p-1 rounded text-slate-500 hover:text-slate-900 focus-ring"
            title={`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            aria-label={`Toggle sort order, currently ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
