import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpenIcon as BookOpen,
  PlayIcon as Play,
  CheckIcon as Check,
  CodeIcon as Code,
  ChevronDownIcon as ChevronDown,
  ChevronRightIcon as ChevronRight,
  LightbulbIcon as Lightbulb,
  AlertTriangleIcon as AlertTriangle,
  SearchIcon as Search,
} from '../icons/CustomIcons';
import { tutorialData, quickStartSteps, TutorialSection, TutorialSubsection } from '../../data/tutorialData';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BookOpen, Play,
};

const TutorialPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(tutorialData[0].id);
  const [expandedSubsections, setExpandedSubsections] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedSubsections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const currentSection = tutorialData.find(s => s.id === activeTab) || tutorialData[0];
  const SectionIcon = iconMap[currentSection.icon] || BookOpen;

  const filteredSubsections = currentSection.subsections.filter(sub =>
    !searchQuery ||
    sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={24} className="text-violet-400" />
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Tutorial</h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Learn how to use AuraMind, set it up, and explore every feature</p>
      </motion.div>

      {/* Quick start checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-6 border-2 border-violet-300 dark:border-violet-800/30 bg-violet-50 dark:bg-violet-950/20"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Play size={18} className="text-violet-400" />
          Quick Start
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickStartSteps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3 p-3 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <div className="w-7 h-7 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">{step.title}</div>
                <div className="text-xs text-zinc-500 mt-1">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search tutorial content..."
          className="w-full pl-12 pr-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all"
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {tutorialData.map(section => {
          const Icon = iconMap[section.icon] || BookOpen;
          const isActive = activeTab === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
                isActive
                  ? 'text-violet-400 border-violet-500 bg-violet-600/5'
                  : 'text-zinc-600 dark:text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon size={16} />
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {filteredSubsections.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-300 dark:border-zinc-800">
            <Search size={40} className="text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No results</h3>
            <p className="text-zinc-500">Try a different search term</p>
          </div>
        ) : (
          filteredSubsections.map((subsection, si) => (
            <TutorialSubsectionCard
              key={subsection.id}
              subsection={subsection}
              isExpanded={!!expandedSubsections[subsection.id]}
              onToggle={() => toggleExpand(subsection.id)}
              searchQuery={searchQuery}
              copiedCode={copiedCode}
              onCopyCode={copyToClipboard}
            />
          ))
        )}
      </div>

      {/* Keyboard hint */}
      <div className="text-center text-xs text-zinc-600 py-8">
        Press <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-700 dark:text-zinc-400">Ctrl+K</kbd> to open the command palette
      </div>
    </div>
  );
};

interface TutorialSubsectionCardProps {
  subsection: TutorialSubsection;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
  copiedCode: string | null;
  onCopyCode: (code: string, id: string) => void;
}

const TutorialSubsectionCard: React.FC<TutorialSubsectionCardProps> = ({
  subsection,
  isExpanded,
  onToggle,
  searchQuery,
  copiedCode,
  onCopyCode,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 overflow-hidden"
    >
      {/* Header - clickable to expand */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-violet-600/10 text-violet-400">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">{subsection.title}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{subsection.steps.length} steps</p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full transition-colors ${isExpanded ? 'bg-violet-500' : 'bg-zinc-700'}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-6 border-t border-zinc-200 dark:border-zinc-800 pt-4">
              {subsection.steps.map((step, i) => (
                <div key={step.id} className="space-y-3">
                  {/* Step header */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
                        {step.title}
                      </h4>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="ml-9 space-y-3">
                    <div className="prose-sm max-w-none text-zinc-700 dark:text-zinc-300 prose-headings:text-zinc-900 dark:prose-headings:text-white prose-headings:font-bold prose-headings:mt-5 prose-headings:mb-2 prose-a:text-violet-400 prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-strong:text-white prose-li:my-0.5 prose-td:text-zinc-300 prose-th:text-zinc-200 prose-table:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {step.content}
                      </ReactMarkdown>
                    </div>

                    {/* Code block */}
                    {step.code && (
                      <div className="relative group">
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-sm text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{step.code}</pre>
                        </div>
                        <button
                          onClick={() => onCopyCode(step.code!, step.id)}
                          className="absolute top-3 right-3 p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          {copiedCode === step.id ? <Check size={14} /> : <Code size={14} />}
                        </button>
                      </div>
                    )}

                    {/* Tip */}
                    {step.tip && (
                      <div className="flex items-start gap-2 p-3 bg-violet-950/30 border border-violet-900/30">
                        <Lightbulb size={14} className="text-violet-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-violet-300">{step.tip}</span>
                      </div>
                    )}

                    {/* Warning */}
                    {step.warning && (
                      <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-900/30">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-amber-300">{step.warning}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TutorialPage;