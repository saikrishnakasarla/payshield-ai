import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { Sidebar } from './components/Sidebar';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { MobileHeaderBar } from './components/MobileHeaderBar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { TransactionMonitor } from './pages/TransactionMonitor';
import { PayPalSandboxPage } from './pages/PayPalSandboxPage';
import { UnifiedCheckoutPage } from './pages/UnifiedCheckoutPage';
import { InsightsReports } from './pages/InsightsReports';
import { SettingsDocs } from './pages/SettingsDocs';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { TransactionInvestigationModal } from './features/transactions/TransactionInvestigationModal';

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
              <Routes>
                {/* Core Pages */}
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

                {/* Authentication Pages */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
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
