import React, { useEffect, useState } from 'react';
import { BookOpenIcon as BookOpen, Volume2Icon as Volume2 } from '../icons/CustomIcons';
import GlassCard from '../shared/GlassCard';
import { wordnikService } from '../../services/wordnik/wordnikService';
import type { WordOfTheDay as WordData } from '../../services/wordnik/wordnikService';

const stripHtml = (text: string | undefined | null): string => {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '');
};

const WordOfTheDay: React.FC = () => {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await wordnikService.getWordOfTheDay();
        if (data) {
          setWordData(data);
        } else {
          setError('Could not fetch word of the day');
        }
      } catch (err) {
        setError('Failed to load word of the day');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <GlassCard variant="neural" className="border-primary/25">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mb-2 animate-pulse" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-32 animate-pulse" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error || !wordData) {
    return (
      <GlassCard variant="neural" className="border-primary/25">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Unable to load word</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const pronunciation = wordData.pronunciations?.find(p => p.rawType === 'ahd' || p.rawType === 'arpabet') || wordData.pronunciations?.[0];
  const synonyms = wordData.relatedWords?.find(r => r.relationshipType === 'synonym');
  const antonyms = wordData.relatedWords?.find(r => r.relationshipType === 'antonym');

  return (
      <GlassCard variant="neural" className="border-primary/25">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Word of the Day
            </h3>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap mb-4">
            <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {wordData.word}
            </span>
{pronunciation && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400 italic font-medium flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                /{pronunciation.raw}/
              </span>
            )}
          </div>

            {wordData.definitions && wordData.definitions.length > 0 && (
            <div className="space-y-2 mb-4">
              {wordData.definitions.slice(0, 2).map((def, i) => (
                <p key={i} className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed pl-3 border-l-2 border-primary/30">
                  <span className="text-[10px] uppercase tracking-wider text-primary/50 mr-2 font-black">
                    {def.sourceDictionary ?? 'definition'}
                  </span>
                  {stripHtml(def.text)}
                </p>
              ))}
            </div>
          )}

{wordData.examples && wordData.examples.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                "{stripHtml(wordData.examples[0].text)}"
              </p>
            </div>
          )}

          {(synonyms || antonyms) && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              {synonyms && synonyms.words.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400/60 font-black text-[10px] uppercase tracking-widest">syn</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{synonyms.words.slice(0, 4).join(', ')}</span>
                </div>
              )}
              {antonyms && antonyms.words.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-rose-400/60 font-black text-[10px] uppercase tracking-widest">ant</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{antonyms.words.slice(0, 4).join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default WordOfTheDay;



