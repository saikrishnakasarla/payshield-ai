import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export const SignIn: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Safe email prefill from registration (password is NEVER prefilled)
  const prefillEmail = (location.state as any)?.email || '';
  const initialSuccess = (location.state as any)?.successMessage || null;

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(initialSuccess);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-[#1F293D] bg-[#121721] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        
        {/* Left Side: Brand Visual & Value Proposition (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0e1626] via-[#121927] to-[#0A0D14] p-8 flex-col justify-between border-r border-[#1F293D] relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>PAYSHIELD AI PROTECTION</span>
            </div>
            <h2 className="text-2xl font-bold font-sans text-slate-100 tracking-tight leading-snug">
              Explainable AI Financial Protection for PayPal Merchants
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Screen transactions with deterministic mathematical rules and plain-English Gemini explanations before order fulfillment.
            </p>
          </div>

          {/* Key Security Pillars */}
          <div className="relative z-10 space-y-3.5 my-6">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Zero False Denials</h4>
                <p className="text-[11px] text-slate-400">Review recommendations only; customers are never blocked automatically.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Grounded Gemini AI</h4>
                <p className="text-[11px] text-slate-400">Transparent narrative summaries without hallucinated facts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">PayPal Sandbox Integrated</h4>
                <p className="text-[11px] text-slate-400">Official JavaScript SDK buyer approval with server capture verification.</p>
              </div>
            </div>
          </div>

          {/* Footer badge */}
          <div className="relative z-10 pt-4 border-t border-[#1F293D] flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>PayPal AI Hackathon</span>
            <span>256-Bit SSL</span>
          </div>
        </div>

        {/* Right Side: Interactive Form Container */}
        <motion.div 
          className="lg:col-span-7 p-5 sm:p-10 flex flex-col justify-center"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-6 space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold font-sans text-slate-100 tracking-tight">
              Merchant Sign In
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Enter your registered merchant credentials to access isolated live protection
            </p>
          </div>

          {/* Registration Success Guidance Banner */}
          {successMessage && (
            <div 
              role="status"
              className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 font-sans animate-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div 
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 font-sans animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="signin-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="signin-password" className="block text-xs font-medium text-slate-300">
                  Account Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] text-white font-sans text-xs font-semibold tracking-wide transition-all shadow-[0_0_18px_rgba(14,165,233,0.35)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Merchant Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-[#1F293D] text-center text-xs text-slate-400 font-sans">
            <span>Don't have an account yet? </span>
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold ml-1 transition-colors">
              Create Merchant Account
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
