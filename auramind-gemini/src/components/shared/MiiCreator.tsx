import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MiiCharacter, { DicebearOptions } from './MiiCharacter';
import { XIcon as X, CheckIcon as Check, UserIcon as User } from '../icons/CustomIcons';

const SKIN_COLORS = ['614335', 'ae5d29', 'd08b5b', 'edb98a', 'fd9841', 'f8d25c', 'ffdbb4'];
const HAIR_COLORS = ['0e0e0e', '2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'c93305', 'd6b370', 'fd9841', 'ffffff'];
const CLOTHING_COLORS = ['262e33', 'e6e6e6', 'ff6b35', 'ff5c5c', 'ff488e', 'f8a5c2', 'ffffb1', 'a7ffc4', '55efc4', '81ecec', '65c9ff', '5199e4', 'b1e2ff', 'a29bfe', '6c5ce7', 'fab1a0'];

const TOPS = ['shortFlat', 'shortCurly', 'shortWaved', 'theCaesar', 'theCaesarAndSidePart', 'bob', 'bigHair', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'froBand', 'longButNotTooLong', 'miaWallace', 'shavedSides', 'straight02', 'straight01', 'straightAndStrand', 'dreads01', 'dreads02', 'frizzle', 'shaggy', 'shaggyMullet', 'sides'];
const EYES = ['default', 'happy', 'side', 'squint', 'surprised', 'wink', 'winkWacky', 'cry', 'eyeRoll', 'xDown', 'closed'];
const EYEBROWS = ['defaultNatural', 'angry', 'angryNatural', 'concerned', 'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural', 'frownNatural'];
const MOUTHS = ['smile', 'serious', 'tongue', 'screamOpen', 'concerned', 'disbelief', 'eating', 'grimace', 'sad', 'twinkle'];
const FACIAL_HAIRS = ['beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum'];
const CLOTHING = ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'];
const ACCESSORIES = ['kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers', 'eyepatch'];

const LABELS: Record<string, string> = {
  shortFlat: 'Short Flat', shortCurly: 'Short Curly', shortWaved: 'Short Waved', theCaesar: 'Caesar', theCaesarAndSidePart: 'Caesar Side',
  bob: 'Bob', bigHair: 'Big Hair', bun: 'Bun', curly: 'Curly', curvy: 'Curvy', dreads: 'Dreads', frida: 'Frida', fro: 'Fro', froBand: 'Fro Band',
  longButNotTooLong: 'Long', miaWallace: 'Mia Wallace', shavedSides: 'Shaved Sides', straight02: 'Straight', 'straight01': 'Straight Long',
  straightAndStrand: 'Straight Strand', dreads01: 'Dreads 1', dreads02: 'Dreads 2', frizzle: 'Frizzle', shaggy: 'Shaggy', shaggyMullet: 'Shaggy Mullet', sides: 'Sides',
  default: 'Default', happy: 'Happy', side: 'Side', squint: 'Squint', surprised: 'Surprised', wink: 'Wink', winkWacky: 'Wink Wacky',
  cry: 'Cry', eyeRoll: 'Eye Roll', xDown: 'X Down', closed: 'Closed',
  defaultNatural: 'Natural', angry: 'Angry', angryNatural: 'Angry Natural', concerned: 'Concerned',
  raisedExcited: 'Excited', raisedExcitedNatural: 'Excited Natural', sadConcerned: 'Sad', sadConcernedNatural: 'Sad Natural',
  unibrowNatural: 'Unibrow', upDown: 'Up Down', upDownNatural: 'Up Down Natural', frownNatural: 'Frown',
  smile: 'Smile', bigSmile: 'Big Smile', serious: 'Serious', tongue: 'Tongue', screamOpen: 'Scream',
  disbelief: 'Disbelief', eating: 'Eating', grimace: 'Grimace', sad: 'Sad', twinkle: 'Twinkle',
  beardLight: 'Light Beard', beardMajestic: 'Majestic Beard', beardMedium: 'Medium Beard', moustacheFancy: 'Fancy Stache', moustacheMagnum: 'Magnum Stache',
  blazerAndShirt: 'Blazer + Shirt', blazerAndSweater: 'Blazer + Sweater', collarAndSweater: 'Collar + Sweater', graphicShirt: 'Graphic Tee',
  hoodie: 'Hoodie', overall: 'Overalls', shirtCrewNeck: 'Crew Neck', shirtScoopNeck: 'Scoop Neck', shirtVNeck: 'V-Neck',
  kurt: 'None', prescription01: 'Glasses 1', prescription02: 'Glasses 2', round: 'Round Glasses', sunglasses: 'Sunglasses', wayfarers: 'Wayfarers', eyepatch: 'Eyepatch',
};

const COLOR_LABELS: Record<string, string> = {
  '614335': 'Dark Brown', ae5d29: 'Tan', d08b5b: 'Warm Tan', edb98a: 'Fair', f8d25c: 'Golden', ffdbb4: 'Pale',
  '0e0e0e': 'Black', '2c1b18': 'Dark Brown', '4a312c': 'Brown', '724133': 'Auburn', a55728: 'Copper', b58143: 'Golden', c93305: 'Red', d6b370: 'Blonde', ffffff: 'White',
  '262e33': 'Dark', e6e6e6: 'Gray', ff6b35: 'Orange', ff5c5c: 'Red', ff488e: 'Pink', f8a5c2: 'Rose', ffffb1: 'Yellow', a7ffc4: 'Mint', '55efc4': 'Teal', '81ecec': 'Cyan', '65c9ff': 'Sky', '5199e4': 'Blue', b1e2ff: 'Light Blue', a29bfe: 'Purple', '6c5ce7': 'Violet', fab1a0: 'Peach',
};

const SKIN_LABELS: Record<string, string> = {
  '614335': 'Dark Brown', ae5d29: 'Tan', d08b5b: 'Warm Tan', edb98a: 'Fair', fd9841: 'Light', f8d25c: 'Golden', ffdbb4: 'Pale',
};

const HAIR_COLOR_LABELS: Record<string, string> = {
  '0e0e0e': 'Black', '2c1b18': 'Dark Brown', '4a312c': 'Brown', '724133': 'Auburn', a55728: 'Copper', b58143: 'Golden', c93305: 'Red', d6b370: 'Blonde', fd9841: 'Strawberry', ffffff: 'White',
};

type Category = 'face' | 'hair' | 'facialHair' | 'outfit' | 'accessories';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'face', label: 'Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'facialHair', label: 'Facial Hair' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'accessories', label: 'Accessories' },
];

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  preview: React.ReactNode;
  label: string;
}

