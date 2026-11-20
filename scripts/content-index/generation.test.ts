import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  GenerationSchema,
  generationErrors,
  generationIssues,
  mergeGeneration,
  XAI_SPEC,
} from './generation';
import { loadCutaways } from './load';
import { CutawayRecordSchema, CutawaySummarySchema } from './record-schemas';
import { buildCutawayRecords } from './records';
import { CutawaySchema } from './schemas';

describe('GenerationSchema', () => {
  it('accepts every field, for stills and for clips', () => {
    const parsed = GenerationSchema.parse({
      image: {
        model: 'grok-imagine-image-2.0',
        aspectRatio: '16:9',
        resolution: '2k',
        quality: 'medium',
        n: 1,
        responseFormat: 'b64_json',
      },
      video: {
        model: 'grok-imagine-video',
        aspectRatio: '9:16',
        resolution: '720p',
        durationSec: 6,
      },
    });
    expect(parsed.image?.resolution).toBe('2k');
    expect(parsed.video?.durationSec).toBe(6);
  });

  it('accepts an empty block and each medium on its own', () => {
    expect(GenerationSchema.parse({})).toEqual({});
    expect(GenerationSchema.parse({ image: { aspectRatio: '1:1' } })).toEqual({
      image: { aspectRatio: '1:1' },
    });
  });

  it.each([
    ['an unknown image aspect ratio', { image: { aspectRatio: '7:5' } }],
    ['an unknown image resolution', { image: { resolution: '4k' } }],
    ['an unknown quality', { image: { quality: 'high' } }],
    ['an unknown response format', { image: { responseFormat: 'png' } }],
    ['n below 1', { image: { n: 0 } }],
    ['n above the API maximum', { image: { n: XAI_SPEC.image.maxCount + 1 } }],
    ['a fractional n', { image: { n: 1.5 } }],
    ['an image-only aspect ratio on a clip', { video: { aspectRatio: 'auto' } }],
    ['a still resolution on a clip', { video: { resolution: '2k' } }],
    ['a clip resolution on a still', { image: { resolution: '720p' } }],
    ['a clip shorter than the API minimum', { video: { durationSec: 0 } }],
    [
      'a clip longer than the API maximum',
      { video: { durationSec: XAI_SPEC.video.maxDurationSec + 1 } },
    ],
    ['a snake_case API key (typo guard)', { image: { aspect_ratio: '16:9' } }],
    ['an empty model', { image: { model: '' } }],
    ['an unknown medium', { audio: {} }],
  ])('rejects %s', (_label, input) => {
    expect(GenerationSchema.safeParse(input).success).toBe(false);
  });

  it('names the allowed values in the error', () => {
    const result = GenerationSchema.safeParse({ image: { resolution: '4k' } });
    expect(JSON.stringify(result.error?.issues)).toContain('2k');
  });
});

describe('mergeGeneration', () => {
  it('layers field by field, later layers winning, per medium', () => {
    const merged = mergeGeneration(
      {
        image: { model: 'grok-imagine-image-2.0', aspectRatio: '16:9' },
        video: { durationSec: 6 },
      },
      { image: { aspectRatio: '9:16' } },
      undefined,
      { video: { resolution: '720p' } },
    );
    expect(merged).toEqual({
      image: { model: 'grok-imagine-image-2.0', aspectRatio: '9:16' },
      video: { durationSec: 6, resolution: '720p' },
    });
  });

  it('is undefined when no layer says anything, so untouched records stay byte-identical', () => {
    expect(mergeGeneration()).toBeUndefined();
    expect(mergeGeneration(undefined, {})).toBeUndefined();
    expect(mergeGeneration({ image: {} })).toBeUndefined();
  });

  it('does not mutate its inputs', () => {
    const defaults = { image: { aspectRatio: '16:9' as const } };
    mergeGeneration(defaults, { image: { aspectRatio: '1:1' } });
    expect(defaults).toEqual({ image: { aspectRatio: '16:9' } });
  });
});

