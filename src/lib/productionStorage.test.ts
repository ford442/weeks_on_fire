import { beforeEach, describe, expect, it } from 'vitest';

import { PRODUCTION_STORAGE_SCHEMA_VERSION } from '../schemas/production';

import { clearStored, loadStored, productionsEqual, saveStored } from './productionStorage';

import type { EpisodeProduction } from '../data/production';

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
  };
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

  it('round-trips catalog refs through save and load', () => {
    const production = fixtureProduction();
    const [scene] = [
      {
        id: 'scene-003',
        order: 2,
        title: '911 for the Wrong Shade of Blue',
        timestamp: '00:01:30',
        description: 'See content/cutaways/911-wrong-shade.json.',
        status: 'draft' as const,
        addedAt: '2026-08-31T12:00:00Z',
        lastEditedAt: '2026-11-19T12:00:00Z',
        history: [],
        cutawayId: '911-wrong-shade',
        characterIds: ['lillith', 'rubella'],
      },
    ];
    const linked = { ...production, scenes: scene ? [scene] : [] };

    saveStored('04', linked);

    expect(loadStored('04')).toEqual(linked);
    const raw = localStorage.getItem('wof:production:episode-04') ?? '';
    expect(JSON.parse(raw)).toMatchObject({ schemaVersion: 1 });
    expect(raw).toContain('"cutawayId":"911-wrong-shade"');
  });

  it('loads a v1 document written before the catalog refs existed', () => {
    const legacy = {
      schemaVersion: 1,
      savedAt: '2026-08-01T00:00:00Z',
      production: {
        ...fixtureProduction(),
        scenes: [
          {
            id: 'scene-001',
            order: 1,
            title: 'Opening',
            timestamp: '00:00:01',
            description: 'In-progress edit saved before refs existed.',
            prompt: '',
            mediaUrl: '',
            status: 'draft',
            addedAt: '2026-06-15T10:00:00Z',
            lastEditedAt: '2026-07-04T16:20:00Z',
            history: [{ date: '2026-06-15T10:00:00Z', action: 'added', note: 'Initial concept' }],
          },
        ],
      },
    };
    localStorage.setItem('wof:production:episode-02', JSON.stringify(legacy));

    const loaded = loadStored('02');
    expect(loaded?.scenes.map((scene) => scene.description)).toEqual([
      'In-progress edit saved before refs existed.',
    ]);
    expect(loaded?.scenes[0]).not.toHaveProperty('songId');
  });

  it('rejects a stored scene whose ref is blank', () => {
    localStorage.setItem(
      'wof:production:episode-02',
      JSON.stringify({
        schemaVersion: PRODUCTION_STORAGE_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        production: {
          ...fixtureProduction(),
          scenes: [{ id: 'scene-001', songId: '' }],
        },
      }),
    );

    expect(loadStored('02')).toBeNull();
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
