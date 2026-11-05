import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutGrid, 
  BellRing, 
  CreditCard, 
  BarChart3, 
  SlidersHorizontal,
  Settings as SettingsIcon,
  LogIn
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutGrid },
    { to: '/transactions', label: 'Transaction Monitor', icon: BellRing },
    { to: '/checkout', label: 'Multi-Gateway Checkout', icon: CreditCard },
    { to: '/sandbox', label: 'PayPal Sandbox Live', icon: CreditCard },
    { to: '/insights', label: 'Insights & Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings & Rules Engine', icon: SlidersHorizontal },
  ];

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PS';

  return (
    <aside 
      className="hidden lg:flex w-20 bg-[#0F172A] border-r border-slate-800 flex-col items-center py-6 justify-between flex-shrink-0 z-30 select-none shadow-sm"
      aria-label="Desktop primary navigation"
    >
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <NavLink
          to="/"
          className="relative p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm group focus-ring"
          title="PayShield AI — Financial Protection Platform"
          aria-label="PayShield AI Home"
        >
          <ShieldAlert className="w-6 h-6 group-hover:scale-105 transition-transform" />
          <span className="sr-only">PayShield AI</span>
        </NavLink>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative p-3 rounded-xl transition-all duration-200 group flex items-center justify-center focus-ring ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
                title={item.label}
                aria-label={item.label}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {isActive && (
                      <span className="absolute -left-3 w-1.5 h-6 bg-blue-400 rounded-r-full" aria-hidden="true" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Settings */}
      <div className="flex flex-col items-center gap-4">
        <NavLink
          to="/settings"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all focus-ring"
          title="Settings & System Status"
          aria-label="System Settings"
        >
          <SettingsIcon className="w-5 h-5" aria-hidden="true" />
        </NavLink>

        {isAuthenticated && user ? (
          <NavLink
            to="/settings"
            className="relative group cursor-pointer focus-ring rounded-full"
            title={`${user.full_name} (${user.email})`}
            aria-label={`Profile: ${user.full_name}`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-teal-400/40 bg-gradient-to-tr from-teal-600 to-blue-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {userInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0F172A]" aria-hidden="true" />
          </NavLink>
        ) : (
          <NavLink
            to="/signin"
            className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all focus-ring"
            title="Sign In to Merchant Account"
            aria-label="Sign In"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
          </NavLink>
        )}
      </div>
    </aside>
  );
};
