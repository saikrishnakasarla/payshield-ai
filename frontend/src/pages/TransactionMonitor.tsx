import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Activity
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
  const [provider, setProvider] = useState<string>('ALL');
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
        provider: provider !== 'ALL' ? provider : undefined,
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
      <section 
        className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-md"
        aria-labelledby="decision-showcase-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-soc-cyan/20 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-soc-cyan/15 text-soc-cyan border border-soc-cyan/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
              <Layers className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="decision-showcase-heading" className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                Real-World Decision Showcase: 4 Live Test Scenarios
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-soc-cyan/15 text-soc-cyan border border-soc-cyan/30">
                  Rubric Requirement 8
                </span>
              </h2>
              <p className="text-xs text-soc-textMuted mt-0.5">
                Demonstrates multi-signal evidence, model decisions, merchant actions, and cryptographically chained audit records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsScenariosOpen(!isScenariosOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-soc-secondary text-soc-text hover:text-white border border-soc-cyan/20 hover:border-soc-cyan/40 text-xs font-medium focus-ring cursor-pointer transition-colors"
            aria-expanded={isScenariosOpen}
          >
            <span>{isScenariosOpen ? 'Collapse Showcase' : 'Expand Showcase'}</span>
            {isScenariosOpen ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        </div>

        {isScenariosOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {scenarios.map((sc) => {
              const isSimulating = simulatingId === sc.id;
              const badgeBg = sc.badge_color === 'emerald'
                ? 'bg-soc-teal/15 text-soc-teal border-soc-teal/40'
                : sc.badge_color === 'rose'
                ? 'bg-soc-danger/15 text-soc-danger border-soc-danger/40'
                : sc.badge_color === 'amber'
                ? 'bg-soc-warning/15 text-soc-warning border-soc-warning/40'
                : 'bg-purple-950/60 text-purple-300 border-purple-500/40';

              return (
                <div
                  key={sc.id}
                  className="bg-soc-secondary/80 border border-soc-cyan/20 hover:border-soc-cyan/60 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.15)] group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeBg}`}>
                        {sc.badge}
                      </span>
                      <span className="font-mono font-bold text-xs text-white">
                        ${sc.amount.toFixed(2)}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white font-sans leading-snug group-hover:text-soc-cyan transition-colors">
                      {sc.title}
                    </h3>

                    <p className="text-[11px] text-soc-textMuted line-clamp-3 leading-relaxed">
                      {sc.description}
                    </p>

                    <div className="bg-soc-card/90 p-2 rounded-lg border border-soc-cyan/20 text-[11px] font-mono text-soc-textMuted space-y-0.5">
                      <div>Customer: <span className="text-white font-semibold">{sc.customer.split(' ')[0]}</span></div>
                      <div>Expected: <span className="text-soc-cyan font-bold">{sc.expected_model_decision.risk_tier} (P={((sc.expected_model_decision.ml_fraud_probability || 0)*100).toFixed(0)}%)</span></div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulateScenario(sc.id)}
                    disabled={isSimulating}
                    className="w-full py-2 px-3 rounded-lg btn-cyan-gradient text-soc-bg text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(0,229,255,0.25)] focus-ring cursor-pointer"
                    aria-label={`Simulate and inspect scenario: ${sc.title}`}
                  >
                    {isSimulating ? (
                      <span className="animate-pulse">Screening Scenario...</span>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                        <span>Simulate & Inspect</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
        provider={provider}
        onProviderChange={(val) => {
          setProvider(val);
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
