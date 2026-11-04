import { useEffect } from 'react';

/**
 * Reusable modal lifecycle hook.
 * Locks body scroll on mount, restores it on unmount,
 * and attaches a global keydown listener to trigger onDismiss on Escape.
 *
 * @param {Function} onDismiss - Callback invoked when Escape key is pressed
 */
export const useModalDismiss = (onDismiss) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        onDismiss?.();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [onDismiss]);
};

export default useModalDismiss;
