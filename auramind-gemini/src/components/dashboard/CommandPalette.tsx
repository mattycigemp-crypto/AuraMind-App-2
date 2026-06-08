import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SearchIcon as Search, CornerDownLeftIcon as CornerDownLeft } from '../../components/icons/CustomIcons';
import { cn } from '../../lib/utils';

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group?: string;
  onSelect: () => void;
};

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
}

export default function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter((i) => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q))
      : items;
    return base.slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        const item = filtered[activeIndex];
        if (!item) return;
        e.preventDefault();
        onOpenChange(false);
        item.onSelect();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, activeIndex, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close command palette"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative mx-auto mt-24 w-[min(720px,calc(100vw-24px))]">
        <div className="rounded-2xl border border-primary/20 bg-zinc-950/95 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-primary/10">
            <Search className="w-4 h-4 text-primary/80 shrink-0" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search decks, pages, actions…"
              className="w-full bg-transparent outline-none text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-600"
            />
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-zinc-500 font-mono-label">
              <CornerDownLeft className="w-3 h-3" aria-hidden />
              Enter
            </span>
          </div>

          <div className="max-h-[420px] overflow-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-zinc-500">
                No matches. Try a different search.
              </div>
            ) : (
              filtered.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onOpenChange(false);
                    item.onSelect();
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 flex items-center justify-between gap-4',
                    idx === activeIndex ? 'bg-primary/10' : 'hover:bg-white/5'
                  )}
                >
<div className="min-w-0">
                      <div className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{item.label}</div>
                      {item.hint && <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{item.hint}</div>}
                    </div>
                    {item.group && (
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-500 font-mono-label shrink-0">
                        {item.group}
                      </span>
                    )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




