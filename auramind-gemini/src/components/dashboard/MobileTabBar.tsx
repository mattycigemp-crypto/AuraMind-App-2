import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  HomeIcon as Home,
  BookOpenIcon as BookOpen,
  BotIcon as Bot,
  SparklesIcon as Sparkles,
  TargetIcon as Target,
  BrainCircuitIcon as BrainCircuit,
  UsersIcon as Users,
  SettingsIcon as Settings,
  PlusIcon as Plus,
} from '../icons/CustomIcons';
import { usePlatform, useHaptics } from '../../hooks/useNative';

interface MobileTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  badgeCounts?: Record<string, number>;
}

const tabs = [
  { id: 'dashboard', label: 'Home', icon: Home, badge: 'dashboard' },
  { id: 'cards', label: 'Decks', icon: BookOpen, badge: 'cards' },
  { id: 'chat', label: 'AI Chat', icon: Bot, badge: null },
  { id: 'generator', label: 'Generate', icon: Sparkles, badge: null },
  { id: 'paths', label: 'Paths', icon: Target, badge: null },
];

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  className,
  badgeCounts,
}) => {
  const platform = usePlatform();
  const { impact, selection } = useHaptics();
  const tabRefs = useRef<HTMLButtonElement[]>([]);

  const isMobile = platform === 'ios' || platform === 'android';

  useEffect(() => {
    if (!isMobile) return;
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    if (activeIndex !== -1 && tabRefs.current[activeIndex]) {
      tabRefs.current[activeIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab, isMobile]);

  if (!isMobile) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-zinc-950/98 dark:bg-zinc-950/98 backdrop-blur-xl border-t border-zinc-800/50',
        'safe-area-bottom',
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-[500px]">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const badgeCount = tab.badge && badgeCounts?.[tab.badge];
            
            return (
              <motion.button
                key={tab.id}
                ref={(el) => { tabRefs.current[index] = el; }}
                onClick={() => {
                  selection();
                  onTabChange(tab.id);
                }}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300',
                  'min-w-[64px]',
                  isActive
                    ? 'text-primary'
                    : 'text-zinc-500 hover:text-zinc-300 dark:hover:text-zinc-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
                )}
                style={{ touchAction: 'manipulation' }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative flex items-center justify-center">
                  <tab.icon
                    size={isActive ? 26 : 24}
                    className={cn(
                      'transition-all duration-300',
                      isActive ? 'fill-current' : ''
                    )}
                    aria-hidden="true"
                  />
                  {badgeCount && badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center"
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </motion.span>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-wider transition-all duration-300',
                  isActive ? 'text-primary opacity-100' : 'text-zinc-500 opacity-60'
                )}>
                  {tab.label}
                </span>
                
                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: '60%', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
        
        {/* Floating action button for quick actions */}
        <div className="px-4 pb-4">
          <button
            onClick={() => {
              impact('medium');
              onTabChange('generator');
            }}
            className={cn(
              'w-full h-12 rounded-xl font-bold text-sm uppercase tracking-wider',
              'bg-gradient-to-r from-primary to-cosmic text-black',
              'shadow-[0_8px_32px_rgba(168,85,247,0.3)]',
              'active:scale-[0.98] transition-transform',
              'flex items-center justify-center gap-2'
            )}
            style={{ touchAction: 'manipulation' }}
          >
            <Plus size={18} />
            Quick Create
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileTabBar;