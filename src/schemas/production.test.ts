import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import episode01Json from '../../episodes/episode-01/scenes.json';
import episode04Json from '../../episodes/episode-04/scenes.json';
import { clipStackerToProduction, exportToClipStacker } from '../data/production';

import {
  ClipStackerPayloadSchema,
  EpisodeProductionSchema,
  PRODUCTION_STORAGE_SCHEMA_VERSION,
  ProductionSceneSchema,
  SCENE_STATUSES,
  SceneStatusSchema,
  createStoredProductionMigrator,
  migrateStoredProduction,
  parseClipStackerPayload,
  parseStoredProduction,
  pickCatalogRefs,
  withCatalogRefs,
} from './production';

import type { EpisodeProduction } from '../data/production';

function fixtureEpisode(): EpisodeProduction {
  return {
    episode: '01',
    title: 'Weeks on Fire - Episode 01',
    lastUpdated: '2026-07-06T12:00:00Z',
    scenes: [
      {
        id: 'scene-001',
        order: 1,
        title: 'Opening Berries & Gala Plan',
        timestamp: '00:00:01',
        description: 'Serene garden terrace, foreboding turn.',
        prompt: 'cinematic garden terrace, golden light',
        mediaUrl: '',
        status: 'generated',
        addedAt: '2026-06-15T10:00:00Z',
        lastEditedAt: '2026-07-04T16:20:00Z',
        history: [{ date: '2026-06-15T10:00:00Z', action: 'added', note: 'Initial concept' }],
      },
      {
        id: 'scene-002',
        order: 2,
        title: 'Corset & Ping-Pong in the Dark',
        timestamp: '00:02:17',
        description: 'Physical discomfort symbolizes restriction.',
        prompt: 'cinematic ping-pong match in near darkness',
        mediaUrl: 'https://example.com/scene-002.mp4',
        status: 'suggested',
        addedAt: '2026-06-20T09:40:00Z',
        lastEditedAt: '2026-06-20T09:40:00Z',
        history: [{ date: '2026-06-20T09:40:00Z', action: 'added', note: 'Added from synopsis' }],
      },
    ],
    episodeHistory: [
      { date: '2026-06-15T10:00:00Z', action: 'created', note: 'Episode structure initialized' },
    ],
  };
}

describe('unified status', () => {
  it('reads the pre-unification "draft" Timeline status as "suggested"', () => {
    const parsed = SceneStatusSchema.parse('draft');
    expect(parsed).toBe('suggested');
  });

  it('accepts every hub-wide status and rejects unknown ones', () => {
    for (const status of SCENE_STATUSES) expect(SceneStatusSchema.parse(status)).toBe(status);
    expect(SceneStatusSchema.safeParse('in-production').success).toBe(false);
  });
});

describe('clip_stacker export', () => {
  it('produces a payload that satisfies the shared schema', () => {
    const payload = exportToClipStacker(fixtureEpisode());

    expect(ClipStackerPayloadSchema.safeParse(payload).success).toBe(true);
    expect(payload.version).toBe('weeks_on_fire_v1');
    expect(payload.clips.map((clip) => clip.mediaUrl)).toEqual([
      null, // empty string mediaUrl exported as null
      'https://example.com/scene-002.mp4',
    ]);
  });
});

describe('clip_stacker import', () => {
  it('round-trips scene fields against the committed baseline', () => {
    const baseline = fixtureEpisode();
    const payload = exportToClipStacker(baseline);

    const reimported = clipStackerToProduction(payload, baseline.episode, baseline);
    const baselineById = new Map(baseline.scenes.map((scene) => [scene.id, scene]));

    expect(reimported.title).toBe(baseline.title);
    expect(reimported.scenes).toHaveLength(baseline.scenes.length);

    for (const scene of reimported.scenes) {
      const original = baselineById.get(scene.id);
      expect(original).toBeDefined();
      expect(scene.title).toBe(original?.title);
      expect(scene.timestamp).toBe(original?.timestamp);
      expect(scene.status).toBe(original?.status);
      expect(scene.description).toBe(original?.description);
      // Fields omitted from the clip_stacker payload are preserved from the baseline.
      expect(scene.prompt).toBe(original?.prompt);
      expect(scene.addedAt).toBe(original?.addedAt);
      expect(scene.history.length).toBe((original?.history.length ?? 0) + 1);
    }
  });

  it('rejects a payload with the wrong version tag', () => {
    const payload = { ...exportToClipStacker(fixtureEpisode()), version: 'v2' };
    expect(parseClipStackerPayload(payload)).toBeNull();
  });

  it('rejects a payload whose clips are not an array', () => {
    const payload = { ...exportToClipStacker(fixtureEpisode()), clips: 'nope' };
    expect(parseClipStackerPayload(payload)).toBeNull();
  });

  it('rejects a clip with an invalid status', () => {
    const payload = exportToClipStacker(fixtureEpisode());
    const malformed = {
      ...payload,
      clips: payload.clips.map((clip, index) =>
        index === 0 ? { ...clip, status: 'not-a-status' } : clip,
      ),
    };
    expect(parseClipStackerPayload(malformed)).toBeNull();
  });

  it('accepts documented extra fields but strips them from the parsed result', () => {
    const payload = { ...exportToClipStacker(fixtureEpisode()), futureField: 'reserved' };
    const parsed = parseClipStackerPayload(payload);

    expect(parsed).not.toBeNull();
    expect(parsed).not.toHaveProperty('futureField');
  });
});

