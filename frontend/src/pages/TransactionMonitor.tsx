import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle, 
  AlertTriangle,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Header } from '../components/Header';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { TransactionFilters } from '../features/transactions/TransactionFilters';
import { TransactionTable } from '../features/transactions/TransactionTable';
import { Transaction, ShowcaseScenario } from '../lib/types';
import { fetchTransactions, resetDemoDatabase, fetchShowcaseScenarios, simulateScenario } from '../lib/api';

interface TransactionMonitorProps {
  onSelectTransaction: (txnId: number) => void;
  refreshTrigger?: number;
}

export const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  onSelectTransaction,
  refreshTrigger,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<string>('ALL');
  const [reviewStatus, setReviewStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Decision Showcase Scenarios State
  const [scenarios, setScenarios] = useState<ShowcaseScenario[]>([]);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [isScenariosOpen, setIsScenariosOpen] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTransactions({
        page,
        limit: 10,
        search,
        risk_level: riskLevel,
        review_status: reviewStatus,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setTransactions(res.items);
      setPages(res.pages);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, riskLevel, reviewStatus, sortBy, sortOrder, refreshTrigger]);

  useEffect(() => {
    fetchShowcaseScenarios()
      .then((res) => setScenarios(res.scenarios))
      .catch((err) => console.error('Failed to load showcase scenarios:', err));
  }, []);

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleSimulateScenario = async (scenarioId: string) => {
    setSimulatingId(scenarioId);
    try {
      const res = await simulateScenario(scenarioId);
      await loadData();
      if (res.transaction_id) {
        onSelectTransaction(res.transaction_id);
      }
    } catch (err: any) {
      console.error('Failed to simulate scenario:', err);
      alert(err.message || 'Failed to simulate scenario.');
    } finally {
      setSimulatingId(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset demo database to original reproducible synthetic transactions?')) return;
    setIsResetting(true);
    try {
      await resetDemoDatabase();
      await loadData();
    } catch (err: any) {
      console.error('Failed to reset:', err);
      alert(err.message || 'Merchant sign-in required to reset demo data. Please log in.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Transaction Monitor"
        subtitle="Continuous telemetry & heuristic risk scoring across payment flow"
        onResetDemo={handleReset}
        isResetting={isResetting}
      />

      <DemoNoticeBadge />

      {/* Decision Showcase: 4 Live Test Scenarios Banner */}
      <div className="bg-[#121721] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1F293D] gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Real-World Decision Showcase: 4 Live Test Scenarios
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Rubric Requirement 8
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Demonstrates multi-signal evidence, model decisions, merchant actions, and cryptographically chained audit records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsScenariosOpen(!isScenariosOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0B0E14] text-slate-400 hover:text-slate-200 border border-[#1F293D] text-xs font-mono"
          >
            <span>{isScenariosOpen ? 'Collapse Showcase' : 'Expand Showcase'}</span>
            {isScenariosOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isScenariosOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 animate-fade-in">
            {scenarios.map((sc) => {
              const isSimulating = simulatingId === sc.id;
              const badgeBg = sc.badge_color === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : sc.badge_color === 'rose'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : sc.badge_color === 'amber'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-purple-500/10 text-purple-300 border-purple-500/30';

              return (
                <div
                  key={sc.id}
                  className="bg-[#0B0E14] border border-[#1F293D] hover:border-cyan-500/40 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeBg}`}>
                        {sc.badge}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-200">
                        ${sc.amount.toFixed(2)}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 font-sans leading-snug">
                      {sc.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                      {sc.description}
                    </p>

                    <div className="bg-[#121721] p-2 rounded border border-[#1F293D] text-[10px] font-mono text-slate-300 space-y-0.5">
                      <div>Customer: <span className="text-slate-100">{sc.customer.split(' ')[0]}</span></div>
                      <div>Expected: <span className="text-cyan-400">{sc.expected_model_decision.risk_tier} (P={((sc.expected_model_decision.ml_fraud_probability || 0)*100).toFixed(0)}%)</span></div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulateScenario(sc.id)}
                    disabled={isSimulating}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <span className="animate-pulse">Screening Scenario...</span>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Simulate & Inspect</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        riskLevel={riskLevel}
        onRiskLevelChange={(val) => {
          setRiskLevel(val);
          setPage(1);
        }}
        reviewStatus={reviewStatus}
        onReviewStatusChange={(val) => {
          setReviewStatus(val);
          setPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderToggle={handleSortOrderToggle}
      />

      <TransactionTable
        transactions={transactions}
        isLoading={isLoading}
        page={page}
        pages={pages}
        total={total}
        onPageChange={setPage}
        onSelectTransaction={onSelectTransaction}
      />
    </div>
  );
};
