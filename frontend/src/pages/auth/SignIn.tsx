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
  Zap,
  Cpu,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { CanvasWrapper } from '../../components/3d/CanvasWrapper';
import { SecurityShield3D } from '../../components/3d/SecurityShield3D';
import { FloatingPaymentObjects3D } from '../../components/3d/FloatingPaymentObjects3D';
import { DigitalGlobe3D } from '../../components/3d/DigitalGlobe3D';
import { ParticleWave3D } from '../../components/3d/ParticleWave3D';

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
  const [rememberMe, setRememberMe] = useState(true);
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
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20, scale: shouldReduceMotion ? 1 : 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#050A12] text-[#F5FAFF] relative overflow-x-hidden overflow-y-auto select-none flex flex-col justify-between">
      
      {/* Background Ambient Nebulas & Glows matching Reference Image */}
      <div className="absolute top-0 left-1/4 w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-[#0099FF]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Global Background Particle Wave across the bottom */}
      <div className="absolute bottom-0 inset-x-0 h-64 pointer-events-none z-0">
        <CanvasWrapper className="w-full h-full" camera={{ position: [0, 0, 4.5], fov: 50 }} interactive={false}>
          <ParticleWave3D position={[0, -1.8, 0]} rows={35} cols={50} separation={0.32} speed={0.65} />
        </CanvasWrapper>
      </div>

      {/* Top Left Brand Logo - Fixed Header */}
      <header className="relative z-20 px-6 sm:px-10 lg:px-14 pt-6 sm:pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-soc-cyan/15 border border-soc-cyan/50 flex items-center justify-center text-soc-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)] group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-soc-cyan" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white font-sans">
            PayShield <span className="text-soc-cyan">AI</span>
          </span>
        </Link>
      </header>

      {/* Main 50/50 Split Content Area */}
      <main className="relative z-10 flex-1 px-4 sm:px-8 lg:px-14 py-4 sm:py-6 flex items-center">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* LEFT PANEL: 3D Security Shield, Pedestal, Floating Objects, Hero Typography */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4 sm:space-y-6">
            
            {/* Interactive 3D Canvas Scene */}
            <div className="w-full h-[260px] sm:h-[340px] lg:h-[390px] xl:h-[430px] relative flex items-center justify-center">
              <CanvasWrapper 
                className="w-full h-full" 
                camera={{ position: [0, 0, 5.2], fov: 44 }}
                interactive={true}
              >
                {/* Lighting */}
                <ambientLight intensity={0.65} />
                <directionalLight position={[3, 5, 4]} intensity={1.5} color="#00E5FF" />
                <directionalLight position={[-3, -3, -2]} intensity={0.8} color="#00F5C8" />
                <pointLight position={[0, 0, 2.5]} intensity={1.9} color="#00E5FF" distance={10} />

                {/* Background Rotating Digital Globe */}
                <DigitalGlobe3D radius={1.9} position={[1.4, 0.4, -2.5]} interactive={false} />

                {/* Tiered Pedestal & 3D Security Shield */}
                <SecurityShield3D position={[0, 0.1, 0]} scale={1.05} interactive={true} />

                {/* 4 Surrounding Floating Holograms: PayPal, Card, Analytics, AI Chip */}
                <FloatingPaymentObjects3D />
              </CanvasWrapper>
            </div>

            {/* Typography matching Reference Image */}
            <div className="space-y-3 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
              <h1 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-tight font-sans">
                AI-Powered Payment Protection <br className="hidden sm:inline" />
                for Online Merchants
              </h1>
              <p className="text-xs sm:text-sm text-soc-textMuted leading-relaxed font-sans">
                Detect, explain, and prevent payment fraud in real time with AI, machine learning, and PayPal integration.
              </p>

              {/* 3 Feature Indicator Pills matching Reference Image */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-2">
                
                {/* Pill 1: Real-time Risk Scoring */}
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-soc-card/80 border border-soc-cyan/30 text-white text-xs font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.08)]">
                  <div className="p-1 rounded-lg bg-soc-cyan/15 text-soc-cyan">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Real-time Risk Scoring</span>
                </div>

                {/* Pill 2: PayPal Integration */}
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-soc-card/80 border border-soc-cyan/30 text-white text-xs font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.08)]">
                  <div className="p-1 rounded-lg bg-[#00457C]/40 text-soc-cyan">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span>PayPal Integration</span>
                </div>

                {/* Pill 3: Explainable AI Insights */}
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-soc-card/80 border border-soc-cyan/30 text-white text-xs font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.08)]">
                  <div className="p-1 rounded-lg bg-soc-teal/15 text-soc-teal">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <span>Explainable AI Insights</span>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Compact Premium Glassmorphism Card matching Reference Image */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            
            {/* Background ambient glow behind card */}
            <div className="absolute inset-0 bg-soc-cyan/15 rounded-[36px] blur-[50px] -z-10 pointer-events-none" />

            <motion.div 
              className="w-full max-w-md rounded-[32px] p-6 sm:p-8 xl:p-9 bg-soc-card/85 backdrop-blur-2xl border border-soc-cyan/35 shadow-[0_0_50px_rgba(0,229,255,0.2),_inset_0_0_20px_rgba(0,229,255,0.05)] relative z-10"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Card Header: PayShield AI Logo */}
              <div className="text-center space-y-1 mb-6">
                <div className="inline-flex items-center gap-2 justify-center mb-2">
                  <div className="w-7 h-7 rounded-lg bg-soc-cyan/20 border border-soc-cyan/50 flex items-center justify-center text-soc-cyan shadow-[0_0_10px_rgba(0,229,255,0.35)]">
                    <ShieldCheck className="w-4 h-4 text-soc-cyan" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-white font-sans">
                    PayShield <span className="text-soc-cyan">AI</span>
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
                  Welcome Back
                </h2>
                <p className="text-xs text-soc-textMuted font-sans">
                  Sign in to your merchant account
                </p>
              </div>

              {/* Registration Success Guidance Banner */}
              {successMessage && (
                <div 
                  role="status"
                  className="mb-4 p-3 rounded-xl bg-soc-teal/15 border border-soc-teal/40 text-soc-teal text-xs flex items-center gap-2 font-sans animate-fade-in shadow-[0_0_15px_rgba(0,245,200,0.15)]"
                >
                  <CheckCircle2 className="w-4 h-4 text-soc-teal flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div 
                  role="alert"
                  className="mb-4 p-3 rounded-xl bg-soc-danger/15 border border-soc-danger/40 text-soc-danger text-xs flex items-center gap-2 font-sans animate-fade-in shadow-[0_0_15px_rgba(255,82,99,0.15)]"
                >
                  <AlertCircle className="w-4 h-4 text-soc-danger flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                
                {/* Email Field with Envelope Icon */}
                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-cyan/80 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="signin-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-[#071522]/90 border border-soc-cyan/35 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-[#071522] focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/35 transition-all font-sans shadow-inner"
                    />
                  </div>
                </div>

                {/* Password Field with Lock Icon & Eye Toggle */}
                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soc-cyan/80 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-[#071522]/90 border border-soc-cyan/35 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-soc-textMuted/60 focus:bg-[#071522] focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/35 transition-all font-sans shadow-inner"
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

                {/* Remember Me & Forgot Password Row matching Reference Image */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none text-soc-textMuted hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-soc-cyan/40 bg-[#071522] text-soc-cyan focus:ring-soc-cyan/30 focus:ring-offset-0 cursor-pointer accent-[#00E5FF]"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-soc-cyan hover:text-soc-teal transition-colors font-medium focus-ring rounded"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Vibrant Glowing Sign In Button with Target / Arrow */}
                <div className="pt-2 relative group">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-5 rounded-xl btn-cyan-gradient text-[#050A12] font-sans text-sm font-extrabold tracking-wide transition-all shadow-[0_0_25px_rgba(0,229,255,0.45)] hover:shadow-[0_0_35px_rgba(0,229,255,0.7)] focus-ring disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-soc-bg/30 border-t-soc-bg rounded-full animate-spin" />
                        <span>Authenticating Session...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Bottom Register Prompt matching Reference Image */}
              <div className="mt-6 pt-5 border-t border-soc-cyan/20 text-center text-xs text-soc-textMuted font-sans">
                <span>Don't have an account? </span>
                <Link to="/signup" className="text-soc-cyan hover:text-soc-teal font-bold ml-1 transition-colors focus-ring rounded">
                  Register
                </Link>
              </div>

            </motion.div>
          </div>

        </div>
      </main>

      {/* Footer info - Subtle */}
      <footer className="relative z-10 px-6 sm:px-10 lg:px-14 pb-4 sm:pb-6 text-center text-[11px] font-mono text-soc-textDim">
        PayShield AI Autonomous Risk Defense // PayPal Developer Sandbox Verified
      </footer>

    </div>
  );
};
