import { useEffect } from 'react';

/** Calls `onEscape` when Escape is pressed while the component is mounted (modal dialogs). */
export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onEscape]);
}
