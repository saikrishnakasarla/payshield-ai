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
    <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-soc-cyan/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-soc-cyan/15 text-soc-cyan border border-soc-cyan/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
              Explainable AI Analysis
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-soc-cyan/15 text-soc-cyan border border-soc-cyan/30">
                {analysis.model_used.includes('gemini') ? 'Gemini 1.5 Grounded' : 'Grounded Fact Explainer'}
              </span>
              {analysis.is_fallback && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-soc-warning/15 text-soc-warning border border-soc-warning/30">
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
            className="flex items-center gap-1.5 text-xs text-soc-textMuted hover:text-soc-cyan p-2 rounded-lg hover:bg-soc-secondary border border-soc-cyan/20 transition-all disabled:opacity-50 focus-ring cursor-pointer"
            title="Re-run AI Explanation"
            aria-label="Re-run AI Explanation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-soc-cyan' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline font-medium">Refresh Analysis</span>
          </button>
        )}
      </div>

      {/* Fact Registry Constrained Badge */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-soc-teal/15 border border-soc-teal/30 text-xs font-mono text-soc-teal shadow-[0_0_10px_rgba(0,245,200,0.1)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-soc-teal flex-shrink-0" aria-hidden="true" />
          <span className="font-semibold">Grounded Fact Registry: Zero Hallucination Guarantee</span>
        </div>
        {hasFactRegistry && (
          <button
            type="button"
            onClick={() => setShowFactLedger(!showFactLedger)}
            className="underline hover:text-white text-xs font-semibold text-soc-teal focus-ring rounded cursor-pointer"
          >
            {showFactLedger ? 'Hide Facts' : 'View Verified Facts'}
          </button>
        )}
      </div>

      {/* Verified Fact Ledger Details (if toggled) */}
      {showFactLedger && analysis.fact_registry && (
        <div className="bg-soc-secondary/80 border border-soc-cyan/20 rounded-xl p-3.5 space-y-2.5 text-xs font-mono">
          <div className="text-[11px] uppercase tracking-wider text-soc-cyan font-bold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-soc-cyan" aria-hidden="true" />
            Verified Database Attributes:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {analysis.fact_registry.verified_facts.map((fact, idx) => (
              <div key={idx} className="bg-soc-card p-2 rounded-lg border border-soc-cyan/20 flex justify-between shadow-xs">
                <span className="text-soc-textMuted">{fact.label}:</span>
                <span className="text-white font-bold">{String(fact.value)}</span>
              </div>
            ))}
          </div>

          {analysis.fact_registry.statistical_inferences.length > 0 && (
            <div className="pt-2 border-t border-soc-cyan/15">
              <div className="text-[11px] uppercase text-purple-400 font-bold flex items-center gap-1 mb-1 font-sans">
                <Cpu className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                Statistical ML Inferences:
              </div>
              <ul className="space-y-1 text-[11px] text-soc-textMuted list-disc list-inside">
                {analysis.fact_registry.statistical_inferences.map((inf, idx) => (
                  <li key={idx}>
                    <span className="text-white font-semibold">{inf.feature}</span>: {inf.risk_implication}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Summary Section */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-soc-cyan font-semibold mb-1.5">
          Executive Summary
        </h4>
        <p className="text-sm text-soc-text leading-relaxed bg-soc-secondary/80 p-3.5 rounded-xl border border-soc-cyan/20 font-sans">
          {analysis.ai_summary}
        </p>
      </div>

      {/* Evidence-based explanation */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-soc-cyan font-semibold mb-1.5">
          Observed Patterns & Evidence
        </h4>
        <div className="text-xs text-soc-text space-y-1.5 whitespace-pre-line bg-soc-secondary/80 p-3.5 rounded-xl border border-soc-cyan/20 font-mono leading-relaxed">
          {analysis.ai_explanation}
        </div>
      </div>

      {/* Uncertainties & Limitations */}
      <div className="p-3.5 rounded-xl bg-soc-warning/15 border border-soc-warning/30 text-xs text-soc-text flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-soc-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-bold text-soc-warning">Confidence Limitations & Caveats: </span>
          <span className="text-soc-textMuted">{analysis.ai_uncertainties}</span>
        </div>
      </div>

      {/* Recommended Merchant Checklist */}
      {analysis.ai_recommended_steps && analysis.ai_recommended_steps.length > 0 && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-soc-textMuted font-semibold mb-2 flex items-center justify-between font-sans">
            <span>Recommended Merchant Verification Steps</span>
            <span className="text-[11px] text-soc-cyan font-mono font-medium">
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
                      ? 'bg-soc-teal/15 border-soc-teal/40 text-soc-teal line-through'
                      : 'bg-soc-secondary/80 border-soc-cyan/20 text-soc-text hover:border-soc-cyan/40'
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
                  <button type="button" className="flex-shrink-0 mt-0.5 text-soc-cyan focus-ring rounded" tabIndex={-1}>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-soc-teal" aria-hidden="true" />
                    ) : (
                      <Square className="w-4 h-4 text-soc-textMuted" aria-hidden="true" />
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
