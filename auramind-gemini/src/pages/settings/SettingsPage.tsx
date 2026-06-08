import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserIcon as User,
  PaletteIcon as Palette,
  BookOpenIcon as BookOpen,
  TargetIcon as Target,
  AwardIcon as Award,
  BrainIcon as Brain,
  StarIcon as Star,
  CreditCardIcon as CreditCard,
  ShieldIcon as ShieldCheck,
  LogOutIcon as LogOut,
  SunIcon as Sun,
  MoonIcon as Moon,
  GlobeIcon as Globe,
  BellIcon as Bell,
  ChevronRightIcon as ChevronRight,
  XIcon as X,
  CheckIcon as Check,
  CheckCircle2Icon as CheckCircle,
  XCircleIcon as XCircle,
  FileTextIcon as FileText,
  SparklesIcon as Sparkles,
  RotateCcwIcon as RotateCcw,
} from '../../components/icons/CustomIcons';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../types';
import MiiCharacter, { CHARACTER_PRESETS } from '../../components/shared/MiiCharacter';
import MiiCreator from '../../components/shared/MiiCreator';
import type { DicebearOptions } from '../../components/shared/MiiCharacter';
import type { ReactElement } from 'react';

interface SavedCustomCharacter {
  id: string;
  name: string;
  options: DicebearOptions;
}

let nextCustomId = 1;
const CUSTOM_PREFIX = 'custom-';

type SettingsSection = 'profile' | 'appearance' | 'study' | 'account' | 'about' | null;

