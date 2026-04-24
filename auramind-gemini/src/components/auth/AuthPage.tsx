import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Hash, 
  User, 
  MailCheck, 
  Eye, 
  EyeOff, 
  Smartphone,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Lock
} from 'lucide-react';
import { supabase } from '../../services/database/supabase';
import { emailService } from '../../services/email/emailService';

interface AuthPageProps {
  onBack: () => void;
  onContinue: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBack, onContinue }) => {
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [verificationSent, setVerificationSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const prefills = location.state as { email?: string } | null;
    if (prefills?.email) {
      setEmail(prefills.email);
    }
  }, [location.state]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMethod === 'email') {
        if (mode === 'login') {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          
          // Send sign-in alert email
          await emailService.sendSignInAlert({
            name: fullName || 'User',
            email,
            timestamp: new Date().toLocaleString(),
            device: navigator.userAgent,
          });
        } else {
          const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: window.location.origin
            }
          });
          if (error) throw error;

          if (data?.user && !data.session) {
            setVerificationSent(true);
            return;
          }

          // Send welcome email for successful signup
          if (data?.user) {
            await emailService.sendWelcomeEmail({
              name: fullName || 'User',
              email,
            });
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithOtp({ 
          phone,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        setOtpSent(true);
        return;
      }
      onContinue();
    } catch (err: any) {
      if (err.message === 'Email not confirmed') {
        setVerificationSent(true);
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      });
      if (error) throw error;
      onContinue();
    } catch (err: any) {
      alert(err.message || 'OTP Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      
      // Send password reset email via our service
      await emailService.sendPasswordResetEmail({
        name: 'User',
        email,
        resetLink: `${window.location.origin}/reset-password`,
        expiresIn: '1 hour',
      });
      
      alert("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      alert(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-arch-bg font-sans selection:bg-accent-low">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden bg-arch-muted/5 border-r border-arch-border">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute inset-0 arch-grid-overlay opacity-20" />
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-10 h-10 border border-arch-fg flex items-center justify-center p-2 bg-arch-bg">
              <Sparkles className="text-arch-fg" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter italic">AuraMind</span>
          </motion.div>

          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl font-black uppercase tracking-tighter leading-[0.9] italic"
            >
              The New Era <br />
              <span className="text-arch-muted italic">Of Learning.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-arch-muted max-w-md font-medium leading-relaxed"
            >
              Elevate your cognitive potential with the world's most advanced AI learning ecosystem.
            </motion.p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-8">
          {[
            { icon: <Shield size={20} />, label: "Secure", val: "256-bit" },
            { icon: <Zap size={20} />, label: "Fast", val: "LMMs" },
            { icon: <Lock size={20} />, label: "Private", val: "Encrypted" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="space-y-2"
            >
              <div className="text-arch-fg opacity-40">{item.icon}</div>
              <div className="text-[10px] uppercase font-black tracking-widest text-arch-muted">{item.label}</div>
              <div className="text-xs font-black italic">{item.val}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col items-center justify-center p-6 lg:p-16 relative bg-arch-bg">
        <div className="w-full max-w-md space-y-12">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-arch-muted transition-colors hover:text-arch-fg"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return
            </button>
            <div className="lg:hidden w-8 h-8 border border-arch-fg flex items-center justify-center p-1 bg-arch-bg">
              <Sparkles size={16} className="text-arch-fg" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {verificationSent ? (
              <motion.div 
                key="verification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8 text-center"
              >
                <div className="flex justify-center">
                  <div className="w-24 h-24 border border-arch-border flex items-center justify-center bg-arch-muted/5 relative">
                    <div className="absolute inset-[4px] border border-arch-fg/20" />
                    <ShieldCheck size={48} className="text-arch-fg" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">Check Inbox</h2>
                  <p className="text-sm text-arch-muted font-medium leading-relaxed">
                    We've sent a secure access link to <span className="text-arch-fg underline decoration-arch-border underline-offset-4">{email}</span>.
                  </p>
                </div>
                <button 
                  onClick={() => { setVerificationSent(false); setMode('login'); }} 
                  className="w-full btn-arch py-4"
                >
                  Back to Sign In
                </button>
              </motion.div>
            ) : otpSent ? (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4 text-center">
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">Verify Phone</h2>
                  <p className="text-sm text-arch-muted font-medium">Authentication code sent to {phone}</p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="premium-input-group">
                    <div className="relative">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-arch-muted" size={18} />
                      <input 
                        type="text" 
                        placeholder="6-Digit OTP" 
                        value={otp} 
                        onChange={(e)=>setOtp(e.target.value)} 
                        className="w-full bg-arch-muted/5 border border-arch-border p-5 pl-14 text-sm font-medium outline-none focus:border-arch-fg transition-all text-arch-fg placeholder:text-arch-muted/50" 
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-arch w-full py-5 text-sm uppercase tracking-widest font-black">
                    {loading ? 'Validating...' : 'Unlock Account'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOtpSent(false)} 
                    className="w-full text-center text-[10px] uppercase font-black tracking-widest text-arch-muted hover:text-arch-fg transition-colors"
                  >
                    Change phone number
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="auth-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
                    {mode === 'login' ? 'Welcome Back' : 'Create Legacy'}
                  </h2>
                  <p className="text-sm text-arch-muted font-medium">
                    {mode === 'login' ? 'Authorized personnel only.' : 'Join the elite echelon of modern learners.'}
                  </p>
                </div>

                <div className="flex border-b border-arch-border p-0">
                  <button 
                    onClick={() => setAuthMethod('email')}
                    className={`pb-4 text-[10px] uppercase font-black tracking-[0.3em] transition-all relative ${authMethod === 'email' ? 'text-arch-fg' : 'text-arch-muted hover:text-arch-fg opacity-50'}`}
                  >
                    Email Identity
                    {authMethod === 'email' && <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-arch-fg" />}
                  </button>
                  <button 
                    onClick={() => setAuthMethod('phone')}
                    className={`ml-10 pb-4 text-[10px] uppercase font-black tracking-[0.3em] transition-all relative ${authMethod === 'phone' ? 'text-arch-fg' : 'text-arch-muted hover:text-arch-fg opacity-50'}`}
                  >
                    Mobile Verification
                    {authMethod === 'phone' && <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-arch-fg" />}
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                  { (mode === 'signup' || authMethod === 'phone') && (
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-[0.2em] text-arch-muted ml-1">Universal Name</label>
                       <div className="relative">
                         <User className="absolute left-5 top-1/2 -translate-y-1/2 text-arch-muted/40" size={18} />
                         <input 
                          type="text" 
                          placeholder="Your Name" 
                          value={fullName} 
                          onChange={(e)=>setFullName(e.target.value)} 
                          required={mode === 'signup'}
                          className="w-full bg-arch-muted/[0.03] border border-arch-border p-5 pl-14 text-sm font-medium outline-none focus:border-arch-fg transition-all text-arch-fg placeholder:text-arch-muted/30" 
                        />
                       </div>
                    </div>
                  )}

                  {authMethod === 'email' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-arch-muted ml-1">Email Credentials</label>
                        <div className="relative">
                          <MailCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-arch-muted/40" size={18} />
                          <input 
                            type="email" 
                            placeholder="name@domain.com" 
                            value={email} 
                            onChange={(e)=>setEmail(e.target.value)} 
                            required
                            className="w-full bg-arch-muted/[0.03] border border-arch-border p-5 pl-14 text-sm font-medium outline-none focus:border-arch-fg transition-all text-arch-fg placeholder:text-arch-muted/30" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] uppercase font-black tracking-[0.2em] text-arch-muted ml-1">Passphrase</label>
                          {mode === 'login' && (
                            <button
                              type="button"
                              onClick={handleForgot}
                              className="text-[10px] uppercase font-black tracking-widest text-arch-muted hover:text-arch-fg transition-colors"
                            >
                              Reset?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            required
                            className="w-full bg-arch-muted/[0.03] border border-arch-border p-5 pr-14 text-sm font-medium outline-none focus:border-arch-fg transition-all text-arch-fg placeholder:text-arch-muted/30"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center justify-center px-5 text-arch-muted hover:text-arch-fg"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-[0.2em] text-arch-muted ml-1">Phone Coordinate</label>
                      <div className="relative">
                        <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-arch-muted/40" size={18} />
                        <input 
                          type="tel" 
                          placeholder="+1 (555) 000-0000" 
                          value={phone} 
                          onChange={(e)=>setPhone(e.target.value)} 
                          required
                          className="w-full bg-arch-muted/[0.03] border border-arch-border p-5 pl-14 text-sm font-medium outline-none focus:border-arch-fg transition-all text-arch-fg placeholder:text-arch-muted/30" 
                        />
                      </div>
                      <p className="text-[8px] text-arch-muted uppercase tracking-[0.3em] mt-3 ml-1">Prefix with country code (e.g. +1 for USA)</p>
                    </div>
                  )}

                  <div className="pt-4 space-y-4">
                    <button type="submit" disabled={loading} className="btn-arch w-full py-5 text-sm uppercase tracking-[0.4em] font-black group relative overflow-hidden">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? 'Processing...' : (mode === 'login' ? 'Authorized Sign In' : 'Initiate Registration')}
                        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={()=>setMode(mode === 'login' ? 'signup' : 'login')}
                      className="w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-arch-muted hover:text-arch-fg transition-colors"
                    >
                      {mode === 'login' ? "Don't have an identity yet? Apply now" : 'Already have credentials? Sign in'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer info */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 lg:left-auto lg:right-16 lg:translate-x-0">
          <p className="text-[9px] uppercase font-black tracking-[0.4em] text-arch-muted whitespace-nowrap">
            AuraMind V4.0.21 Beta / <span className="text-arch-fg opacity-30">Encrypted Session</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
