import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLinkIcon as ExternalLink, ShieldCheckIcon as ShieldCheck, FileTextIcon as FileText, Undo2Icon as Undo2 } from '../icons/CustomIcons';
import GlassCard from '../shared/GlassCard';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import FloatingInput from '../ui/forms/FloatingInput';
import FloatingSelect from '../ui/forms/FloatingSelect';
import FloatingTextArea from '../ui/forms/FloatingTextArea';

const Settings: React.FC = () => {
  const { user, cards, decks, onLogout } = useDashboardWorkspace();
  const studied = cards.filter((c) => (c.repetition ?? 0) > 0 || (c.lastReviewed && c.lastReviewed > 0)).length;
  const due = cards.filter((c) => c.nextReview <= Date.now()).length;
  const env = import.meta.env.MODE;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-zinc-500 mt-2">
          Profile is sourced from your account; deeper preferences ship incrementally like mature SaaS settings surfaces.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <GlassCard variant="neural" className="border-primary/20">
             <h2 className="text-xl font-semibold text-primary mb-6">Profile</h2>
             <div className="space-y-5">
               <div>
                 <FloatingInput
                   label="Display name"
                   value={user.name}
                   onChange={(value) => { /* Read-only in demo */ }}
                   disabled
                   className="w-full"
                 />
                 <p className="text-xs text-zinc-600 mt-1.5">Synced from your AuraMind account.</p>
               </div>
               <div>
                 <FloatingInput
                   label="Email"
                   value={user.email}
                   onChange={(value) => { /* Read-only in demo */ }}
                   type="email"
                   disabled
                   className="w-full"
                 />
               </div>
             </div>
           </GlassCard>

           <GlassCard variant="bordered">
             <h2 className="text-xl font-semibold text-primary mb-2">Study preferences</h2>
             <p className="text-sm text-zinc-500 mb-6">
               Customize your learning experience to match your goals and schedule.
             </p>
             <div className="space-y-5">
               <div className="space-y-3">
                 <FloatingInput
                   label="Daily goal"
                   placeholder="e.g., 20"
                   type="number"
                   value="20"
                   onChange={(value) => { /* Handle change */ }}
                   className="w-full"
                 />
                 <p className="text-xs text-zinc-500 mt-1">Cards to review each day</p>
               </div>
               <div className="space-y-3">
                 <FloatingSelect
                   label="Notification preference"
                   value="none"
                   options={[
                     { value: "none", label: "None" },
                     { value: "daily", label: "Daily reminder" },
                     { value: "weekly", label: "Weekly summary" }
                   ]}
                   onChange={(value) => { /* Handle change */ }}
                   className="w-full"
                 />
               </div>
               <div className="space-y-3">
                 <FloatingSelect
                   label="Study reminder time"
                   value="09:00"
                   options={[
                     { value: "08:00", label: "8:00 AM" },
                     { value: "09:00", label: "9:00 AM" },
                     { value: "10:00", label: "10:00 AM" },
                     { value: "19:00", label: "7:00 PM" },
                     { value: "20:00", label: "8:00 PM" }
                   ]}
                   onChange={(value) => { /* Handle change */ }}
                   className="w-full"
                 />
               </div>
             </div>
           </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-lg font-semibold text-primary mb-4">Snapshot</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Plan</dt>
                <dd className="text-zinc-900 dark:text-white font-medium">{user.plan}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Decks</dt>
                <dd className="text-zinc-900 dark:text-white font-medium tabular-nums">{decks.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Cards</dt>
                <dd className="text-zinc-900 dark:text-white font-medium tabular-nums">{cards.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Touched in review</dt>
                <dd className="text-zinc-900 dark:text-white font-medium tabular-nums">{studied}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Due now</dt>
                <dd className="text-zinc-900 dark:text-white font-medium tabular-nums">{due}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Streak</dt>
                <dd className="text-zinc-900 dark:text-white font-medium tabular-nums">{user.streak ?? 0} days</dd>
              </div>
            </dl>
          </GlassCard>

          <GlassCard variant="bordered" className="border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">App status</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Lightweight “production readiness” surface: environment + data signals.
                </p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Environment</dt>
                <dd className="text-zinc-900 dark:text-white font-medium">{env}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Data loaded</dt>
                <dd className="text-zinc-900 dark:text-white font-medium">
                  {decks.length > 0 || cards.length > 0 ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold text-primary mb-4">Legal & data</h3>
            <div className="space-y-3">
              <Link
                to="/privacy"
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 -mx-1"
              >
                <ExternalLink className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                Privacy policy
              </Link>
              <Link
                to="/terms"
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 -mx-1"
              >
                <ExternalLink className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                Terms of service
              </Link>
              <Link
                to="/docs"
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 -mx-1"
              >
                <FileText className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                Documentation
              </Link>
              <Link
                to="/restore-account"
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 -mx-1"
              >
                <Undo2 className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                Restore account
              </Link>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="mt-6 w-full px-4 py-3 rounded-lg bg-red-500/15 text-red-400 font-medium hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              Sign out everywhere on this device
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Settings;



