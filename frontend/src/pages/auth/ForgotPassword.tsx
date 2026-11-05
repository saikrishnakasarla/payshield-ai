import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { 
  KeyRound, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
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
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <motion.div 
        className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900">
            Password Recovery
          </h2>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            Enter your merchant email address. If an account is registered, instructions to reset your password will be provided.
          </p>
        </div>

        {error && (
          <div 
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-sans"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>

            {/* Direct token convenience in Sandbox/Dev mode */}
            {resetToken && (
              <div className="mt-3 p-3 bg-white border border-emerald-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-800">
                    Dev Mode Reset Token
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 focus-ring rounded px-1.5 py-0.5"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="block text-[11px] font-mono break-all text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  {resetToken}
                </code>
                <div className="pt-1">
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 focus-ring rounded"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="recovery-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Registered Business Email
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="recovery-email"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans text-sm font-semibold tracking-wide transition-all shadow-sm hover:shadow focus-ring disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Processing Request...</span>
              </div>
            ) : (
              <>
                <span>Send Reset Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-500 font-sans">
          <Link to="/signin" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold transition-colors focus-ring rounded">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
