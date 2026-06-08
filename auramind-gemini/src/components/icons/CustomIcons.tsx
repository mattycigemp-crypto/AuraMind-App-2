import React from 'react';

// Helper function to convert size to className
const sizeToClass = (size?: number): string => {
  if (!size) return '';
  const sizeMap: Record<number, string> = {
    6: 'w-1.5 h-1.5',
    8: 'w-2 h-2',
    10: 'w-2.5 h-2.5',
    12: 'w-3 h-3',
    14: 'w-3.5 h-3.5',
    16: 'w-4 h-4',
    18: 'w-4.5 h-4.5',
    20: 'w-5 h-5',
    24: 'w-6 h-6',
    28: 'w-7 h-7',
    32: 'w-8 h-8',
    36: 'w-9 h-9',
    40: 'w-10 h-10',
    48: 'w-12 h-12',
  };
  return sizeMap[size] || '';
};

// Navigation Icons
export const HomeIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SearchIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowLeftIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="12 19 5 12 12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowRightIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="12 5 19 12 12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronRightIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronLeftIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronUpIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="18 15 12 9 6 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronDownIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Action Icons
export const PlusIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MinusIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const XIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckCircle2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const XCircleIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Play/Pause/Media Icons
export const PlayIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
  </svg>
);

export const PauseIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
    <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
  </svg>
);

export const StopIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
  </svg>
);

export const SkipForwardIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/>
    <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SkipBackIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/>
    <line x1="5" y1="5" x2="5" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Volume2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const VolumeXIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
    <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Edit/Delete Icons
export const PencilIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Trash2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EditIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Alert/Status Icons
export const AlertTriangleIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AlertCircleIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// User/Account Icons
export const UserIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UserPlusIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ShieldIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LockIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Time/Calendar Icons
export const ClockIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CalendarIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TimerIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="10" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="14" x2="15" y2="11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="14" r="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Content Icons
export const BookOpenIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FileTextIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TypeIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="4 7 4 4 20 4 20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="9" y1="20" x2="15" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Utility Icons
export const RefreshCwIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="23 4 23 10 17 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="1 20 1 14 7 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RotateCwIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="23 4 23 10 17 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RotateCcwIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="1 4 1 10 7 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Settings2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="3" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 10h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 14h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EyeIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EyeOffIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-5.06-5.94M1 1l22 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ExternalLinkIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ShareIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BookmarkIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FlagIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Achievement/Progress Icons
export const TrophyIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 22h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MedalIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 22h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CrownIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AwardIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="8" r="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TargetIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ZapIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>
  </svg>
);

export const TrendingUpIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BarChart3Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ActivityIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Brain/AI Icons
export const BrainIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BrainCircuitIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12v.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 7v.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 7v.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17v.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 17v.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BotIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M12 8V4H8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="6" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="14" r="1" fill="currentColor"/>
    <circle cx="15" cy="14" r="1" fill="currentColor"/>
  </svg>
);

export const CpuIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="9" y1="1" x2="9" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="1" x2="15" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="9" y1="20" x2="9" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="20" x2="15" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="20" y1="9" x2="23" y2="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="20" y1="14" x2="23" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="9" x2="4" y2="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="14" x2="4" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SparklesIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 3v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 17v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 5h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 19h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Wand2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m14 7 3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 6v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 14v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 2v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 8H3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GlobeIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Communication Icons
export const MessageSquareIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SendIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MailIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="20" height="16" x="2" y="4" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HistoryIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Layout/View Icons
export const LayersIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08c-.5.31-.5.99-.01 1.3l8.55 5.43a2 2 0 0 0 1.72 0l8.55-5.43c.49-.31.49-.99-.01-1.3L12.83 2.18Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m22 17.65-9.17 5.17a2 2 0 0 1-1.66 0L2.35 17.65c-.5-.31-.5-.99-.01-1.3l8.55-5.43a2 2 0 0 1 1.72 0l8.55 5.43c.49.31.49.99-.01 1.3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m22 12.65-9.17 5.17a2 2 0 0 1-1.66 0L2.35 12.65c-.5-.31-.5-.99-.01-1.3l8.55-5.43a2 2 0 0 1 1.72 0l8.55 5.43c.49.31.49.99-.01 1.3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ListIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Maximize2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="9 21 3 21 3 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="3" x2="14" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="21" x2="10" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Minimize2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="4 14 10 14 10 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="20 10 14 10 14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="14" y1="10" x2="21" y2="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="21" x2="10" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FolderOpenIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FocusIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ShuffleIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="16 3 21 3 21 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="21 16 21 21 16 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="4" x2="9" y2="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CommandIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const StopCircleIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="9" y="9" width="6" height="6" fill="currentColor"/>
  </svg>
);

