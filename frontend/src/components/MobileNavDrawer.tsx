import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  LayoutGrid, 
  BellRing, 
  CreditCard, 
  BarChart3, 
  SlidersHorizontal, 
  X, 
  LogIn, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutGrid, desc: 'Real-time detection metrics' },
    { to: '/transactions', label: 'Transaction Monitor', icon: BellRing, desc: 'Continuous payment telemetry' },
    { to: '/checkout', label: 'Multi-Gateway Checkout', icon: CreditCard, desc: 'PayPal, Stripe, Razorpay & Adyen' },
    { to: '/sandbox', label: 'PayPal Sandbox Live', icon: CreditCard, desc: 'Orders API & AI screening' },
    { to: '/insights', label: 'Insights & Reports', icon: BarChart3, desc: 'Rule synthesis & CSV export' },
    { to: '/settings', label: 'Settings & Rules Engine', icon: SlidersHorizontal, desc: 'Heuristic thresholds' },
  ];

  // Close drawer on Escape key press and lock background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PS';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-soc-bg/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <motion.aside
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="fixed top-0 bottom-0 left-0 w-[84%] max-w-xs bg-soc-secondary/95 border-r border-soc-cyan/30 flex flex-col justify-between p-5 z-50 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-y-auto backdrop-blur-2xl"
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-soc-cyan/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-soc-cyan/15 border border-soc-cyan/40 text-soc-cyan shadow-[0_0_12px_rgba(0,229,255,0.25)]">
                    <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-sm font-bold tracking-tight text-white font-sans block">PayShield AI</span>
                    <span className="text-[11px] font-mono text-soc-teal font-medium">SOC Console</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-soc-textMuted hover:text-white hover:bg-soc-card transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation Drawer">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-start gap-3 p-3 rounded-xl transition-all duration-150 min-h-[48px] focus-ring ${
                          isActive
                            ? 'bg-soc-cyan/20 text-soc-cyan border border-soc-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                            : 'text-soc-textMuted hover:text-white hover:bg-soc-card/70 border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`p-1.5 rounded-lg ${isActive ? 'text-soc-cyan' : 'text-soc-textMuted'}`}>
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold tracking-tight font-sans text-white">{item.label}</div>
                            <div className="text-[11px] text-soc-textMuted">{item.desc}</div>
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Auth Profile / Sign In */}
            <div className="pt-4 border-t border-soc-cyan/20">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-soc-card/90 border border-soc-cyan/20">
                    <div className="w-9 h-9 rounded-full border border-soc-teal/40 bg-gradient-to-tr from-soc-card to-soc-secondary flex items-center justify-center text-xs font-bold text-soc-teal shadow-[0_0_10px_rgba(0,245,200,0.2)]">
                      {userInitials}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="text-xs font-semibold text-white truncate font-sans">
                        {user.business_name || user.full_name}
                      </div>
                      <div className="text-[11px] text-soc-textMuted truncate font-mono">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-soc-danger/40 bg-soc-danger/10 text-soc-danger hover:bg-soc-danger/20 text-xs font-semibold transition-all focus-ring min-h-[44px] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Out of Console</span>
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/signin"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl btn-cyan-gradient text-soc-bg text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] focus-ring min-h-[44px] cursor-pointer"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>Sign In to Merchant Account</span>
                </NavLink>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
