import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  riskLevel: string;
  onRiskLevelChange: (val: string) => void;
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
  reviewStatus,
  onReviewStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
}) => {
  return (
    <div className="bg-[#121721] border border-[#1F293D] rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Order ID, customer, email, or IP..."
          className="w-full bg-[#0B0E14] border border-[#1F293D] focus:border-rose-500/50 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
        />
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {/* Risk Level Filter */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-[#0B0E14] border border-[#1F293D] rounded-xl px-3 py-2 min-h-[44px] text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-mono text-[11px]">Risk:</span>
          </div>
          <select
            value={riskLevel}
            onChange={(e) => onRiskLevelChange(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-mono"
          >
            <option value="ALL" className="bg-[#121721]">All Tiers</option>
            <option value="HIGH" className="bg-[#121721]">High Risk</option>
            <option value="MEDIUM" className="bg-[#121721]">Medium Risk</option>
            <option value="LOW" className="bg-[#121721]">Low Risk</option>
          </select>
        </div>

        {/* Review Status Filter */}
        <div className="flex-1 sm:flex-none flex items-center justify-between gap-1.5 bg-[#0B0E14] border border-[#1F293D] rounded-xl px-3 py-2 min-h-[44px] text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Review:</span>
          <select
            value={reviewStatus}
            onChange={(e) => onReviewStatusChange(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-mono"
          >
            <option value="ALL" className="bg-[#121721]">All Statuses</option>
            <option value="UNREVIEWED" className="bg-[#121721]">Unreviewed</option>
            <option value="REVIEWED_SAFE" className="bg-[#121721]">Reviewed Safe</option>
            <option value="ESCALATED_HUMAN_REVIEW" className="bg-[#121721]">Escalated</option>
          </select>
        </div>

        {/* Sort By Field */}
        <div className="w-full sm:w-auto flex items-center justify-between gap-1.5 bg-[#0B0E14] border border-[#1F293D] rounded-xl px-3 py-2 min-h-[44px] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-mono"
            >
              <option value="timestamp" className="bg-[#121721]">Timestamp</option>
              <option value="amount" className="bg-[#121721]">Amount</option>
              <option value="risk_score" className="bg-[#121721]">Risk Score</option>
            </select>
          </div>
          <button
            onClick={onSortOrderToggle}
            className="p-1.5 hover:bg-[#18202F] rounded-lg text-slate-300 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={`Toggle Sort Order (${sortOrder.toUpperCase()})`}
            aria-label="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
