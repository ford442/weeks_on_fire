import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'wof:edit-mode';

function readEditMode(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('edit');
    if (param === '1') window.localStorage.setItem(STORAGE_KEY, '1');
    else if (param === '0') window.localStorage.removeItem(STORAGE_KEY);
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener('storage', callback);
  };
}

/**
 * Edit mode reveals internal production tooling and repo details.
 * Enable with `?edit=1` (persisted in localStorage); disable with `?edit=0`.
 */
export function useEditMode(): boolean {
  return useSyncExternalStore(subscribe, readEditMode, () => false);
}

/** Replace raw model/API identifiers with a friendly tool label for public display. */
export function publicText(text: string, editMode: boolean): string {
  if (editMode) return text;
  return text
    .replace(/xAI API\s*·\s*grok-imagine[\w-]*/gi, 'Grok Imagine')
    .replace(/(?:direct\s+)?api\.x\.ai/gi, 'Grok Imagine')
    .replace(/grok-imagine[\w-]*/gi, 'Grok Imagine');
}
