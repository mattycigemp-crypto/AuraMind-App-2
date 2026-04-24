import React from 'react';
import { useContextMenu, ContextMenuItem } from './ui/ContextMenu';
import {
  RefreshCw,
  Download,
  Settings,
  HelpCircle,
  BarChart3,
  Calendar,
  Archive,
  Trash2,
  Copy,
  Share,
  Filter,
  SortAsc,
  Moon,
  Sun,
} from 'lucide-react';

interface DashboardContextMenuProps {
  onRefreshData?: () => void;
  onExportData?: () => void;
  onOpenSettings?: () => void;
  onViewHelp?: () => void;
  onViewAnalytics?: () => void;
  onViewCalendar?: () => void;
  onArchiveOldData?: () => void;
  onClearCache?: () => void;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
  currentSort?: string;
  onSortChange?: (sort: string) => void;
  onFilterChange?: (filter: string) => void;
}

export const DashboardContextMenu: React.FC<DashboardContextMenuProps> = ({
  onRefreshData,
  onExportData,
  onOpenSettings,
  onViewHelp,
  onViewAnalytics,
  onViewCalendar,
  onArchiveOldData,
  onClearCache,
  onToggleTheme,
  isDarkMode = false,
  currentSort = 'due',
  onSortChange,
  onFilterChange,
}) => {
  const { showContextMenu } = useContextMenu();

  const getDashboardContextMenuItems = (): ContextMenuItem[] => [
    {
      id: 'refresh',
      label: 'Refresh Data',
      icon: RefreshCw,
      action: () => onRefreshData?.(),
    },
    {
      id: 'separator1',
      label: '',
      separator: true,
    },
    {
      id: 'sort',
      label: 'Sort By',
      icon: SortAsc,
      action: () => {
        // Could open a submenu or cycle through sort options
        const sortOptions = ['due', 'recent', 'name', 'mastery'];
        const currentIndex = sortOptions.indexOf(currentSort);
        const nextSort = sortOptions[(currentIndex + 1) % sortOptions.length];
        onSortChange?.(nextSort);
      },
    },
    {
      id: 'filter',
      label: 'Filter Decks',
      icon: Filter,
      action: () => onFilterChange?.('all'), // Could open filter dialog
    },
    {
      id: 'separator2',
      label: '',
      separator: true,
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      icon: BarChart3,
      action: () => onViewAnalytics?.(),
    },
    {
      id: 'calendar',
      label: 'Study Calendar',
      icon: Calendar,
      action: () => onViewCalendar?.(),
    },
    {
      id: 'separator3',
      label: '',
      separator: true,
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: Download,
      action: () => onExportData?.(),
    },
    {
      id: 'share',
      label: 'Share Progress',
      icon: Share,
      action: () => {
        // TODO: Implement progress sharing
        console.log('Share progress');
      },
    },
    {
      id: 'separator4',
      label: '',
      separator: true,
    },
    {
      id: 'theme',
      label: isDarkMode ? 'Switch to Light' : 'Switch to Dark',
      icon: isDarkMode ? Sun : Moon,
      action: () => onToggleTheme?.(),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => onOpenSettings?.(),
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      action: () => onViewHelp?.(),
    },
    {
      id: 'separator5',
      label: '',
      separator: true,
    },
    {
      id: 'archive',
      label: 'Archive Old Data',
      icon: Archive,
      action: () => onArchiveOldData?.(),
    },
    {
      id: 'clear-cache',
      label: 'Clear Cache',
      icon: Trash2,
      action: () => onClearCache?.(),
      danger: true,
    },
  ];

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event, getDashboardContextMenuItems());
  };

  return {
    handleContextMenu,
    getDashboardContextMenuItems,
  };
};

export default DashboardContextMenu;