describe('Timeline ↔ clip_stacker round trip on the committed Episode 01 file', () => {
  // The real episodes/episode-01/scenes.json, sent through the same hops a person's files take:
  // Export to clip_stacker → a .json file on disk → Import clip_stacker.
  const committed = EpisodeProductionSchema.parse(episode01Json);
  const throughAFile = (payload: unknown): unknown => JSON.parse(JSON.stringify(payload));

  it('reads the committed file as four scenes', () => {
    expect(committed.episode).toBe('01');
    expect(committed.scenes.map((scene) => scene.id)).toEqual([
      'scene-001',
      'scene-002',
      'scene-003',
      'scene-004',
    ]);
  });

  it('survives export → file → import with every scene field intact', () => {
    const payload = parseClipStackerPayload(throughAFile(exportToClipStacker(committed)));
    expect(payload).not.toBeNull();
    if (!payload) return;

    const imported = clipStackerToProduction(payload, committed.episode, committed);

    expect(imported.title).toBe(committed.title);
    expect(imported.episode).toBe(committed.episode);
    expect(imported.episodeHistory).toEqual(committed.episodeHistory);
    expect(imported.scenes).toHaveLength(committed.scenes.length);

    imported.scenes.forEach((scene, index) => {
      const original = committed.scenes[index];
      if (!original) throw new Error(`no committed scene at ${index}`);
      // Everything but the bookkeeping the import itself writes (lastEditedAt, one history entry).
      const { lastEditedAt, history, ...rest } = scene;
      const { lastEditedAt: _lastEditedAt, history: originalHistory, ...originalRest } = original;
      void _lastEditedAt;
      expect(lastEditedAt >= original.lastEditedAt).toBe(true);
      expect(rest).toEqual(originalRest);
      expect(history.slice(0, -1)).toEqual(originalHistory);
      expect(history.at(-1)).toMatchObject({
        action: 'edited',
        note: 'Imported from clip_stacker',
      });
    });
  });

  it('is stable: re-exporting the imported episode gives the same clips', () => {
    const first = exportToClipStacker(committed);
    const payload = parseClipStackerPayload(throughAFile(first));
    if (!payload) throw new Error('first export did not parse');
    const second = exportToClipStacker(clipStackerToProduction(payload, '01', committed));

    expect(second.clips).toEqual(first.clips);
    expect(second.episodeHistory).toEqual(first.episodeHistory);
    expect(second.project).toBe(first.project);
  });

  it('carries mediaUrl and status edited in clip_stacker onto the matching scene only', () => {
    const exported = exportToClipStacker(committed);
    const edited = {
      ...exported,
      clips: exported.clips.map((clip) =>
        clip.id === 'scene-002'
          ? { ...clip, mediaUrl: 'https://example.com/scene-002.mp4', status: 'approved' as const }
          : clip,
      ),
    };
    const payload = parseClipStackerPayload(throughAFile(edited));
    if (!payload) throw new Error('edited export did not parse');

    const imported = clipStackerToProduction(payload, '01', committed);
    const byId = new Map(imported.scenes.map((scene) => [scene.id, scene]));
    const changed = byId.get('scene-002');
    const original = committed.scenes.find((scene) => scene.id === 'scene-002');

    expect(changed?.mediaUrl).toBe('https://example.com/scene-002.mp4');
    expect(changed?.status).toBe('approved');
    expect(changed?.prompt).toBe(original?.prompt); // prompts never leave the Timeline
    for (const id of ['scene-001', 'scene-003', 'scene-004']) {
      expect(byId.get(id)?.mediaUrl).toBe(committed.scenes.find((s) => s.id === id)?.mediaUrl);
    }
  });

  it('hydrates the Timeline from the export alone (no committed baseline), minus the prompts', () => {
    const exported = exportToClipStacker(committed);
    const payload = parseClipStackerPayload(throughAFile(exported));
    if (!payload) throw new Error('export did not parse');

    const hydrated = clipStackerToProduction(payload, '01', null);

    expect(hydrated.scenes.map((scene) => scene.id)).toEqual(committed.scenes.map((s) => s.id));
    expect(exportToClipStacker(hydrated).clips).toEqual(exported.clips);
    // The documented data loss: prompts and per-scene history are not in the payload.
    expect(hydrated.scenes.every((scene) => scene.prompt === '')).toBe(true);
  });
});

