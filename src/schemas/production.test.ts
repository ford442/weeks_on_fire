import { describe, expect, it } from 'vitest';

import { clipStackerToProduction, exportToClipStacker } from '../data/production';
import type { EpisodeProduction } from '../data/production';
import { ClipStackerPayloadSchema, parseClipStackerPayload } from './production';

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
        status: 'draft',
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
