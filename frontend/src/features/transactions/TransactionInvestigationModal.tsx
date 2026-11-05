import React, { useEffect, useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Cpu, 
  MessageSquare
} from 'lucide-react';
import { Transaction, RiskAnalysis } from '../../lib/types';
import { RiskScoreGauge } from '../risk/RiskScoreGauge';
import { TriggeredRulesList } from '../risk/TriggeredRulesList';
import { AIExplanationCard } from '../risk/AIExplanationCard';
import { fetchTransactionDetail, submitReviewAction, analyzeTransactionWithAI } from '../../lib/api';

interface TransactionInvestigationModalProps {
  transactionId: number | null;
  onClose: () => void;
  onReviewUpdated?: () => void;
}

export const TransactionInvestigationModal: React.FC<TransactionInvestigationModalProps> = ({
  transactionId,
  onClose,
  onReviewUpdated,
}) => {
  const [data, setData] = useState<{
    transaction: Transaction & { items: Array<{ name: string; price: number; quantity: number }> };
    latest_analysis: RiskAnalysis;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetchTransactionDetail(id);
      setData(res);
      setReviewNote(res.transaction.review_notes || '');
    } catch (err) {
      console.error('Failed to load transaction detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      loadData(transactionId);
    }
  }, [transactionId]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!transactionId) return null;

  const handleReviewAction = async (status: 'REVIEWED_SAFE' | 'ESCALATED_HUMAN_REVIEW') => {
    if (!data) return;
    setIsSubmittingReview(true);
    setActionError(null);
    try {
      await submitReviewAction(data.transaction.id, status, reviewNote, 'Merchant Security Lead');
      await loadData(data.transaction.id);
      if (onReviewUpdated) onReviewUpdated();
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setActionError(err.message || 'Failed to submit review action.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReanalyze = async () => {
    if (!data) return;
    setIsReanalyzing(true);
    setActionError(null);
    try {
      await analyzeTransactionWithAI(data.transaction.id);
      await loadData(data.transaction.id);
      if (onReviewUpdated) onReviewUpdated();
    } catch (err: any) {
      console.error('Failed to reanalyze:', err);
      setActionError(err.message || 'Failed to run AI re-analysis.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const mlProb = data?.latest_analysis?.ml_fraud_probability !== undefined
    ? data.latest_analysis.ml_fraud_probability
    : (data?.transaction?.ml_fraud_probability !== undefined ? data.transaction.ml_fraud_probability : 0.0);

  const hybridScore = data?.latest_analysis?.hybrid_score !== undefined
    ? data.latest_analysis.hybrid_score
    : (data?.transaction?.hybrid_score !== undefined ? data.transaction.hybrid_score : data?.latest_analysis.deterministic_score || 0);

  // Parse feature attributions if available
  let featureAttributions: Array<{ feature: string; impact: number; description?: string }> = [];
  if (data?.latest_analysis?.feature_attributions) {
    if (Array.isArray(data.latest_analysis.feature_attributions)) {
      featureAttributions = data.latest_analysis.feature_attributions as any;
    } else if (typeof data.latest_analysis.feature_attributions === 'object') {
      featureAttributions = Object.entries(data.latest_analysis.feature_attributions).map(([k, v]) => ({
        feature: k,
        impact: Number(v),
      }));
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="investigation-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl relative text-slate-900">
        {/* Top Modal Header */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="investigation-modal-title" className="text-sm sm:text-base font-bold text-slate-900 font-mono break-all leading-tight">
                  {data?.transaction.reference_id || 'Transaction Investigation'}
                </h2>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold flex-shrink-0">
                  {data?.transaction.source === 'PAYPAL_SANDBOX' ? 'SANDBOX VERIFIED' : 'DEMO BENCHMARK'}
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-mono font-bold flex-shrink-0">
                  SHA-256 CHAINED
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5 font-sans">
                Multi-signal telemetry, ML inference & cryptographically chained merchant audit trail
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0 focus-ring"
            aria-label="Close investigation dossier"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        {isLoading || !data ? (
          <div className="p-16 text-center text-slate-500 font-mono text-xs" role="status">
            <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" aria-hidden="true" />
            <p>Loading multi-signal investigation dossier...</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* 3-Column Layout: Metadata | ML & Rules | AI Explanation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Transaction Metadata & Multi-Signal Telemetry (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2 font-sans">
                    <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    Transaction & Identity Signals
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block font-mono text-[11px]">Amount Charged</span>
                      <span className="text-2xl font-bold font-mono text-slate-900">
                        ${data.transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                        <span className="text-xs font-normal text-slate-500">{data.transaction.currency}</span>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block font-mono text-[11px]">Customer Profile</span>
                      <span className="font-semibold text-slate-900">{data.transaction.customer_name}</span>
                      <span className="text-slate-500 block font-mono text-[11px] truncate">
                        {data.transaction.customer_email}
                      </span>
                    </div>

                    {/* Anti-Evasion Multi-Signals: Account Age & Failed Attempts */}
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 font-mono">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Account Age</span>
                        <span className="font-bold text-slate-900 text-xs">
                          {data.transaction.account_age_days ?? 90} days
                        </span>
                        <span className="text-[10px] text-slate-500 block font-sans">
                          {(data.transaction.account_age_days ?? 90) < 7 ? '⚠️ New Account' : 'Mature Profile'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Failed (24h)</span>
                        <span className={`font-bold text-xs ${
                          (data.transaction.failed_attempts_24h ?? 0) >= 3 ? 'text-rose-600' : 'text-slate-900'
                        }`}>
                          {data.transaction.failed_attempts_24h ?? 0} attempts
                        </span>
                        <span className="text-[10px] text-slate-500 block font-sans">
                          {(data.transaction.failed_attempts_24h ?? 0) >= 3 ? '⚠️ Velocity Spike' : 'Normal'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block font-mono text-[11px]">Customer Baseline</span>
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-700">
                        <span>Avg Purchase:</span>
                        <span className="font-bold text-slate-900">${data.transaction.customer_baseline_amount}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-700">
                        <span>Prior Orders:</span>
                        <span className="font-bold text-slate-900">{data.transaction.customer_baseline_orders}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-amber-800 font-mono font-medium">
                        Current is {(data.transaction.amount / (data.transaction.customer_baseline_amount || 1)).toFixed(1)}x baseline
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block font-mono text-[11px]">Connection & Geolocation</span>
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-700">
                        <span>IP Country:</span>
                        <span className="font-bold text-slate-900">{data.transaction.ip_country} ({data.transaction.ip_address})</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-700">
                        <span>Billing Country:</span>
                        <span className="font-bold text-slate-900">{data.transaction.billing_country}</span>
                      </div>
                    </div>

                    {data.transaction.items && data.transaction.items.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-500 block font-mono text-[11px] mb-1">Purchased Line Items</span>
                        <div className="space-y-1">
                          {data.transaction.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                              <span className="truncate mr-2 font-medium">{it.quantity}x {it.name}</span>
                              <span className="font-bold text-slate-900">${(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cryptographically Chained Audit & Review History Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-mono uppercase text-[11px] font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                      Tamper-Resistant Audit Trail
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                      SHA-256 CHAINED
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-600">Current Status:</span>
                    <span className="font-bold text-blue-700">{data.transaction.review_status}</span>
                  </div>
                  {data.transaction.reviewed_at && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Reviewed on: {new Date(data.transaction.reviewed_at).toLocaleString()} by {data.transaction.reviewer}
                    </div>
                  )}
                  {data.transaction.review_notes && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 text-xs italic font-mono">
                      "{data.transaction.review_notes}"
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 font-mono leading-tight">
                    Every review action is hashed with previous chain entry and signed via HMAC-SHA256. Proves complete audit integrity.
                  </p>
                </div>
              </div>

              {/* Center Column: Risk Gauge, Random Forest ML, & Rules (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Risk Gauge */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <RiskScoreGauge
                    score={data.latest_analysis.deterministic_score}
                    level={data.latest_analysis.risk_level}
                  />
                </div>

                {/* Random Forest Classifier Card */}
                <div className="bg-slate-50 border border-blue-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-600" aria-hidden="true" />
                      <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
                        Random Forest Classifier (100 Trees)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                      Trained ML
                    </span>
                  </div>

                  {/* Probability Bar */}
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">P(Fraud) Probability:</span>
                      <span className={`font-bold ${
                        mlProb > 0.65 ? 'text-rose-600' : mlProb > 0.35 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {(mlProb * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <div
                        className={`h-full transition-all duration-700 ${
                          mlProb > 0.65 ? 'bg-rose-600' : mlProb > 0.35 ? 'bg-amber-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, mlProb * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Hybrid Score & Formula */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-xs shadow-2xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">PayShield Hybrid Score:</span>
                      <span className="font-bold text-blue-700 text-sm">
                        {hybridScore.toFixed(1)} / 100
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      Ensemble: 60% ML Probability + 40% Deterministic Rule Points
                    </div>
                  </div>

                  {/* Feature Attributions / SHAP Values */}
                  {featureAttributions.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5 font-mono text-xs">
                      <span className="text-[10px] uppercase text-slate-600 block font-bold font-sans">
                        Top Model Feature Attributions:
                      </span>
                      <div className="space-y-1">
                        {featureAttributions.slice(0, 4).map((attr, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] bg-white p-1.5 rounded-lg border border-slate-200">
                            <span className="text-slate-700 truncate mr-2 font-medium">{attr.feature}</span>
                            <span className={`font-bold ${attr.impact >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {attr.impact >= 0 ? `+${(attr.impact * 100).toFixed(0)}%` : `${(attr.impact * 100).toFixed(0)}%`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Triggered Rules List */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <TriggeredRulesList rules={data.latest_analysis.triggered_rules} />
                </div>
              </div>

              {/* Right Column: AI Explanation & Verification (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <AIExplanationCard
                  analysis={data.latest_analysis}
                  onReanalyze={handleReanalyze}
                  isAnalyzing={isReanalyzing}
                />
              </div>

            </div>

            {/* Note Input Toggle */}
            {showNoteInput && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <label htmlFor="audit-trail-note-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 font-sans">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                  Merchant Audit Trail Note:
                </label>
                <textarea
                  id="audit-trail-note-input"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Record customer contact notes, shipping address verification, or human reasoning..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus-ring font-mono h-20 shadow-2xs"
                />
              </div>
            )}
          </div>
        )}

        {/* Action Error Alert */}
        {actionError && (
          <div className="bg-rose-50 border-t border-rose-200 px-6 py-2.5 text-xs text-rose-800 font-mono flex items-center justify-between" role="alert">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" aria-hidden="true" />
              {actionError}
            </span>
            <button type="button" onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 underline text-[11px] font-semibold focus-ring rounded">
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Bottom Actions Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs font-mono">
              Cryptographic Audit: Decision states are signed and chained upon review.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center shadow-sm focus-ring"
            >
              {showNoteInput ? 'Hide Note' : 'Add Note'}
            </button>

            <button
              type="button"
              onClick={() => handleReviewAction('REVIEWED_SAFE')}
              disabled={isSubmittingReview}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm min-h-[44px] flex items-center justify-center disabled:opacity-50 focus-ring"
            >
              Mark Reviewed Safe
            </button>

            <button
              type="button"
              onClick={() => handleReviewAction('ESCALATED_HUMAN_REVIEW')}
              disabled={isSubmittingReview}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-sm min-h-[44px] flex items-center justify-center disabled:opacity-50 focus-ring"
            >
              Escalate to Human Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
