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
    { to: '/sandbox', label: 'PayPal Sandbox Checkout', icon: CreditCard },
    { to: '/insights', label: 'Insights & Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings & Rules Engine', icon: SlidersHorizontal },
  ];

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PS';

  return (
    <aside className="hidden lg:flex w-20 bg-[#0B0E14] border-r border-[#1F293D] flex-col items-center py-6 justify-between flex-shrink-0 z-30 select-none">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <NavLink
          to="/"
          className="relative p-3 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 text-rose-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] group"
          title="PayShield AI — Financial Protection Assistant"
        >
          <ShieldAlert className="w-6 h-6 group-hover:rotate-6 transition-transform" />
          <span className="sr-only">PayShield AI</span>
        </NavLink>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative p-3 rounded-xl transition-all duration-200 group flex items-center justify-center ${
                    isActive
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#18202F]'
                  }`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <span className="absolute -left-3 w-1 h-5 bg-rose-500 rounded-r-full shadow-[0_0_8px_#f43f5e]" />
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
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#18202F] transition-all"
          title="Settings & System Status"
        >
          <SettingsIcon className="w-5 h-5" />
        </NavLink>

        {isAuthenticated && user ? (
          <NavLink
            to="/settings"
            className="relative group cursor-pointer"
            title={`${user.full_name} (${user.email})`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-cyan-500/40 bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
              {userInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0E14]" />
          </NavLink>
        ) : (
          <NavLink
            to="/signin"
            className="w-10 h-10 rounded-full border border-slate-700 bg-[#121721] hover:bg-[#1F293D] text-slate-300 hover:text-cyan-400 flex items-center justify-center transition-all"
            title="Sign In to Merchant Account"
          >
            <LogIn className="w-4 h-4" />
          </NavLink>
        )}
      </div>
    </aside>
  );
};
