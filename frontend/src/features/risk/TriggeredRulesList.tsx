import React from 'react';
import { TriggeredRule } from '../../lib/types';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface TriggeredRulesListProps {
  rules: TriggeredRule[];
}

export const TriggeredRulesList: React.FC<TriggeredRulesListProps> = ({ rules }) => {
  if (!rules || rules.length === 0) {
    return (
      <div className="bg-soc-teal/15 border border-soc-teal/40 rounded-xl p-4 flex items-center gap-3 shadow-[0_0_15px_rgba(0,245,200,0.1)]" role="status">
        <div className="p-2 rounded-lg bg-soc-teal/20 text-soc-teal">
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-white font-sans">All Screening Checks Passed</p>
          <p className="text-xs text-soc-teal mt-0.5">
            No heuristic risk rules triggered. Transaction values and connection signatures conform to expected merchant patterns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-soc-textMuted font-sans">
          Triggered Heuristic Rules ({rules.length})
        </h3>
        <span className="text-[11px] font-mono font-bold text-soc-danger bg-soc-danger/15 border border-soc-danger/30 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(255,82,99,0.15)]">
          +{rules.reduce((acc, r) => acc + r.score_points, 0)} total pts
        </span>
      </div>

      <div className="space-y-2.5">
        {rules.map((rule) => (
          <div
            key={rule.rule_id}
            className="bg-soc-secondary/80 border border-soc-cyan/20 hover:border-soc-cyan/50 rounded-xl p-3.5 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-soc-danger shadow-[0_0_6px_#ff5263]" aria-hidden="true" />
                <span className="text-xs font-mono font-bold text-white">
                  {rule.rule_name}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-soc-danger/20 border border-soc-danger/30 text-soc-danger font-mono text-xs font-bold">
                +{rule.score_points} pts
              </span>
            </div>

            <p className="text-xs text-soc-textMuted mt-1">{rule.description}</p>

            <div className="mt-2.5 pt-2 border-t border-soc-cyan/15 flex items-start gap-1.5 text-xs text-soc-text bg-soc-card/90 p-2.5 rounded-lg border border-soc-cyan/20 font-mono">
              <span className="text-soc-warning font-bold select-none">Evidence:</span>
              <span className="text-white">{rule.evidence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
