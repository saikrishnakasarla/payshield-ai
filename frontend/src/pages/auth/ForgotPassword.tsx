import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { 
  KeyRound, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { forgotPasswordApi } from '../../lib/api';

export const ForgotPassword: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered business email.');
      return;
    }
    setError(null);
    setMessage(null);
    setResetToken(null);
    setIsSubmitting(true);
    try {
      const res = await forgotPasswordApi(email.trim());
      setMessage(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to process password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (resetToken) {
      navigator.clipboard.writeText(resetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="w-full max-w-md bg-[#121721] border border-[#1F293D] rounded-3xl p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2.5 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(14,165,233,0.2)]">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-100">
            Password Recovery
          </h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Enter your merchant email address. If an account is registered, instructions to reset your password will be provided.
          </p>
        </div>

        {error && (
          <div 
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 font-sans"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-sans space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>

            {resetToken && (
              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-cyan-500/30 text-[11px] font-mono space-y-2">
                <div className="flex items-center justify-between text-cyan-400 font-semibold">
                  <span>Development / Fast-Track Token:</span>
                  <button 
                    type="button" 
                    onClick={handleCopyToken}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="break-all text-slate-300 bg-[#121721] p-2 rounded-lg border border-[#1F293D] select-all">
                  {resetToken}
                </div>
                <div className="pt-1 text-right">
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                  >
                    <span>Proceed to Set New Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="forgot-email" className="block text-xs font-medium text-slate-300 mb-1.5">
              Registered Business Email
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="forgot-email"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] text-white font-sans text-xs font-semibold tracking-wide transition-all shadow-[0_0_18px_rgba(14,165,233,0.35)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Issuing Instructions...</span>
              </div>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#1F293D] text-center text-xs text-slate-400 font-sans">
          <Link to="/signin" className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
