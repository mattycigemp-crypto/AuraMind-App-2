import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from '@/components/icons';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-5">
        <Icon size={24} className="text-zinc-600" />
      </div>
      <h3 className="text-sm font-medium text-zinc-400 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-zinc-600 max-w-[280px]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
