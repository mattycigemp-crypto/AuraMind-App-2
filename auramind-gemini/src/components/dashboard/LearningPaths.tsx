import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BookOpenIcon as BookOpen, BrainIcon as Brain, CodeIcon as Code, DatabaseIcon as Database, GlobeIcon as Globe, LockIcon as Lock, PlayIcon as Play, 
  CheckCircleIcon as CheckCircle, CircleIcon as Circle, ChevronRightIcon as ChevronRight, StarIcon as Star, ClockIcon as Clock, UsersIcon as Users,
  Loader2Icon as Loader2, ListIcon as List, TargetIcon as Target, AwardIcon as Award, TrendingUpIcon as TrendingUp, ArrowLeftIcon as ArrowLeft
} from '../icons/CustomIcons';
import GlassCard from '../shared/GlassCard';
import { learningPathsService, LearningPath as LearningPathType } from '../../services/learningPaths/learningPathsService';
import { LearningPathIcons } from './icons/LearningPathIcons';
import type { Lesson, CourseModule } from '../../data/learningPathsData';

const iconMap: Record<string, React.ReactNode> = {
  javascript: <LearningPathIcons.javascript className="w-6 h-6" />,
  react: <LearningPathIcons.react className="w-6 h-6" />,
  database: <LearningPathIcons.database className="w-6 h-6" />,
  ml: <LearningPathIcons.ml className="w-6 h-6" />,
  datastructures: <LearningPathIcons.datastructures className="w-6 h-6" />,
  typescript: <LearningPathIcons.typescript className="w-6 h-6" />,
};

const LearningPaths: React.FC<{ user: any }> = ({ user }) => {
  const [paths, setPaths] = useState<LearningPathType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const pathData = useMemo(() =>
    paths.find(p => p.id === selectedPath),
    [paths, selectedPath]
  );

  const lessonContext = useMemo(() => {
    if (!selectedLesson || !pathData) return null;
    const allLessons: { lesson: Lesson; module: CourseModule }[] = [];
    for (const mod of pathData.modules) {
      for (const les of mod.lessons) {
        allLessons.push({ lesson: les, module: mod });
      }
    }
    const idx = allLessons.findIndex(l => l.lesson.id === selectedLesson.id);
    if (idx === -1) return null;
    return {
      module: allLessons[idx].module,
      index: idx,
      total: allLessons.length,
      prev: idx > 0 ? allLessons[idx - 1] : null,
      next: idx < allLessons.length - 1 ? allLessons[idx + 1] : null,
    };
  }, [selectedLesson, pathData]);

  const goToLesson = useCallback((l: Lesson) => setSelectedLesson(l), []);

  useEffect(() => {
    loadLearningPaths();
  }, []);

  const loadLearningPaths = async () => {
    setLoading(true);
    const data = await learningPathsService.getLearningPaths(user?.id);
    setPaths(data);
    setLoading(false);
  };

  const handleEnroll = async (pathId: string) => {
    if (!user?.id) return;
    setEnrolling(pathId);
    const success = await learningPathsService.enrollInPath(user.id, pathId);
    if (success) {
      await loadLearningPaths();
    }
    setEnrolling(null);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-400';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || <BookOpen size={24} />;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
            Learning Paths
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Structured courses to guide your learning journey</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
          Learning Paths
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Structured courses to guide your learning journey</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {paths.map((path, i) => (
          <motion.div
            key={path.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="group"
          >
            <GlassCard variant="neural" className="h-full flex flex-col p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-600/30 transition-colors">
                  {getIcon(path.icon)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(path.level)}`}>
                    {path.level}
                  </span>
                  {path.enrolled && (
                    <CheckCircle size={14} className="text-emerald-400" />
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                {path.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">
                {path.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-zinc-400 dark:text-zinc-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {path.duration}
                </span>
                <span className="flex items-center gap-1">
                  <List size={14} />
                  {path.moduleCount} modules
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {path.enrolled_count} enrolled
                </span>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => setSelectedPath(path.id)}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={enrolling === path.id}
                >
                  {enrolling === path.id ? 'Enrolling...' : (path.enrolled ? 'Continue Learning' : 'Enroll Free')}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {paths.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 border-2 border-dashed border-zinc-300 dark:border-zinc-800"
        >
          <BookOpen size={48} className="text-zinc-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No Learning Paths Available</h3>
          <p className="text-zinc-500 dark:text-zinc-400">Learning paths will appear here once they are created.</p>
        </motion.div>
      )}
    </div>
  );
};

export default LearningPaths;