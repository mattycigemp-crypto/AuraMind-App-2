import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auraAiClient } from '../../services/api/auraAiService';
import { Quiz, FlashcardData } from '../../types';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { 
  SparklesIcon as Sparkles, 
  PlayIcon as Play,
  TargetIcon as Target,
  CheckCircle2Icon as CheckCircle,
  DownloadIcon as Save,
  EyeIcon as Eye,
  RotateCcwIcon as RotateCcw,
  PencilIcon as Pencil,
  Trash2Icon as Trash,
  XIcon as X,
  CheckIcon as Check,
  GlobeIcon as Globe,
  TypeIcon as Type,
  FileTextIcon as FileText,
  BookOpenIcon as BookOpen,
} from '../../components/icons/CustomIcons';
import { toast } from 'sonner';
import { localInference, getModelDisplayName, type InitProgress } from '../../services/api/localInferenceService';
import PresentationViewer from '../../components/study/PresentationViewer';
import { extractStudyAssetText } from '../../services/import/documentImportService';

type GeneratorType = 'quiz' | 'flashcards' | 'presentation';
type InputSource = 'topic' | 'url' | 'youtube' | 'file';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

const GeneratorPage: React.FC = () => {
  const { createDeck, addCardsToDeck } = useDashboardWorkspace();
  const [generatorType, setGeneratorType] = useState<GeneratorType>('quiz');
  const [topic, setTopic] = useState('');
  const [numItems, setNumItems] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [customNumItems, setCustomNumItems] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inputSource, setInputSource] = useState<InputSource>('topic');
  const [extractedContent, setExtractedContent] = useState<string | null>(null);
  const [extractedTitle, setExtractedTitle] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationStartRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [genProgress, setGenProgress] = useState(0);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<FlashcardData[] | null>(null);
  const [generatedPresentation, setGeneratedPresentation] = useState<{ title: string; slides: { title: string; bullets: string[]; script: string }[] } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [localAIProgress, setLocalAIProgress] = useState<InitProgress | null>(null);

  const useLocalAI = (import.meta as any).env?.VITE_USE_LOCAL_AI === 'true';
  const genEstimate = useLocalAI ? 45 : 10;

  useEffect(() => {
    if (!useLocalAI) return;
    const unsub = localInference.subscribe(setLocalAIProgress);
    return unsub;
  }, [useLocalAI]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      const sec = Math.floor((Date.now() - generationStartRef.current) / 1000);
      setElapsed(sec);
      setGenProgress(Math.min(sec / genEstimate, 0.95));
    }, 200);
    return () => clearInterval(interval);
  }, [isGenerating, genEstimate]);

  const handleFetchUrl = async () => {
    if (!topic.trim()) return;
    setIsExtracting(true);
    setFetchError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch URL');
      if (!data.data.text) {
        setFetchError('No text content could be extracted from this URL');
        return;
      }
      setExtractedContent(data.data.text);
      setExtractedTitle(data.data.title || topic);
      toast.success(`Fetched ${data.data.text.length.toLocaleString()} characters from ${data.data.title || 'page'}`);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to fetch URL');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFetchYoutube = async () => {
    if (!topic.trim()) return;
    setIsExtracting(true);
    setFetchError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/fetch-youtube-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch transcript');
      if (!data.data.text) {
        setFetchError(data.data.error || 'No transcript available for this video');
        return;
      }
      setExtractedContent(data.data.text);
      setExtractedTitle(data.data.title || topic);
      toast.success(`Fetched transcript for "${data.data.title}" (${data.data.text.length.toLocaleString()} chars)`);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to fetch YouTube transcript');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsExtracting(true);
    setFetchError(null);
    try {
      const text = await extractStudyAssetText(file);
      if (!text.trim()) {
        setFetchError('No text could be extracted from this file');
        return;
      }
      setExtractedContent(text);
      setExtractedTitle(file.name);
      setTopic(file.name);
      toast.success(`Extracted ${text.length.toLocaleString()} characters from ${file.name}`);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to extract file');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    const sourceLabel = extractedTitle || topic;
    const sourceContext = extractedContent
      ? `\n\nUse the following source content to generate the study material. Ground ALL content in this source:\n\n${extractedContent.slice(0, 30000)}`
      : '';

    setIsGenerating(true);
    generationStartRef.current = Date.now();
    setElapsed(0);
    setGenProgress(0);
    const finalNumItems = showCustomInput ? parseInt(customNumItems) || 10 : numItems;

    if (useLocalAI) {
      const model = await localInference.ensureModelFor(sourceLabel, finalNumItems, difficulty === 'mixed' ? 'medium' : difficulty);
      toast.info(`Using ${getModelDisplayName(model)} for this request`);
    }

    const isPres = generatorType === 'presentation';
    const diffDesc = difficulty === 'mixed'
      ? `mixed difficulty levels (include a balanced mix of easy, medium, and hard ${isPres ? 'slides' : generatorType === 'quiz' ? 'questions' : 'flashcards'})`
      : `${difficulty} difficulty level`;
    const prompt = isPres
      ? `Generate a presentation on "${sourceLabel}" with ${finalNumItems} slides at ${diffDesc}. Each slide should have a title, 3-5 bullet points, and a narrator script for voiceover.${sourceContext}\n\nRespond with valid JSON only. Format: { "title": "Presentation Title", "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"], "script": "Narrator script for this slide" }] }`
      : `Generate a ${generatorType} on "${sourceLabel}" with ${finalNumItems} ${generatorType === 'quiz' ? 'questions' : 'flashcards'} at ${diffDesc}. ${generatorType === 'quiz' ? 'Include explanations for each question.' : 'Include difficulty levels for each card.'}${sourceContext}\n\nRespond with valid JSON only. ${generatorType === 'quiz' ? 'Format: { "questions": [{ "id": "1", "question": "...", "options": ["...", "..."], "correctAnswer": 0, "explanation": "..." }] }' : 'Format: { "cards": [{ "question": "...", "answer": "...", "difficulty": "easy|medium|hard" }] }'}`;

    try {
      const response = await auraAiClient.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a study content generator. Always respond with valid JSON only, no markdown, no other text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '';
      if (!content.trim()) {
        toast.error('Empty response from AI. Please try again.');
        return;
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        toast.error('Failed to parse AI response. Please try again.');
        return;
      }

      let rawJson = jsonMatch[0];
      try {
        JSON.parse(rawJson);
      } catch {
        rawJson = rawJson
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      }

      const parsed = JSON.parse(rawJson);
      if (generatorType === 'quiz') {
        if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
          toast.error('Generated quiz has no questions. Please try again.');
          return;
        }
        setGeneratedQuiz({
          id: crypto.randomUUID(),
          title: `${topic} Quiz`,
          topic,
          difficulty: difficulty === 'mixed' ? 'medium' : difficulty,
          questions: parsed.questions
        });
      } else if (generatorType === 'presentation') {
        if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
          toast.error('Generated presentation has no slides. Please try again.');
          return;
        }
        setGeneratedPresentation({
          title: parsed.title || `${topic} Presentation`,
          slides: parsed.slides
        });
      } else if (generatorType === 'flashcards') {
        if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
          toast.error('Generated flashcards have no cards. Please try again.');
          return;
        }
        setGeneratedFlashcards(parsed.cards);
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setTopic('');
    setNumItems(10);
    setDifficulty('medium');
    setCustomNumItems('');
    setShowCustomInput(false);
    setGeneratedQuiz(null);
    setGeneratedFlashcards(null);
    setGeneratedPresentation(null);
    setEditingIndex(null);
    setEditForm({});
    setExtractedContent(null);
    setExtractedTitle('');
    setFetchError(null);
  };

  const handleSaveQuiz = async () => {
    if (!generatedQuiz) return;
    setIsSaving(true);
    try {
      const deck = await createDeck(
        `${generatedQuiz.title} (Quiz)`,
        `__QUIZ__:${JSON.stringify(generatedQuiz)}`
      );
      if (deck) {
        const cards = generatedQuiz.questions.map(q => ({
          question: q.question,
          answer: `${q.options[q.correctAnswer]}${q.explanation ? ` — ${q.explanation}` : ''}`
        }));
        await addCardsToDeck(deck.id, cards);
        toast.success('Quiz saved as a deck!');
        handleReset();
      }
    } catch (error) {
      console.error('Failed to save quiz:', error);
      toast.error('Failed to save quiz');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToQuizLab = () => {
    if (!generatedQuiz) return;
    const saved = JSON.parse(localStorage.getItem('auramind-saved-quizzes') || '[]');
    saved.push({ ...generatedQuiz, savedAt: Date.now() });
    localStorage.setItem('auramind-saved-quizzes', JSON.stringify(saved));
    toast.success('Quiz saved to Quiz Lab!');
  };

  const handleSavePresentation = async () => {
    if (!generatedPresentation) return;
    setIsSaving(true);
    try {
      const slides = generatedPresentation.slides;
      const deck = await createDeck(
        `${generatedPresentation.title}`,
        `AI-generated presentation on ${generatedPresentation.title}. ${slides.length} slides.`
      );
      if (deck) {
        const cards = slides.map(s => ({
          question: s.title,
          answer: `${s.bullets.join('\n')}${s.script ? `\n\nScript: ${s.script}` : ''}`
        }));
        await addCardsToDeck(deck.id, cards);
        toast.success('Presentation saved as a deck!');
        handleReset();
      }
    } catch (error) {
      console.error('Failed to save presentation:', error);
      toast.error('Failed to save presentation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFlashcards = async () => {
    if (!generatedFlashcards || generatedFlashcards.length === 0) return;
    setIsSaving(true);
    try {
      const deck = await createDeck(
        `${topic} Flashcards`,
        `AI-generated flashcards on ${topic} at ${difficulty} difficulty. ${generatedFlashcards.length} cards.`
      );
      if (deck) {
        const cards = generatedFlashcards.map(card => ({
          question: card.question,
          answer: card.answer
        }));
        await addCardsToDeck(deck.id, cards);
        toast.success('Flashcards saved as a deck!');
        handleReset();
      }
    } catch (error) {
      console.error('Failed to save flashcards:', error);
      toast.error('Failed to save flashcards');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuestion = (index: number) => {
    if (!generatedQuiz) return;
    const q = generatedQuiz.questions[index];
    setEditForm({ question: q.question, options: [...q.options], correctAnswer: q.correctAnswer, explanation: q.explanation || '' });
    setEditingIndex(index);
  };

  const handleSaveQuestionEdit = () => {
    if (!generatedQuiz || editingIndex === null) return;
    setGeneratedQuiz({
      ...generatedQuiz,
      questions: generatedQuiz.questions.map((q, i) =>
        i === editingIndex ? { ...q, question: editForm.question, options: editForm.options, correctAnswer: editForm.correctAnswer, explanation: editForm.explanation } : q
      )
    });
    setEditingIndex(null);
    setEditForm({});
  };

  const handleDeleteQuestion = (index: number) => {
    if (!generatedQuiz) return;
    setGeneratedQuiz({
      ...generatedQuiz,
      questions: generatedQuiz.questions.filter((_, i) => i !== index)
    });
    toast.success('Question removed');
  };

  const handleEditCard = (index: number) => {
    if (!generatedFlashcards) return;
    const c = generatedFlashcards[index];
    setEditForm({ question: c.question, answer: c.answer, difficulty: c.difficulty || 'medium' });
    setEditingIndex(index);
  };

  const handleSaveCardEdit = () => {
    if (!generatedFlashcards || editingIndex === null) return;
    setGeneratedFlashcards(generatedFlashcards.map((c, i) =>
      i === editingIndex ? { ...c, question: editForm.question, answer: editForm.answer, difficulty: editForm.difficulty } : c
    ));
    setEditingIndex(null);
    setEditForm({});
  };

  const handleDeleteCard = (index: number) => {
    if (!generatedFlashcards) return;
    setGeneratedFlashcards(generatedFlashcards.filter((_, i) => i !== index));
    toast.success('Card removed');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Content Generator</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Create quizzes, flashcards, and presentations with AI</p>
      </motion.div>

      {useLocalAI && localAIProgress && localAIProgress.status !== 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          {localAIProgress.status === 'downloading' && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-zinc-100 font-bold text-sm">Loading {getModelDisplayName(localInference.getModelId())}</p>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-violet-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(localAIProgress.progress * 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">{localAIProgress.text}</p>
            </div>
          )}
          {localAIProgress.status === 'error' && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-red-400 font-bold text-sm mb-1">Failed to load local model</p>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs">{localAIProgress.error}</p>
                <p className="text-zinc-500 text-xs mt-2">The app will use the cloud API instead.</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => {
              setGeneratorType('quiz');
              handleReset();
            }}
            className={`p-6 rounded-2xl border-2 transition-all ${
              generatorType === 'quiz'
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                generatorType === 'quiz' ? 'bg-violet-500' : 'bg-zinc-200 dark:bg-zinc-800'
              }`}>
                <Sparkles size={24} className={generatorType === 'quiz' ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Quiz</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Multiple choice questions</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setGeneratorType('flashcards');
              handleReset();
            }}
            className={`p-6 rounded-2xl border-2 transition-all ${
              generatorType === 'flashcards'
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                generatorType === 'flashcards' ? 'bg-violet-500' : 'bg-zinc-200 dark:bg-zinc-800'
              }`}>
                <CheckCircle size={24} className={generatorType === 'flashcards' ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Flashcards</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Study cards</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setGeneratorType('presentation');
              handleReset();
            }}
            className={`p-6 rounded-2xl border-2 transition-all ${
              generatorType === 'presentation'
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                generatorType === 'presentation' ? 'bg-violet-500' : 'bg-zinc-200 dark:bg-zinc-800'
              }`}>
                <Sparkles size={24} className={generatorType === 'presentation' ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Presentation</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Slide decks with voiceover</p>
              </div>
            </div>
          </button>
        </div>
      </motion.div>

      {!generatedQuiz && !generatedFlashcards && !generatedPresentation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8"
        >
          <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Configure {generatorType === 'quiz' ? 'Quiz' : generatorType === 'presentation' ? 'Presentation' : 'Flashcards'}
          </h2>

          {/* Source Type Tabs */}
          <div className="mb-6">
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400 mb-3">Source</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'topic' as InputSource, label: 'Topic', icon: Type },
                { value: 'url' as InputSource, label: 'URL', icon: Globe },
                { value: 'youtube' as InputSource, label: 'YouTube', icon: Play },
                { value: 'file' as InputSource, label: 'File', icon: FileText },
              ].map((src) => (
                <button
                  key={src.value}
                  onClick={() => { setInputSource(src.value); setFetchError(null); }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    inputSource === src.value
                      ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-white'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <src.icon size={16} />
                  <span className="text-sm font-bold">{src.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          {inputSource === 'topic' && (
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400 mb-3">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Biology, History, Mathematics"
                className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          )}

          {/* URL Input */}
          {inputSource === 'url' && (
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400 mb-3">Website URL</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); setExtractedContent(null); }}
                  placeholder="https://example.com/article"
                  className="flex-1 p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!topic.trim() || isExtracting}
                  className="px-6 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExtracting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Fetch</>
                  ) : 'Fetch'}
                </button>
              </div>
              {extractedContent && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Fetched: {extractedTitle}</p>
                  <p className="text-xs text-zinc-500">{extractedContent.length.toLocaleString()} characters extracted</p>
                </div>
              )}
            </div>
          )}

          {/* YouTube Input */}
          {inputSource === 'youtube' && (
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400 mb-3">YouTube Video URL</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); setExtractedContent(null); }}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  onClick={handleFetchYoutube}
                  disabled={!topic.trim() || isExtracting}
                  className="px-6 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExtracting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Fetch</>
                  ) : 'Fetch'}
                </button>
              </div>
              {extractedContent && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Transcript: {extractedTitle}</p>
                  <p className="text-xs text-zinc-500">{extractedContent.length.toLocaleString()} characters</p>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          {inputSource === 'file' && (
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400 mb-3">Upload Document</label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500/50 rounded-2xl p-12 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.pptx,.txt,.md,.doc,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-zinc-600 dark:text-zinc-400">Extracting text...</p>
                  </div>
                ) : extractedContent ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileText size={32} className="text-emerald-400" />
                    <p className="text-emerald-400 font-bold">{extractedTitle}</p>
                    <p className="text-xs text-zinc-500">{extractedContent.length.toLocaleString()} characters extracted</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-600">Click or drop a new file to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <BookOpen size={32} className="text-zinc-500" />
                    <p className="text-zinc-700 dark:text-zinc-400 font-bold">Drop a file here or click to browse</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-600">PDF, DOCX, TXT, MD, PPTX</p>
                  </div>
                )}
              </div>
              {fetchError && (
                <p className="mt-2 text-xs text-red-400">{fetchError}</p>
              )}
            </div>
          )}

          {fetchError && inputSource !== 'file' && (
            <p className="mb-6 text-sm text-red-400">{fetchError}</p>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400 mb-3">
              Number of {generatorType === 'quiz' ? 'Questions' : generatorType === 'presentation' ? 'Slides' : 'Cards'}
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setNumItems(num);
                    setShowCustomInput(false);
                    setCustomNumItems('');
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    numItems === num && !showCustomInput
                      ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-white'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setShowCustomInput(true)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  showCustomInput
                    ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-white'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Custom
              </button>
            </div>

            {showCustomInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <input
                  type="number"
                  value={customNumItems}
                  onChange={(e) => setCustomNumItems(e.target.value)}
                  placeholder="Enter custom number..."
                  className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                  min="1"
                  max="50"
                />
              </motion.div>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400 mb-3">Difficulty</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: 'easy', label: 'Easy', color: 'emerald' },
                { value: 'medium', label: 'Medium', color: 'amber' },
                { value: 'hard', label: 'Hard', color: 'red' },
                { value: 'mixed', label: 'Mixed', color: 'violet' }
              ].map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setDifficulty(diff.value as Difficulty)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    difficulty === diff.value
                      ? `border-${diff.color}-500 bg-${diff.color}-500/10 text-${diff.color}-700 dark:text-white`
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || isGenerating || isExtracting}
            className={`w-full flex items-center justify-center gap-3 p-5 rounded-xl text-lg font-bold uppercase tracking-widest transition-all ${
              !topic.trim() || isGenerating || isExtracting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="flex flex-col items-start">
                  <span>Generating...</span>
                  <span className="text-[10px] font-normal opacity-60">
                    {elapsed < genEstimate
                      ? `~${genEstimate - elapsed}s remaining`
                      : `still working... (${elapsed}s)`}
                  </span>
                </span>
              </>
            ) : (
              <>
                <Play size={20} />
                Generate {generatorType === 'quiz' ? 'Quiz' : generatorType === 'presentation' ? 'Presentation' : 'Flashcards'}
              </>
            )}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {(generatedQuiz || generatedFlashcards || generatedPresentation) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Generated {generatorType === 'quiz' ? 'Quiz' : generatorType === 'presentation' ? 'Presentation' : 'Flashcards'}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {generatorType === 'quiz' ? (
                    <>Topic: {generatedQuiz?.topic} &middot; {generatedQuiz?.difficulty} &middot; {generatedQuiz?.questions.length} questions</>
                  ) : generatorType === 'presentation' ? (
                    <>{generatedPresentation?.title} &middot; {generatedPresentation?.slides.length} slides</>
                  ) : (
                    <>{topic} &middot; {difficulty} &middot; {generatedFlashcards?.length} cards</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all text-sm font-bold uppercase tracking-widest"
                >
                  <RotateCcw size={14} />
                  Start Over
                </button>
              </div>
            </div>

            {generatedQuiz && (
              <div className="space-y-4 mb-8">
                {generatedQuiz.questions.map((q, i) => (
                  <div
                    key={q.id || i}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {editingIndex === i ? (
                          <div className="space-y-3">
                            <textarea
                              value={editForm.question}
                              onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                              rows={2}
                            />
                            {editForm.options?.map((opt: string, oi: number) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${i}`}
                                  checked={oi === editForm.correctAnswer}
                                  onChange={() => setEditForm(f => ({ ...f, correctAnswer: oi }))}
                                  className="accent-emerald-500"
                                />
                                <input
                                  value={opt}
                                  onChange={e => {
                                    const opts = [...editForm.options];
                                    opts[oi] = e.target.value;
                                    setEditForm(f => ({ ...f, options: opts }));
                                  }}
                                  className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                                />
                              </div>
                            ))}
                            <textarea
                              value={editForm.explanation || ''}
                              onChange={e => setEditForm(f => ({ ...f, explanation: e.target.value }))}
                              placeholder="Explanation (optional)"
                              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button onClick={handleSaveQuestionEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all">
                                <Check size={12} /> Save
                              </button>
                              <button onClick={handleCancelEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider transition-all">
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-zinc-100 font-medium mb-3">{q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => {
                                const isCorrect = oi === q.correctAnswer;
                                return (
                                  <div
                                    key={oi}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                                      isCorrect
                                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                                        : 'border-zinc-300 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                      isCorrect
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-zinc-800 text-zinc-500'
                                    }`}>
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    <span>{opt}</span>
                                    {isCorrect && <CheckCircle size={14} className="text-emerald-400 ml-auto" />}
                                  </div>
                                );
                              })}
                            </div>
                            {q.explanation && (
                              <div className="mt-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/10 text-sm text-zinc-600 dark:text-zinc-400">
                                <span className="text-violet-400 font-bold mr-2">Explanation:</span>
                                {q.explanation}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col gap-1.5">
                        <button onClick={() => handleEditQuestion(i)} className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteQuestion(i)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-500/20 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-all" title="Delete">
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {generatedPresentation && (
              <div className="mb-8">
                <PresentationViewer title={generatedPresentation.title} slides={generatedPresentation.slides} />
              </div>
            )}

            {generatedFlashcards && (
              <div className="space-y-3 mb-8">
                {generatedFlashcards.map((card, i) => (
                  <FlashcardRow
                    key={i}
                    card={card}
                    index={i}
                    editingIndex={editingIndex}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onEdit={handleEditCard}
                    onSave={handleSaveCardEdit}
                    onCancel={handleCancelEdit}
                    onDelete={handleDeleteCard}
                  />
                ))}
              </div>
            )}

            <div className="sticky bottom-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 -mx-6 px-6 py-5 flex items-center justify-end gap-4">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all text-sm font-bold uppercase tracking-widest"
              >
                <RotateCcw size={14} />
                Discard
              </button>
              {generatorType === 'quiz' && generatedQuiz && (
                <button
                  onClick={handleSendToQuizLab}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl border border-violet-500/30 text-violet-400 hover:text-violet-300 hover:border-violet-500/60 transition-all text-sm font-bold uppercase tracking-widest"
                >
                  <Target size={16} />
                  Send to Quiz Lab
                </button>
              )}
              <button
                onClick={generatorType === 'presentation' ? handleSavePresentation : generatorType === 'quiz' ? handleSaveQuiz : handleSaveFlashcards}
                disabled={isSaving}
                className="flex items-center gap-3 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : `Save as Deck (${generatorType === 'presentation' ? generatedPresentation?.slides.length : generatorType === 'quiz' ? generatedQuiz?.questions.length : generatedFlashcards?.length} cards)`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FlashcardRow: React.FC<{
  card: FlashcardData;
  index: number;
  editingIndex: number | null;
  editForm: Record<string, any>;
  setEditForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onEdit: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (index: number) => void;
}> = ({ card, index, editingIndex, editForm, setEditForm, onEdit, onSave, onCancel, onDelete }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const isEditing = editingIndex === index;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editForm.question}
                onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                rows={2}
              />
              <textarea
                value={editForm.answer}
                onChange={e => setEditForm(f => ({ ...f, answer: e.target.value }))}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                rows={2}
              />
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Difficulty</label>
                <select
                  value={editForm.difficulty}
                  onChange={e => setEditForm(f => ({ ...f, difficulty: e.target.value }))}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={onSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all">
                  <Check size={12} /> Save
                </button>
                <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider transition-all">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-zinc-100 font-medium mb-2">{card.question}</p>
              <motion.div
                initial={false}
                animate={{ height: showAnswer ? 'auto' : 0, opacity: showAnswer ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Answer</span>
                    {card.difficulty && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        card.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                        card.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {card.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300">{card.answer}</p>
                </div>
              </motion.div>
            </>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col gap-1.5">
          <button onClick={() => onEdit(index)} disabled={editingIndex !== null && editingIndex !== index} className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(index)} disabled={editingIndex !== null} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-500/20 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Delete">
            <Trash size={14} />
          </button>
        </div>
      </div>
      {!isEditing && (
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 text-xs font-bold uppercase tracking-widest transition-all"
        >
          <Eye size={14} /> {showAnswer ? 'Hide' : 'Show'} Answer
        </button>
      )}
    </div>
  );
};

export default GeneratorPage;