describe('catalog refs on scenes and clips', () => {
  const refs = {
    songId: 'call-forty-seven',
    cutawayId: '911-wrong-shade',
    sequenceId: 'lattice-hymn',
    cartoonId: 'cereal-wolf',
    characterIds: ['lillith', 'rubella'],
  };

  function withRefs(): EpisodeProduction {
    const episode = fixtureEpisode();
    const [first, second] = episode.scenes;
    if (!first || !second) throw new Error('fixture needs two scenes');
    return { ...episode, scenes: [first, { ...second, ...refs }] };
  }

  it('does not require any ref: a scene with only a prompt is valid', () => {
    expect(EpisodeProductionSchema.safeParse(fixtureEpisode()).success).toBe(true);
  });

  it('accepts every ref when present', () => {
    expect(EpisodeProductionSchema.safeParse(withRefs()).success).toBe(true);
  });

  it.each([
    ['a blank songId', { songId: '' }],
    ['a blank cutawayId', { cutawayId: '' }],
    ['a blank sequenceId', { sequenceId: '' }],
    ['a blank cartoonId', { cartoonId: '' }],
    ['an empty characterIds', { characterIds: [] }],
    ['a blank character id', { characterIds: ['lillith', ''] }],
    ['a non-string songId', { songId: 7 }],
  ])('rejects %s, so unset and set-to-blank stay distinct', (_label, extra) => {
    const [scene] = fixtureEpisode().scenes;
    expect(ProductionSceneSchema.safeParse({ ...scene, ...extra }).success).toBe(false);
  });

  it('pickCatalogRefs drops unset, blank and empty refs; withCatalogRefs replaces them wholesale', () => {
    expect(pickCatalogRefs({ songId: '', cartoonId: undefined, characterIds: [] })).toEqual({});
    expect(pickCatalogRefs(refs)).toEqual(refs);

    const [scene] = withRefs().scenes.slice(1);
    if (!scene) throw new Error('fixture needs a second scene');
    const cleared = withCatalogRefs(scene, { cutawayId: '911-wrong-shade' });
    expect(cleared).toMatchObject({ id: scene.id, cutawayId: '911-wrong-shade' });
    expect(cleared).not.toHaveProperty('songId');
    expect(cleared).not.toHaveProperty('characterIds');
  });

  it('exports refs only on the clips that set them, and keeps weeks_on_fire_v1', () => {
    const payload = exportToClipStacker(withRefs());

    expect(payload.version).toBe('weeks_on_fire_v1');
    expect(ClipStackerPayloadSchema.safeParse(payload).success).toBe(true);

    const [plain, linked] = payload.clips;
    expect(plain).toBeDefined();
    for (const key of Object.keys(refs)) expect(plain).not.toHaveProperty(key);
    expect(linked).toMatchObject(refs);
  });

  it('round-trips refs through export → JSON → parse → import', () => {
    const baseline = withRefs();
    const wire: unknown = JSON.parse(JSON.stringify(exportToClipStacker(baseline)));
    const parsed = parseClipStackerPayload(wire);
    expect(parsed).not.toBeNull();
    if (!parsed) return;

    // Import into an empty baseline so the refs can only have come from the payload.
    const imported = clipStackerToProduction(parsed, baseline.episode, null);
    const byId = new Map(imported.scenes.map((scene) => [scene.id, scene]));
    expect(byId.get('scene-002')).toMatchObject(refs);
    expect(byId.get('scene-001')).not.toHaveProperty('songId');
  });

  it('keeps baseline refs when a clip omits them, and replaces them when it carries them', () => {
    const baseline = withRefs();
    const payload = exportToClipStacker(baseline);
    // An external clip_stacker that predates the fields hands every clip back without them.
    const stripped = {
      ...payload,
      clips: payload.clips.map((clip) => ({
        id: clip.id,
        title: clip.title,
        timestamp: clip.timestamp,
        order: clip.order,
        status: clip.status,
        mediaUrl: clip.mediaUrl,
        description: clip.description,
      })),
    };
    const kept = clipStackerToProduction(stripped, baseline.episode, baseline);
    expect(kept.scenes.find((scene) => scene.id === 'scene-002')).toMatchObject(refs);

    const retargeted = {
      ...stripped,
      clips: stripped.clips.map((clip) =>
        clip.id === 'scene-002' ? { ...clip, songId: 'another-song' } : clip,
      ),
    };
    const replaced = clipStackerToProduction(retargeted, baseline.episode, baseline);
    expect(replaced.scenes.find((scene) => scene.id === 'scene-002')).toMatchObject({
      ...refs,
      songId: 'another-song',
    });
  });

  it('still parses a payload from a tool that knows nothing about refs', () => {
    const legacy = {
      project: 'Weeks on Fire - Episode 02',
      version: 'weeks_on_fire_v1',
      exportedAt: '2026-08-29T14:00:00.000Z',
      clips: [
        {
          id: 'scene-001',
          title: 'Feed up',
          timestamp: '00:00:00',
          order: 1,
          status: 'draft',
          mediaUrl: null,
          description: 'Grainy 480p warehouse establish.',
        },
      ],
      episodeHistory: [],
    };
    expect(parseClipStackerPayload(legacy)).not.toBeNull();
  });

  it('rejects a clip carrying a blank ref', () => {
    const payload = exportToClipStacker(withRefs());
    const bad = {
      ...payload,
      clips: payload.clips.map((clip) => ({ ...clip, cutawayId: '' })),
    };
    expect(parseClipStackerPayload(bad)).toBeNull();
  });
});

