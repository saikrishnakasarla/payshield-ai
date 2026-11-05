import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, ShieldAlert, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface MobileHeaderBarProps {
  onOpenNav: () => void;
}

export const MobileHeaderBar: React.FC<MobileHeaderBarProps> = ({ onOpenNav }) => {
  const { user, isAuthenticated } = useAuth();

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PS';

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-soc-secondary/95 backdrop-blur-md border-b border-soc-cyan/20 px-4 py-2.5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      {/* Left: Hamburger Button + Logo */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenNav}
          className="p-2 -ml-1 rounded-xl text-soc-textMuted hover:text-soc-cyan hover:bg-soc-card transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <NavLink to="/" className="flex items-center gap-2.5 focus-ring rounded-lg cursor-pointer" title="PayShield AI Home">
          <div className="p-1.5 rounded-xl bg-soc-cyan/15 border border-soc-cyan/40 text-soc-cyan shadow-[0_0_10px_rgba(0,229,255,0.2)]">
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white font-sans block leading-none">
              PayShield AI
            </span>
            <span className="text-[10px] font-mono text-soc-teal flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-soc-teal animate-pulse" aria-hidden="true" />
              SOC Active
            </span>
          </div>
        </NavLink>
      </div>

      {/* Right: Quick Auth Action */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <NavLink
            to="/settings"
            className="flex items-center gap-1.5 p-1 rounded-full text-soc-textMuted hover:text-soc-cyan transition-all min-h-[44px] min-w-[44px] justify-center focus-ring cursor-pointer"
            title={`${user.full_name} (${user.email})`}
            aria-label={`Profile: ${user.full_name}`}
          >
            <div className="w-8 h-8 rounded-full border border-soc-teal/40 bg-gradient-to-tr from-soc-card to-soc-secondary flex items-center justify-center text-[11px] font-bold text-soc-teal shadow-[0_0_10px_rgba(0,245,200,0.2)]">
              {userInitials}
            </div>
          </NavLink>
        ) : (
          <NavLink
            to="/signin"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl btn-cyan-gradient text-soc-bg text-xs font-bold transition-all min-h-[38px] shadow-[0_0_15px_rgba(0,229,255,0.3)] focus-ring cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign In</span>
          </NavLink>
        )}
      </div>
    </header>
  );
};
