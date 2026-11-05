import React from 'react';
import { Info } from 'lucide-react';

interface DemoNoticeProps {
  compact?: boolean;
}

export const DemoNoticeBadge: React.FC<DemoNoticeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-semibold"
        role="note"
        aria-label="Demonstration environment with synthetic data"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
        DEMO ENVIRONMENT
      </span>
    );
  }

  return (
    <div 
      className="bg-amber-50/80 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-amber-950 shadow-sm"
      role="note"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
          <Info className="w-4 h-4" aria-hidden="true" />
        </div>
        <div>
          <span className="font-bold text-amber-900 mr-1.5">Demonstration Environment Notice:</span>
          <span className="text-amber-800">
            PayShield AI operates using deterministic synthetic transactions and verified PayPal Sandbox telemetry. Risk scores represent rule-based evidence recommendations.
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4 hidden md:block">
        <span className="px-2.5 py-1 rounded-lg bg-white text-amber-800 font-mono text-[11px] font-semibold border border-amber-200 shadow-sm">
          PAYPAL SANDBOX ACTIVE
        </span>
      </div>
    </div>
  );
};
