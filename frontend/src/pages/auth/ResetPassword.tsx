import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { 
  KeyRound, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { resetPasswordApi } from '../../lib/api';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  // Password strength validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUpperCase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('A valid password reset token is required.');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await resetPasswordApi({ token: token.trim(), new_password: newPassword });
      setSuccess(res.message || 'Password reset successfully. Redirecting to sign in...');
      setTimeout(() => {
        navigate('/signin', {
          replace: true,
          state: {
            successMessage: 'Password successfully updated. Please sign in with your new password.'
          }
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-soc-bg text-soc-text relative overflow-hidden select-none">
      {/* Background Nebulas */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-soc-cyan/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-soc-teal/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Glass Card */}
      <motion.div 
        className="w-full max-w-lg rounded-3xl border border-soc-cyan/30 bg-soc-card/90 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_0_50px_rgba(0,229,255,0.15)] relative z-10"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-soc-teal/10 border border-soc-teal/40 flex items-center justify-center text-soc-teal mb-3 shadow-[0_0_20px_rgba(0,245,200,0.25)]">
            <Lock className="w-8 h-8" />
          </div>
          <div className="text-xs font-mono text-soc-cyan tracking-wider uppercase font-semibold">
            Security Credential Update
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Set New Password
          </h1>
          <p className="text-xs text-soc-textMuted max-w-sm mt-1">
            Enter your recovery token and select a new secure merchant password.
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div 
            role="status"
            className="mb-5 p-3.5 rounded-xl bg-soc-teal/15 border border-soc-teal/40 text-soc-teal text-xs flex items-center gap-2.5 font-sans animate-fade-in shadow-[0_0_15px_rgba(0,245,200,0.15)]"
          >
            <CheckCircle2 className="w-4 h-4 text-soc-teal flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div 
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-soc-danger/15 border border-soc-danger/40 text-soc-danger text-xs flex items-center gap-2.5 font-sans animate-fade-in shadow-[0_0_15px_rgba(255,82,99,0.15)]"
          >
            <AlertCircle className="w-4 h-4 text-soc-danger flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Token Field */}
          <div>
            <label htmlFor="reset-token" className="block text-xs font-semibold text-soc-text mb-1.5 font-sans">
              Reset Security Token
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token here"
                className="w-full bg-soc-bg/80 border border-soc-cyan/30 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-soc-cyan placeholder:text-soc-textMuted/60 focus:bg-soc-bg focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 transition-all"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="reset-password" className="block text-xs font-semibold text-soc-text mb-1.5 font-sans">
              New Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-soc-bg/80 border border-soc-cyan/30 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-soc-bg focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted hover:text-soc-cyan transition-colors p-1 rounded focus-ring cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="reset-confirm" className="block text-xs font-semibold text-soc-text mb-1.5 font-sans">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="reset-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-soc-bg/80 border border-soc-cyan/30 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-soc-bg focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/30 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-soc-textMuted hover:text-soc-cyan transition-colors p-1 rounded focus-ring cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength bar */}
          {newPassword.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 h-1.5 pt-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`rounded-full transition-all duration-300 ${
                    step <= strengthScore ? 'bg-soc-teal' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-3 px-4 rounded-xl btn-cyan-gradient text-soc-bg font-sans text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(0,229,255,0.35)] hover:shadow-[0_0_30px_rgba(0,229,255,0.55)] focus-ring disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-soc-bg/30 border-t-soc-bg rounded-full animate-spin" />
                <span>Updating Password...</span>
              </div>
            ) : (
              <>
                <span>Save New Password & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-soc-cyan/20 text-center text-xs text-soc-textMuted font-sans">
          <Link to="/signin" className="inline-flex items-center gap-1.5 text-soc-cyan hover:text-soc-teal font-semibold transition-colors focus-ring rounded">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Back to Sign In</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
