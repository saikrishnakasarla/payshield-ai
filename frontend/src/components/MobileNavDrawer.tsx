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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <motion.aside
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="fixed top-0 bottom-0 left-0 w-[84%] max-w-xs bg-white border-r border-slate-200 flex flex-col justify-between p-5 z-50 shadow-2xl overflow-y-auto"
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                    <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-sm font-bold tracking-tight text-slate-900 font-sans block">PayShield AI</span>
                    <span className="text-[11px] font-mono text-teal-600 font-medium">Enterprise Protection</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5" aria-label="Mobile navigation links">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 text-xs font-medium min-h-[44px] focus-ring ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-sm'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-slate-500" aria-hidden="true" />
                      <div className="flex-1 truncate">
                        <div className="leading-tight">{item.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{item.desc}</div>
                      </div>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Profile and Authentication Area */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              {isAuthenticated && user ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full border border-teal-500/40 bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
                      {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{user.full_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.business_name || user.email}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-all min-h-[44px] focus-ring"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <NavLink
                    to="/signin"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold font-sans transition-all min-h-[44px] shadow-sm focus-ring"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span>Merchant Sign In</span>
                  </NavLink>
                  <NavLink
                    to="/signup"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium font-sans border border-slate-300 transition-all min-h-[44px] focus-ring"
                  >
                    <span>Create Account</span>
                  </NavLink>
                </div>
              )}

              <div className="text-center text-[11px] font-mono text-slate-400">
                PayPal AI Hackathon • 2026
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
