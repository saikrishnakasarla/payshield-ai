import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export const SignUp: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength heuristics
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [hasMinLength, hasUpperCase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'Empty', color: 'bg-slate-200', text: 'text-slate-400' };
    if (strengthScore <= 1) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (strengthScore === 2 || strengthScore === 3) return { label: 'Good', color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide your business email.');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const regEmail = email.trim();
      await register(regEmail, password, fullName.trim(), businessName.trim() || undefined);
      
      // Crucial Security Rule: Registration MUST NOT establish an authenticated session.
      // 1. Clear sensitive password fields immediately.
      setPassword('');
      setConfirmPassword('');
      
      // 2. Redirect to Login page with safe prefilled email and explicit success guidance.
      navigate('/signin', {
        replace: true,
        state: {
          email: regEmail,
          successMessage: 'Account created successfully. Please sign in with your credentials.'
        }
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try a different email or try again.');
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
              <span>PAYSHIELD AI ONBOARDING</span>
            </div>
            <h2 className="text-2xl font-bold font-sans text-white tracking-tight leading-snug">
              Secure Multi-Tenant Protection for PayPal Merchants
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Each registered merchant receives isolated cryptographic audit trails, tailored rule weights, and real-time risk scoring.
            </p>
          </div>

          {/* Key Security Pillars */}
          <div className="relative z-10 space-y-3.5 my-6">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Merchant Isolation</h4>
                <p className="text-[11px] text-slate-300">Transaction logs, rules, and secrets are strictly tenant-isolated.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Explainable Gemini AI</h4>
                <p className="text-[11px] text-slate-300">Clear rationales and forensic summaries for suspicious captures.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-400 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Instant Sandbox Testing</h4>
                <p className="text-[11px] text-slate-300">Simulate payments or hook up live PayPal Sandbox credentials anytime.</p>
              </div>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>PCI-DSS Aligned</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              256-Bit TLS
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
          <div className="mb-5 space-y-1">
            <h3 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
              Create Merchant Account
            </h3>
            <p className="text-sm text-slate-500 font-sans">
              Sign up to start monitoring transactions and mitigating payment risks
            </p>
          </div>

          {error && (
            <div 
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-sans animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label htmlFor="signup-business" className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-business"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Commerce Ltd."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Business Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Account Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
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

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Strength:</span>
                    <span className={`text-[11px] font-bold ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${strength.color}`} 
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-slate-500">
                    <span className={hasMinLength ? 'text-emerald-600 font-medium' : ''}>✓ 8+ Characters</span>
                    <span className={hasUpperCase ? 'text-emerald-600 font-medium' : ''}>✓ Uppercase Letter</span>
                    <span className={hasNumber ? 'text-emerald-600 font-medium' : ''}>✓ Number</span>
                    <span className={hasSpecial ? 'text-emerald-600 font-medium' : ''}>✓ Special Character</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="signup-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded focus-ring"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans text-sm font-semibold tracking-wide transition-all shadow-sm hover:shadow focus-ring disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Registering Merchant...</span>
                </div>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-5 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 font-sans">
            <span>Already have an account? </span>
            <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-semibold ml-1 transition-colors focus-ring rounded">
              Sign In
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
