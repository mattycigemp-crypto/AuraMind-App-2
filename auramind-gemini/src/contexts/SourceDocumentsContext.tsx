import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { SourceDocument } from '../types';
import { extractStudyAssetText } from '../services/import/documentImportService';

interface SourceDocumentsContextValue {
  sources: SourceDocument[];
  addSource: (file: File) => Promise<void>;
  removeSource: (id: string) => void;
  clearSources: () => void;
  activeSourceIds: string[];
  setActiveSourceIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectAllSources: () => void;
  deselectAllSources: () => void;
  totalWordCount: number;
  isProcessing: boolean;
}

const SourceDocumentsContext = createContext<SourceDocumentsContextValue | null>(null);

export const useSourceDocuments = () => {
  const ctx = useContext(SourceDocumentsContext);
  if (!ctx) throw new Error('useSourceDocuments must be used within SourceDocumentsProvider');
  return ctx;
};

export const SourceDocumentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [activeSourceIds, setActiveSourceIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const contentHashCache = useRef<Set<string>>(new Set());

  const addSource = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await extractStudyAssetText(file);
      if (!text.trim()) {
        throw new Error(`No readable text found in "${file.name}".`);
      }

      const contentHash = `${file.name}:${text.length}`;
      if (contentHashCache.current.has(contentHash)) {
        setIsProcessing(false);
        return;
      }
      contentHashCache.current.add(contentHash);

      const words = text.trim().split(/\s+/);
      const excerpt = text.slice(0, 300).trim() + (text.length > 300 ? '...' : '');

      const doc: SourceDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' :
              file.name.endsWith('.pptx') ? 'pptx' :
              file.name.endsWith('.md') ? 'markdown' : 'text',
        content: text,
        excerpt,
        contentHash,
        wordCount: words.length,
        addedAt: Date.now(),
        processingStatus: 'complete',
      };

      setSources(prev => {
        if (prev.some(s => s.contentHash === contentHash)) return prev;
        const updated = [...prev, doc];
        return updated;
      });
      setActiveSourceIds(prev => [...prev, doc.id]);
    } catch (err) {
      const doc: SourceDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'text',
        content: '',
        excerpt: '',
        contentHash: `${file.name}:error`,
        wordCount: 0,
        addedAt: Date.now(),
        processingStatus: 'error',
        error: err instanceof Error ? err.message : 'Failed to process document',
      };
      setSources(prev => [...prev, doc]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources(prev => {
      const doc = prev.find(s => s.id === id);
      if (doc) contentHashCache.current.delete(doc.contentHash);
      return prev.filter(s => s.id !== id);
    });
    setActiveSourceIds(prev => prev.filter(sid => sid !== id));
  }, []);

  const clearSources = useCallback(() => {
    setSources([]);
    setActiveSourceIds([]);
    contentHashCache.current.clear();
  }, []);

  const selectAllSources = useCallback(() => {
    setActiveSourceIds(sources.map(s => s.id));
  }, [sources]);

  const deselectAllSources = useCallback(() => {
    setActiveSourceIds([]);
  }, []);

  const totalWordCount = sources
    .filter(s => s.processingStatus === 'complete' && activeSourceIds.includes(s.id))
    .reduce((sum, s) => sum + s.wordCount, 0);

  return (
    <SourceDocumentsContext.Provider value={{
      sources,
      addSource,
      removeSource,
      clearSources,
      activeSourceIds,
      setActiveSourceIds,
      selectAllSources,
      deselectAllSources,
      totalWordCount,
      isProcessing,
    }}>
      {children}
    </SourceDocumentsContext.Provider>
  );
};



