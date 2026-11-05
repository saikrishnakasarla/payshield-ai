import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
      <div className="w-9 h-9 rounded-full border-2 border-soc-cyan/20 border-t-soc-cyan animate-spin shadow-[0_0_15px_rgba(0,229,255,0.3)]" />
      <span className="text-xs font-mono text-soc-cyan tracking-widest uppercase">Initializing Security Module...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password'];
  const isAuthPage = authRoutes.includes(location.pathname);

  const handleSelectTransaction = (id: number) => {
    setSelectedTransactionId(id);
  };

  const handleCloseModal = () => {
    setSelectedTransactionId(null);
  };

  const handleReviewUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-soc-bg text-soc-text font-sans overflow-x-hidden selection:bg-soc-cyan/30 selection:text-white">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-soc-bg text-soc-text font-sans selection:bg-soc-cyan/30 selection:text-white relative">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] bg-soc-cyan/5 rounded-full blur-[140px] -z-10" />
      <div className="pointer-events-none fixed bottom-0 left-20 w-[600px] h-[600px] bg-soc-teal/5 rounded-full blur-[160px] -z-10" />

      {/* Mobile Top Header */}
      <MobileHeaderBar onOpenNav={() => setIsMobileNavOpen(true)} />

      {/* Mobile Drawer Navigation */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 relative">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route
                path="/"
                element={<OverviewDashboard onSelectTransaction={handleSelectTransaction} refreshTrigger={refreshKey} />}
              />
              <Route
                path="/transactions"
                element={<TransactionMonitor onSelectTransaction={handleSelectTransaction} refreshTrigger={refreshKey} />}
              />
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

              {/* Redirection fallback */}
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
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
