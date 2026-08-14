import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  siblingCount?: number; // Number of pages to show on each side of current page
  boundaryCount?: number; // Number of pages to show at the boundaries
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const pages = range(1, totalPages);

  const startPage = Math.max(2, currentPage - siblingCount);
  const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

  const shouldShowLeftDots = startPage > boundaryCount + 2;
  const shouldShowRightDots = endPage < totalPages - boundaryCount - 1;

  const firstPageIndex = boundaryCount;
  const lastPageIndex = totalPages + 1 - boundaryCount;

  return (
    <nav className={`${className} flex items-center justify-center space-x-1`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-lg 
                   ${currentPage === 1 ? 'opacity-25 pointer-events-none' : 'hover:bg-primary/10'}
                   transition-colors`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((page, _index) => {
        // First page (always visible)
        if (page === 1) {
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg 
                         ${currentPage === page ? 'bg-primary text-black' : 'hover:bg-primary/10'}
                         transition-colors`}
            >
              {page}
            </button>
          );
        }

        // Last page (always visible)
        if (page === totalPages) {
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg 
                         ${currentPage === page ? 'bg-primary text-black' : 'hover:bg-primary/10'}
                         transition-colors`}
            >
              {page}
            </button>
          );
        }

        // Left dots
        if (page === firstPageIndex && shouldShowLeftDots) {
          return (
            <span key="dots-left" className="flex h-9 w-9 items-center justify-center text-zinc-400">
              ...
            </span>
          );
        }

        // Right dots
        if (page === lastPageIndex && shouldShowRightDots) {
          return (
            <span key="dots-right" className="flex h-9 w-9 items-center justify-center text-zinc-400">
              ...
            </span>
          );
        }

        // Middle pages (visible when within sibling range)
        if (page >= startPage && page <= endPage) {
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg 
                         ${currentPage === page ? 'bg-primary text-black' : 'hover:bg-primary/10'}
                         transition-colors`}
            >
              {page}
            </button>
          );
        }

        return null;
      })}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-lg 
                   ${currentPage === totalPages ? 'opacity-25 pointer-events-none' : 'hover:bg-primary/10'}
                   transition-colors`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
};

export default Pagination;


