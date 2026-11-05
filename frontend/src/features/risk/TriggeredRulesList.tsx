import React from 'react';
import { TriggeredRule } from '../../lib/types';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface TriggeredRulesListProps {
  rules: TriggeredRule[];
}

export const TriggeredRulesList: React.FC<TriggeredRulesListProps> = ({ rules }) => {
  if (!rules || rules.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3" role="status">
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-900 font-sans">All Screening Checks Passed</p>
          <p className="text-xs text-emerald-800 mt-0.5">
            No heuristic risk rules triggered. Transaction values and connection signatures conform to expected merchant patterns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">
          Triggered Heuristic Rules ({rules.length})
        </h3>
        <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
          +{rules.reduce((acc, r) => acc + r.score_points, 0)} total pts
        </span>
      </div>

      <div className="space-y-2.5">
        {rules.map((rule) => (
          <div
            key={rule.rule_id}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 transition-all shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600" aria-hidden="true" />
                <span className="text-xs font-mono font-bold text-slate-900">
                  {rule.rule_name}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-mono text-xs font-bold">
                +{rule.score_points} pts
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1">{rule.description}</p>

            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-start gap-1.5 text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
              <span className="text-amber-800 font-bold select-none">Evidence:</span>
              <span>{rule.evidence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
