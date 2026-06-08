import React from 'react';
import { ClockIcon as Clock, ConstructionIcon as Construction, SparklesIcon as Sparkles } from '../icons/CustomIcons';
import GlassCard from './GlassCard';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: 'clock' | 'construction' | 'sparkles';
  estimated?: string;
}

const icons = {
  clock: Clock,
  construction: Construction,
  sparkles: Sparkles,
};

export default function ComingSoon({ title, description, icon = 'construction', estimated }: ComingSoonProps) {
  const Icon = icons[icon];

return (
    <div className="my-6">
      <GlassCard variant="neural" className="max-w-2xl mx-auto text-center">
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary mb-3">{title}</h1>
            <p className="text-zinc-400 text-lg max-w-md">
              {description || 'This feature is currently in development.'}
            </p>
          </div>
          {estimated && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Estimated completion: {estimated}</span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}



