import React, { useEffect, useState } from 'react';
import { QuoteIcon as Quote, SparklesIcon as Sparkles } from '../icons/CustomIcons';
import GlassCard from '../shared/GlassCard';
import { quotesService } from '../../services/quotes/quotesService';

const QuoteOfTheDay: React.FC = () => {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await quotesService.getQuoteOfTheDay();
        if (data) {
          setQuoteData(data);
        } else {
          setError('Could not fetch quote of the day');
        }
      } catch (err) {
        setError('Failed to load quote of the day');
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
            <Quote className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mb-2 animate-pulse" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-32 animate-pulse" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error || !quoteData) {
    return (
      <GlassCard variant="neural" className="border-primary/25">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Quote className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Unable to load quote</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
      <GlassCard variant="neural" className="border-primary/25">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Quote of the Day
            </h3>
          </div>
          
          <blockquote className="text-lg text-zinc-900 dark:text-white font-medium mb-3 leading-relaxed">
            "{quoteData.content}"
          </blockquote>
          
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            — {quoteData.author}
          </p>
          
{quoteData.tags && quoteData.tags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-wrap gap-2">
                {quoteData.tags.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default QuoteOfTheDay;



