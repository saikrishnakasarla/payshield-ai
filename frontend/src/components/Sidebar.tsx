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
      className="hidden lg:flex w-20 bg-soc-secondary border-r border-soc-cyan/20 flex-col items-center py-6 justify-between flex-shrink-0 z-30 select-none shadow-[4px_0_24px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      aria-label="Desktop primary navigation"
    >
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <NavLink
          to="/"
          className="relative p-3 rounded-2xl bg-soc-cyan/15 border border-soc-cyan/40 text-soc-cyan hover:bg-soc-cyan hover:text-soc-bg transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] group focus-ring cursor-pointer"
          title="PayShield AI — Financial Protection Platform"
          aria-label="PayShield AI Home"
        >
          <ShieldAlert className="w-6 h-6 group-hover:scale-105 transition-transform" />
          <span className="sr-only">PayShield AI</span>
        </NavLink>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative p-3 rounded-xl transition-all duration-200 group flex items-center justify-center focus-ring ${
                    isActive
                      ? 'bg-soc-cyan/20 text-soc-cyan border border-soc-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                      : 'text-soc-textMuted hover:text-soc-cyan hover:bg-soc-card/80 border border-transparent'
                  }`
                }
                title={item.label}
                aria-label={item.label}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {isActive && (
                      <span className="absolute -left-3.5 w-1.5 h-6 bg-soc-cyan rounded-r-full shadow-[0_0_8px_#00e5ff]" aria-hidden="true" />
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
          className="p-2.5 rounded-xl text-soc-textMuted hover:text-soc-cyan hover:bg-soc-card transition-all focus-ring"
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
            <div className="w-10 h-10 rounded-full border border-soc-teal/50 bg-gradient-to-tr from-soc-card to-soc-secondary flex items-center justify-center text-xs font-bold text-soc-teal shadow-[0_0_12px_rgba(0,245,200,0.25)]">
              {userInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-soc-teal border-2 border-soc-secondary shadow-[0_0_6px_#00f5c8]" aria-hidden="true" />
          </NavLink>
        ) : (
          <NavLink
            to="/signin"
            className="w-10 h-10 rounded-full border border-soc-cyan/30 bg-soc-card hover:bg-soc-cyan/20 text-soc-cyan flex items-center justify-center transition-all focus-ring shadow-[0_0_10px_rgba(0,229,255,0.15)]"
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
