import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon as Home, SearchIcon as Search, BookOpenIcon as BookOpen, ArrowLeftIcon as ArrowLeft } from '../components/icons/CustomIcons';
import { motion } from 'framer-motion';

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-8">
            <span className="text-9xl font-bold text-zinc-800 select-none">404</span>
<motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <BookOpen className="h-16 w-16 text-primary/50" />
            </motion.div>
          </div>

<h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Page not found</h1>
<p className="text-zinc-600 dark:text-zinc-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
            Don't worry, even the best students lose their way sometimes.
          </p>
        </motion.div>

        {/* Quick Actions */}
<motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold"
          >
            <Home className="h-5 w-5 text-white" />
            Go to Dashboard
          </Link>

          <Link
            to="/decks"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            Browse Decks
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            Go Back
          </button>
        </motion.div>

        {/* Fun fact */}
<motion.div
          className="mt-12 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-zinc-500">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Study tip:</span>{' '}
            Getting lost is a great opportunity to practice spaced repetition!
            Review what you know, then find your way back.
          </p>
        </motion.div>
      </div>
    </div>
  );
}


