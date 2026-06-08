import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSourceDocuments } from '../../contexts/SourceDocumentsContext';
import { SourceDocument } from '../../types';
import {
  FileTextIcon as FileText, XIcon as X, PlusIcon as Plus,
  CheckCircle2Icon as CheckCircle, AlertCircleIcon as AlertCircle,
  Loader2Icon as Loader2, BookOpenIcon as BookOpen,
  SparklesIcon as Sparkles,
  Maximize2Icon as Maximize2, Minimize2Icon as Minimize2,
  Trash2Icon as Trash2
} from '../icons/CustomIcons';

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText size={16} />,
  pptx: <FileText size={16} />,
  text: <FileText size={16} />,
  markdown: <BookOpen size={16} />,
  doc: <FileText size={16} />,
};

const typeColors: Record<string, string> = {
  pdf: 'bg-red-500/10 text-red-400 border-red-500/20',
  pptx: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  text: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  markdown: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  doc: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

interface SourcesPanelProps {
  onGenerateQuiz?: () => void;
  onGenerateFlashcards?: () => void;
  isGenerating?: boolean;
}

const SourcesPanel: React.FC<SourcesPanelProps> = ({ onGenerateQuiz, onGenerateFlashcards, isGenerating }) => {
  const {
    sources, addSource, removeSource, clearSources,
    activeSourceIds, setActiveSourceIds,
    selectAllSources, deselectAllSources,
    totalWordCount, isProcessing,
  } = useSourceDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await addSource(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await addSource(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSource = (id: string) => {
    setActiveSourceIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const formatWordCount = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return `${count}`;
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-2">
        <motion.button
          onClick={() => setIsCollapsed(false)}
          className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/60 text-zinc-400 hover:text-white hover:border-violet-500/30 transition-all"
          title="Show Sources"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FileText size={18} />
          {sources.length > 0 && (
            <span className="block text-[9px] font-black uppercase tracking-widest text-violet-400 mt-1">
              {sources.length}
            </span>
          )}
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      className="w-80 shrink-0 border-l border-zinc-800/50 bg-zinc-950/60 backdrop-blur-xl flex flex-col h-full overflow-hidden"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <FileText size={14} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Sources</h3>
              <p className="text-[9px] text-zinc-500 mt-0.5">
                {sources.length} doc{sources.length !== 1 ? 's' : ''}
                {totalWordCount > 0 && ` · ${formatWordCount(totalWordCount)} words`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => setIsCollapsed(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all"
            >
              <Minimize2 size={14} />
            </motion.button>
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="relative cursor-pointer group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.txt,.md,.doc,.docx"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="border-2 border-dashed border-zinc-800/60 rounded-xl p-4 text-center group-hover:border-violet-500/40 group-hover:bg-violet-500/5 transition-all">
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-violet-400" />
                <span className="text-[10px] text-zinc-400 font-medium">Processing...</span>
              </div>
            ) : (
              <>
                <Plus size={18} className="mx-auto mb-2 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                <p className="text-[10px] text-zinc-500 font-medium">
                  Drop files or <span className="text-violet-400 underline underline-offset-2">browse</span>
                </p>
                <p className="text-[8px] text-zinc-600 mt-1">PDF, PPTX, TXT, MD</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
        {sources.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <FileText size={24} className="text-zinc-700" />
            </div>
            <p className="text-xs text-zinc-600 font-medium">No sources yet</p>
            <p className="text-[10px] text-zinc-700 mt-1">Upload documents to ground AI responses</p>
          </div>
        )}

        {/* Batch select actions */}
        {sources.length > 1 && (
          <div className="flex gap-2 mb-2 px-1">
            <button
              onClick={selectAllSources}
              className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-violet-400 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAllSources}
              className="text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
            >
              Deselect
            </button>
            <div className="flex-1" />
            <button
              onClick={clearSources}
              className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        <AnimatePresence>
          {sources.map((doc) => {
            const isActive = activeSourceIds.includes(doc.id);
            const isExpanded = expandedDoc === doc.id;
            const isError = doc.processingStatus === 'error';

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                layout
              >
                <div
                  className={`rounded-xl border transition-all ${
                    isError
                      ? 'border-red-500/20 bg-red-500/5'
                      : isActive
                        ? 'border-violet-500/30 bg-violet-500/5'
                        : 'border-zinc-800/50 bg-zinc-900/40 hover:border-zinc-700/50'
                  }`}
                >
                  {/* Document Row */}
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      {!isError && (
                        <button
                          onClick={() => toggleSource(doc.id)}
                          className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-violet-500 border-violet-500'
                              : 'border-zinc-600 hover:border-zinc-500'
                          }`}
                        >
                          {isActive && <CheckCircle size={10} className="text-white" />}
                        </button>
                      )}

                      {/* Icon + Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-md border ${typeColors[doc.type] || typeColors.text}`}>
                            {typeIcons[doc.type] || typeIcons.text}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-zinc-900 dark:text-white truncate">
                              {doc.name}
                            </p>
                            <p className="text-[9px] text-zinc-500 mt-0.5">
                              {formatWordCount(doc.wordCount)} words
                            </p>
                          </div>
                        </div>

                        {/* Status */}
                        {doc.processingStatus === 'error' && (
                          <div className="mt-2 flex items-center gap-1.5 text-red-400">
                            <AlertCircle size={12} />
                            <span className="text-[9px]">{doc.error || 'Processing error'}</span>
                          </div>
                        )}

                        {/* Excerpt Preview */}
                        {isActive && doc.excerpt && !isExpanded && (
                          <p
                            onClick={() => setExpandedDoc(doc.id)}
                            className="mt-2 text-[10px] text-zinc-500 leading-relaxed line-clamp-2 cursor-pointer hover:text-zinc-400 transition-colors"
                          >
                            {doc.excerpt}
                          </p>
                        )}

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="mt-2">
                            <p className="text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                              {doc.content.slice(0, 1500)}
                              {doc.content.length > 1500 && '...'}
                            </p>
                            <button
                              onClick={() => setExpandedDoc(null)}
                              className="mt-1 text-[8px] uppercase tracking-widest text-violet-500 hover:text-violet-400 font-black"
                            >
                              Collapse
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isActive && doc.excerpt && !isExpanded && (
                          <button
                            onClick={() => setExpandedDoc(doc.id)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all"
                          >
                            <Maximize2 size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => removeSource(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Generation Actions */}
      {sources.length > 0 && activeSourceIds.length > 0 && (
        <div className="px-4 py-4 border-t border-zinc-800/50 space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
            Generate from Sources
          </p>
          <div className="flex gap-2">
            <motion.button
              onClick={onGenerateFlashcards}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 p-3 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 text-violet-300 hover:text-violet-200 hover:border-violet-500/50 transition-all disabled:opacity-40"
            >
              <Sparkles size={14} className="mx-auto mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Flashcards</span>
            </motion.button>
            <motion.button
              onClick={onGenerateQuiz}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 p-3 rounded-xl bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/50 transition-all disabled:opacity-40"
            >
              <Sparkles size={14} className="mx-auto mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Quiz</span>
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SourcesPanel;