export const BookTextIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 11h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LightbulbIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6.5 6.5 0 0 0 5.5 2c0 1.3.5 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 18h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 22h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SunIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 20v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m4.93 4.93 1.41 1.41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m17.66 17.66 1.41 1.41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 12h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m6.34 17.66-1.41 1.41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m19.07 4.93-1.41 1.41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MoonIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FlameIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38.5-2 1-3 1.5 1.5 3.5 1 4.5 2a2.5 2.5 0 0 0 2.5 2.5c.6 0 1.2-.2 1.5-.5.5.5 1.5 1.5 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-.5-1-1.5-1.5-2.5-2.5a2.5 2.5 0 0 0-2.5-2.5c-.6 0-1.2.2-1.5.5-.5-.5-1.5-1.5-2.5-2.5a2.5 2.5 0 0 0-2.5 2.5c0 1.38.5 2 1 3 .5 1 1.5 1.5 2.5 2.5Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CoffeeIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="6" y1="1" x2="6" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="14" y1="1" x2="14" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MusicIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ConstructionIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="m14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 0-3 3l-6.91 6.91a6 6 0 0 1 7.94-7.94l6.91-6.91a2.12 2.12 0 0 0-3-3l6.91-6.91Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UsersIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MoreVerticalIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="5" r="1" fill="currentColor"/>
    <circle cx="12" cy="19" r="1" fill="currentColor"/>
  </svg>
);

export const Loader2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
    </path>
  </svg>
);

export const BanIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowDownIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="19 12 12 19 5 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CircleIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Missing icons
export const LogOutIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BellIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MenuIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DatabaseIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PaletteIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CreditCardIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="20" height="14" x="2" y="5" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const InfinityIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GraduationCapIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ShieldCheckIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HashIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="3" x2="8" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16" y1="3" x2="14" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MailCheckIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect width="20" height="16" x="2" y="4" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SmartphoneIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GithubIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 18c-4.51 2-5-2-7-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TwitterIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2 3 3.5 3 5c0 0 1.5-3 5-3 0 0 5.5-5.5 5.5-5.5s-1 5.5-5 5.5c0 0 2 1.5 5 1.5 0 0 5 5.5 5 5.5z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Clock3Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FingerprintIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 6-6 6 6 0 0 1 6 6c0 7-3 9-3 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22v-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 19.5c-1 1.5-2.5 2.5-4 2.5s-3-1-4-2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DnaIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M2 15c6.667-6 13.333 0 20-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 17.66a1.6 1.6 0 0 1-1.5 1.34c-.5 0-1-.34-1.5-1.34a1.6 1.6 0 0 0-1.5-1.34c-.5 0-1 .34-1.5 1.34a1.6 1.6 0 0 1-1.5 1.34c-.5 0-1-.34-1.5-1.34a1.6 1.6 0 0 0-1.5-1.34c-.5 0-1 .34-1.5 1.34a1.6 1.6 0 0 1-1.5 1.34c-.5 0-1-.34-1.5-1.34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 6.34a1.6 1.6 0 0 0-1.5-1.34c-.5 0-1 .34-1.5 1.34a1.6 1.6 0 0 1-1.5 1.34c-.5 0-1-.34-1.5-1.34a1.6 1.6 0 0 0-1.5-1.34c-.5 0-1 .34-1.5 1.34a1.6 1.6 0 0 1-1.5 1.34c-.5 0-1-.34-1.5-1.34a1.6 1.6 0 0 0-1.5-1.34c-.5 0-1 .34-1.5 1.34a1.6 1.6 0 0 1-1.5 1.34c-.5 0-1-.34-1.5-1.34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ScanSearchIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m16 16-1.9-1.9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Mic2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LockKeyholeIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 13v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 7v7a5 5 0 0 0 10 0V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const StarIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BugIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="20" height="16" x="2" y="4" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 14h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowUpRightIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 7h10v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RadarIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.93 4.93l2.83 2.83" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.24 16.24l2.83 2.83" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const OrbitIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PanelLeftIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="18" height="18" x="3" y="3" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 3v18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CornerDownLeftIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="9 10 4 15 9 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 4v7a4 4 0 0 1-4 4H4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CopyIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DownloadIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArchiveIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="21 8 21 21 3 21 3 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect width="20" height="14" x="2" y="3" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MoreHorizontalIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UnlockIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LayoutDashboardIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="7" height="9" x="3" y="3" rx="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect width="7" height="5" x="14" y="3" rx="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect width="7" height="9" x="14" y="12" rx="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect width="7" height="5" x="3" y="16" rx="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DotIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GripVerticalIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="9" cy="12" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="15" cy="12" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="5" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="15" cy="5" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="19" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="15" cy="19" r="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ConfettiIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="m4.5 16.5-.9-.9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m4.5 7.5-.9-.9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m16.5 16.5-.9-.9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m16.5 7.5-.9-.9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 20v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m4.93 4.93 1.41 1.41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m17.66 17.66 1.41 1.41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m4.93 19.07 1.41-1.41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m17.66 6.34 1.41-1.41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CodeIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TrendingDownIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17 18 23 18 23 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Undo2Icon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M9 14 4 9l5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const QuoteIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.5V11c0 1.25.75 2 2 2h1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.5V11c0 1.25.75 2 2 2h1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LayoutGridIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="7" height="9" x="3" y="3" rx="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect width="7" height="5" x="14" y="3" rx="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect width="7" height="9" x="14" y="12" rx="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect width="7" height="5" x="3" y="16" rx="1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MessageSquareWarningIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 9v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const InfoIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16v-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TableIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect width="18" height="18" x="3" y="3" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SaveIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FilterIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MonitorIcon: React.FC<{ className?: string; size?: number; fill?: string }> = ({ className = "", size, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill || "none"} className={`${className} ${sizeToClass(size)}`}>
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);



