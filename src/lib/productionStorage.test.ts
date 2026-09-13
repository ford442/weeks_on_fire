import { beforeEach, describe, expect, it } from 'vitest';

import type { EpisodeProduction } from '../data/production';
import { PRODUCTION_STORAGE_SCHEMA_VERSION } from '../schemas/production';
import { clearStored, loadStored, productionsEqual, saveStored } from './productionStorage';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? (store.get(key) ?? null) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
}

function fixtureProduction(): EpisodeProduction {
  return {
    episode: '02',
    title: 'Weeks on Fire - Episode 02',
    lastUpdated: '2026-08-01T00:00:00Z',
    scenes: [],
    episodeHistory: [],
  };
}

beforeEach(() => {
  globalThis.localStorage = createMemoryStorage();
});

describe('production storage', () => {
  it('round-trips a production through save and load', () => {
    const production = fixtureProduction();
    saveStored('02', production);
    expect(loadStored('02')).toEqual(production);
  });

  it('returns null when nothing is stored', () => {
    expect(loadStored('03')).toBeNull();
  });

  it('rejects an unknown schema version', () => {
    localStorage.setItem(
      'wof:production:episode-02',
      JSON.stringify({
        schemaVersion: PRODUCTION_STORAGE_SCHEMA_VERSION + 1,
        savedAt: new Date().toISOString(),
        production: fixtureProduction(),
      }),
    );

    expect(loadStored('02')).toBeNull();
  });

  it('rejects malformed JSON', () => {
    localStorage.setItem('wof:production:episode-02', '{not json');
    expect(loadStored('02')).toBeNull();
  });

  it('rejects a stored production missing required fields', () => {
    localStorage.setItem(
      'wof:production:episode-02',
      JSON.stringify({
        schemaVersion: PRODUCTION_STORAGE_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        production: { episode: '02' },
      }),
    );

    expect(loadStored('02')).toBeNull();
  });

  it('clearStored removes a saved production', () => {
    saveStored('04', fixtureProduction());
    clearStored('04');
    expect(loadStored('04')).toBeNull();
  });

  it('productionsEqual compares by value, not identity', () => {
    const a = fixtureProduction();
    const b = { ...a, scenes: [] };
    expect(productionsEqual(a, b)).toBe(true);
    expect(productionsEqual(a, { ...a, title: 'Different' })).toBe(false);
  });
});
