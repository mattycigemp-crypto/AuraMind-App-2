import React from 'react';
import { ChevronRightIcon as ChevronRight } from '../../icons/CustomIcons';

interface BreadcrumbItem {
  label: string;
  href?: string; // If undefined, it's the current page
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  'aria-label'?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  'aria-label': ariaLabel = 'breadcrumb',
}) => {
  return (
    <nav
      className={`${className} flex items-center space-x-2 text-xs text-zinc-500`}
      aria-label={ariaLabel}
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center">
              {isLast ? (
                <span className="text-zinc-300">{item.label}</span>
              ) : (
                <>
                  <a
                    href={item.href || '#'}
                    className="hover:text-primary transition-colors"
                  >
                    {item.label}
                  </a>
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;