describe('generationIssues', () => {
  it('rejects quality on the house default model, which does not support it', () => {
    const issues = generationIssues({ image: { quality: 'low' } });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain(XAI_SPEC.image.defaultModel);
    expect(issues[0]).toContain('Set image.model');
  });

  it('rejects quality on an explicit model that does not support it', () => {
    const issues = generationIssues({ image: { model: 'grok-imagine-image', quality: 'low' } });
    expect(issues[0]).toContain('Change image.model');
  });

  it('accepts quality on a model that supports it, and no quality anywhere', () => {
    expect(
      generationIssues({ image: { model: 'grok-imagine-image-2.0', quality: 'medium' } }),
    ).toEqual([]);
    expect(generationIssues({ image: { model: 'grok-imagine-image' } })).toEqual([]);
    expect(generationIssues({ video: { durationSec: 4 } })).toEqual([]);
  });
});

describe('generationErrors', () => {
  const quality = { image: { quality: 'low' as const } };

  it('flags segmentGeneration keys that name no segment', () => {
    const errors = generationErrors({
      id: 'well-fall',
      segments: [{ id: 'a' }, { id: 'b' }],
      segmentGeneration: { a: {}, zz: {} },
    });
    expect(errors).toEqual([
      'Cutaway well-fall: segmentGeneration names unknown segment id(s): zz (segments: a, b)',
    ]);
  });

  it('reports one problem shared by several segments once, naming them all', () => {
    const errors = generationErrors({
      id: 'c',
      segments: [
        { id: 'a', generation: quality },
        { id: 'b', generation: { image: { model: 'grok-imagine-image-2.0', quality: 'low' } } },
        { id: 'c', generation: quality },
      ],
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('(segment a, c)');
  });

  it('is empty for a cutaway with nothing to complain about', () => {
    expect(generationErrors({ id: 'c', segments: [{ id: 'a' }] })).toEqual([]);
    expect(generationErrors({ id: 'c' })).toEqual([]);
  });
});

describe('CutawaySchema', () => {
  const base = {
    id: 'demo',
    kind: 'musical',
    title: 'Demo',
    status: 'suggested',
    runtime: '~10s',
    episode: 'Ep 1',
    songId: 's',
    songTitle: 'S',
    summary: 'x',
    visualArc: 'y',
    tags: [],
  };

  it('accepts generationDefaults and segmentGeneration', () => {
    const parsed = CutawaySchema.parse({
      ...base,
      generationDefaults: { image: { aspectRatio: '16:9', resolution: '2k' } },
      segmentGeneration: { a: { image: { aspectRatio: '9:16' } } },
    });
    expect(parsed.generationDefaults?.image?.resolution).toBe('2k');
    expect(parsed.segmentGeneration?.a?.image?.aspectRatio).toBe('9:16');
  });

  it('fails on an invalid aspect or resolution enum, at either level', () => {
    expect(
      CutawaySchema.safeParse({ ...base, generationDefaults: { image: { aspectRatio: '5:7' } } })
        .success,
    ).toBe(false);
    expect(
      CutawaySchema.safeParse({
        ...base,
        segmentGeneration: { a: { image: { resolution: '8k' } } },
      }).success,
    ).toBe(false);
  });
});

describe('loadCutaways + emission', () => {
  const MARKDOWN = `# Demo

## A — First (0:00–0:06)

**Grok Imagine**
\`\`\`
Prompt for A
\`\`\`

## B — Second (0:06–0:12)

**Grok Imagine**
\`\`\`
Prompt for B
\`\`\`
`;

  const cutaway = (over: Record<string, unknown>) => ({
    id: 'demo',
    kind: 'musical',
    title: 'Demo',
    status: 'suggested',
    runtime: '~12s',
    episode: 'Ep 1',
    songId: 's',
    songTitle: 'S',
    summary: 'x',
    visualArc: 'y',
    tags: [],
    ...over,
  });

  const repoWith = (record: Record<string, unknown>, markdown?: string): string => {
    const root = mkdtempSync(join(tmpdir(), 'wof-generation-'));
    mkdirSync(join(root, 'content/cutaways'), { recursive: true });
    mkdirSync(join(root, 'prompts'), { recursive: true });
    if (markdown) writeFileSync(join(root, 'prompts/demo-segments.md'), markdown);
    writeFileSync(join(root, 'content/cutaways/demo.json'), JSON.stringify(record));
    return root;
  };

  const inlineSegment = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    label: id,
    start: '0:00',
    end: '0:06',
    durationSec: 6,
    onScreen: '',
    lyrics: '',
    musicCue: '',
    grokImaginePrompt: `Prompt ${id}`,
    geminiOmniPrompt: '',
    promptVariations: [],
    ...extra,
  });

  it('merges defaults, an inline segment block and the override map onto each segment', () => {
    const root = repoWith(
      cutaway({
        generationDefaults: { image: { model: 'grok-imagine-image-2.0', aspectRatio: '16:9' } },
        segmentGeneration: { b: { image: { aspectRatio: '1:1' } } },
        segments: [
          inlineSegment('a', { generation: { image: { resolution: '2k' } } }),
          inlineSegment('b'),
        ],
      }),
    );
    const [loaded] = loadCutaways(root);
    expect(loaded?.segments?.map((segment) => segment.generation)).toEqual([
      { image: { model: 'grok-imagine-image-2.0', aspectRatio: '16:9', resolution: '2k' } },
      { image: { model: 'grok-imagine-image-2.0', aspectRatio: '1:1' } },
    ]);
  });

  it('applies the override map to segments parsed from markdown, which carry no fields', () => {
    const root = repoWith(
      cutaway({
        segmentsSource: 'prompts/demo-segments.md',
        generationDefaults: { image: { aspectRatio: '16:9' } },
        segmentGeneration: { 'demo-b-second': { image: { aspectRatio: '9:16' } } },
      }),
      MARKDOWN,
    );
    const [loaded] = loadCutaways(root);
    expect(
      loaded?.segments?.map((segment) => [segment.id, segment.generation?.image?.aspectRatio]),
    ).toEqual([
      ['demo-a-first', '16:9'],
      ['demo-b-second', '9:16'],
    ]);
  });

  it('names the file and the field when generation settings are invalid', () => {
    const root = repoWith(
      cutaway({
        generationDefaults: { image: { aspectRatio: '7:5' } },
        segmentGeneration: { a: { image: { resolution: '8k' } } },
        segments: [inlineSegment('a')],
      }),
    );
    expect(() => loadCutaways(root)).toThrowError(/content\/cutaways\/demo\.json is invalid/);
    expect(() => loadCutaways(root)).toThrowError(/at generationDefaults\.image\.aspectRatio/);
    expect(() => loadCutaways(root)).toThrowError(/at segmentGeneration\.a\.image\.resolution/);
  });

  it('leaves segments untouched when no generation settings exist', () => {
    const root = repoWith(cutaway({ segments: [inlineSegment('a')] }));
    const [loaded] = loadCutaways(root);
    expect(loaded?.segments?.[0]).not.toHaveProperty('generation');
  });

  it('emits the effective block on each segment, and none of the authoring fields', () => {
    const root = repoWith(
      cutaway({
        generationDefaults: { image: { aspectRatio: '16:9' } },
        segmentGeneration: { b: { video: { durationSec: 4 } } },
        segments: [inlineSegment('a'), inlineSegment('b')],
      }),
    );
    const { records, summaries } = buildCutawayRecords(loadCutaways(root));
    const record = CutawayRecordSchema.parse(records[0]);
    expect(record.segments.map((segment) => segment.generation)).toEqual([
      { image: { aspectRatio: '16:9' } },
      { image: { aspectRatio: '16:9' }, video: { durationSec: 4 } },
    ]);
    expect(record).not.toHaveProperty('generationDefaults');
    expect(record).not.toHaveProperty('segmentGeneration');
    expect(CutawaySummarySchema.parse(summaries[0])).not.toHaveProperty('generationDefaults');
  });
});