describe('committed scenes.json seed', () => {
  it('Episode 04 scene-003 points at the 911-wrong-shade cutaway its own description names', () => {
    const production = EpisodeProductionSchema.parse(episode04Json);
    const scene = production.scenes.find((candidate) => candidate.id === 'scene-003');

    expect(scene?.cutawayId).toBe('911-wrong-shade');
    // The pairing was already stated in prose; the ref is not a new claim.
    expect(scene?.description).toContain('content/cutaways/911-wrong-shade.json');
  });
});

describe('stored production migration', () => {
  const savedAt = '2026-08-01T00:00:00Z';

  function envelope(schemaVersion: unknown, production: unknown): unknown {
    return { schemaVersion, savedAt, production };
  }

  it('parses a v1 document without catalog refs', () => {
    const production = fixtureEpisode();
    expect(migrateStoredProduction(envelope(1, production))).toEqual(production);
  });

  it('parses a v1 document with catalog refs and keeps them', () => {
    const production = fixtureEpisode();
    const [first, second] = production.scenes;
    if (!first || !second) throw new Error('fixture needs two scenes');
    const linked: EpisodeProduction = {
      ...production,
      scenes: [first, { ...second, cutawayId: '911-wrong-shade', characterIds: ['lillith'] }],
    };

    const result = migrateStoredProduction(envelope(PRODUCTION_STORAGE_SCHEMA_VERSION, linked));
    expect(result).toEqual(linked);
  });

  it('is what parseStoredProduction calls', () => {
    const production = fixtureEpisode();
    expect(parseStoredProduction(envelope(1, production))).toEqual(
      migrateStoredProduction(envelope(1, production)),
    );
    expect(parseStoredProduction(envelope(2, production))).toBeNull();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a string', '{"schemaVersion":1}'],
    ['an empty object', {}],
    ['an array', []],
    ['no production', { schemaVersion: 1, savedAt }],
    ['a production of the wrong type', envelope(1, 'nope')],
    ['a production missing required fields', envelope(1, { episode: '02' })],
    ['a missing savedAt', { schemaVersion: 1, production: fixtureEpisode() }],
    ['a version of 0', envelope(0, fixtureEpisode())],
    ['a fractional version', envelope(1.5, fixtureEpisode())],
    ['a string version', envelope('1', fixtureEpisode())],
    ['a blank ref in a scene', envelope(1, withBlankRef())],
  ])('returns null for garbage: %s', (_label, data) => {
    expect(migrateStoredProduction(data)).toBeNull();
  });

  function withBlankRef(): EpisodeProduction {
    const production = fixtureEpisode();
    return {
      ...production,
      scenes: production.scenes.map((scene) => ({ ...scene, songId: '' })),
    };
  }

  describe('with a synthetic v2 that adds a required field', () => {
    // The next non-optional change: every scene must now carry `notes`.
    const SceneV2 = ProductionSceneSchema.extend({ notes: z.string() });
    const ProductionV2 = EpisodeProductionSchema.extend({ scenes: z.array(SceneV2) });
    type ProductionV2 = z.infer<typeof ProductionV2>;

    function fromV1(production: unknown): unknown {
      const parsed = EpisodeProductionSchema.parse(production);
      return { ...parsed, scenes: parsed.scenes.map((scene) => ({ ...scene, notes: '' })) };
    }

    const migrate = createStoredProductionMigrator<ProductionV2>({
      current: 2,
      schema: ProductionV2,
      fromVersion: { 1: fromV1 },
    });

    function editedV1(): EpisodeProduction {
      // In-progress Timeline edits saved by the previous build.
      const production = fixtureEpisode();
      return {
        ...production,
        scenes: production.scenes.map((scene) => ({ ...scene, title: `${scene.title} (edited)` })),
      };
    }

    it('today rejects a v2 document, so the edits it carries would be dropped', () => {
      const v2 = { ...editedV1(), scenes: editedV1().scenes.map((s) => ({ ...s, notes: 'n' })) };
      expect(parseStoredProduction(envelope(2, v2))).toBeNull();
    });

    it('accepts the v2 document once the table knows v2', () => {
      const v2 = { ...editedV1(), scenes: editedV1().scenes.map((s) => ({ ...s, notes: 'n' })) };
      expect(migrate(envelope(2, v2))).toEqual(v2);
    });

    it('carries a v1 document forward through fromV1 instead of discarding its edits', () => {
      const result = migrate(envelope(1, editedV1()));

      expect(result).not.toBeNull();
      expect(result?.scenes.map((scene) => scene.title)).toEqual([
        'Opening Berries & Gala Plan (edited)',
        'Corset & Ping-Pong in the Dark (edited)',
      ]);
      expect(result?.scenes.every((scene) => scene.notes === '')).toBe(true);
    });

    it('still rejects a v2 payload that fails the v2 schema', () => {
      expect(migrate(envelope(2, editedV1()))).toBeNull();
    });

    it('rejects versions newer than current', () => {
      const v3 = { ...editedV1(), scenes: editedV1().scenes.map((s) => ({ ...s, notes: 'n' })) };
      expect(migrate(envelope(3, v3))).toBeNull();
    });

    it('returns null when a step is missing, throws, or produces an invalid payload', () => {
      const noStep = createStoredProductionMigrator({
        current: 2,
        schema: ProductionV2,
        fromVersion: {},
      });
      expect(noStep(envelope(1, editedV1()))).toBeNull();

      const throwing = createStoredProductionMigrator({
        current: 2,
        schema: ProductionV2,
        fromVersion: {
          1: () => {
            throw new Error('corrupt');
          },
        },
      });
      expect(throwing(envelope(1, editedV1()))).toBeNull();

      const wrong = createStoredProductionMigrator({
        current: 2,
        schema: ProductionV2,
        fromVersion: { 1: (production) => production },
      });
      expect(wrong(envelope(1, editedV1()))).toBeNull();
    });

    it('chains steps one version at a time', () => {
      const calls: string[] = [];
      const chained = createStoredProductionMigrator({
        current: 3,
        schema: z.object({ n: z.number() }),
        fromVersion: {
          1: (value) => {
            calls.push('fromV1');
            return { n: (value as { n: number }).n + 1 };
          },
          2: (value) => {
            calls.push('fromV2');
            return { n: (value as { n: number }).n * 10 };
          },
        },
      });

      expect(chained(envelope(1, { n: 1 }))).toEqual({ n: 20 });
      expect(calls).toEqual(['fromV1', 'fromV2']);
      expect(chained(envelope(2, { n: 1 }))).toEqual({ n: 10 });
      expect(chained(envelope(3, { n: 5 }))).toEqual({ n: 5 });
    });
  });
});
