import { useEffect } from 'react';

/**
 * Accessibility hook for keyboard navigation shortcuts
 * Provides standard keyboard shortcuts for the website
 */
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case '/':
          // Search shortcut
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }
          break;

        case 'Escape':
          // Close modals/dropdowns
          const modals = document.querySelectorAll('[role="dialog"]');
          modals.forEach((modal) => {
            const closeButton = modal.querySelector('[data-close-button]') as HTMLButtonElement;
            if (closeButton) closeButton.click();
          });
          break;

        case '?':
          // Show keyboard shortcuts
          if (e.shiftKey) {
            e.preventDefault();
            // Dispatch custom event for showing shortcuts modal
            window.dispatchEvent(new CustomEvent('showKeyboardShortcuts'));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};

/**
 * Enhance focus management for better keyboard navigation
 */
export const useFocusManagement = () => {
  useEffect(() => {
    // Add focus visible styles
    const style = document.createElement('style');
    style.innerHTML = `
      :focus-visible {
        outline: 2px solid #8B5CF6;
        outline-offset: 2px;
      }
      
      button:focus-visible,
      a:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 2px solid #8B5CF6;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
};

/**
 * Accessibility provider component
 * Initializes all accessibility features
 */
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useKeyboardNavigation();
  useFocusManagement();

  useEffect(() => {
    // Set language attribute
    document.documentElement.lang = 'en';

    // Add skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className =
      'sr-only focus:not-sr-only fixed top-0 left-0 z-[9999] bg-primary text-black px-4 py-2 font-bold';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Mark main content with ID
    let mainContent = document.querySelector('main');
    if (!mainContent) {
      mainContent = document.querySelector('[role="main"]');
    }
    if (mainContent) {
      mainContent.id = 'main';
    }

    return () => {
      if (document.body.contains(skipLink)) {
        document.body.removeChild(skipLink);
      }
    };
  }, []);

  return <>{children}</>;
};

/**
 * Utility function to add ARIA labels to interactive elements
 */
export const enhanceAriaLabels = () => {
  // Add aria-labels to icon-only buttons
  const iconButtons = document.querySelectorAll('button:not([aria-label])');
  iconButtons.forEach((button) => {
    if (button.textContent?.trim() === '') {
      const icon = button.querySelector('svg');
      if (icon && icon.getAttribute('data-icon')) {
        button.setAttribute('aria-label', icon.getAttribute('data-icon') || '');
      }
    }
  });

  // Add role and aria-labels to custom elements
  const customElements = document.querySelectorAll('[role="tab"]:not([aria-label])');
  customElements.forEach((element, index) => {
    if (!element.getAttribute('aria-label')) {
      element.setAttribute('aria-label', `Tab ${index + 1}`);
    }
  });
};

/**
 * Screen reader only class utility
 * Use class "sr-only" to hide elements visually but keep them for screen readers
 */
export const addScreenReaderStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    
    .sr-only-focusable:focus,
    .sr-only-focusable:active {
      position: static;
      width: auto;
      height: auto;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Initialize all accessibility features
 */
export const initializeAccessibility = () => {
  addScreenReaderStyles();
  enhanceAriaLabels();
};
