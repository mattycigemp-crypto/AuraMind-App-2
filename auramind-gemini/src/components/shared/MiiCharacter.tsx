import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

interface MiiCharacterProps {
  seed: string;
  size?: number;
  className?: string;
  dicebear?: DicebearOptions;
}

const MiiCharacter: React.FC<MiiCharacterProps> = ({ seed, size = 48, className = '', dicebear }) => {
  const preset = CHARACTER_PRESETS.find(c => c.seed === seed);

  const svgUri = useMemo(() => {
    const o = dicebear ?? preset?.dicebear;
    const isKurt = (o?.accessories ?? 'kurt') === 'kurt';
    const opts: Record<string, any> = {
      seed,
      backgroundColor: ['transparent'],
      accessories: [o?.accessories ?? 'kurt'],
      accessoriesColor: [o?.accessoriesColor ?? '262e33'],
      ...(isKurt ? {} : { accessoriesProbability: 100 }),
      clothing: [o?.clothing ?? 'shirtCrewNeck'],
      clothesColor: [o?.clothesColor ?? 'e6e6e6'],
      eyes: [o?.eyes ?? 'default'],
      eyebrows: [o?.eyebrows ?? 'defaultNatural'],
      hairColor: [o?.hairColor ?? '2c1b18'],
      mouth: [o?.mouth ?? 'smile'],
      skinColor: [o?.skinColor ?? 'fd9841'],
      top: [o?.top ?? 'shortFlat'],
      hatColor: [o?.hatColor ?? '262e33'],
    };
    if (o?.facialHair) {
      opts.facialHair = [o.facialHair];
      opts.facialHairColor = [o.facialHairColor ?? '2c1b18'];
      opts.facialHairProbability = 100;
    }
    const avatar = createAvatar(avataaars, opts as any);
    const svg = avatar.toString();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [seed, preset, dicebear]);

  const name = dicebear ? 'Custom' : (preset?.name ?? 'Character');

  return (
    <img
      src={svgUri}
      alt={name}
      className={`block ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export interface DicebearOptions {
  accessories: string;
  accessoriesColor: string;
  clothing: string;
  clothesColor: string;
  eyes: string;
  eyebrows: string;
  facialHair?: string;
  facialHairColor: string;
  hairColor: string;
  hatColor: string;
  mouth: string;
  skinColor: string;
  top: string;
}

export interface CharacterPreset {
  id: string;
  name: string;
  seed: string;
  accentColor: string;
  description: string;
  dicebear: DicebearOptions;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'matt', name: 'Atlas', seed: 'Atlas',
    accentColor: '#FF6B35', description: 'Champion',
    dicebear: { accessories: 'kurt', accessoriesColor: '3c4f5c', clothing: 'shirtVNeck', clothesColor: 'ff6b35', eyes: 'default', eyebrows: 'defaultNatural', hairColor: '2c1b18', hatColor: '262e33', mouth: 'serious', skinColor: 'fd9841', top: 'shortFlat', facialHairColor: '2c1b18' }
  },
  {
    id: 'elisa', name: 'Riven', seed: 'Riven',
    accentColor: '#E84393', description: 'Strategist',
    dicebear: { accessories: 'prescription02', accessoriesColor: 'ff488e', clothing: 'blazerAndSweater', clothesColor: 'ff488e', eyes: 'default', eyebrows: 'defaultNatural', hairColor: '724133', hatColor: 'ffffff', mouth: 'smile', skinColor: 'ffdbb4', top: 'bigHair', facialHairColor: '724133' }
  },
  {
    id: 'sakura', name: 'Kaida', seed: 'Kaida',
    accentColor: '#D63031', description: 'Trailblazer',
    dicebear: { accessories: 'kurt', accessoriesColor: '3c4f5c', clothing: 'hoodie', clothesColor: 'ff5c5c', eyes: 'happy', eyebrows: 'raisedExcitedNatural', hairColor: 'b58143', hatColor: '3c4f5c', mouth: 'smile', skinColor: 'f8d25c', top: 'straightAndStrand', facialHairColor: 'b58143' }
  },
  {
    id: 'sarah', name: 'Seren', seed: 'Seren',
    accentColor: '#0984E3', description: 'Mentor',
    dicebear: { accessories: 'kurt', accessoriesColor: '25557c', clothing: 'blazerAndShirt', clothesColor: '5199e4', eyes: 'default', eyebrows: 'defaultNatural', facialHairColor: '724133', hairColor: '724133', hatColor: '25557c', mouth: 'smile', skinColor: 'edb98a', top: 'longButNotTooLong' }
  },
  {
    id: 'akira', name: 'Zephyr', seed: 'Zephyr',
    accentColor: '#6C5CE7', description: 'Visionary',
    dicebear: { accessories: 'kurt', accessoriesColor: '3c4f5c', clothing: 'shirtCrewNeck', clothesColor: '6c5ce7', eyes: 'default', eyebrows: 'defaultNatural', facialHairColor: '2c1b18', hairColor: '2c1b18', hatColor: '3c4f5c', mouth: 'smile', skinColor: 'ae5d29', top: 'shortCurly' }
  },
  {
    id: 'anna', name: 'Nova', seed: 'Nova',
    accentColor: '#FDCB6E', description: 'Scholar',
    dicebear: { accessories: 'round', accessoriesColor: 'ffffb1', clothing: 'shirtScoopNeck', clothesColor: 'ffffb1', eyes: 'default', eyebrows: 'defaultNatural', facialHairColor: '724133', hairColor: '724133', hatColor: 'ffffb1', mouth: 'smile', skinColor: 'ffdbb4', top: 'miaWallace' }
  },
  {
    id: 'david', name: 'Orion', seed: 'Orion',
    accentColor: '#00B894', description: 'Pathfinder',
    dicebear: { accessories: 'sunglasses', accessoriesColor: '3c4f5c', clothing: 'collarAndSweater', clothesColor: 'a7ffc4', eyes: 'default', eyebrows: 'defaultNatural', facialHair: 'beardLight', facialHairColor: '4a312c', hairColor: '4a312c', hatColor: '3c4f5c', mouth: 'serious', skinColor: 'd08b5b', top: 'shortCurly' }
  },
  {
    id: 'emma', name: 'Lyra', seed: 'Lyra',
    accentColor: '#A29BFE', description: 'Sage',
    dicebear: { accessories: 'kurt', accessoriesColor: '929598', clothing: 'blazerAndSweater', clothesColor: 'a29bfe', eyes: 'default', eyebrows: 'defaultNatural', facialHairColor: 'd6b370', hairColor: 'd6b370', hatColor: 'e6e6e6', mouth: 'smile', skinColor: 'f8d25c', top: 'curvy' }
  },
  {
    id: 'luca', name: 'Cinder', seed: 'Cinder',
    accentColor: '#E17055', description: 'Artisan',
    dicebear: { accessories: 'kurt', accessoriesColor: '3c4f5c', clothing: 'graphicShirt', clothesColor: 'ffafb9', eyes: 'happy', eyebrows: 'raisedExcitedNatural', facialHairColor: 'c93305', hairColor: 'c93305', hatColor: '3c4f5c', mouth: 'bigSmile', skinColor: 'edb98a', top: 'theCaesarAndSidePart' }
  },
  {
    id: 'naomi', name: 'Vesper', seed: 'Vesper',
    accentColor: '#00CEC9', description: 'Thinker',
    dicebear: { accessories: 'prescription01', accessoriesColor: '65c9ff', clothing: 'shirtScoopNeck', clothesColor: '65c9ff', eyes: 'default', eyebrows: 'defaultNatural', facialHairColor: '2c1b18', hairColor: '2c1b18', hatColor: '65c9ff', mouth: 'smile', skinColor: 'ffdbb4', top: 'straight02' }
  },
  {
    id: 'saburo', name: 'Fenrir', seed: 'Fenrir',
    accentColor: '#55EFC4', description: 'Pioneer',
    dicebear: { accessories: 'kurt', accessoriesColor: '25557c', clothing: 'hoodie', clothesColor: '55efc4', eyes: 'default', eyebrows: 'defaultNatural', facialHair: 'beardMedium', facialHairColor: 'a55728', hairColor: 'a55728', hatColor: '25557c', mouth: 'smile', skinColor: 'ae5d29', top: 'shortWaved' }
  },
  {
    id: 'takumi', name: 'Kael', seed: 'Kael',
    accentColor: '#74B9FF', description: 'Architect',
    dicebear: { accessories: 'kurt', accessoriesColor: '25557c', clothing: 'blazerAndShirt', clothesColor: 'b1e2ff', eyes: 'default', eyebrows: 'defaultNatural', facialHairColor: '2c1b18', hairColor: '2c1b18', hatColor: '25557c', mouth: 'smile', skinColor: '614335', top: 'shortCurly' }
  },
  {
    id: 'yoshi', name: 'Sol', seed: 'Sol',
    accentColor: '#F8A5C2', description: 'Guide',
    dicebear: { accessories: 'kurt', accessoriesColor: 'e6e6e6', clothing: 'shirtCrewNeck', clothesColor: 'f8a5c2', eyes: 'happy', eyebrows: 'raisedExcitedNatural', facialHairColor: 'd6b370', hairColor: 'd6b370', hatColor: 'e6e6e6', mouth: 'smile', skinColor: 'edb98a', top: 'bob' }
  },
  {
    id: 'victor', name: 'Ronan', seed: 'Ronan',
    accentColor: '#FAB1A0', description: 'Guardian',
    dicebear: { accessories: 'kurt', accessoriesColor: '929598', clothing: 'collarAndSweater', clothesColor: 'fab1a0', eyes: 'default', eyebrows: 'defaultNatural', facialHair: 'beardMajestic', facialHairColor: 'b58143', hairColor: 'b58143', hatColor: '929598', mouth: 'serious', skinColor: 'fd9841', top: 'shortWaved' }
  },
  {
    id: 'pierre', name: 'Ember', seed: 'Ember',
    accentColor: '#81ECEC', description: 'Prodigy',
    dicebear: { accessories: 'kurt', accessoriesColor: '3c4f5c', clothing: 'shirtVNeck', clothesColor: '81ecec', eyes: 'default', eyebrows: 'defaultNatural', facialHairColor: 'c93305', hairColor: 'c93305', hatColor: '3c4f5c', mouth: 'smile', skinColor: 'ffdbb4', top: 'theCaesar' }
  },
  {
    id: 'sophia', name: 'Wren', seed: 'Wren',
    accentColor: '#B2BEC3', description: 'Dreamer',
    dicebear: { accessories: 'kurt', accessoriesColor: '929598', clothing: 'shirtScoopNeck', clothesColor: 'e6e6e6', eyes: 'default', eyebrows: 'defaultNatural', facialHairColor: 'd6b370', hairColor: 'd6b370', hatColor: '929598', mouth: 'smile', skinColor: 'f8d25c', top: 'froBand' }
  },
];

export default MiiCharacter;


