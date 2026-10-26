import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckSquare, Square, RefreshCw, ShieldCheck, Database, Cpu, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-[#121721] border border-[#1F293D] rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Explainable AI Analysis
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {analysis.model_used.includes('gemini') ? 'Powered by Gemini' : 'Grounded Fact Explainer'}
              </span>
            </h3>
          </div>
        </div>

        {onReanalyze && (
          <button
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-[#18202F] transition-all disabled:opacity-50"
            title="Re-run AI Explanation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Analysis</span>
          </button>
        )}
      </div>

      {/* Fact Registry Constrained Badge */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Grounded Fact Registry: Zero Score Invention Guarantee</span>
        </div>
        {hasFactRegistry && (
          <button
            type="button"
            onClick={() => setShowFactLedger(!showFactLedger)}
            className="underline hover:text-cyan-100 text-[10px]"
          >
            {showFactLedger ? 'Hide Facts' : 'View Verified Facts'}
          </button>
        )}
      </div>

      {/* Verified Fact Ledger Details (if toggled) */}
      {showFactLedger && analysis.fact_registry && (
        <div className="bg-[#0B0E14] border border-[#1F293D] rounded-xl p-3 space-y-2 text-xs font-mono animate-fade-in">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Database className="w-3 h-3 text-cyan-400" />
            Verified Database Attributes:
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {analysis.fact_registry.verified_facts.map((fact, idx) => (
              <div key={idx} className="bg-[#121721] p-1.5 rounded border border-[#1F293D]/60 flex justify-between">
                <span className="text-slate-400">{fact.label}:</span>
                <span className="text-slate-200 font-bold">{String(fact.value)}</span>
              </div>
            ))}
          </div>

          {analysis.fact_registry.statistical_inferences.length > 0 && (
            <div className="pt-2 border-t border-[#1F293D]/60">
              <div className="text-[10px] uppercase text-purple-400 font-bold flex items-center gap-1 mb-1">
                <Cpu className="w-3 h-3 text-purple-400" />
                Statistical ML Inferences:
              </div>
              <ul className="space-y-0.5 text-[10px] text-slate-300 list-disc list-inside">
                {analysis.fact_registry.statistical_inferences.map((inf, idx) => (
                  <li key={idx}>
                    <span className="text-slate-200 font-semibold">{inf.feature}</span>: {inf.risk_implication}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Summary Section */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Executive Summary
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed bg-[#18202F] p-3 rounded-xl border border-[#2D3A54]">
          {analysis.ai_summary}
        </p>
      </div>

      {/* Evidence-based explanation */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Observed Patterns & Evidence
        </h4>
        <div className="text-xs text-slate-300 space-y-1.5 whitespace-pre-line bg-[#0B0E14] p-3 rounded-xl border border-[#1F293D] font-mono">
          {analysis.ai_explanation}
        </div>
      </div>

      {/* Uncertainties & Limitations (Honesty Rule!) */}
      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Confidence Limitations & Caveats: </span>
          <span>{analysis.ai_uncertainties}</span>
        </div>
      </div>

      {/* Recommended Merchant Checklist */}
      {analysis.ai_recommended_steps && analysis.ai_recommended_steps.length > 0 && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Recommended Merchant Verification Steps</span>
            <span className="text-[10px] text-cyan-400 font-normal">
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
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300 line-through'
                      : 'bg-[#18202F] border-[#2D3A54] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <button className="flex-shrink-0 mt-0.5 text-cyan-400">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <span className="text-xs font-medium leading-relaxed">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
