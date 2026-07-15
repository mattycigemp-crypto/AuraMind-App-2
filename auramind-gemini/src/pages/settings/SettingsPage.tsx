import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Zap, Bell, Palette, Shield, AlertTriangle, Volume2, RefreshCw, Languages, Accessibility, Pencil, Check, X } from 'lucide-react';
import PageShell from '../../components/dashboard/PageShell';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { supabase } from '../../services/database/supabase';
import { userService } from '../../services/user/userService';
import type { UserProfile } from '../../types';

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
}

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!on)}
    className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
      on ? 'bg-[#7C3AED]' : 'bg-[#2A2A3A]'
    }`}
  >
    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow ${
      on ? 'left-5' : 'left-0.5'
    }`} />
  </button>
);

const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="bg-[#1A1A24] border border-[#2A2A3A] rounded-lg px-3 py-1.5 text-[#F0EFFE] text-xs outline-none focus:border-[#7C3AED]/50 min-w-[120px]"
  >
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-sm shrink-0 mt-0.5">
        <Icon size={14} className="text-[#8B5CF6]" />
      </div>
      <div>
        <h3 className="text-[#F0EFFE] text-sm font-medium">{title}</h3>
        <p className="text-[#5A5A72] text-[11px]">{subtitle}</p>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <div className="text-[#F0EFFE] text-xs">{label}</div>
        {desc && <div className="text-[#5A5A72] text-[10px] mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const workspace = useDashboardWorkspace();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // Use workspace user for display name (matches sidebar), fall back to profile
  const displayName = workspace?.user?.name || profile?.name || 'User';

  const [dailyGoal, setDailyGoal] = useLocalStorage('auramind_dailyGoal', '20');
  const [newCards, setNewCards] = useLocalStorage('auramind_newCards', '10');
  const [maxReviews, setMaxReviews] = useLocalStorage('auramind_maxReviews', '100');
  const [retention, setRetention] = useLocalStorage('auramind_retention', 'Balanced - 85%');
  const [showIntervals, setShowIntervals] = useLocalStorage('auramind_showIntervals', true);
  const [keyboardShortcuts, setKeyboardShortcuts] = useLocalStorage('auramind_keyboardShortcuts', true);
  const [cardsPerGen, setCardsPerGen] = useLocalStorage('auramind_cardsPerGen', '20');
  const [includeExamples, setIncludeExamples] = useLocalStorage('auramind_includeExamples', true);
  const [defaultLanguage, setDefaultLanguage] = useLocalStorage('auramind_defaultLanguage', 'English');
  const [dailyReminder, setDailyReminder] = useLocalStorage('auramind_dailyReminder', true);
  const [reminderTime, setReminderTime] = useLocalStorage('auramind_reminderTime', '09:00');
  const [dueReminder, setDueReminder] = useLocalStorage('auramind_dueReminder', true);
  const [streakReminder, setStreakReminder] = useLocalStorage('auramind_streakReminder', true);
  const [weeklySummary, setWeeklySummary] = useLocalStorage('auramind_weeklySummary', false);
  const [theme, setTheme] = useLocalStorage('auramind_theme', 'Dark');
  const [reduceMotion, setReduceMotion] = useLocalStorage('auramind_reduceMotion', false);
  const [compactMode, setCompactMode] = useLocalStorage('auramind_compactMode', false);
  const [usageAnalytics, setUsageAnalytics] = useLocalStorage('auramind_usageAnalytics', true);
  const [saveChatHistory, setSaveChatHistory] = useLocalStorage('auramind_saveChatHistory', true);
  const [soundEffects, setSoundEffects] = useLocalStorage('auramind_soundEffects', true);
  const [studyMusicVolume, setStudyMusicVolume] = useLocalStorage('auramind_studyMusicVolume', '50');
  const [autoSync, setAutoSync] = useLocalStorage('auramind_autoSync', true);
  const [offlineMode, setOfflineMode] = useLocalStorage('auramind_offlineMode', false);
  const [fontSize, setFontSize] = useLocalStorage('auramind_fontSize', 'Medium');
  const [highContrast, setHighContrast] = useLocalStorage('auramind_highContrast', false);
  const [textToSpeech, setTextToSpeech] = useLocalStorage('auramind_textToSpeech', false);
  const [autoNightMode, setAutoNightMode] = useLocalStorage('auramind_autoNightMode', true);
  const [reviewOrder, setReviewOrder] = useLocalStorage('auramind_reviewOrder', 'FSRS - Optimized');
  const [showHintFirst, setShowHintFirst] = useLocalStorage('auramind_showHintFirst', false);
  const [autoPlayAudio, setAutoPlayAudio] = useLocalStorage('auramind_autoPlayAudio', false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (user) {
          const p = await userService.getCurrentUser();
          setProfile(p);
          setNameInput(p?.name || '');
        }
      } catch {} finally { setProfileLoading(false); }
    })();
  }, []);

  const saveName = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === displayName) {
      setEditingName(false);
      setNameInput(displayName);
      return;
    }
    setNameSaving(true);
    try {
      // Use workspace updateProfile if available (keeps sidebar in sync)
      if (workspace?.updateProfile) {
        await workspace.updateProfile({ name: trimmed });
      } else {
        // Fallback: direct supabase update
        if (supabase) {
          const { error } = await supabase.auth.updateUser({
            data: { full_name: trimmed },
          });
          if (error) throw error;
          await supabase.from('user_profiles').update({ name: trimmed }).eq('id', profile!.id);
        }
      }
      setProfile(prev => prev ? { ...prev, name: trimmed } : prev);
      setNameInput(trimmed);
      setEditingName(false);
    } catch (err) {
      console.error('Failed to save name:', err);
      setNameInput(displayName);
      setEditingName(false);
    } finally {
      setNameSaving(false);
    }
  }, [nameInput, displayName, workspace, profile]);

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[#F0EFFE] text-lg font-light tracking-tight">Settings</h1>
          <p className="text-[#5A5A72] text-xs mt-1">Customize your AuraMind experience</p>
        </div>

        {/* Profile Card — full width at top */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white text-xl font-semibold shrink-0">
              {profile ? (profile.name || profile.email || 'A').charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    className="flex-1 px-2 py-1 bg-[#1A1A24] border border-[#7C3AED]/50 rounded-lg text-[#F0EFFE] text-sm outline-none focus:border-[#7C3AED] max-w-xs"
                    autoFocus
                    placeholder="Your name"
                  />
                  <button onClick={saveName} disabled={nameSaving} className="p-1.5 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors">
                    <Check size={14} />
                  </button>
                  <button onClick={() => { setEditingName(false); setNameInput(profile?.name || ''); }} className="p-1.5 rounded-lg hover:bg-[#2A2A3A] text-[#5A5A72]">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => { setNameInput(profile?.name || ''); setEditingName(true); }}
                    className="text-[#F0EFFE] text-lg font-medium truncate cursor-pointer hover:text-[#8B5CF6] transition-colors"
                    title="Click to edit name"
                  >
                    {profileLoading && !workspace ? 'Loading...' : displayName}
                  </span>
                  <button onClick={() => { setNameInput(profile?.name || ''); setEditingName(true); }} className="text-[#5A5A72] hover:text-[#8B5CF6] transition-colors">
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#8B5CF6] text-[9px] font-medium shrink-0">
                  {profile?.plan || 'Free'}
                </span>
              </div>
              <p className="text-[#5A5A72] text-xs mt-1">{profile?.email || ''}</p>
              <button className="text-[#8B5CF6] text-[10px] font-medium hover:text-[#7C3AED] transition-colors mt-1">
                Manage subscription
              </button>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <button className="px-4 py-2 border border-[#2A2A3A] text-[#F0EFFE] text-xs font-medium rounded-lg hover:border-[#3A3A4F] transition-all">
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Settings Grid — 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Study */}
          <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={BookOpen} title="Study" subtitle="Tune your daily review rhythm and retention target." />
          <div className="space-y-1">
            <SettingRow label="Daily goal" desc="Cards to review each day">
              <Select value={dailyGoal} onChange={setDailyGoal} options={[10,15,20,25,30,40,50,100].map(n => ({ label: `${n} cards`, value: String(n) }))} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="New cards per day">
              <Select value={newCards} onChange={setNewCards} options={[5,10,15,20,25,30].map(n => ({ label: `${n} cards`, value: String(n) }))} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Max reviews per day">
              <Select value={maxReviews} onChange={setMaxReviews} options={[50,75,100,150,200,9999].map(n => ({ label: n === 9999 ? 'Unlimited' : `${n} cards`, value: String(n) }))} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Target retention">
              <Select value={retention} onChange={setRetention} options={[
                { label: 'Conservative - 90%', value: 'Conservative - 90%' },
                { label: 'Balanced - 85%', value: 'Balanced - 85%' },
                { label: 'Aggressive - 80%', value: 'Aggressive - 80%' },
              ]} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Show next intervals">
              <Toggle on={showIntervals} onChange={setShowIntervals} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Enable keyboard shortcuts">
              <Toggle on={keyboardShortcuts} onChange={setKeyboardShortcuts} />
            </SettingRow>
          </div>
        </div>

        {/* AI Generation */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={Zap} title="AI Generation" subtitle="Defaults applied when Aura builds new cards." />
          <div className="space-y-1">
            <SettingRow label="Cards per generation">
              <Select value={cardsPerGen} onChange={setCardsPerGen} options={[5,10,15,20,25,30].map(n => ({ label: `${n} cards`, value: String(n) }))} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Include examples">
              <Toggle on={includeExamples} onChange={setIncludeExamples} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Default language">
              <Select value={defaultLanguage} onChange={setDefaultLanguage} options={[
                { label: 'English', value: 'English' },
                { label: 'Spanish', value: 'Spanish' },
                { label: 'French', value: 'French' },
                { label: 'German', value: 'German' },
                { label: 'Japanese', value: 'Japanese' },
              ]} />
            </SettingRow>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={Bell} title="Notifications" subtitle="Reminders that keep your streak alive." />
          <div className="space-y-1">
            <SettingRow label="Daily reminder">
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="bg-[#1A1A24] border border-[#2A2A3A] rounded-lg px-2 py-1 text-[#F0EFFE] text-xs outline-none focus:border-[#7C3AED]/50"
                />
                <Toggle on={dailyReminder} onChange={setDailyReminder} />
              </div>
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Due cards reminder">
              <Toggle on={dueReminder} onChange={setDueReminder} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Streak reminder">
              <Toggle on={streakReminder} onChange={setStreakReminder} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Weekly progress summary">
              <Toggle on={weeklySummary} onChange={setWeeklySummary} />
            </SettingRow>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={Palette} title="Appearance" subtitle="How AuraMind looks and feels on this device." />
          <div className="space-y-1">
            <SettingRow label="Theme">
              <Select value={theme} onChange={setTheme} options={[
                { label: 'Dark', value: 'Dark' },
                { label: 'Light', value: 'Light' },
                { label: 'System', value: 'System' },
              ]} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Reduce motion">
              <Toggle on={reduceMotion} onChange={setReduceMotion} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Compact mode">
              <Toggle on={compactMode} onChange={setCompactMode} />
            </SettingRow>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={Shield} title="Privacy" subtitle="What we store, what stays on your device." />
          <div className="space-y-1">
            <SettingRow label="Send anonymous usage analytics">
              <Toggle on={usageAnalytics} onChange={setUsageAnalytics} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Save AI chat history">
              <Toggle on={saveChatHistory} onChange={setSaveChatHistory} />
            </SettingRow>
          </div>
        </div>

        {/* Audio */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={Volume2} title="Audio" subtitle="Sound effects, study music, and text-to-speech." />
          <div className="space-y-1">
            <SettingRow label="Sound effects" desc="Card flip and button sounds">
              <Toggle on={soundEffects} onChange={setSoundEffects} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Study music volume" desc="Ambient background during study sessions">
              <Select value={studyMusicVolume} onChange={setStudyMusicVolume} options={[
                { label: 'Off', value: '0' },
                { label: '25%', value: '25' },
                { label: '50%', value: '50' },
                { label: '75%', value: '75' },
                { label: '100%', value: '100' },
              ]} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Text-to-speech" desc="Read cards aloud during review">
              <Toggle on={textToSpeech} onChange={setTextToSpeech} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Auto-play audio" desc="Play card audio automatically">
              <Toggle on={autoPlayAudio} onChange={setAutoPlayAudio} />
            </SettingRow>
          </div>
        </div>

        {/* Sync & Data */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={RefreshCw} title="Sync & Data" subtitle="How your data stays up to date across devices." />
          <div className="space-y-1">
            <SettingRow label="Auto-sync" desc="Sync progress automatically">
              <Toggle on={autoSync} onChange={setAutoSync} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Offline mode" desc="Work without internet connection">
              <Toggle on={offlineMode} onChange={setOfflineMode} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <div className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-[#F0EFFE] text-xs">Clear local cache</div>
                <div className="text-[#5A5A72] text-[10px] mt-0.5">Free up storage on this device</div>
              </div>
              <button className="px-4 py-1.5 border border-[#2A2A3A] text-[#5A5A72] text-[11px] font-medium rounded-lg hover:border-[#3A3A4F] hover:text-[#F0EFFE] transition-all">
                Clear
              </button>
            </div>
            <div className="border-t border-[#2A2A3A]/30" />
            <div className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-[#F0EFFE] text-xs">Reset progress</div>
                <div className="text-[#5A5A72] text-[10px] mt-0.5">Reset all study progress and streaks</div>
              </div>
              <button className="px-4 py-1.5 border border-red-500/30 text-red-400 text-[11px] font-medium rounded-lg hover:bg-red-500/10 transition-all">
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Accessibility */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={Accessibility} title="Accessibility" subtitle="Make AuraMind comfortable for your needs." />
          <div className="space-y-1">
            <SettingRow label="Font size">
              <Select value={fontSize} onChange={setFontSize} options={[
                { label: 'Small', value: 'Small' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Large', value: 'Large' },
                { label: 'Extra Large', value: 'Extra Large' },
              ]} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="High contrast">
              <Toggle on={highContrast} onChange={setHighContrast} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Auto night mode" desc="Dim screen during late-night study">
              <Toggle on={autoNightMode} onChange={setAutoNightMode} />
            </SettingRow>
          </div>
        </div>

        {/* Learning */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={Languages} title="Learning Preferences" subtitle="Fine-tune how cards are presented during review." />
          <div className="space-y-1">
            <SettingRow label="Review order">
              <Select value={reviewOrder} onChange={setReviewOrder} options={[
                { label: 'FSRS - Optimized', value: 'FSRS - Optimized' },
                { label: 'Random', value: 'Random' },
                { label: 'Newest first', value: 'Newest first' },
                { label: 'Oldest first', value: 'Oldest first' },
                { label: 'Hardest first', value: 'Hardest first' },
              ]} />
            </SettingRow>
            <div className="border-t border-[#2A2A3A]/30" />
            <SettingRow label="Show hint first" desc="Reveal hint before showing answer">
              <Toggle on={showHintFirst} onChange={setShowHintFirst} />
            </SettingRow>
          </div>
          </div>
        </div>
      </div>

      {/* Danger Zone — full width */}
      <div className="mt-8 bg-[#111118] border border-red-500/20 rounded-xl p-6">
          <SectionHeader icon={AlertTriangle} title="Danger Zone" subtitle="Irreversible actions. Proceed with care." />
          <div className="space-y-3">
            {['Export your data', 'Export Anki package', 'Delete account'].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <span className="text-[#F0EFFE] text-xs">{item}</span>
                <button className={`px-4 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                  item === 'Delete account'
                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                    : 'border-[#2A2A3A] text-[#5A5A72] hover:text-[#F0EFFE] hover:border-[#3A3A4F]'
                }`}>
                  {item === 'Delete account' ? 'Delete' : 'Export'}
                </button>
              </div>
            ))}
          </div>
        </div>
    </PageShell>
  );
}
