import { useEffect, useRef, useCallback } from 'react';

/**
 * Focus trap hook for modal accessibility.
 * When the modal is open, Tab/Shift+Tab cycle only within the modal's
 * focusable elements, and focus is restored to the previously focused
 * element when the modal closes.
 */
export function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    const selectors = [
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selectors)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    );
  }, [containerRef]);

  useEffect(() => {
    if (!isOpen) return;

    // Save the element that had focus before the modal opened
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusables = getFocusableElements();
      if (focusables.length === 0) return;

      e.preventDefault();

      const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);

      if (e.shiftKey) {
        // Shift+Tab: go to previous, wrap to last
        const prevIndex = (currentIndex - 1 + focusables.length) % focusables.length;
        focusables[prevIndex].focus();
      } else {
        // Tab: go to next, wrap to first
        const nextIndex = (currentIndex + 1) % focusables.length;
        focusables[nextIndex].focus();
      }
    };

    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('keydown', handleKeydown);

      // Restore focus to the previously focused element
      if (previouslyFocused.current && document.body.contains(previouslyFocused.current)) {
        previouslyFocused.current.focus();
      }
      previouslyFocused.current = null;
    };
  }, [isOpen, getFocusableElements]);
}
