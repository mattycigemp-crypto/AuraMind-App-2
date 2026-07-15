import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { useTheme } from '../../hooks/useTheme';
import { usePlatform } from '../../hooks/usePlatform';
import {
  SunIcon as Sun,
  MoonIcon as Moon,
  MonitorIcon as Monitor,
  ShieldIcon as Shield,
  Trash2Icon as Trash2,
  LogOutIcon as LogOut,
  GlobeIcon as Globe,
  CheckIcon as Check,
  PencilIcon as Pencil,
  XIcon as X,
  ChevronRightIcon as ChevronRight,
  BellIcon as Bell,
} from '../icons/CustomIcons';

// DiceBear styles with customization options
const avatarStyles = [
  'avataaars', 'bottts', 'pixel-art', 'lorelei', 'notionists',
  'big-ears', 'big-smile', 'croodles', 'fun-emoji', 'icons',
  'identicon', 'initials', 'micah', 'miniavs', 'open-peeps',
  'personas', 'rings', 'shapes', 'thumbs'
] as const;

const avatarSeeds = ['aura', 'mind', 'study', 'brain', 'neural', 'spark', 'pulse', 'beam', 'nova', 'zen', 'flow', 'wave', 'echo', 'flux', 'glow'];

const getAvatarUrl = (style: string, seed: string, options?: Record<string, string>) => {
  const params = new URLSearchParams({ backgroundColor: 'transparent', ...options });
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&${params.toString()}`;
};

// Avataaars customization options
const avataaarsOptions = {
  topType: ['NoHair', 'Eyepatch', 'Hat', 'Hijab', 'Turban', 'WinterHat1', 'WinterHat2', 'WinterHat3', 'WinterHat4', 'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairCurly', 'LongHairCurvy', 'LongHairDread', 'LongHairFrida', 'LongHairFro', 'LongHairFroBand', 'LongHairMia', 'LongHairMonique', 'LongHairMud', 'LongHairNotTooLong', 'LongHairShaved', 'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand', 'ShortHairDreads01', 'ShortHairDreads02', 'ShortHairFrizzle', 'ShortHairShaggy', 'ShortHairShaggyMullet', 'ShortHairShortCurly', 'ShortHairShortFlat', 'ShortHairShortRound', 'ShortHairShortWaved', 'ShortHairSides', 'ShortHairTheCaesar', 'ShortHairTheCaesarSidePart'],
  accessoriesType: ['Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers'],
  hairColor: ['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'PastelPink', 'Blue', 'GoldenBrown', 'Platinum', 'Red', 'SilverGray'],
  facialHairType: ['Blank', 'BeardMedium', 'BeardLight', 'BeardMagestic', 'MoustacheFancy', 'MoustacheMagnum'],
  clotheType: ['BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie', 'Overall', 'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck'],
  eyeType: ['Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side', 'Squint', 'Surprised', 'Wink', 'WinkWacky'],
  eyebrowType: ['Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural', 'FrownNatural', 'RaisedExcited', 'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural', 'Unibrow', 'UpDown', 'UpDownNatural'],
  mouthType: ['Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad', 'ScreamOpen', 'Serious', 'Smile', 'Tongue', 'Twinkle', 'Vomit'],
  skinColor: ['Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'],
};

const Settings: React.FC = () => {
  const workspace = useDashboardWorkspace();
  const user = workspace?.user;
  const onLogout = workspace?.onLogout;
  const updateProfile = workspace?.updateProfile;
  const { theme, setTheme } = useTheme();
  const { platform, isIOS, isAndroid, isMacOS, isWindows, isLinux, platformName, accentColor } = usePlatform();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [notifications, setNotifications] = useState({
    studyReminders: true,
    streakAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user?.avatar || null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarMode, setAvatarMode] = useState<'browse' | 'customize' | 'draw' | 'code' | 'upload'>('browse');
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState(user?.name || '');

  const handleSaveName = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === savedName) {
      setEditingName(false);
      setName(savedName);
      return;
    }
    setSaving(true);
    try {
      if (updateProfile) {
        await updateProfile({ name: trimmed });
      }
      setSavedName(trimmed);
      setName(trimmed);
      setEditingName(false);
    } catch (err) {
      console.error('Failed to save name:', err);
      setName(savedName);
      setEditingName(false);
    } finally {
      setSaving(false);
    }
  }, [name, savedName, updateProfile]);

  // Avatar Picker Component (shared)
  const AvatarPicker = ({ accentColor = 'primary', rounded = 'rounded-xl', buttonStyle = 'default' }: { accentColor?: string; rounded?: string; buttonStyle?: 'default' | 'linux' | 'android' | 'windows' | 'macos' }) => {
    const accentMap: Record<string, string> = {
      primary: 'border-primary',
      blue: 'border-blue-500',
      green: 'border-green-500',
      purple: 'border-purple-500',
    };
    const bgMap: Record<string, string> = {
      primary: 'bg-primary text-black',
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-600 text-white',
      purple: 'bg-purple-600 text-white',
    };
    const btnAccent = buttonStyle === 'linux' ? bgMap.green : buttonStyle === 'android' ? bgMap.purple : (isMacOS || isWindows ? bgMap.blue : bgMap.primary);
    const selectedBorder = buttonStyle === 'linux' ? accentMap.green : buttonStyle === 'android' ? accentMap.purple : (isMacOS || isWindows ? accentMap.blue : accentMap.primary);

    const [browseStyle, setBrowseStyle] = useState(0);
    const [customizeStyle, setCustomizeStyle] = useState('avataaars');
    const [customizeSeed, setCustomizeSeed] = useState('aura');
    const [customizeOpts, setCustomizeOpts] = useState<Record<string, string>>({});
    const [codeInput, setCodeInput] = useState('');
    const [codePreview, setCodePreview] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const tabs = [
      { id: 'browse' as const, label: buttonStyle === 'linux' ? 'browse' : 'Browse' },
      { id: 'customize' as const, label: buttonStyle === 'linux' ? 'customize' : 'Customize' },
      { id: 'draw' as const, label: buttonStyle === 'linux' ? 'draw' : 'Draw' },
      { id: 'code' as const, label: buttonStyle === 'linux' ? 'code' : 'Code' },
      { id: 'upload' as const, label: buttonStyle === 'linux' ? 'upload' : 'Upload' },
    ];

    // Drawing canvas setup
    useEffect(() => {
      if (avatarMode === 'draw' && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#18181b';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, [avatarMode]);

    const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#a78bfa';
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDraw = () => setIsDrawing(false);

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const saveCanvasAsAvatar = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      setSelectedAvatar(dataUrl);
      setShowAvatarPicker(false);
    };

    const handleCodeSubmit = () => {
      if (codeInput.trim()) {
        // If it's an SVG, use it directly; if it's a URL, use it as-is
        if (codeInput.startsWith('<svg') || codeInput.startsWith('<SVG')) {
          setCodePreview(codeInput);
          setSelectedAvatar(`data:image/svg+xml,${encodeURIComponent(codeInput)}`);
        } else if (codeInput.startsWith('http')) {
          setSelectedAvatar(codeInput);
        } else {
          // Treat as emoji/text - create a data URL
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#18181b';
            ctx.fillRect(0, 0, 256, 256);
            ctx.font = '120px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(codeInput, 128, 128);
            setSelectedAvatar(canvas.toDataURL());
          }
        }
      }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setSelectedAvatar(result);
        setShowAvatarPicker(false);
      };
      reader.readAsDataURL(file);
    };

    const currentStyle = avatarStyles[browseStyle];

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={() => setShowAvatarPicker(false)}>
        <div className={`w-full sm:max-w-xl ${rounded} overflow-hidden max-h-[85vh] flex flex-col bg-zinc-900`} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h3 className={`text-lg ${buttonStyle === 'linux' ? 'font-mono text-sm text-zinc-300' : 'font-semibold text-white'}`}>
              {buttonStyle === 'linux' ? 'choose_avatar' : 'Choose Avatar'}
            </h3>
            <button onClick={() => setShowAvatarPicker(false)} className={`p-2 ${buttonStyle === 'linux' ? 'font-mono' : 'rounded-full'} bg-zinc-800 text-zinc-400`}>
              <X size={16} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className={`flex border-b border-zinc-800 ${buttonStyle === 'linux' ? 'font-mono' : ''}`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setAvatarMode(tab.id)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  avatarMode === tab.id
                    ? buttonStyle === 'linux'
                      ? 'text-green-400 border-b-2 border-green-500 bg-green-500/5'
                      : 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4">
            {avatarMode === 'browse' && (
              <>
                {/* Style selector */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {avatarStyles.map((style, i) => (
                    <button
                      key={style}
                      onClick={() => setBrowseStyle(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        i === browseStyle
                          ? buttonStyle === 'linux'
                            ? 'bg-green-600 text-white'
                            : 'bg-primary text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {avatarSeeds.map(seed => {
                    const url = getAvatarUrl(currentStyle, seed);
                    const isSelected = selectedAvatar === url;
                    return (
                      <button
                        key={seed}
                        onClick={() => setSelectedAvatar(url)}
                        className={`aspect-square overflow-hidden bg-zinc-800 border-2 transition-all ${
                          buttonStyle === 'linux' ? 'rounded-sm' : 'rounded-xl'
                        } ${isSelected ? `${buttonStyle === 'linux' ? 'border-green-500' : 'border-primary'} scale-95` : 'border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <img src={url} alt={seed} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {avatarMode === 'customize' && (
              <div className="space-y-4">
                {/* Style & seed selector */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={`text-xs mb-1 block ${buttonStyle === 'linux' ? 'font-mono text-zinc-500' : 'text-zinc-500'}`}>
                      {buttonStyle === 'linux' ? 'style' : 'Style'}
                    </label>
                    <select
                      value={customizeStyle}
                      onChange={e => setCustomizeStyle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none ${buttonStyle === 'linux' ? 'font-mono focus:border-green-500' : 'focus:border-primary'}`}
                    >
                      <option value="avataaars">Avataaars</option>
                      <option value="bottts">Bottts</option>
                      <option value="pixel-art">Pixel Art</option>
                      <option value="lorelei">Lorelei</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={`text-xs mb-1 block ${buttonStyle === 'linux' ? 'font-mono text-zinc-500' : 'text-zinc-500'}`}>
                      {buttonStyle === 'linux' ? 'seed' : 'Seed'}
                    </label>
                    <input
                      type="text"
                      value={customizeSeed}
                      onChange={e => setCustomizeSeed(e.target.value)}
                      placeholder="any word..."
                      className={`w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none ${buttonStyle === 'linux' ? 'font-mono focus:border-green-500' : 'focus:border-primary'}`}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="flex justify-center">
                  <div className={`w-32 h-32 ${buttonStyle === 'linux' ? 'rounded' : 'rounded-2xl'} bg-zinc-800 border-2 ${buttonStyle === 'linux' ? 'border-green-500/30' : 'border-zinc-700'} overflow-hidden`}>
                    <img
                      src={getAvatarUrl(customizeStyle, customizeSeed, customizeOpts)}
                      alt="custom"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Feature options (avataaars only for now) */}
                {customizeStyle === 'avataaars' && (
                  <div className="space-y-3">
                    {[
                      { key: 'topType', label: 'Hair' },
                      { key: 'accessoriesType', label: 'Accessories' },
                      { key: 'hairColor', label: 'Hair Color' },
                      { key: 'facialHairType', label: 'Facial Hair' },
                      { key: 'clotheType', label: 'Clothing' },
                      { key: 'eyeType', label: 'Eyes' },
                      { key: 'eyebrowType', label: 'Eyebrows' },
                      { key: 'mouthType', label: 'Mouth' },
                      { key: 'skinColor', label: 'Skin' },
                    ].map(opt => (
                      <div key={opt.key}>
                        <label className={`text-xs mb-1 block ${buttonStyle === 'linux' ? 'font-mono text-zinc-500' : 'text-zinc-500'}`}>
                          {buttonStyle === 'linux' ? opt.key : opt.label}
                        </label>
                        <select
                          value={customizeOpts[opt.key] || ''}
                          onChange={e => setCustomizeOpts(prev => ({ ...prev, [opt.key]: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none ${buttonStyle === 'linux' ? 'font-mono focus:border-green-500' : 'focus:border-primary'}`}
                        >
                          <option value="">Random</option>
                          {(avataaarsOptions as any)[opt.key]?.map((v: string) => (
                            <option key={v} value={v}>{v.replace(/([A-Z])/g, ' $1').trim()}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={() => {
                    setSelectedAvatar(getAvatarUrl(customizeStyle, customizeSeed, customizeOpts));
                    setShowAvatarPicker(false);
                  }}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm ${buttonStyle === 'linux' ? 'rounded bg-green-600 text-white font-mono' : 'bg-primary text-black'}`}
                >
                  {buttonStyle === 'linux' ? 'save_avatar' : 'Save Avatar'}
                </button>
              </div>
            )}

            {avatarMode === 'draw' && (
              <div className="space-y-3">
                <canvas
                  ref={canvasRef}
                  width={256}
                  height={256}
                  className="w-full aspect-square rounded-xl bg-zinc-800 cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                <div className="flex gap-2">
                  <button onClick={clearCanvas} className={`flex-1 py-2.5 rounded-xl text-sm ${buttonStyle === 'linux' ? 'rounded bg-zinc-800 text-zinc-400 font-mono' : 'bg-zinc-800 text-zinc-400'}`}>
                    {buttonStyle === 'linux' ? 'clear' : 'Clear'}
                  </button>
                  <button onClick={saveCanvasAsAvatar} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${buttonStyle === 'linux' ? 'rounded bg-green-600 text-white font-mono' : 'bg-primary text-black'}`}>
                    {buttonStyle === 'linux' ? 'use_drawing' : 'Use Drawing'}
                  </button>
                </div>
              </div>
            )}

            {avatarMode === 'code' && (
              <div className="space-y-3">
                <p className={`text-xs ${buttonStyle === 'linux' ? 'font-mono text-zinc-500' : 'text-zinc-500'}`}>
                  {buttonStyle === 'linux'
                    ? 'paste_svg_url, svg_code, or type_emoji/text'
                    : 'Paste an SVG, image URL, or type emoji/text to generate an avatar.'}
                </p>
                <textarea
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  placeholder={buttonStyle === 'linux' ? '<svg>... or https://... or :brain:' : 'Paste SVG, URL, or type emoji...'}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm resize-none focus:outline-none ${buttonStyle === 'linux' ? 'font-mono focus:border-green-500' : 'focus:border-primary'}`}
                />
                <button
                  onClick={handleCodeSubmit}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold ${buttonStyle === 'linux' ? 'rounded bg-green-600 text-white font-mono' : 'bg-primary text-black'}`}
                >
                  {buttonStyle === 'linux' ? 'generate' : 'Generate'}
                </button>
                {selectedAvatar && selectedAvatar.startsWith('data:') && (
                  <div className="flex justify-center">
                    <div className={`w-24 h-24 ${buttonStyle === 'linux' ? 'rounded' : 'rounded-xl'} bg-zinc-800 border-2 ${buttonStyle === 'linux' ? 'border-green-500/30' : 'border-zinc-700'} overflow-hidden`}>
                      <img src={selectedAvatar} alt="code preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {avatarMode === 'upload' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full aspect-square ${buttonStyle === 'linux' ? 'rounded' : 'rounded-xl'} bg-zinc-800 border-2 border-dashed ${buttonStyle === 'linux' ? 'border-green-500/30' : 'border-zinc-700'} flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors`}
                >
                  <svg className={`w-12 h-12 mb-2 ${buttonStyle === 'linux' ? 'text-green-500' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
                  </svg>
                  <p className={`text-sm ${buttonStyle === 'linux' ? 'font-mono text-zinc-400' : 'text-zinc-500'}`}>
                    {buttonStyle === 'linux' ? 'click_to_upload' : 'Click to upload'}
                  </p>
                  <p className={`text-xs ${buttonStyle === 'linux' ? 'font-mono text-zinc-600' : 'text-zinc-600'}`}>
                    {buttonStyle === 'linux' ? 'png, jpg, gif, svg' : 'PNG, JPG, GIF, SVG'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-5 py-3 border-t border-zinc-800 flex gap-2 ${buttonStyle === 'linux' ? 'font-mono justify-end' : ''}`}>
            <button onClick={() => { setSelectedAvatar(null); setShowAvatarPicker(false); }} className={`flex-1 py-2.5 ${buttonStyle === 'linux' ? 'rounded' : 'rounded-xl'} bg-zinc-800 text-zinc-400 text-sm`}>
              {buttonStyle === 'linux' ? 'none' : 'Remove'}
            </button>
            <button onClick={() => setShowAvatarPicker(false)} className={`flex-1 py-2.5 ${buttonStyle === 'linux' ? 'rounded' : 'rounded-xl'} ${btnAccent} text-sm font-semibold`}>
              {buttonStyle === 'linux' ? 'ok' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-3xl mx-auto pb-8 ${isIOS ? 'space-y-6' : isAndroid ? 'space-y-2' : isMacOS ? 'space-y-5' : 'space-y-4'}`}>
      {/* Header */}
      <div className={`px-4 pt-2 ${isMacOS || isWindows ? 'border-b border-zinc-800 pb-3' : ''}`}>
        <div className="flex items-center gap-3">
          <h1 className={`${
            isIOS ? 'text-3xl font-bold text-white' :
            isAndroid ? 'text-2xl font-medium text-white' :
            isMacOS ? 'text-2xl font-semibold text-zinc-100' :
            isWindows ? 'text-xl font-semibold text-white' :
            isLinux ? 'text-xl font-semibold text-zinc-200 font-mono' :
            'text-2xl font-medium text-white'
          }`}>
            {isLinux ? 'settings' : 'Settings'}
          </h1>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${
            isIOS ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
            isAndroid ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
            isMacOS ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :
            isWindows ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
            isLinux ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-mono' :
            'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }`}>
            {platformName}
          </span>
        </div>
        {(isMacOS || isWindows) && <p className="text-sm text-zinc-500 mt-0.5">Manage your account, preferences, and privacy</p>}
      </div>

      {isIOS ? (
        // ── iOS Style ───────────────────────────────────────────
        <>
          <section className="mx-4 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/60">
            <div className="flex items-center gap-4 p-4 border-b border-zinc-800/60">
              <button onClick={() => setShowAvatarPicker(true)} className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shadow-lg shrink-0 hover:opacity-80 transition-opacity">
                {selectedAvatar ? <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white text-2xl font-semibold">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>}
              </button>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex gap-2">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-primary" />                      <button onClick={handleSaveName} disabled={saving} className="p-1.5 rounded-lg bg-primary text-black disabled:opacity-50"><Check size={14} /></button>
                      <button onClick={() => { setEditingName(false); setName(user?.name || ''); }} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingName(true)} className="text-base font-semibold text-white truncate">{user?.name || 'No name set'}</button>
                    <Pencil size={12} className="text-zinc-600 shrink-0" />
                  </div>
                )}
                <p className="text-sm text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="divide-y divide-zinc-800/60">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center"><span className="text-[10px] font-bold text-primary uppercase">{user?.plan}</span></div>
                  <span className="text-sm text-zinc-300">Plan</span>
                </div>
                <span className="text-sm text-zinc-600">Manage</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-green-500/20 flex items-center justify-center"><Shield size={14} className="text-green-400" /></div>
                  <span className="text-sm text-zinc-300">Email verified</span>
                </div>
                {user?.isEmailVerified ? <Check size={16} className="text-green-400" /> : <button className="text-sm text-primary font-medium">Verify</button>}
              </div>
            </div>
          </section>

          <section className="mx-4 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/60">
            <div className="px-4 py-2.5 border-b border-zinc-800/60"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Appearance</span></div>
            <div className="divide-y divide-zinc-800/60">
              {[{ id: 'light' as const, label: 'Light', icon: Sun }, { id: 'dark' as const, label: 'Dark', icon: Moon }, { id: 'system' as const, label: 'System', icon: Monitor }].map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)} className="w-full flex items-center justify-between px-4 py-3 active:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${theme === t.id ? 'bg-primary/20' : 'bg-zinc-800'}`}><t.icon size={14} className={theme === t.id ? 'text-primary' : 'text-zinc-500'} /></div>
                    <span className="text-sm text-zinc-300">{t.label}</span>
                  </div>
                  {theme === t.id && <Check size={14} className="text-primary" />}
                </button>
              ))}
            </div>
          </section>

          <section className="mx-4 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/60">
            <div className="px-4 py-2.5 border-b border-zinc-800/60"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Notifications</span></div>
            <div className="divide-y divide-zinc-800/60">
              {Object.entries({ studyReminders: 'Study reminders', streakAlerts: 'Streak alerts', weeklyReports: 'Weekly progress reports', marketingEmails: 'Product updates & tips' }).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-zinc-300">{label}</span>
                  <div className="relative inline-flex items-center">
                    <input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))} className="sr-only peer" />
                    <div className="w-11 h-7 rounded-full bg-zinc-700 peer-checked:bg-green-500 transition-colors duration-200" />
                    <div className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-zinc-900 shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="mx-4 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/60">
            <div className="px-4 py-2.5 border-b border-zinc-800/60"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Privacy & Security</span></div>
            <div className="divide-y divide-zinc-800/60">
              <button className="w-full flex items-center justify-between px-4 py-3 active:bg-zinc-800/50"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center"><Shield size={14} className="text-zinc-500" /></div><span className="text-sm text-zinc-300">Change password</span></div><span className="text-zinc-600 text-sm">›</span></button>
              <button className="w-full flex items-center justify-between px-4 py-3 active:bg-zinc-800/50"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center"><Globe size={14} className="text-zinc-500" /></div><span className="text-sm text-zinc-300">Data export</span></div><span className="text-zinc-600 text-sm">›</span></button>
            </div>
          </section>

          <section className="mx-4 rounded-xl overflow-hidden bg-red-950/30 border border-red-500/20">
            <div className="divide-y divide-red-500/10">
              {showDeleteConfirm ? (
                <div className="p-4 space-y-3">
                  <p className="text-sm text-red-300 font-medium">Are you sure? This will permanently delete your account and all data.</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold">Yes, delete</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-semibold">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between px-4 py-3 active:bg-red-500/10">
                  <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-md bg-red-500/20 flex items-center justify-center"><Trash2 size={14} className="text-red-400" /></div><span className="text-sm text-red-400">Delete account</span></div>
                  <span className="text-red-500/50 text-sm">›</span>
                </button>
              )}
              <button onClick={onLogout} className="w-full flex items-center justify-between px-4 py-3 active:bg-red-500/10">
                <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-md bg-red-500/20 flex items-center justify-center"><LogOut size={14} className="text-red-400" /></div><span className="text-sm text-red-400">Sign out</span></div>
                <span className="text-red-500/50 text-sm">›</span>
              </button>
            </div>
          </section>

          {showAvatarPicker && <AvatarPicker rounded="rounded-t-3xl sm:rounded-3xl" />}
        </>
      ) : isAndroid ? (
        // ── Android Style ───────────────────────────────────────
        <>
          <section className="mx-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              <button onClick={() => setShowAvatarPicker(true)} className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
                {selectedAvatar ? <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-primary text-xl font-medium">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>}
              </button>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex gap-2 items-center">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-primary" />                      <button onClick={handleSaveName} disabled={saving} className="p-2 rounded-full hover:bg-zinc-800 text-primary disabled:opacity-50"><Check size={16} /></button>
                      <button onClick={() => { setEditingName(false); setName(user?.name || ''); }} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingName(true)} className="text-lg font-medium text-white truncate hover:underline">{user?.name || 'No name set'}</button>
                      <Pencil size={14} className="text-zinc-600 shrink-0" />
                    </div>
                    <p className="text-sm text-zinc-500 truncate">{user?.email}</p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="mx-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/40"><span className="text-sm font-medium text-primary">Account</span></div>
            <div className="divide-y divide-zinc-800/30">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-xs font-bold text-primary uppercase">{user?.plan}</span></div>
                  <div><p className="text-sm text-zinc-200">Plan</p><p className="text-xs text-zinc-600">{user?.plan}</p></div>
                </div>
                <button className="text-sm text-primary font-medium px-4 py-1.5 rounded-full border border-primary/30 hover:bg-primary/10">Upgrade</button>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center"><Shield size={18} className="text-green-400" /></div>
                  <div><p className="text-sm text-zinc-200">Email verified</p><p className="text-xs text-zinc-600">{user?.isEmailVerified ? 'Verified' : 'Not verified'}</p></div>
                </div>
                {!user?.isEmailVerified && <button className="text-sm text-primary font-medium px-4 py-1.5 rounded-full hover:bg-primary/10">Verify</button>}
              </div>
            </div>
          </section>

          <section className="mx-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/40"><span className="text-sm font-medium text-primary">Appearance</span></div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {[{ id: 'light' as const, label: 'Light', icon: Sun }, { id: 'dark' as const, label: 'Dark', icon: Moon }, { id: 'system' as const, label: 'System', icon: Monitor }].map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'}`}>
                    <t.icon size={20} /><span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/40"><span className="text-sm font-medium text-primary">Notifications</span></div>
            <div className="divide-y divide-zinc-800/30">
              {Object.entries({ studyReminders: 'Study reminders', streakAlerts: 'Streak alerts', weeklyReports: 'Weekly progress reports', marketingEmails: 'Product updates & tips' }).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><Bell size={18} className="text-zinc-500" /></div>
                    <span className="text-sm text-zinc-200">{label}</span>
                  </div>
                  <div className="relative inline-flex items-center">
                    <input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))} className="sr-only peer" />
                    <div className="w-10 h-5 rounded-full bg-zinc-700 peer-checked:bg-primary/60 transition-colors duration-200" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-zinc-400 peer-checked:bg-primary peer-checked:translate-x-5 transition-all duration-200 shadow-sm" />
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="mx-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/40"><span className="text-sm font-medium text-primary">Privacy & Security</span></div>
            <div className="divide-y divide-zinc-800/30">
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900/50"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><Shield size={18} className="text-zinc-500" /></div><span className="text-sm text-zinc-200">Change password</span></div><ChevronRight size={18} className="text-zinc-600" /></button>
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900/50"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><Globe size={18} className="text-zinc-500" /></div><span className="text-sm text-zinc-200">Data export</span></div><ChevronRight size={18} className="text-zinc-600" /></button>
            </div>
          </section>

          <section className="mx-4 rounded-2xl bg-red-950/20 border border-red-500/20 overflow-hidden">
            {showDeleteConfirm ? (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-red-400" /></div><p className="text-sm text-red-300 font-medium">Permanently delete your account and all data?</p></div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">Delete</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-medium hover:bg-zinc-700">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-500/10">
                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><Trash2 size={18} className="text-red-400" /></div><span className="text-sm text-red-400">Delete account</span></div>
                <ChevronRight size={18} className="text-red-500/50" />
              </button>
            )}
            <div className="border-t border-red-500/10">
              <button onClick={onLogout} className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-500/10">
                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><LogOut size={18} className="text-red-400" /></div><span className="text-sm text-red-400">Sign out</span></div>
                <ChevronRight size={18} className="text-red-500/50" />
              </button>
            </div>
          </section>

          {showAvatarPicker && <AvatarPicker rounded="rounded-t-2xl sm:rounded-2xl" />}
        </>
      ) : isMacOS ? (
        // ── macOS Style ─────────────────────────────────────────
        <div className="px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="hidden lg:block lg:col-span-1">
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/50 p-3 space-y-1 sticky top-20">
                {['Account', 'Appearance', 'Notifications', 'Privacy'].map((item, i) => (
                  <button key={item} className={`w-full text-left px-3 py-1.5 rounded-lg text-sm ${i === 0 ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>{item}</button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Account</h2>
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/50 overflow-hidden">
                  <div className="flex items-center gap-4 p-5 border-b border-zinc-800/50">
                    <button onClick={() => setShowAvatarPicker(true)} className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 flex items-center justify-center shadow-lg shrink-0 hover:opacity-80 transition-opacity">
                      {selectedAvatar ? <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white text-xl font-semibold">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>}
                    </button>
                    <div className="flex-1">
                      {editingName ? (
                        <div className="flex gap-2">
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500" />
                      <button onClick={handleSaveName} disabled={saving} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-50">Save</button>
                      <button onClick={() => { setEditingName(false); setName(user?.name || ''); }} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => setEditingName(true)} className="text-lg font-semibold text-white hover:underline">{user?.name || 'No name set'}</button>
                          <p className="text-sm text-zinc-500">{user?.email}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-800/50">
                    <div className="flex items-center justify-between px-5 py-3"><span className="text-sm text-zinc-300">Plan</span><span className="text-sm font-medium text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full">{user?.plan}</span></div>
                    <div className="flex items-center justify-between px-5 py-3"><span className="text-sm text-zinc-300">Email verified</span>{user?.isEmailVerified ? <Check size={16} className="text-green-400" /> : <button className="text-sm text-blue-400 font-medium">Verify</button>}</div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Appearance</h2>
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/50 p-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[{ id: 'light' as const, label: 'Light', icon: Sun }, { id: 'dark' as const, label: 'Dark', icon: Moon }, { id: 'system' as const, label: 'System', icon: Monitor }].map(t => (
                      <button key={t.id} onClick={() => setTheme(t.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === t.id ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-zinc-800/50 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'}`}>
                        <t.icon size={20} /><span className="text-xs font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Notifications</h2>
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/50 overflow-hidden divide-y divide-zinc-800/50">
                  {Object.entries({ studyReminders: 'Study reminders', streakAlerts: 'Streak alerts', weeklyReports: 'Weekly progress reports', marketingEmails: 'Product updates & tips' }).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-zinc-300">{label}</span>
                      <div className="relative inline-flex items-center">
                        <input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))} className="sr-only peer" />
                        <div className="w-9 h-5 rounded-full bg-zinc-700 peer-checked:bg-blue-500 transition-colors duration-200" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-zinc-900 shadow peer-checked:translate-x-4 transition-transform duration-200" />
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Privacy & Security</h2>
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/50 overflow-hidden divide-y divide-zinc-800/50">
                  <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-900/50"><span className="text-sm text-zinc-300">Change password</span><ChevronRight size={16} className="text-zinc-600" /></button>
                  <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-900/50"><span className="text-sm text-zinc-300">Data export</span><ChevronRight size={16} className="text-zinc-600" /></button>
                </div>
              </section>

              <section>
                <div className="rounded-xl bg-red-950/20 border border-red-500/20 overflow-hidden divide-y divide-red-500/10">
                  {showDeleteConfirm ? (
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-red-300">Permanently delete your account and all data?</p>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium">Delete</button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-red-500/10"><span className="text-sm text-red-400">Delete account</span><ChevronRight size={16} className="text-red-500/50" /></button>
                  )}
                  <button onClick={onLogout} className="w-full flex items-center justify-between px-5 py-3 hover:bg-red-500/10"><span className="text-sm text-red-400">Sign out</span><ChevronRight size={16} className="text-red-500/50" /></button>
                </div>
              </section>
            </div>
          </div>
          {showAvatarPicker && <AvatarPicker rounded="rounded-xl" accentColor="blue" />}
        </div>
      ) : isWindows ? (
        // ── Windows Style ───────────────────────────────────────
        <div className="px-6">
          <div className="space-y-4">
            <section className="rounded-lg bg-zinc-900/80 border border-zinc-800 overflow-hidden">
              <div className="flex items-center gap-4 p-4 border-b border-zinc-800">
                <button onClick={() => setShowAvatarPicker(true)} className="w-12 h-12 rounded overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
                  {selectedAvatar ? <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white text-lg font-semibold">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>}
                </button>
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex gap-2">
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-400" />
                      <button onClick={handleSaveName} disabled={saving} className="px-3 py-1.5 rounded bg-blue-500 text-white text-sm disabled:opacity-50">Save</button>
                      <button onClick={() => { setEditingName(false); setName(user?.name || ''); }} className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setEditingName(true)} className="text-base font-semibold text-white">{user?.name || 'No name set'}</button>
                      <p className="text-xs text-zinc-500">{user?.email}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-zinc-400">Plan: <span className="text-blue-400 font-medium">{user?.plan}</span></span>
                {user?.isEmailVerified ? <Check size={14} className="text-green-400" /> : <button className="text-xs text-blue-400 underline">Verify email</button>}
              </div>
            </section>

            <section className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-4">
              <p className="text-sm font-medium text-white mb-3">Theme</p>
              <div className="flex gap-2">
                {[{ id: 'light' as const, label: 'Light', icon: Sun }, { id: 'dark' as const, label: 'Dark', icon: Moon }, { id: 'system' as const, label: 'System', icon: Monitor }].map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className={`flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded border ${theme === t.id ? 'border-blue-400 bg-blue-500/10 text-blue-400' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'}`}>
                    <t.icon size={16} /><span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg bg-zinc-900/80 border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
              <div className="px-4 py-2.5 border-b border-zinc-800"><span className="text-sm font-medium text-white">Notifications</span></div>
              {Object.entries({ studyReminders: 'Study reminders', streakAlerts: 'Streak alerts', weeklyReports: 'Weekly progress reports', marketingEmails: 'Product updates' }).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-zinc-400">{label}</span>
                  <div className="relative inline-flex items-center">
                    <input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))} className="sr-only peer" />
                    <div className="w-8 h-4 rounded-full bg-zinc-700 peer-checked:bg-blue-500 transition-colors" />
                    <div className="absolute top-0 left-0 w-4 h-4 rounded-full bg-zinc-600 peer-checked:bg-zinc-900 peer-checked:translate-x-4 transition-all shadow" />
                  </div>
                </label>
              ))}
            </section>

            <section className="rounded-lg bg-zinc-900/80 border border-zinc-800 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800"><span className="text-sm font-medium text-white">Privacy & Security</span></div>
              <div className="divide-y divide-zinc-800">
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50"><span className="text-sm text-zinc-400">Change password</span><ChevronRight size={14} className="text-zinc-600" /></button>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50"><span className="text-sm text-zinc-400">Data export</span><ChevronRight size={14} className="text-zinc-600" /></button>
              </div>
            </section>

            <section className="rounded-lg bg-red-950/20 border border-red-500/30 overflow-hidden">
              {showDeleteConfirm ? (
                <div className="p-4 space-y-3">
                  <p className="text-sm text-red-300">Delete account permanently?</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded bg-red-600 text-white text-sm font-medium">Delete</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded bg-zinc-800 text-zinc-400 text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-500/10"><span className="text-sm text-red-400">Delete account</span><ChevronRight size={14} className="text-red-500/50" /></button>
              )}
              <div className="border-t border-red-500/20">
                <button onClick={onLogout} className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-500/10"><span className="text-sm text-red-400">Sign out</span><ChevronRight size={14} className="text-red-500/50" /></button>
              </div>
            </section>
          </div>
          {showAvatarPicker && <AvatarPicker rounded="rounded-lg" accentColor="blue" />}
        </div>
      ) : (
        // ── Linux / Web Style ───────────────────────────────────
        <div className="px-6">
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-zinc-300 mb-2">Account</h2>
              <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowAvatarPicker(true)} className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
                    {selectedAvatar ? <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-zinc-400 text-lg font-mono">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>}
                  </button>
                  <div className="flex-1">
                    {editingName ? (
                      <div className="flex gap-2">
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
                      <button onClick={handleSaveName} disabled={saving} className="px-2 py-1 bg-green-600 text-white text-xs font-mono disabled:opacity-50">OK</button>
                      <button onClick={() => { setEditingName(false); setName(user?.name || ''); }} className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs font-mono">x</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setEditingName(true)} className="text-sm font-mono text-zinc-200 hover:text-green-400">{user?.name || 'user'}</button>
                        <p className="text-xs font-mono text-zinc-600">{user?.email}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800 flex gap-4 text-xs font-mono">
                  <span className="text-zinc-500">plan: <span className="text-green-400">{user?.plan}</span></span>
                  <span className="text-zinc-500">verified: <span className={user?.isEmailVerified ? 'text-green-400' : 'text-yellow-400'}>{user?.isEmailVerified ? 'yes' : 'no'}</span></span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-zinc-300 mb-2">Theme</h2>
              <div className="rounded bg-zinc-900 border border-zinc-800 p-3 flex gap-2">
                {[{ id: 'light' as const, label: 'light', icon: Sun }, { id: 'dark' as const, label: 'dark', icon: Moon }, { id: 'system' as const, label: 'auto', icon: Monitor }].map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded border font-mono text-xs ${theme === t.id ? 'border-green-500 text-green-400 bg-green-500/5' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                    <t.icon size={14} />{t.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-zinc-300 mb-2">Notifications</h2>
              <div className="rounded bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800">
                {Object.entries({ studyReminders: 'study_reminders', streakAlerts: 'streak_alerts', weeklyReports: 'weekly_reports', marketingEmails: 'marketing_emails' }).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs font-mono text-zinc-400">{label}</span>
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))} className="sr-only peer" />
                      <div className="w-8 h-4 rounded-sm bg-zinc-700 peer-checked:bg-green-600 transition-colors" />
                      <div className="absolute top-0 left-0 w-4 h-4 rounded-sm bg-zinc-400 peer-checked:bg-green-400 peer-checked:translate-x-4 transition-all" />
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-zinc-300 mb-2">Privacy & Security</h2>
              <div className="rounded bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800">
                <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800/50"><span className="text-xs font-mono text-zinc-400">change_password</span><span className="text-zinc-600 font-mono text-xs">→</span></button>
                <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800/50"><span className="text-xs font-mono text-zinc-400">data_export</span><span className="text-zinc-600 font-mono text-xs">→</span></button>
              </div>
            </section>

            <section>
              <div className="rounded bg-red-950/20 border border-red-500/30 divide-y divide-red-500/10">
                {showDeleteConfirm ? (
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-mono text-red-400">rm -rf /account --force?</p>
                    <div className="flex gap-2">
                      <button className="flex-1 py-1.5 rounded bg-red-600 text-white text-xs font-mono">DELETE</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 rounded bg-zinc-800 text-zinc-400 text-xs font-mono">cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-red-500/10"><span className="text-xs font-mono text-red-400">delete_account</span><span className="text-red-500/50 font-mono text-xs">→</span></button>
                )}
                <button onClick={onLogout} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-red-500/10"><span className="text-xs font-mono text-red-400">logout</span><span className="text-red-500/50 font-mono text-xs">→</span></button>
              </div>
            </section>
          </div>
          {showAvatarPicker && (
            <AvatarPicker
              rounded={isAndroid ? 'rounded-2xl' : isIOS ? 'rounded-xl' : isWindows ? 'rounded' : 'rounded-xl'}
              buttonStyle={isLinux ? 'linux' : isAndroid ? 'android' : isWindows ? 'windows' : isMacOS ? 'macos' : 'default'}
              accentColor={isLinux ? 'green' : isWindows ? 'blue' : isAndroid ? 'purple' : 'primary'}
            />
          )}
        </div>
      )}

      {/* App version */}
      <div className="text-center pt-4">
        <p className="text-xs text-zinc-600">
          AuraMind v2.0 · <span style={{ color: accentColor }}>{platformName}</span>
        </p>
      </div>
    </div>
  );
};

export default Settings;
