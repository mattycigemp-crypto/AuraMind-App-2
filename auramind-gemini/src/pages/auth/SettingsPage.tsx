import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Check, Mail, CreditCard, Crown, Trash2, Mic2, Lock, CalendarDays, LayoutGrid, Shield, Eye, EyeOff, Loader2, Plus, Command } from 'lucide-react';
import { UserProfile } from '../../types';
import { PageHeader } from '../../components/shared/PageComponents';
import { supabase } from '../../services/database/supabase';
import { useTheme } from '../../hooks/useTheme';

export const SettingsPage = ({
  user,
  onUpdateUser,
}: {
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => Promise<void>;
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [ambientAudio, setAmbientAudio] = useState(true);
  const [operatorMode, setOperatorMode] = useState<'balanced' | 'deep' | 'fast'>('deep');
  const [privacyLock, setPrivacyLock] = useState(true);
  const [sessionLength, setSessionLength] = useState<'25 min' | '45 min' | '90 min'>('45 min');
  const [displayName, setDisplayName] = useState(user.name);
  const [profileStatus, setProfileStatus] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [deleteReasons, setDeleteReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const DELETION_REASONS = [
    'Not using it enough',
    'Found a better alternative',
    'Too complicated to use',
    'Missing features I need',
    'Performance issues',
    'Privacy concerns',
    'Too expensive',
    'Just taking a break',
    'Other',
  ] as const;

  const toggleReason = (reason: string) => {
    setDeleteReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeleteReasons([]);
    setOtherReason('');
    setDeletePassword('');
    setDeleteStatus('');
  };

  useEffect(() => {
    setDisplayName(user.name);
  }, [user.name]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileStatus('Profile media must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        setIsSavingProfile(true);
        setProfileStatus('Saving profile media...');
        try {
          await onUpdateUser({ avatar: reader.result });
          setProfileStatus('Profile media saved to Supabase.');
        } catch (error: any) {
          setProfileStatus(error?.message || 'Could not save profile media.');
        } finally {
          setIsSavingProfile(false);
        }
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleProfileSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setProfileStatus('Display name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    setProfileStatus('Saving profile...');
    try {
      await onUpdateUser({ name: trimmedName });
      setProfileStatus('Profile synced with Supabase.');
    } catch (error: any) {
      setProfileStatus(error?.message || 'Could not save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteStatus('Please enter your credential to confirm.');
      return;
    }
    if (deleteReasons.length === 0) {
      setDeleteStatus('Please select at least one reason.');
      return;
    }
    if (deleteReasons.includes('Other') && !otherReason.trim()) {
      setDeleteStatus('Please describe your reason.');
      return;
    }

    setIsDeleting(true);
    setDeleteStatus('Verifying credentials...');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword
      });

      if (authError || !authData.session) {
        setDeleteStatus(authError?.message || 'Invalid credentials.');
        setIsDeleting(false);
        return;
      }

      setDeleteStatus('Deactivating account...');
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        },
        body: JSON.stringify({
          reasons: deleteReasons,
          otherReason: otherReason.trim() || undefined,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate account.');

      setDeleteStep(3);
      setIsDeleting(false);

      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }, 6000);
    } catch (err: any) {
      setDeleteStatus(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-10 py-4">
      <PageHeader title="SETTINGS." subtitle="Configure your neural workspace and profile identity." />

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8">
        <div className="space-y-8">
          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Profile identity</p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4 italic">Display name</p>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-arch-fg/5 border border-arch-border p-5 text-xs font-medium outline-none focus:border-arch-fg text-arch-fg placeholder:text-arch-muted"
                    placeholder="Enter visual handle"
                  />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted mb-4 italic">Electronic mail</p>
                  <div className="w-full bg-arch-bg border border-arch-border/50 p-5 text-xs font-medium text-arch-muted italic">
                    {user.email || 'No email available'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center border border-arch-border bg-arch-fg/5 p-8 group">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-32 h-32 object-cover grayscale brightness-125 border border-arch-fg/20" />
                ) : (
                  <div className="w-32 h-32 bg-arch-bg border border-arch-border flex items-center justify-center text-3xl font-black">
                     {user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <p className="mt-4 text-[8px] font-black uppercase tracking-[0.4em] text-arch-muted italic">Neural Signature</p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-arch-border flex flex-wrap gap-4">
              <button
                onClick={handleProfileSave}
                disabled={isSavingProfile}
                className="btn-arch min-w-[200px]"
              >
                {isSavingProfile ? 'Updating' : 'Save Protocol'}
              </button>
              <label className="btn-arch-outline min-w-[200px] cursor-pointer inline-flex items-center justify-center">
                Sync Media
                <input type="file" accept="image/*,image/gif" className="hidden" onChange={handleAvatarUpload} />
              </label>
              {user.avatar && (
                <button
                  onClick={async () => {
                    setIsSavingProfile(true);
                    setProfileStatus('Removing profile media...');
                    try {
                      await onUpdateUser({ avatar: undefined });
                      setProfileStatus('Profile media removed.');
                    } catch (error: any) {
                      setProfileStatus(error?.message || 'Could not remove profile media.');
                    } finally {
                      setIsSavingProfile(false);
                    }
                  }}
                  className="btn-arch-outline px-6 py-4 text-[10px] uppercase tracking-[0.4em] font-black"
                >
                  Remove Media
                </button>
              )}
            </div>
            <p className="text-[9px] text-arch-muted mt-6 uppercase tracking-widest italic leading-relaxed">Identity metadata syncs through localized account protocols. JPG, PNG, WebP, GIF supported.</p>
            {profileStatus && <p className="text-[10px] text-arch-fg font-black mt-4 uppercase tracking-[0.4em] italic">{profileStatus}</p>}
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Thermal Interface</p>
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'dark', 'system'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setTheme(option)}
                  className={`border p-6 text-left transition-all ${theme === option ? 'border-arch-fg bg-arch-fg/5' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{option}</p>
                  <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">{option === resolvedTheme ? 'Active' : 'Standby'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Operator Subsystems</p>
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              {(['balanced', 'deep', 'fast'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setOperatorMode(option as any)}
                  className={`border p-6 text-left transition-all ${operatorMode === option ? 'border-arch-fg bg-arch-fg/10' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{option}</p>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {[
                { label: 'Ambient audio surfaces', value: ambientAudio, toggle: () => setAmbientAudio((prev) => !prev), icon: Mic2 },
                { label: 'Privacy lock', value: privacyLock, toggle: () => setPrivacyLock((prev) => !prev), icon: Lock },
              ].map((item) => (
                <button key={item.label} onClick={item.toggle} className="w-full border border-arch-border bg-arch-fg/5 p-6 text-left hover:border-arch-fg transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <item.icon size={16} className="text-arch-fg" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{item.label}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${item.value ? 'text-arch-fg' : 'text-arch-muted italic'}`}>
                      {item.value ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Workflow parameters</p>
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              {(['25 min', '45 min', '90 min'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSessionLength(option as any)}
                  className={`border p-6 text-left transition-all ${sessionLength === option ? 'border-arch-fg bg-arch-fg/10' : 'border-arch-border bg-transparent hover:bg-arch-fg/5'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{option}</p>
                  <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">Clock</p>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {[
                { label: 'Session target', value: sessionLength, icon: CalendarDays },
                { label: 'Active theme', value: resolvedTheme, icon: LayoutGrid },
                { label: 'Security posture', value: privacyLock ? 'Hardened' : 'Open', icon: Shield },
              ].map((item) => (
                <div key={item.label} className="border border-arch-border bg-transparent p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <item.icon size={16} className="text-arch-muted" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-arch-muted">{item.label}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-arch-fg">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">Billing & Subscription</p>
            <div className="border border-arch-border bg-arch-fg/5 p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <CreditCard size={16} className="text-arch-fg" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">Active Plan: {user.plan}</p>
                    <p className="text-[8px] text-arch-muted italic mt-1 uppercase tracking-widest leading-relaxed">
                      Manage your subscription, update payment methods, and view invoices via Stripe's secure portal.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.open('/subscribe', '_blank')}
                className="btn-arch w-full md:w-auto"
              >
                Manage Subscription
              </button>
            </div>
          </div>

          <div className="architectural-panel p-8">
            <p className="text-arch-eyebrow mb-8">System and legal</p>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { label: 'Docs', href: '/docs' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="border border-arch-border bg-arch-fg/5 p-6 text-left hover:border-arch-fg transition-all"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-arch-fg">{item.label}</p>
                  <p className="text-[8px] text-arch-muted italic mt-3 uppercase tracking-widest">Access</p>
                </a>
              ))}
            </div>
          </div>

          <div className="architectural-panel p-8 border-red-500/20">
            <p className="text-arch-eyebrow mb-8 text-red-500">Danger Zone</p>
            <div className="border border-red-500/20 bg-red-500/5 p-6 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Delete Account</p>
                <p className="text-xs text-arch-muted italic mt-3 leading-relaxed">Deactivate your account for 30 days. Your data is preserved during this period and can be restored via the link sent to your email. After 30 days, your account and all associated data will be permanently deleted.</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.4em] transition-colors"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="architectural-panel p-10 w-full max-w-xl border-red-500/50 space-y-6 bg-arch-bg">

            {/* STEP 1: Reason Survey */}
            {deleteStep === 1 && (
              <>
                <div className="text-center space-y-4">
                  <AlertTriangle size={36} className="mx-auto text-amber-400" />
                  <h2 className="text-2xl font-black italic lowercase text-arch-fg">Before you go.</h2>
                  <p className="text-xs text-arch-muted leading-relaxed font-medium max-w-sm mx-auto">
                    We'd love to understand why you're leaving. Your feedback helps us build a better AuraMind.
                  </p>
                </div>

                <div className="space-y-2 pt-2 max-h-[320px] overflow-y-auto">
                  {DELETION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={`w-full text-left border p-4 transition-all flex items-center gap-3 ${
                        deleteReasons.includes(reason)
                          ? 'border-red-500/60 bg-red-500/10'
                          : 'border-arch-border bg-arch-fg/5 hover:border-arch-fg/30'
                      }`}
                    >
                      <div className={`w-5 h-5 border flex-shrink-0 flex items-center justify-center transition-all ${
                        deleteReasons.includes(reason)
                          ? 'border-red-500 bg-red-500'
                          : 'border-arch-border'
                      }`}>
                        {deleteReasons.includes(reason) && <Check size={12} className="text-slate-900 dark:text-white" />}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-arch-fg">{reason}</span>
                    </button>
                  ))}
                </div>

                {deleteReasons.includes('Other') && (
                  <textarea
                    autoFocus
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Tell us what we could improve..."
                    rows={3}
                    className="w-full bg-arch-fg/5 border border-arch-border p-4 text-xs font-medium outline-none focus:border-red-500 transition-all text-arch-fg placeholder:text-arch-muted italic resize-none"
                  />
                )}

                <div className="flex gap-4 pt-4 border-t border-arch-border">
                  <button
                    onClick={resetDeleteModal}
                    className="flex-1 btn-arch-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteReasons.length === 0) {
                        setDeleteStatus('Please select at least one reason.');
                        return;
                      }
                      if (deleteReasons.includes('Other') && !otherReason.trim()) {
                        setDeleteStatus('Please describe your reason.');
                        return;
                      }
                      setDeleteStatus('');
                      setDeleteStep(2);
                    }}
                    disabled={deleteReasons.length === 0}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white font-black uppercase tracking-[0.4em] text-[10px] py-4 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={14} />
                  </button>
                </div>
                {deleteStatus && <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-red-400 text-center">{deleteStatus}</p>}
              </>
            )}

            {/* STEP 2: Password Confirmation */}
            {deleteStep === 2 && (
              <>
                <div className="text-center space-y-4">
                  <Trash2 size={36} className="mx-auto text-red-500" />
                  <h2 className="text-2xl font-black italic lowercase text-red-500">Final Warning.</h2>
                  <p className="text-xs text-arch-muted leading-relaxed font-medium max-w-sm mx-auto">
                    To proceed, re-authenticate below. Your account will be deactivated for 30 days — you'll receive an email with a link to restore it if this was accidental.
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
                  <Mail size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-300/80 font-bold uppercase tracking-widest leading-relaxed">
                    A confirmation email will be sent to <span className="text-amber-200">{user.email}</span> with a restore link valid for 30 days.
                  </p>
                </div>

                <div className="text-left space-y-4 pt-2">
                  <input
                    type="password"
                    autoFocus
                    placeholder="Enter your password to confirm"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && deletePassword && handleDeleteAccount()}
                    className="w-full bg-arch-fg/5 border border-arch-border p-5 text-sm font-medium outline-none focus:border-red-500 transition-all text-arch-fg placeholder:text-arch-muted italic"
                  />
                  {deleteStatus && <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-red-400">{deleteStatus}</p>}
                </div>

                <div className="flex gap-4 pt-4 border-t border-arch-border">
                  <button
                    onClick={() => { setDeleteStep(1); setDeletePassword(''); setDeleteStatus(''); }}
                    disabled={isDeleting}
                    className="flex-1 btn-arch-outline flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !deletePassword}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white font-black uppercase tracking-[0.4em] text-[10px] py-4 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? 'Deactivating...' : 'Confirm Deactivation'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: Success / Email Sent */}
            {deleteStep === 3 && (
              <>
                <div className="text-center space-y-6 py-6">
                  <div className="w-16 h-16 mx-auto border-2 border-emerald-500 flex items-center justify-center">
                    <Mail size={28} className="text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black italic lowercase text-arch-fg">Account Deactivated.</h2>
                  <p className="text-xs text-arch-muted leading-relaxed font-medium max-w-sm mx-auto">
                    We've sent a confirmation email to <span className="text-arch-fg font-bold">{user.email}</span>. If this was a mistake, use the restore link in the email within 30 days to recover your account and all your data.
                  </p>
                  <div className="bg-arch-fg/5 border border-arch-border p-4">
                    <p className="text-[9px] text-arch-muted uppercase tracking-[0.3em] italic">Redirecting you in a few seconds...</p>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
