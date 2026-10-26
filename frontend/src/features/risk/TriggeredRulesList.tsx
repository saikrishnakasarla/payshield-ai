import React from 'react';
import { TriggeredRule } from '../../lib/types';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface TriggeredRulesListProps {
  rules: TriggeredRule[];
}

export const TriggeredRulesList: React.FC<TriggeredRulesListProps> = ({ rules }) => {
  if (!rules || rules.length === 0) {
    return (
      <div className="bg-[#121721] border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-400">All Screening Checks Passed</p>
          <p className="text-xs text-slate-400">
            No heuristic risk rules triggered. Transaction values and connection signatures conform to regular patterns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Triggered Heuristic Rules ({rules.length})
        </h4>
        <span className="text-[11px] font-mono text-rose-400">
          +{rules.reduce((acc, r) => acc + r.score_points, 0)} total pts
        </span>
      </div>

      <div className="space-y-2.5">
        {rules.map((rule) => (
          <div
            key={rule.rule_id}
            className="bg-[#18202F] border border-[#2D3A54] hover:border-rose-500/30 rounded-xl p-3.5 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  {rule.rule_name}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs font-semibold">
                +{rule.score_points} pts
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">{rule.description}</p>

            <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-start gap-1.5 text-xs text-slate-300 bg-[#121721] p-2 rounded-lg font-mono">
              <span className="text-amber-400 font-semibold select-none">Evidence:</span>
              <span>{rule.evidence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
