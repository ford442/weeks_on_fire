import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearDraft, listDrafts, loadDraft, saveDraft } from './sequenceDraftStorage';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('sequenceDraftStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('saves, loads and clears a draft as text, valid JSON or not', () => {
    expect(saveDraft('new-film', '{"camera": ', 'hose-chase')).toBe(true);
    expect(loadDraft('new-film')).toMatchObject({ forkedFrom: 'hose-chase', text: '{"camera": ' });
    clearDraft('new-film');
    expect(loadDraft('new-film')).toBeNull();
  });

  it('ignores other keys and payloads from another schema version', () => {
    localStorage.setItem('wof:sequence-graph:old', JSON.stringify({ schemaVersion: 0, text: '' }));
    localStorage.setItem('wof:production:episode-01', '{}');
    saveDraft('b-film', '{}', 'kick-lattice');
    expect(loadDraft('old')).toBeNull();
    expect(listDrafts().map((draft) => draft.id)).toEqual(['b-film']);
  });

  it('reports a blocked or full storage instead of throwing', () => {
    vi.stubGlobal('localStorage', {
      ...createMemoryStorage(),
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    });
    expect(saveDraft('x', '{}', 'y')).toBe(false);
  });
});
