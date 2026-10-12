import { useCallback, useState } from 'react';

/**
 * Open state of the compact view's navigation card. The card only exists in
 * the compact view, so it never reports itself shown outside of it.
 * @param isCompactView - whether the file manager renders its compact view
 */
export const useCompactNavigation = (isCompactView: boolean) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeCompactNavigation = useCallback(() => setIsOpen(false), []);

  return {
    isCompactNavigationShown: isCompactView && isOpen,
    setIsCompactNavigationOpen: setIsOpen,
    closeCompactNavigation,
  };
};
