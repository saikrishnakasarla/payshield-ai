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
  CheckCircle2,
  Sparkles,
  Zap,
  Globe2
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { AuthHero3DScene } from '../../components/3d';

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
    if (password.length === 0) return { label: 'Empty', color: 'bg-slate-700', text: 'text-soc-textMuted' };
    if (strengthScore <= 1) return { label: 'Weak', color: 'bg-soc-danger', text: 'text-soc-danger' };
    if (strengthScore === 2 || strengthScore === 3) return { label: 'Good', color: 'bg-soc-warning', text: 'text-soc-warning' };
    return { label: 'Strong', color: 'bg-soc-teal', text: 'text-soc-teal' };
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
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to Login page with safe prefilled email and explicit success guidance.
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-soc-bg text-soc-text relative overflow-hidden select-none">
      {/* Background Ambient Nebulas */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-soc-teal/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-soc-cyan/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-soc-secondary/60 via-soc-bg to-soc-bg pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-soc-cyan/25 bg-soc-card/85 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,229,255,0.12)] relative z-10">
        
        {/* Left Side: 3D Cinematic Scene & Value Proposition */}
        <div className="hidden lg:flex lg:col-span-6 relative flex-col justify-between p-8 xl:p-10 border-r border-soc-cyan/20 bg-gradient-to-b from-soc-bg/90 via-soc-card/70 to-soc-bg/95 overflow-hidden min-h-[640px]">
          {/* Real-time 3D Canvas */}
          <div className="absolute inset-0 z-0">
            <AuthHero3DScene className="w-full h-full" showFloatingObjects={true} />
          </div>

          {/* Top Brand Tag */}
          <div className="relative z-10 pointer-events-none space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-soc-cyan/10 border border-soc-cyan/40 text-soc-cyan text-xs font-mono font-bold tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.25)]">
              <ShieldCheck className="w-4 h-4 text-soc-cyan animate-pulse" />
              <span>MERCHANT ONBOARDING</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight font-sans drop-shadow-md">
              Deploy Isolated AI Risk Protection in <span className="text-transparent bg-clip-text bg-gradient-to-r from-soc-cyan to-soc-teal">Minutes</span>
            </h1>
            <p className="text-xs xl:text-sm text-soc-textMuted max-w-lg leading-relaxed font-sans">
              Each merchant receives isolated transaction data storage, customized risk thresholds, and dedicated audit logging.
            </p>
          </div>

          {/* Bottom Security Highlights */}
          <div className="relative z-10 pointer-events-none pt-6 mt-auto">
            <div className="space-y-2.5 bg-soc-bg/75 backdrop-blur-md p-4 rounded-2xl border border-soc-cyan/25 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-soc-teal/15 border border-soc-teal/30 text-soc-teal">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white">Full Multi-Merchant Isolation: </span>
                  <span className="text-soc-textMuted">No cross-tenant data leaks or shared records.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-soc-cyan/15 border border-soc-cyan/30 text-soc-cyan">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white">Instant AI Verification: </span>
                  <span className="text-soc-textMuted">Sub-second inference and rule evaluation.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[#0079C1]/20 border border-[#0079C1]/40 text-[#00E5FF]">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white">Turnkey PayPal Sandbox: </span>
                  <span className="text-soc-textMuted">Pre-configured testing credentials and simulated buyers.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-soc-textMuted mt-3 px-1">
              <span className="flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-soc-cyan" />
                <span>Encrypted SOC Gateway</span>
              </span>
              <span className="text-soc-teal">
                Zero Setup Fees
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphism Registration Card */}
        <motion.div 
          className="lg:col-span-6 p-6 sm:p-8 xl:p-10 flex flex-col justify-center bg-soc-card/90 relative z-20 backdrop-blur-xl"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile Top Header */}
          <div className="lg:hidden mb-6 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soc-cyan/10 border border-soc-cyan/30 text-soc-cyan text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-soc-cyan" />
              <span>PAYSHIELD AI</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Create Merchant Account</h1>
            <p className="text-xs text-soc-textMuted">Isolated AI Security Console Access</p>
          </div>

          <div className="hidden lg:block mb-5 space-y-1">
            <div className="text-xs font-mono text-soc-cyan tracking-wider uppercase font-semibold">
              New Merchant Registration
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
              Create Merchant Account
            </h2>
            <p className="text-xs text-soc-textMuted font-sans">
              Set up your isolated merchant organization and administrator login
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div 
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-soc-danger/15 border border-soc-danger/40 text-soc-danger text-xs flex items-center gap-2.5 font-sans animate-fade-in shadow-[0_0_15px_rgba(255,82,99,0.15)]"
            >
              <AlertCircle className="w-4 h-4 text-soc-danger flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {/* Grid for Name and Business */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-soc-text mb-1 font-sans">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted pointer-events-none">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-soc-bg/80 border border-soc-cyan/30 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-soc-bg focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-business" className="block text-xs font-semibold text-soc-text mb-1 font-sans">
                  Business Name (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted pointer-events-none">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-business"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Payments LLC"
                    className="w-full bg-soc-bg/80 border border-soc-cyan/30 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-soc-bg focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 transition-all font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-soc-text mb-1 font-sans">
                Business Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted pointer-events-none">
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
                  className="w-full bg-soc-bg/80 border border-soc-cyan/30 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-soc-bg focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 transition-all font-sans"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-password" className="block text-xs font-semibold text-soc-text mb-1 font-sans">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-soc-bg/80 border border-soc-cyan/30 rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-soc-bg focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-soc-textMuted hover:text-soc-cyan transition-colors p-1 rounded focus-ring cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-xs font-semibold text-soc-text mb-1 font-sans">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-soc-bg/80 border border-soc-cyan/30 rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-soc-bg focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-soc-textMuted hover:text-soc-cyan transition-colors p-1 rounded focus-ring cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-soc-textMuted">Security Complexity:</span>
                  <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`rounded-full transition-all duration-300 ${
                        step <= strengthScore ? strength.color : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 px-4 rounded-xl btn-cyan-gradient text-soc-bg font-sans text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(0,229,255,0.35)] hover:shadow-[0_0_30px_rgba(0,229,255,0.55)] focus-ring disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-soc-bg/30 border-t-soc-bg rounded-full animate-spin" />
                  <span>Provisioning Isolated Workspace...</span>
                </div>
              ) : (
                <>
                  <span>Create Merchant Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-5 pt-4 border-t border-soc-cyan/20 text-center text-xs text-soc-textMuted font-sans">
            <span>Already have a merchant account? </span>
            <Link to="/signin" className="text-soc-cyan hover:text-soc-teal font-semibold ml-1 transition-colors focus-ring rounded">
              Sign In
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