const OptionCard: React.FC<OptionCardProps> = ({ selected, onClick, preview, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
      selected
        ? 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-500/10'
        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900'
    }`}
  >
    {preview}
    <span className={`text-[10px] font-bold leading-tight text-center ${selected ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-500'}`}>
      {label}
    </span>
  </button>
);

interface ColorSwatchProps {
  color: string;
  selected: boolean;
  onClick: () => void;
  label: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, selected, onClick, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={`relative flex items-center justify-center p-2 rounded-xl border-2 transition-all ${
      selected
        ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10'
        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
    }`}
  >
    <div
      className="w-8 h-8 rounded-full border border-white/10 shadow-inner"
      style={{ backgroundColor: `#${color}` }}
    />
    {selected && (
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
        <Check size={8} className="text-white" />
      </div>
    )}
  </button>
);

interface MiiCreatorProps {
  initialOptions: DicebearOptions;
  initialName?: string;
  onSave: (name: string, options: DicebearOptions) => void;
  onClose: () => void;
}

const MiiCreator: React.FC<MiiCreatorProps> = ({ initialOptions, initialName = '', onSave, onClose }) => {
  const [options, setOptions] = useState<DicebearOptions>(initialOptions);
  const [charName, setCharName] = useState(initialName);
  const [category, setCategory] = useState<Category>('face');

  const update = (partial: Partial<DicebearOptions>) => {
    setOptions(prev => ({ ...prev, ...partial }));
  };

  const renderPreview = (overrides: Record<string, any>) => (
    <MiiCharacter
      seed="creator"
      size={36}
      dicebear={{ ...options, ...overrides }}
    />
  );

  const isSkin = (v: string) => SKIN_COLORS.includes(v);
  const isHairColor = (v: string) => HAIR_COLORS.includes(v);
  const isClothesColor = (v: string) => CLOTHING_COLORS.includes(v);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-800">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-zinc-400" />
              </div>
              <input
                type="text"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="Name your character..."
                maxLength={20}
                className="bg-transparent text-lg font-bold text-zinc-100 placeholder-zinc-600 focus:outline-none border-b border-transparent focus:border-violet-500 transition-colors w-full min-w-0"
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Preview Panel */}
          <div className="md:w-64 p-6 flex flex-col items-center justify-center bg-zinc-900/50 border-b md:border-b-0 md:border-r border-zinc-800">
            <div className="relative mb-4">
              <div
                className="w-44 h-44 rounded-full flex items-center justify-center overflow-hidden shadow-xl"
                style={{ backgroundColor: `#${options.skinColor}40` }}
              >
                <MiiCharacter seed="creator" size={130} dicebear={options} />
              </div>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-bold">Your Character</p>
          </div>

          {/* Options Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Category Tabs */}
            <div className="flex gap-0.5 p-3 border-b border-zinc-800 bg-zinc-900/80 overflow-x-auto flex-shrink-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    category === cat.id
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Options Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  {/* Face Category */}
                  {category === 'face' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Skin Color</label>
                        <div className="grid grid-cols-7 gap-2">
                          {SKIN_COLORS.map(c => (
                            <ColorSwatch key={c} color={c} selected={options.skinColor === c} onClick={() => update({ skinColor: c })} label={SKIN_LABELS[c] || c} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Eyes</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {EYES.map(e => (
                            <OptionCard key={e} selected={options.eyes === e} onClick={() => update({ eyes: e })} preview={renderPreview({ eyes: e })} label={LABELS[e] || e} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Eyebrows</label>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {EYEBROWS.map(e => (
                            <OptionCard key={e} selected={options.eyebrows === e} onClick={() => update({ eyebrows: e })} preview={renderPreview({ eyebrows: e })} label={LABELS[e] || e} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Mouth</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {MOUTHS.map(m => (
                            <OptionCard key={m} selected={options.mouth === m} onClick={() => update({ mouth: m })} preview={renderPreview({ mouth: m })} label={LABELS[m] || m} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Hair Category */}
                  {category === 'hair' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Hairstyle</label>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {TOPS.map(t => (
                            <OptionCard key={t} selected={options.top === t} onClick={() => update({ top: t })} preview={renderPreview({ top: t })} label={LABELS[t] || t} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Hair Color</label>
                        <div className="grid grid-cols-5 gap-2">
                          {HAIR_COLORS.map(c => (
                            <ColorSwatch key={c} color={c} selected={options.hairColor === c} onClick={() => update({ hairColor: c })} label={HAIR_COLOR_LABELS[c] || c} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Facial Hair Category */}
                  {category === 'facialHair' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Style</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          <OptionCard selected={!options.facialHair} onClick={() => {
                            setOptions(prev => ({ ...prev, facialHair: undefined }));
                          }} preview={renderPreview({})} label="None" />
                          {FACIAL_HAIRS.map(f => (
                            <OptionCard key={f} selected={options.facialHair === f} onClick={() => update({ facialHair: f, facialHairColor: options.facialHairColor || options.hairColor })} preview={renderPreview({ facialHair: f, facialHairColor: options.facialHairColor || options.hairColor })} label={LABELS[f] || f} />
                          ))}
                        </div>
                      </div>
                      {options.facialHair && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Facial Hair Color</label>
                          <div className="grid grid-cols-5 gap-2">
                            {HAIR_COLORS.map(c => (
                              <ColorSwatch key={c} color={c} selected={options.facialHairColor === c} onClick={() => update({ facialHairColor: c })} label={HAIR_COLOR_LABELS[c] || c} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Outfit Category */}
                  {category === 'outfit' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Top</label>
                        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                          {CLOTHING.map(c => (
                            <OptionCard key={c} selected={options.clothing === c} onClick={() => update({ clothing: c })} preview={renderPreview({ clothing: c })} label={LABELS[c] || c} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Color</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {CLOTHING_COLORS.map(c => (
                            <ColorSwatch key={c} color={c} selected={options.clothesColor === c} onClick={() => update({ clothesColor: c })} label={COLOR_LABELS[c] || c} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Accessories Category */}
                  {category === 'accessories' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Type</label>
                        <div className="grid grid-cols-4 gap-2">
                          {ACCESSORIES.map(a => (
                            <OptionCard key={a} selected={options.accessories === a} onClick={() => update({ accessories: a })} preview={renderPreview({ accessories: a })} label={LABELS[a] || a} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Color</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {CLOTHING_COLORS.map(c => (
                            <ColorSwatch key={c} color={c} selected={options.accessoriesColor === c} onClick={() => update({ accessoriesColor: c })} label={COLOR_LABELS[c] || c} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800 bg-zinc-900/80">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(charName.trim() || 'Custom', options)}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all flex items-center gap-2"
          >
            <Check size={14} />
            Save Character
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export { DEFAULT_CUSTOM_OPTIONS };

const DEFAULT_CUSTOM_OPTIONS: DicebearOptions = {
  accessories: 'kurt',
  accessoriesColor: '262e33',
  clothing: 'shirtCrewNeck',
  clothesColor: '6c5ce7',
  eyes: 'default',
  eyebrows: 'defaultNatural',
  hairColor: '2c1b18',
  hatColor: '262e33',
  mouth: 'smile',
  skinColor: 'fd9841',
  top: 'shortFlat',
  facialHairColor: '2c1b18',
};

export default MiiCreator;



