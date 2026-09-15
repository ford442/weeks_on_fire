import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadCartoons, loadSequences } from './load';
import type { ParsedSong } from './load';
import type { CartoonRecord, CutawayRecord, SequenceRecord } from './schemas';
import { validateContent, validateCartoons, validateSequences } from './validate';

function makeSong(overrides: Partial<ParsedSong> = {}): ParsedSong {
  return {
    id: 'song-1',
    title: 'Song One',
    genre: 'Pop',
    description: 'A song.',
    episode: '01',
    tags: [],
    instrumental: false,
    audioFile: null,
    sourceFile: 'songs/song-1.md',
    stylePrompt: '',
    lyrics: null,
    notes: null,
    ...overrides,
  };
}

function makeCutaway(overrides: Partial<CutawayRecord> = {}): CutawayRecord {
  return {
    id: 'cutaway-1',
    kind: 'musical',
    title: 'Cutaway One',
    status: 'suggested',
    runtime: '1m',
    episode: '01',
    songId: 'song-1',
    songTitle: 'Song One',
    summary: 'Summary.',
    visualArc: 'Arc.',
    tags: [],
    ...overrides,
  };
}

describe('validateContent', () => {
  let repoRoot: string;

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'wof-validate-'));
    mkdirSync(join(repoRoot, 'content'), { recursive: true });
    writeFileSync(join(repoRoot, 'content/gallery.json'), '[]');
  });

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it('passes for consistent songs and cutaways', () => {
    expect(() => validateContent(repoRoot, [makeSong()], [makeCutaway()], false)).not.toThrow();
  });

  it('flags a cutaway that references an unknown songId', () => {
    const cutaway = makeCutaway({ songId: 'missing-song' });
    expect(() => validateContent(repoRoot, [makeSong()], [cutaway], false)).toThrow(
      /unknown songId: missing-song/,
    );
  });

  it('flags duplicate song ids', () => {
    const songs = [makeSong(), makeSong()];
    expect(() => validateContent(repoRoot, songs, [makeCutaway()], false)).toThrow(
      /Duplicate song id: song-1/,
    );
  });

  it('flags duplicate cutaway ids', () => {
    const cutaways = [makeCutaway(), makeCutaway()];
    expect(() => validateContent(repoRoot, [makeSong()], cutaways, false)).toThrow(
      /Duplicate cutaway id: cutaway-1/,
    );
  });

  it('flags a segment count that disagrees with the segmentsSource edit timeline', () => {
    mkdirSync(join(repoRoot, 'prompts'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'prompts/cutaway-1-segments.md'),
      ['## Edit timeline', '```', '| 0:00-0:05 | A |', '| 0:05-0:10 | B |', '```', ''].join('\n'),
    );

    const cutaway = makeCutaway({
      segmentsSource: 'prompts/cutaway-1-segments.md',
      segments: [
        {
          id: 'seg-a',
          label: 'A',
          start: '0:00',
          end: '0:05',
          durationSec: 5,
          onScreen: 'A',
          lyrics: '',
          musicCue: '',
          grokImaginePrompt: '',
          geminiOmniPrompt: '',
          promptVariations: [],
        },
      ],
    });

    expect(() => validateContent(repoRoot, [makeSong()], [cutaway], false)).toThrow(
      /segment count 1 != edit timeline rows 2/,
    );
  });
});

function makeCartoon(overrides: Partial<CartoonRecord> = {}): CartoonRecord {
  return {
    id: 'cartoon-1',
    title: 'Cartoon One',
    premise: 'A gag.',
    visual: 'A still.',
    status: 'seed',
    tags: [],
    ...overrides,
  };
}

describe('validateCartoons', () => {
  it('passes for unique cartoon ids', () => {
    expect(() =>
      validateCartoons('/tmp', [makeCartoon(), makeCartoon({ id: 'cartoon-2' })]),
    ).not.toThrow();
  });

  it('flags duplicate cartoon ids', () => {
    expect(() => validateCartoons('/tmp', [makeCartoon(), makeCartoon()])).toThrow(
      /Duplicate cartoon id: cartoon-1/,
    );
  });
});

describe('loadCartoons', () => {
  let repoRoot: string;

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'wof-cartoons-'));
  });

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it('rejects a filename that does not match id', () => {
    mkdirSync(join(repoRoot, 'content/cartoons'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'content/cartoons/wrong-name.json'),
      JSON.stringify(makeCartoon({ id: 'courtesy-shuttle' })),
    );

    expect(() => loadCartoons(repoRoot)).toThrow(/id mismatch: courtesy-shuttle/);
  });

  it('loads cartoons whose filename matches id', () => {
    mkdirSync(join(repoRoot, 'content/cartoons'), { recursive: true });
    writeFileSync(join(repoRoot, 'content/cartoons/cartoon-1.json'), JSON.stringify(makeCartoon()));

    expect(loadCartoons(repoRoot)).toEqual([makeCartoon()]);
  });
});

function makeSequence(overrides: Partial<SequenceRecord> = {}): SequenceRecord {
  return {
    id: 'sequence-1',
    title: 'Sequence One',
    medium: 'unreal',
    runtime: '~16 seconds',
    durationSec: 16,
    premise: 'A lattice turns.',
    visual: 'Brass wire.',
    motion: 'One orbit.',
    tags: [],
    ...overrides,
  };
}

describe('validateSequences', () => {
  it('passes for unique sequence ids in range', () => {
    expect(() =>
      validateSequences('/tmp', [makeSequence(), makeSequence({ id: 'sequence-2' })]),
    ).not.toThrow();
  });

  it('flags duplicate sequence ids', () => {
    expect(() => validateSequences('/tmp', [makeSequence(), makeSequence()])).toThrow(
      /Duplicate sequence id: sequence-1/,
    );
  });

  it('flags a duration outside 10–120 seconds', () => {
    expect(() => validateSequences('/tmp', [makeSequence({ durationSec: 8 })])).toThrow(
      /durationSec 8 is outside 10–120 seconds/,
    );
  });
});

describe('loadSequences', () => {
  let repoRoot: string;

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'wof-sequences-'));
  });

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it('rejects a filename that does not match id', () => {
    mkdirSync(join(repoRoot, 'content/sequences'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'content/sequences/wrong-name.json'),
      JSON.stringify(makeSequence({ id: 'lattice-hymn' })),
    );

    expect(() => loadSequences(repoRoot)).toThrow(/id mismatch: lattice-hymn/);
  });

  it('loads sequences whose filename matches id', () => {
    mkdirSync(join(repoRoot, 'content/sequences'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'content/sequences/sequence-1.json'),
      JSON.stringify(makeSequence()),
    );

    expect(loadSequences(repoRoot)).toEqual([makeSequence()]);
  });
});
