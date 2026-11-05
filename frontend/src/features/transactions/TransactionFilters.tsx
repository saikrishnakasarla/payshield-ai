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
    <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <label htmlFor="transaction-search-input" className="sr-only">
          Search Transactions
        </label>
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted" aria-hidden="true" />
        <input
          id="transaction-search-input"
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Order ID, customer, email, or IP..."
          className="w-full bg-soc-secondary/80 border border-soc-cyan/25 focus:bg-soc-secondary focus:border-soc-cyan rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs text-white placeholder:text-soc-textMuted/60 focus-ring transition-all font-mono"
        />
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {/* Risk Level Filter */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3 py-1.5 min-h-[44px] text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-soc-cyan" aria-hidden="true" />
            <label htmlFor="risk-filter-select" className="text-soc-textMuted font-medium text-[11px]">Risk:</label>
          </div>
          <select
            id="risk-filter-select"
            value={riskLevel}
            onChange={(e) => onRiskLevelChange(e.target.value)}
            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-soc-secondary text-white">All Tiers</option>
            <option value="CRITICAL" className="bg-soc-secondary text-white">Critical Risk</option>
            <option value="HIGH" className="bg-soc-secondary text-white">High Risk</option>
            <option value="MEDIUM" className="bg-soc-secondary text-white">Medium Risk</option>
            <option value="LOW" className="bg-soc-secondary text-white">Low Risk</option>
          </select>
        </div>

        {/* Provider Filter */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3 py-1.5 min-h-[44px] text-xs">
          <label htmlFor="provider-filter-select" className="text-soc-textMuted font-medium text-[11px]">Gateway:</label>
          <select
            id="provider-filter-select"
            value={provider || 'ALL'}
            onChange={(e) => onProviderChange && onProviderChange(e.target.value)}
            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-soc-secondary text-white">All Gateways</option>
            <option value="PAYPAL" className="bg-soc-secondary text-white">PayPal</option>
            <option value="STRIPE" className="bg-soc-secondary text-white">Stripe</option>
            <option value="RAZORPAY" className="bg-soc-secondary text-white">Razorpay</option>
            <option value="ADYEN" className="bg-soc-secondary text-white">Adyen</option>
          </select>
        </div>

        {/* Review Status Filter */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3 py-1.5 min-h-[44px] text-xs">
          <label htmlFor="review-filter-select" className="text-soc-textMuted font-medium text-[11px]">Review:</label>
          <select
            id="review-filter-select"
            value={reviewStatus}
            onChange={(e) => onReviewStatusChange(e.target.value)}
            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-soc-secondary text-white">All Statuses</option>
            <option value="UNREVIEWED" className="bg-soc-secondary text-white">Unreviewed</option>
            <option value="REVIEWED_SAFE" className="bg-soc-secondary text-white">Marked Safe</option>
            <option value="ESCALATED_HUMAN_REVIEW" className="bg-soc-secondary text-white">Escalated</option>
          </select>
        </div>

        {/* Sort By Field */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3 py-1.5 min-h-[44px] text-xs">
          <label htmlFor="sort-field-select" className="text-soc-textMuted font-medium text-[11px]">Sort:</label>
          <select
            id="sort-field-select"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="timestamp" className="bg-soc-secondary text-white">Time</option>
            <option value="amount" className="bg-soc-secondary text-white">Amount</option>
            <option value="risk_score" className="bg-soc-secondary text-white">Risk Score</option>
          </select>

          <button
            type="button"
            onClick={onSortOrderToggle}
            className="p-1 rounded text-soc-textMuted hover:text-soc-cyan transition-colors ml-1 focus-ring cursor-pointer"
            title={`Sort order: ${sortOrder.toUpperCase()}`}
            aria-label={`Toggle sort order (Current: ${sortOrder.toUpperCase()})`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
