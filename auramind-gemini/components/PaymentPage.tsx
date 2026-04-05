import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Shield, BrainCircuit, Infinity, ChevronLeft,
  Sparkles, Check, Crown, Loader2, ArrowRight,
  Clock, BookOpen, Bot, GraduationCap
} from 'lucide-react';

interface PaymentPageProps {
  user: { id: string; email: string; name: string };
  onBack: () => void;
}

const PLANS = [
  {
    id: 'monthly',
    name: 'MONTHLY',
    price: '$9.99',
    interval: '/mo',
    priceId: 'price_1SNlszGhRq84JnUVyNTmKt3A',
    badge: null,
  },
  {
    id: 'annual',
    name: 'ANNUAL',
    price: '$3.99',
    interval: '/mo',
    priceId: 'price_1SNlxOGhRq84JnUV1DzlFMS8',
    badge: 'SAVE 60%',
    totalPrice: '$47.88/yr',
  },
];

const FEATURES = [
  { icon: BrainCircuit, label: 'Unlimited AI-powered flashcard generation' },
  { icon: Bot, label: 'Full Aura Operator — 4 study agent modes' },
  { icon: BookOpen, label: 'Unlimited deck creation & study sessions' },
  { icon: Sparkles, label: 'Research assistant & content pipeline' },
  { icon: GraduationCap, label: 'Spaced repetition mastery engine' },
  { icon: Shield, label: 'Cloud sync across all your devices' },
  { icon: Infinity, label: 'Priority feature access & updates' },
  { icon: Clock, label: 'Study planner & scheduling tools' },
];

const PaymentPage: React.FC<PaymentPageProps> = ({ user, onBack }) => {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.alreadySubscribed) {
        window.location.href = '/dashboard';
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not start checkout.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-arch-bg text-arch-fg font-sans relative overflow-hidden">
      {/* Grid overlay */}
      <div className="fixed inset-0 arch-grid-overlay opacity-20 pointer-events-none" />

      {/* Decorative gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-500/8 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-500/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-20">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-arch-muted transition-colors hover:text-arch-fg mb-12"
        >
          <ChevronLeft size={14} />
          Back
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-arch-fg/5 border border-arch-border px-6 py-3 mb-8">
            <Crown size={14} className="text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-arch-fg">
              7-Day Free Trial — Cancel Anytime
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight italic leading-[0.95] text-arch-fg mb-6">
            Unlock<br />
            <span className="text-arch-muted">AuraMind.</span>
          </h1>

          <p className="text-sm md:text-base text-arch-muted font-medium max-w-lg mx-auto leading-relaxed">
            Your AI-powered study OS. Start free for 7 days — you won't be charged until your trial ends.
          </p>
        </motion.div>

        {/* Plan cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative text-left p-8 md:p-10 border-2 transition-all duration-300 group ${
                  isSelected
                    ? 'border-arch-fg bg-arch-fg/5 shadow-[0_0_80px_rgba(255,255,255,0.04)]'
                    : 'border-arch-border bg-transparent hover:border-arch-muted hover:bg-arch-fg/[0.02]'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-6 bg-emerald-500 text-black px-4 py-1.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{plan.badge}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-4 h-4 border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-arch-fg bg-arch-fg' : 'border-arch-border'
                  }`}>
                    {isSelected && <Check size={10} className="text-arch-bg" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-arch-muted">
                    {plan.name}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl md:text-6xl font-black tracking-tight text-arch-fg">
                    {plan.price}
                  </span>
                  <span className="text-sm text-arch-muted font-bold">{plan.interval}</span>
                </div>

                {plan.totalPrice && (
                  <p className="text-[10px] text-arch-muted font-black uppercase tracking-[0.2em] mb-4">
                    {plan.totalPrice} billed annually
                  </p>
                )}

                <div className="mt-6 pt-6 border-t border-arch-border">
                  <p className="text-[9px] text-arch-muted uppercase tracking-[0.3em] italic font-medium">
                    7-day free trial · Card required · Cancel anytime
                  </p>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-20"
        >
          {error && (
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-6">{error}</p>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="relative inline-flex items-center gap-4 bg-arch-fg text-arch-bg px-12 py-5 text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Setting up checkout...
              </>
            ) : (
              <>
                <Zap size={18} />
                Start 7-Day Free Trial
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-[10px] text-arch-muted mt-6 font-medium tracking-wide">
            Secure payment via Stripe · 256-bit SSL encrypted
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4">
              What's included
            </p>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic text-arch-fg">
              Everything You Need.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
                className="flex items-center gap-5 p-6 border border-arch-border bg-arch-fg/[0.02] hover:bg-arch-fg/5 transition-all group"
              >
                <div className="w-10 h-10 border border-arch-border flex items-center justify-center flex-shrink-0 group-hover:border-arch-fg transition-colors">
                  <feature.icon size={18} className="text-arch-muted group-hover:text-arch-fg transition-colors" />
                </div>
                <span className="text-xs font-bold text-arch-fg tracking-wide">
                  {feature.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-6 text-arch-muted">
            <div className="flex items-center gap-2">
              <Shield size={14} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Secure</span>
            </div>
            <div className="w-px h-3 bg-arch-border" />
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">7-Day Trial</span>
            </div>
            <div className="w-px h-3 bg-arch-border" />
            <div className="flex items-center gap-2">
              <Zap size={14} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Cancel Anytime</span>
            </div>
          </div>
          <p className="text-[9px] text-arch-muted/60 uppercase tracking-[0.2em]">
            Questions? Reach out to support@auramind.app
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentPage;
