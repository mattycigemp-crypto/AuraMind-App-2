import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Shield, BrainCircuit, Infinity, ChevronLeft,
  Sparkles, Check, Crown, Loader2, ArrowRight,
  Clock, BookOpen, Bot, GraduationCap, Activity,
  ShieldCheck, CreditCard, Lock
} from 'lucide-react';

interface PaymentPageProps {
  user: { id: string; email: string; name: string };
  onBack: () => void;
}

const PLANS = [
  {
    id: 'monthly',
    name: 'MONTHLY PROTOCOL',
    price: '$9.99',
    interval: '/MO',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || 'price_1SNlszGhRq84JnUVyNTmKt3A',
    badge: null,
    desc: 'Full access with flexible maintenance.'
  },
  {
    id: 'annual',
    name: 'ANNUAL SYSTEM',
    price: '$3.99',
    interval: '/MO',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL || 'price_1SedVnGhRq84JnUVctLWWuWJ',
    badge: 'SAVE 60%',
    totalPrice: '$47.88 Billed Annually',
    desc: 'The complete cognitive upgrade.'
  },
];

const FEATURES = [
  { icon: BrainCircuit, label: 'Unlimited AI-powered flashcard generation', detail: 'No more "generation limits". Create entire libraries in seconds.' },
  { icon: Bot, label: 'Full Aura Operator — 4 study agent modes', detail: 'Deep focus, rapid-fire, Socratic, and summary modes unlocked.' },
  { icon: BookOpen, label: 'Unlimited deck creation & study sessions', detail: 'Architecture for 100 or 10,000 cards. It scales with you.' },
  { icon: Sparkles, label: 'Research assistant & content pipeline', detail: 'Convert PDFs, URLs, and YouTube videos into mastery decks.' },
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

      if (data.url) {
        window.location.href = data.url;
      } else if (data.alreadySubscribed) {
        setError('You are already subscribed to a plan.');
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
    <div className="min-h-screen bg-arch-bg text-arch-fg font-sans relative overflow-x-hidden p-6 md:p-12 lg:p-20">
      {/* Background architectural elements */}
      <div className="fixed inset-0 arch-grid-overlay opacity-10 pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-arch-fg/[0.03] to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-arch-muted hover:text-arch-fg transition-colors mb-20"
        >
          <ChevronLeft size={14} />
          Terminal / Home
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-20">
          {/* Left Column: Mission Control */}
          <div className="space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-3 py-1 bg-amber-400 text-black text-[8px] font-black uppercase tracking-[0.4em] mb-8">
                <Crown size={10} />
                Access Authorized: 7-Day Trial Mode
              </div>
              <h1 className="text-arch-impact text-arch-fg leading-[0.85] mb-8">UPGRADE YOUR<br /><span className="text-arch-muted">COGNITION.</span></h1>
              <p className="text-arch-muted font-medium italic text-lg max-w-xl leading-relaxed">
                Join the architectural study movement. AuraMind Pro is your study system, optimized for momentum and peak performance.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className="architectural-panel p-8 space-y-4 hover:bg-arch-fg/[0.01] transition-all group"
                >
                  <div className="w-10 h-10 border border-arch-border flex items-center justify-center text-arch-muted group-hover:text-arch-fg group-hover:border-arch-fg transition-all">
                    <feature.icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-arch-fg mb-2">{feature.label}</h3>
                    <p className="text-[10px] text-arch-muted leading-relaxed italic">{feature.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-10 pt-8 border-t border-arch-border">
               <div className="flex items-center gap-4 text-arch-muted italic text-[9px] font-bold uppercase tracking-widest">
                  <ShieldCheck size={16} /> 100% SECURE UPGRADE
               </div>
               <div className="flex items-center gap-4 text-arch-muted italic text-[9px] font-bold uppercase tracking-widest">
                  <Lock size={16} /> PCI COMPLIANT
               </div>
            </div>
          </div>

          {/* Right Column: Pricing & Conversion */}
          <div className="space-y-8">
            <div className="architectural-panel p-0 overflow-hidden relative border-arch-fg/20">
               <div className="p-8 border-b border-arch-border bg-arch-muted/5 flex items-center justify-between">
                  <p className="text-arch-eyebrow">Selection Window</p>
                  <CreditCard size={16} className="text-arch-muted" />
               </div>
               
               <div className="p-8 space-y-6">
                 {PLANS.map((plan) => {
                   const isSelected = selectedPlan === plan.id;
                   return (
                     <button
                       key={plan.id}
                       onClick={() => setSelectedPlan(plan.id)}
                       className={`w-full text-left p-8 border transition-all duration-300 relative group ${
                         isSelected ? 'border-arch-fg bg-arch-fg/5 ring-1 ring-arch-fg/10' : 'border-arch-border bg-transparent hover:border-arch-muted'
                       }`}
                     >
                       {plan.badge && (
                         <div className="absolute -top-3 right-6 bg-blue-500 text-slate-900 dark:text-white px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em]">
                           {plan.badge}
                         </div>
                       )}
                       <div className="flex items-center justify-between mb-6">
                         <span className="text-[8px] font-black uppercase tracking-[0.3em] text-arch-muted group-hover:text-arch-fg transition-colors">
                           {plan.name}
                         </span>
                         <div className={`w-3 h-3 rounded-full border border-arch-fg flex items-center justify-center ${isSelected ? 'bg-arch-fg' : ''}`} />
                       </div>
                       <div className="flex items-baseline gap-2">
                         <span className="text-5xl font-black italic tracking-tighter text-arch-fg">{plan.price}</span>
                         <span className="text-[10px] font-black text-arch-muted uppercase tracking-widest leading-none">{plan.interval}</span>
                       </div>
                       {plan.totalPrice && (
                         <p className="text-[9px] text-arch-muted uppercase tracking-widest mt-4 italic font-bold">
                           {plan.totalPrice}
                         </p>
                       )}
                       <p className="text-[9px] text-arch-muted leading-relaxed mt-2 italic font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                         {plan.desc}
                       </p>
                     </button>
                   )
                 })}
               </div>

               <div className="p-8 bg-arch-fg/[0.02] border-t border-arch-border">
                 {error && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-6">{error}</p>}
                 
                 <button
                   onClick={handleSubscribe}
                   disabled={loading}
                   className="w-full btn-arch py-8 text-sm group"
                 >
                   {loading ? (
                     <div className="flex items-center justify-center gap-4">
                       <Loader2 size={18} className="animate-spin" />
                       INITIALIZING...
                     </div>
                   ) : (
                     <div className="flex items-center justify-center gap-4">
                        <Zap size={18} />
                        START 7-DAY FREE TRIAL
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                     </div>
                   )}
                 </button>

                 <div className="mt-8 space-y-4">
                   <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-arch-muted italic">
                      <span>No charge until trial ends</span>
                      <Activity size={10} />
                   </div>
                   <p className="text-[8px] text-center text-arch-muted/50 uppercase tracking-widest leading-relaxed">
                     By upgrading, you agree to our Terms of Service and Privacy Policy. Cancellation is instant via your dashboard.
                   </p>
                 </div>
               </div>
            </div>

            <div className="architectural-panel p-8 bg-arch-muted/5 flex items-center justify-center gap-12">
               <div className="flex items-center gap-3 grayscale opacity-30 invert">
                  <CreditCard size={14} className="text-white" />
                  <span className="text-[8px] font-black text-slate-900 dark:text-white bg-black p-1">Stripe Secure</span>
               </div>
               <div className="w-px h-6 bg-arch-border" />
               <div className="flex items-center gap-3 grayscale opacity-30 invert">
                  <Shield size={14} className="text-white" />
                  <span className="text-[12px] font-black text-slate-900 dark:text-white italic">Aura OS</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

