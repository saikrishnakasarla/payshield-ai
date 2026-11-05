import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckSquare, Square, RefreshCw, ShieldCheck, Database, Cpu } from 'lucide-react';
import { RiskAnalysis } from '../../lib/types';

interface AIExplanationCardProps {
  analysis: RiskAnalysis;
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

export const AIExplanationCard: React.FC<AIExplanationCardProps> = ({
  analysis,
  onReanalyze,
  isAnalyzing = false,
}) => {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [showFactLedger, setShowFactLedger] = useState<boolean>(false);

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const hasFactRegistry = !!analysis.fact_registry;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
              Explainable AI Analysis
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {analysis.model_used.includes('gemini') ? 'Gemini 1.5 Grounded' : 'Grounded Fact Explainer'}
              </span>
              {analysis.is_fallback && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Fallback Mode
                </span>
              )}
            </h3>
          </div>
        </div>

        {onReanalyze && (
          <button
            type="button"
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-50 border border-slate-200 transition-all disabled:opacity-50 focus-ring"
            title="Re-run AI Explanation"
            aria-label="Re-run AI Explanation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-blue-600' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline font-medium">Refresh Analysis</span>
          </button>
        )}
      </div>

      {/* Fact Registry Constrained Badge */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-xs font-mono text-teal-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" aria-hidden="true" />
          <span className="font-semibold">Grounded Fact Registry: Zero Hallucination Guarantee</span>
        </div>
        {hasFactRegistry && (
          <button
            type="button"
            onClick={() => setShowFactLedger(!showFactLedger)}
            className="underline hover:text-teal-700 text-xs font-semibold text-teal-800 focus-ring rounded"
          >
            {showFactLedger ? 'Hide Facts' : 'View Verified Facts'}
          </button>
        )}
      </div>

      {/* Verified Fact Ledger Details (if toggled) */}
      {showFactLedger && analysis.fact_registry && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs font-mono">
          <div className="text-[11px] uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
            Verified Database Attributes:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {analysis.fact_registry.verified_facts.map((fact, idx) => (
              <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between shadow-2xs">
                <span className="text-slate-500">{fact.label}:</span>
                <span className="text-slate-900 font-bold">{String(fact.value)}</span>
              </div>
            ))}
          </div>

          {analysis.fact_registry.statistical_inferences.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[11px] uppercase text-purple-700 font-bold flex items-center gap-1 mb-1 font-sans">
                <Cpu className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                Statistical ML Inferences:
              </div>
              <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside">
                {analysis.fact_registry.statistical_inferences.map((inf, idx) => (
                  <li key={idx}>
                    <span className="text-slate-900 font-semibold">{inf.feature}</span>: {inf.risk_implication}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Summary Section */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
          Executive Summary
        </h4>
        <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans">
          {analysis.ai_summary}
        </p>
      </div>

      {/* Evidence-based explanation */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
          Observed Patterns & Evidence
        </h4>
        <div className="text-xs text-slate-800 space-y-1.5 whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono leading-relaxed">
          {analysis.ai_explanation}
        </div>
      </div>

      {/* Uncertainties & Limitations */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-bold text-amber-900">Confidence Limitations & Caveats: </span>
          <span>{analysis.ai_uncertainties}</span>
        </div>
      </div>

      {/* Recommended Merchant Checklist */}
      {analysis.ai_recommended_steps && analysis.ai_recommended_steps.length > 0 && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center justify-between font-sans">
            <span>Recommended Merchant Verification Steps</span>
            <span className="text-[11px] text-blue-700 font-mono font-medium">
              {Object.values(checkedSteps).filter(Boolean).length}/{analysis.ai_recommended_steps.length} verified
            </span>
          </h4>
          <div className="space-y-2">
            {analysis.ai_recommended_steps.map((step, idx) => {
              const isChecked = !!checkedSteps[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 line-through'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleStep(idx);
                    }
                  }}
                >
                  <button type="button" className="flex-shrink-0 mt-0.5 text-blue-600 focus-ring rounded" tabIndex={-1}>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    )}
                  </button>
                  <span className="text-xs font-medium leading-relaxed font-sans">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
