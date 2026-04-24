import React from 'react';
import { Card } from '../../types';
import { useContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import {
  Edit,
  Copy,
  Trash2,
  Star,
  Eye,
  EyeOff,
  RotateCcw,
  Flag,
  Bookmark,
  Share,
} from 'lucide-react';

interface FlashcardContextMenuProps {
  card: Card;
  onEditCard?: (cardId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onToggleCardVisibility?: (cardId: string) => void;
  onResetCardProgress?: (cardId: string) => void;
  onToggleCardFavorite?: (cardId: string) => void;
  onFlagCard?: (cardId: string) => void;
  onBookmarkCard?: (cardId: string) => void;
  onShareCard?: (cardId: string) => void;
  onDuplicateCard?: (cardId: string) => void;
}

export const FlashcardContextMenu: React.FC<FlashcardContextMenuProps> = ({
  card,
  onEditCard,
  onDeleteCard,
  onToggleCardVisibility,
  onResetCardProgress,
  onToggleCardFavorite,
  onFlagCard,
  onBookmarkCard,
  onShareCard,
  onDuplicateCard,
}) => {
  const { showContextMenu } = useContextMenu();

  const getFlashcardContextMenuItems = (): ContextMenuItem[] => [
    {
      id: 'edit',
      label: 'Edit Card',
      icon: Edit,
      action: () => onEditCard?.(card.id),
    },
    {
      id: 'duplicate',
      label: 'Duplicate Card',
      icon: Copy,
      action: () => onDuplicateCard?.(card.id),
    },
    {
      id: 'separator1',
      label: '',
      separator: true,
    },
    {
      id: 'reset-progress',
      label: 'Reset Progress',
      icon: RotateCcw,
      action: () => onResetCardProgress?.(card.id),
    },
    {
      id: 'toggle-visibility',
      label: card.image ? 'Hide Image' : 'Show Image',
      icon: card.image ? EyeOff : Eye,
      action: () => onToggleCardVisibility?.(card.id),
      disabled: !card.image,
    },
    {
      id: 'separator2',
      label: '',
      separator: true,
    },
    {
      id: 'favorite',
      label: 'Add to Favorites',
      icon: Star,
      action: () => onToggleCardFavorite?.(card.id),
    },
    {
      id: 'bookmark',
      label: 'Bookmark Card',
      icon: Bookmark,
      action: () => onBookmarkCard?.(card.id),
    },
    {
      id: 'flag',
      label: 'Flag for Review',
      icon: Flag,
      action: () => onFlagCard?.(card.id),
    },
    {
      id: 'separator3',
      label: '',
      separator: true,
    },
    {
      id: 'share',
      label: 'Share Card',
      icon: Share,
      action: () => onShareCard?.(card.id),
    },
    {
      id: 'separator4',
      label: '',
      separator: true,
    },
    {
      id: 'delete',
      label: 'Delete Card',
      icon: Trash2,
      action: () => onDeleteCard?.(card.id),
      danger: true,
    },
  ];

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event, getFlashcardContextMenuItems());
  };

  return {
    handleContextMenu,
    getFlashcardContextMenuItems,
  };
};

export default FlashcardContextMenu;