interface SettingsPageProps {
  user: { id: string; name: string; email: string; plan: string; streak?: number };
  onLogout: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onLogout }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>(null);
  const [displayName, setDisplayName] = useState(user.name);
  const [dailyGoal, setDailyGoal] = useState(() => parseInt(localStorage.getItem('auramind-daily-goal') || '20'));
  const [notifications, setNotifications] = useState(() => localStorage.getItem('auramind-notifications') || 'daily');
  const [customCharacters, setCustomCharacters] = useState<SavedCustomCharacter[]>(() => {
    const saved = localStorage.getItem('auramind-custom-characters');
    if (saved) {
      try {
        const parsed: SavedCustomCharacter[] = JSON.parse(saved);
        parsed.forEach(c => { const n = parseInt(c.id.replace(CUSTOM_PREFIX, '')); if (n >= nextCustomId) nextCustomId = n + 1; });
        return parsed;
      } catch { /* fall through */ }
    }
    return [];
  });
  const [characterId, setCharacterId] = useState(() => {
    const saved = localStorage.getItem('auramind-character-id');
    if (saved === 'uploaded') return saved;
    if (saved && saved.startsWith(CUSTOM_PREFIX) && customCharacters.some(c => c.id === saved)) return saved;
    if (saved && CHARACTER_PRESETS.some(p => p.id === saved)) return saved;
    return 'matt';
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(() => localStorage.getItem('auramind-uploaded-image'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCharacter, setEditingCharacter] = useState<SavedCustomCharacter | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('auramind-daily-goal', String(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem('auramind-notifications', notifications);
  }, [notifications]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedImage(dataUrl);
      setCharacterId('uploaded');
      localStorage.setItem('auramind-uploaded-image', dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeUploadedImage = useCallback(() => {
    setUploadedImage(null);
    localStorage.removeItem('auramind-uploaded-image');
    setCharacterId('matt');
  }, []);

  useEffect(() => {
    localStorage.setItem('auramind-character-id', characterId);
    localStorage.setItem('auramind-char-version', String(Date.now()));
  }, [characterId]);

  useEffect(() => {
    localStorage.setItem('auramind-custom-characters', JSON.stringify(customCharacters));
  }, [customCharacters]);

  useEffect(() => {
    if (activeSection && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection]);

  const tiles: { id: SettingsSection; icon: React.FC<{ size?: number; className?: string }>; label: string; desc: string; color: string }[] = [
    { id: 'profile', icon: User, label: 'Profile', desc: 'Avatar, name, email', color: 'from-violet-500 to-purple-600' },
    { id: 'appearance', icon: Palette, label: 'Appearance', desc: 'Theme, display', color: 'from-pink-500 to-rose-600' },
    { id: 'study', icon: BookOpen, label: 'Study', desc: 'Goals, notifications', color: 'from-emerald-500 to-teal-600' },
    { id: 'account', icon: CreditCard, label: 'Account', desc: 'Plan, billing, data', color: 'from-blue-500 to-indigo-600' },
    { id: 'about', icon: ShieldCheck, label: 'About', desc: 'Version, legal', color: 'from-amber-500 to-orange-600' },
  ];

  const themeOptions: { value: Theme; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Globe },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Settings</h1>
        <p className="text-zinc-400 dark:text-zinc-500 text-sm">Customize your AuraMind experience</p>
      </div>

      {/* Avatar Card */}
      <motion.div         initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative group">
            <div               className="w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 overflow-hidden"
              style={{ backgroundColor: (characterId.startsWith(CUSTOM_PREFIX) || characterId === 'uploaded' ? '#8B5CF6' : (CHARACTER_PRESETS.find(c => c.id === characterId)?.accentColor || '#8B5CF6')) + '30' }}
            >
              {(() => {
                const custom = customCharacters.find(c => c.id === characterId);
                if (characterId === 'uploaded' && uploadedImage) return <img src={uploadedImage} alt="Profile" className="w-full h-full object-cover" />;
                if (custom) return <MiiCharacter seed={custom.id} size={80} dicebear={custom.options} />;
                return <MiiCharacter seed={CHARACTER_PRESETS.find(c => c.id === characterId)?.seed || 'Matt'} size={80} />;
              })()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Palette size={14} className="text-zinc-400" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{displayName}</h2>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                <Target size={12} />
                <span>Streak {user.streak ?? 0} days</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                <Award size={12} />
                <span>{user.plan}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wii-Style Tile Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {tiles.map((tile, i) => (
          <motion.button             key={tile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => setActiveSection(activeSection === tile.id ? null : tile.id)}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
              activeSection === tile.id
                ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tile.color} flex items-center justify-center mb-4 shadow-lg`}>
              <tile.icon size={22} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">{tile.label}</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{tile.desc}</p>
            {activeSection === tile.id && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                <X size={10} className="text-white" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Expanded Section Content */}
      <AnimatePresence mode="wait">
        {activeSection && (
          <motion.div             ref={contentRef}
            key={activeSection}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 mb-8">
              {activeSection === 'profile' && (
                <div className="space-y-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                    <User size={20} className="text-violet-400" />
                    Profile
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Display Name</label>
                    <input                       type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Mind Character</label>
                    <div className="grid grid-cols-4 sm:grid-cols-9 gap-3">
                      {CHARACTER_PRESETS.map((char) => {
                        const isActive = characterId === char.id;
                        return (
                          <button                             key={char.id}
                            onClick={() => setCharacterId(char.id)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                              isActive
                                ? 'border-violet-500 bg-violet-500/10'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
                            }`}
                          >
                            <MiiCharacter seed={char.seed} size={40} />
                            <span className={`text-[10px] font-bold ${isActive ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-500'}`}>
                              {char.name}
                            </span>
                          </button>
                        );
                      })}
                      {customCharacters.map((cc) => {
                        const isActive = characterId === cc.id;
                        return (
                          <div key={cc.id} className="relative group">
                            <button                               onClick={() => setCharacterId(cc.id)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all w-full ${
                                isActive
                              ? 'border-violet-500 bg-violet-500/10'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
                              }`}
                            >
                              <MiiCharacter seed={cc.id} size={40} dicebear={cc.options} />
                              <span className={`text-[10px] font-bold ${isActive ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-500'}`}>
                                {cc.name}
                              </span>
                            </button>
                            <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button                                 onClick={() => setEditingCharacter(cc)}
                                className="w-5 h-5 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center"
                              >
                                <Palette size={8} className="text-zinc-600 dark:text-zinc-300" />
                              </button>
                              <button                                 onClick={() => {
                                  setCustomCharacters(prev => prev.filter(c => c.id !== cc.id));
                                  if (characterId === cc.id) setCharacterId('matt');
                                }}
                                className="w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center"
                              >
                                <X size={8} className="text-white" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button                         onClick={() => setEditingCharacter({ id: '', name: '', options: { accessories: 'kurt', accessoriesColor: '262e33', clothing: 'shirtCrewNeck', clothesColor: '6c5ce7', eyes: 'default', eyebrows: 'defaultNatural', hairColor: '2c1b18', hatColor: '262e33', mouth: 'smile', skinColor: 'fd9841', top: 'shortFlat', facialHairColor: '2c1b18' } })}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-dashed transition-all border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Palette size={18} className="text-zinc-500" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500">Create</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Upload Photo / GIF</label>
                    <div className="flex items-center gap-4">
                      <button                         onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-all ${
                          characterId === 'uploaded'
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
                        }`}
                      >
                        {uploadedImage ? (
                          <div className="w-20 h-20 rounded-full overflow-hidden">
                            <img src={uploadedImage} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <User size={28} className="text-zinc-400 dark:text-zinc-500" />
                          </div>
                        )}
                        <span className={`text-xs font-bold ${characterId === 'uploaded' ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-500'}`}>
                          {uploadedImage ? 'Change Photo' : 'Choose File'}
                        </span>
                      </button>
                      {characterId === 'uploaded' && (
                        <button                           onClick={removeUploadedImage}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl">
                    <div                       className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: (characterId.startsWith(CUSTOM_PREFIX) || characterId === 'uploaded' ? '#8B5CF6' : (CHARACTER_PRESETS.find(c => c.id === characterId)?.accentColor || '#8B5CF6')) + '30' }}
                    >
                      {(() => {
                        const custom = customCharacters.find(c => c.id === characterId);
                        if (characterId === 'uploaded' && uploadedImage) return <img src={uploadedImage} alt="" className="w-full h-full object-cover" />;
                        if (custom) return <MiiCharacter seed={custom.id} size={48} dicebear={custom.options} />;
                        return <MiiCharacter seed={CHARACTER_PRESETS.find(c => c.id === characterId)?.seed || 'Matt'} size={48} />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-800 dark:text-zinc-300 font-bold">
                        {(() => {
                          const custom = customCharacters.find(c => c.id === characterId);
                          if (characterId === 'uploaded') return 'Photo';
                          if (custom) return custom.name;
                          return CHARACTER_PRESETS.find(c => c.id === characterId)?.name || 'Matt';
                        })()}
                      </p>
                      <p className="text-xs text-zinc-500">Your character appears like this across the app</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="space-y-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                    <Palette size={20} className="text-pink-400" />
                    Appearance
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {themeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = theme === opt.value;
                        return (
                          <button                             key={opt.value}
                            onClick={() => setTheme(opt.value)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                              isActive
                                ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-white'
                                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
<opt.icon size={28} className={isActive ? 'text-pink-400' : ''} />
                            <span className="text-sm font-bold">{opt.label}</span>
                            {isActive && <Check size={16} className="text-pink-400" />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-3">
                      {resolvedTheme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'study' && (
                <div className="space-y-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                    <BookOpen size={20} className="text-emerald-400" />
                    Study Preferences
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Daily Review Goal</label>
                    <div className="flex items-center gap-4">
                      <input                         type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                        className="flex-1 accent-emerald-500"
                      />
                      <span className="text-2xl font-bold text-emerald-400 w-12 text-right">{dailyGoal}</span>
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Cards to review each day</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Notifications</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'none', label: 'None', icon: X },
                        { value: 'daily', label: 'Daily Reminder', icon: Bell },
                        { value: 'weekly', label: 'Weekly Summary', icon: Target },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const isActive = notifications === opt.value;
                        return (
                          <button                             key={opt.value}
                            onClick={() => setNotifications(opt.value)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                              isActive
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                            }`}
                          >
                            <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'} />
                            <span className={`text-sm font-bold ${isActive ? 'text-emerald-600 dark:text-emerald-300' : 'text-zinc-600 dark:text-zinc-400'}`}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'account' && (
                <div className="space-y-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                    <CreditCard size={20} className="text-blue-400" />
                    Account
                  </h3>

                  <div className="p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Current Plan</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{user.plan}</p>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                          {user.plan === 'Starter' ? 'Free Tier' : 'Active'}
                        </p>
                      </div>
                    </div>
                    <button                       onClick={() => window.location.href = '/subscribe'}
                      className="w-full p-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-sm transition-all"
                    >
                      {user.plan === 'Starter' ? 'Upgrade Plan' : 'Manage Subscription'}
                    </button>
                  </div>

                  <div className="p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Email</p>
                    <p className="text-zinc-800 dark:text-zinc-300 font-medium">{user.email}</p>
                  </div>
                </div>
              )}

              {activeSection === 'about' && (
                <div className="space-y-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                    <ShieldCheck size={20} className="text-amber-400" />
                    About
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Version</p>
                      <p className="text-zinc-800 dark:text-zinc-300 font-bold">3.0.0</p>
                    </div>
                    <div className="p-5 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Environment</p>
                      <p className="text-zinc-800 dark:text-zinc-300 font-bold capitalize">{import.meta.env.MODE}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Privacy Policy', href: '/privacy' },
                      { label: 'Terms of Service', href: '/terms' },
                      { label: 'Documentation', href: '/docs' },
                    ].map((link) => (
                      <a                         key={link.label}
                        href={link.href}
                        className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group"
                      >
                        <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors font-medium">{link.label}</span>
                        <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign Out Tile */}
              <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                {showSignOutConfirm ? (
                  <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <p className="text-red-400 font-bold text-sm mb-4">Are you sure you want to sign out?</p>
                    <div className="flex gap-3">
                      <button                         onClick={() => { setShowSignOutConfirm(false); onLogout(); }}
                        className="flex-1 p-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-sm transition-all"
                      >
                        Sign Out
                      </button>
                      <button                         onClick={() => setShowSignOutConfirm(false)}
                        className="flex-1 p-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-sm transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button                     onClick={() => setShowSignOutConfirm(true)}
                    className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-all group"
                  >
                    <LogOut size={20} />
                    <span className="font-bold uppercase tracking-widest text-sm">Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
       <AnimatePresence>
         {editingCharacter && (
           <MiiCreator
            initialOptions={editingCharacter.options}
            initialName={editingCharacter.name}
            onSave={(name, opts) => {
              if (editingCharacter.id) {
                setCustomCharacters(prev => prev.map(c => c.id === editingCharacter.id ? { ...c, name, options: opts } : c));
              } else {
                const id = `${CUSTOM_PREFIX}${nextCustomId++}`;
                setCustomCharacters(prev => [...prev, { id, name, options: opts }]);
                setCharacterId(id);
              }
              setEditingCharacter(null);
            }}
            onClose={() => setEditingCharacter(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;


