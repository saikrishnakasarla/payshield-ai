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
    if (password.length === 0) return { label: 'Empty', color: 'bg-slate-700', text: 'text-slate-500' };
    if (strengthScore <= 1) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (strengthScore === 2 || strengthScore === 3) return { label: 'Good', color: 'bg-amber-500', text: 'text-amber-400' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
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
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-[#1F293D] bg-[#121721] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        
        {/* Left Side: Brand Visual & Value Proposition (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0e1626] via-[#121927] to-[#0A0D14] p-8 flex-col justify-between border-r border-[#1F293D] relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>MERCHANT ONBOARDING</span>
            </div>
            <h2 className="text-2xl font-bold font-sans text-slate-100 tracking-tight leading-snug">
              Instant Risk Screening for Your Online Store
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Register your merchant profile to screen live Sandbox charges, configure custom risk thresholds, and preserve customer trust.
            </p>
          </div>

          {/* Value Props */}
          <div className="relative z-10 space-y-3.5 my-6">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Per-Merchant Data Isolation</h4>
                <p className="text-[11px] text-slate-400">Your store transactions and PayPal captures remain completely private.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Customizable Rule Thresholds</h4>
                <p className="text-[11px] text-slate-400">Tune baseline multipliers and velocity windows to match your business model.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Audit-Ready Logging</h4>
                <p className="text-[11px] text-slate-400">Detailed timestamped records for every review decision and inspection.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[#1F293D] flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>PayPal AI Hackathon</span>
            <span>GDPR/CCPA Conscious</span>
          </div>
        </div>

        {/* Right Side: Interactive Registration Form */}
        <motion.div 
          className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-center"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-5 space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold font-sans text-slate-100 tracking-tight">
              Create Merchant Account
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Enter your details to initialize your isolated PayShield workspace
            </p>
          </div>

          {error && (
            <div 
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 font-sans animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label htmlFor="signup-business" className="block text-xs font-medium text-slate-300 mb-1">
                  Store / Business Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-business"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Digital Goods"
                    className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-medium text-slate-300 mb-1">
                Business Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@acmedigital.com"
                  className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-sans"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="signup-password" className="block text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl pl-10 pr-9 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signup-confirm" className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-[#0B0E14] border border-[#1F293D] rounded-xl pl-10 pr-9 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-400">Password strength:</span>
                  <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-[#0B0E14] rounded-full overflow-hidden p-0.5 border border-[#1F293D]">
                  <div className={`rounded-full h-full ${strengthScore >= 1 ? strength.color : 'bg-transparent'}`} />
                  <div className={`rounded-full h-full ${strengthScore >= 2 ? strength.color : 'bg-transparent'}`} />
                  <div className={`rounded-full h-full ${strengthScore >= 3 ? strength.color : 'bg-transparent'}`} />
                  <div className={`rounded-full h-full ${strengthScore >= 4 ? strength.color : 'bg-transparent'}`} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 pt-0.5 font-sans">
                  <span className={hasMinLength ? 'text-emerald-400 flex items-center gap-0.5' : ''}>
                    {hasMinLength && <Check className="w-2.5 h-2.5" />} 8+ chars
                  </span>
                  <span className={hasUpperCase ? 'text-emerald-400 flex items-center gap-0.5' : ''}>
                    {hasUpperCase && <Check className="w-2.5 h-2.5" />} Uppercase
                  </span>
                  <span className={hasNumber ? 'text-emerald-400 flex items-center gap-0.5' : ''}>
                    {hasNumber && <Check className="w-2.5 h-2.5" />} Number
                  </span>
                  <span className={hasSpecial ? 'text-emerald-400 flex items-center gap-0.5' : ''}>
                    {hasSpecial && <Check className="w-2.5 h-2.5" />} Special char
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] text-white font-sans text-xs font-semibold tracking-wide transition-all shadow-[0_0_18px_rgba(14,165,233,0.35)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Registering Profile...</span>
                </div>
              ) : (
                <>
                  <span>Create Merchant Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In link */}
          <div className="mt-5 pt-4 border-t border-[#1F293D] text-center text-xs text-slate-400 font-sans">
            <span>Already have an account? </span>
            <Link to="/signin" className="text-cyan-400 hover:text-cyan-300 font-semibold ml-1 transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
