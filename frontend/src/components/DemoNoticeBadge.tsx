import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface DemoNoticeProps {
  compact?: boolean;
}

export const DemoNoticeBadge: React.FC<DemoNoticeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        DEMO DATA
      </span>
    );
  }

  return (
    <div className="bg-[#121721] border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 flex-shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-amber-300 mr-1.5">Demonstration Environment Notice:</span>
          <span>
            PayShield AI uses synthetic seeded transactions and PayPal Sandbox for demo payments. Risk alerts are
            explainable recommendations, not proof of fraud. All actions are review-only.
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4 hidden md:block">
        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono text-[11px] border border-slate-700">
          SECURE SANDBOX
        </span>
      </div>
    </div>
  );
};
