import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { Sidebar } from './components/Sidebar';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { MobileHeaderBar } from './components/MobileHeaderBar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { TransactionMonitor } from './pages/TransactionMonitor';
import { TransactionInvestigationModal } from './features/transactions/TransactionInvestigationModal';

// Route-level code splitting for heavy dependencies (Recharts, Auth forms, Sandbox)
const PayPalSandboxPage = lazy(() => import('./pages/PayPalSandboxPage').then(m => ({ default: m.PayPalSandboxPage })));
const UnifiedCheckoutPage = lazy(() => import('./pages/UnifiedCheckoutPage').then(m => ({ default: m.UnifiedCheckoutPage })));
const InsightsReports = lazy(() => import('./pages/InsightsReports').then(m => ({ default: m.InsightsReports })));
const SettingsDocs = lazy(() => import('./pages/SettingsDocs').then(m => ({ default: m.SettingsDocs })));
const SignIn = lazy(() => import('./pages/auth/SignIn').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('./pages/auth/SignUp').then(m => ({ default: m.SignUp })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
      <span className="text-xs font-mono text-slate-400 tracking-wider">Loading PayShield Module...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  const handleSelectTransaction = (id: number) => {
    setSelectedTransactionId(id);
  };

  const handleCloseModal = () => {
    setSelectedTransactionId(null);
  };

  const handleReviewUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-[#0B0E14] text-slate-100">
          {/* Mobile Top Header (Shown only on < lg viewports) */}
          <MobileHeaderBar onOpenNav={() => setIsMobileNavOpen(true)} />

          {/* Accessible Mobile Drawer Navigation */}
          <MobileNavDrawer
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
          />

          {/* Desktop Navigation Sidebar (Shown on lg+ screens) */}
          <Sidebar />

          {/* Main Content Area with fluid responsive padding */}
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Core Pages (Eagerly loaded for instant responsiveness) */}
                  <Route
                    path="/"
                    element={<OverviewDashboard onSelectTransaction={handleSelectTransaction} refreshTrigger={refreshKey} />}
                  />
                  <Route
                    path="/transactions"
                    element={<TransactionMonitor onSelectTransaction={handleSelectTransaction} refreshTrigger={refreshKey} />}
                  />

                  {/* Lazy-loaded Sub-modules */}
                  <Route
                    path="/sandbox"
                    element={<PayPalSandboxPage onSelectTransaction={handleSelectTransaction} />}
                  />
                  <Route
                    path="/checkout"
                    element={<UnifiedCheckoutPage onSelectTransaction={handleSelectTransaction} />}
                  />
                  <Route path="/insights" element={<InsightsReports />} />
                  <Route path="/settings" element={<SettingsDocs />} />

                  {/* Authentication Pages */}
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </main>

          {/* Investigation Modal Dossier */}
          {selectedTransactionId && (
            <TransactionInvestigationModal
              transactionId={selectedTransactionId}
              onClose={handleCloseModal}
              onReviewUpdated={handleReviewUpdated}
            />
          )}
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
