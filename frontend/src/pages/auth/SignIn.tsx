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
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xl">
        
        {/* Left Side: Brand Visual & Value Proposition (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-8 flex-col justify-between border-r border-slate-800 text-white relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>PAYSHIELD AI PROTECTION</span>
            </div>
            <h2 className="text-2xl font-bold font-sans text-white tracking-tight leading-snug">
              Explainable AI Financial Protection for PayPal Merchants
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Screen transactions with deterministic mathematical rules and plain-English Gemini explanations before order fulfillment.
            </p>
          </div>

          {/* Key Security Pillars */}
          <div className="relative z-10 space-y-3.5 my-6">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Zero False Denials</h4>
                <p className="text-[11px] text-slate-300">Review recommendations only; customers are never blocked automatically.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Grounded Gemini AI</h4>
                <p className="text-[11px] text-slate-300">Transparent narrative summaries without hallucinated facts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-400 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">PayPal Sandbox Integrated</h4>
                <p className="text-[11px] text-slate-300">Official JavaScript SDK buyer approval with server capture verification.</p>
              </div>
            </div>
          </div>

          {/* Footer badge */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>PayPal AI Hackathon</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              256-Bit SSL
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Form Container */}
        <motion.div 
          className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-6 space-y-1.5">
            <h3 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
              Merchant Sign In
            </h3>
            <p className="text-sm text-slate-500 font-sans">
              Enter your registered merchant credentials to access isolated live protection
            </p>
          </div>

          {/* Registration Success Guidance Banner */}
          {successMessage && (
            <div 
              role="status"
              className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 font-sans animate-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div 
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-sans animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="signin-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="signin-password" className="block text-xs font-semibold text-slate-700">
                  Account Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium focus-ring rounded"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded focus-ring"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans text-sm font-semibold tracking-wide transition-all shadow-sm hover:shadow focus-ring disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-500 font-sans">
            <span>Don't have an account yet? </span>
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold ml-1 transition-colors focus-ring rounded">
              Create Merchant Account
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
