import { useCallback, useState } from 'react';

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

/**
 * A per-viewer on/off preference remembered in `localStorage` (off until set). Storage can be
 * blocked or throw (private windows, cleared site data); the flag then lasts until the page closes.
 */
export function useStoredFlag(key: string): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => read(key));

  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        if (next) localStorage.setItem(key, '1');
        else localStorage.removeItem(key);
      } catch {
        // Not remembered; still applies for this visit.
      }
    },
    [key],
  );

  return [value, set];
}
