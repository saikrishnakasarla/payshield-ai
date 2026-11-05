import React from 'react';
import { Info } from 'lucide-react';

interface DemoNoticeProps {
  compact?: boolean;
}

export const DemoNoticeBadge: React.FC<DemoNoticeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-soc-warning/15 border border-soc-warning/40 text-soc-warning text-xs font-mono font-semibold shadow-[0_0_8px_rgba(255,181,71,0.15)]"
        role="note"
        aria-label="Demonstration environment with synthetic data"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-soc-warning animate-pulse" aria-hidden="true" />
        DEMO ENVIRONMENT
      </span>
    );
  }

  return (
    <div 
      className="bg-soc-card/90 border border-soc-warning/30 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-soc-text shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-md"
      role="note"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-soc-warning/15 text-soc-warning flex-shrink-0 border border-soc-warning/30">
          <Info className="w-4 h-4" aria-hidden="true" />
        </div>
        <div>
          <span className="font-bold text-soc-warning mr-1.5">Demonstration Environment Notice:</span>
          <span className="text-soc-textMuted">
            PayShield AI operates using deterministic synthetic transactions and verified PayPal Sandbox telemetry. Risk scores represent rule-based evidence recommendations.
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4 hidden md:block">
        <span className="px-2.5 py-1 rounded-lg bg-soc-secondary text-soc-warning font-mono text-[11px] font-semibold border border-soc-warning/30 shadow-sm">
          PAYPAL SANDBOX ACTIVE
        </span>
      </div>
    </div>
  );
};
