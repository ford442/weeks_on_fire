import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { assertDistinctAudioNames, servedAudioName, servedAudioPath } from './audio-names';
import { emitRecordFiles } from './emit';
import { pictureQuery } from './image-variants';
import { syncOwnedDirectory } from './output';
import { CutawayRecordSchema, SongRecordSchema } from './record-schemas';
import { buildCutawayRecords, buildSongRecords } from './records';

import type { ParsedSong } from './load';
import type { CutawayRecord } from './schemas';

const song = (over: Partial<ParsedSong> = {}): ParsedSong => ({
  id: 'daisy',
  title: 'Daisy',
  added: '2026-01-01',
  genre: 'Pop',
  description: 'A bicycle.',
  episode: 'ep1',
  tags: ['bell'],
  instrumental: false,
  audioFile: null,
  status: 'generated',
  sourceFile: 'Daisy.md',
  stylePrompt: 'Waltz, 3/4.',
  lyrics: 'Daisy, Daisy',
  notes: null,
  ...over,
});

const segment = (id: string, stillImagePath?: string) => ({
  id,
  label: id,
  start: '0:00',
  end: '0:05',
  durationSec: 5,
  onScreen: 'A well.',
  lyrics: '',
  musicCue: '',
  grokImaginePrompt: 'Prompt',
  geminiOmniPrompt: 'Prompt',
  promptVariations: [],
  ...(stillImagePath ? { stillImagePath } : {}),
});

const cutaway = (over: Partial<CutawayRecord> = {}): CutawayRecord => ({
  id: 'well-fall',
  kind: 'scene',
  title: 'Well Fall',
  status: 'suggested',
  runtime: '~10s',
  episode: 'Ep 1',
  songId: 'daisy',
  songTitle: 'Daisy',
  summary: 'Down.',
  visualArc: 'Lip to dark.',
  tags: [],
  segmentStills: { a: 'images/a.jpg' },
  segmentsSource: 'prompts/well.md',
  segments: [segment('a', 'images/a.jpg'), segment('b')],
  sightBank: [
    {
      id: 's1',
      title: 'Sight',
      category: 'c',
      lane: 'fall',
      prompt: 'p',
      description: 'd',
    },
  ],
  ...over,
});

describe('buildSongRecords', () => {
  it('bundles the summary and keeps prompts, lyrics and notes for the record', () => {
    const { summaries, records } = buildSongRecords([song({ audioFile: 'Daisy.mp3' })]);
    expect(summaries[0]).not.toHaveProperty('stylePrompt');
    expect(summaries[0]).not.toHaveProperty('lyrics');
    expect(summaries[0]).not.toHaveProperty('notes');
    expect(summaries[0]?.audioFile).toBe('Daisy.mp3');
    expect(SongRecordSchema.parse(records[0])).toEqual(records[0]);
    expect(records[0]?.lyrics).toBe('Daisy, Daisy');
  });

  it('drops a null audioFile rather than emitting it', () => {
    expect(buildSongRecords([song()]).summaries[0]).not.toHaveProperty('audioFile');
  });
});

describe('buildCutawayRecords', () => {
  it('replaces segments and sights with counts in the summary', () => {
    const { summaries, records, stillPaths } = buildCutawayRecords([cutaway()]);
    expect(summaries[0]).toMatchObject({ segmentCount: 2, sightCount: 1 });
    expect(summaries[0]).not.toHaveProperty('segments');
    expect(summaries[0]).not.toHaveProperty('sightBank');
    expect(records[0]).not.toHaveProperty('segmentsSource');
    expect(records[0]).not.toHaveProperty('segmentStills');
    expect(CutawayRecordSchema.parse(records[0]).segments).toHaveLength(2);
    expect(stillPaths).toEqual(['images/a.jpg']);
  });
});

describe('emitRecordFiles', () => {
  it('writes index.json plus one file per record', () => {
    const record: { id: string; body: string } = { id: 'a', body: 'long' };
    const files = emitRecordFiles([{ id: 'a' }], [record]);
    expect(Object.keys(files).sort()).toEqual(['a.json', 'index.json']);
    expect(JSON.parse(files['a.json']!)).toEqual({ id: 'a', body: 'long' });
    expect(files['index.json']!.endsWith('\n')).toBe(true);
  });
});

describe('syncOwnedDirectory', () => {
  const options = { label: 'catalog', fixHint: 'Run codegen.' };

  it('writes outputs and deletes files codegen no longer writes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wof-catalog-'));
    writeFileSync(join(dir, 'removed.json'), '{}');
    syncOwnedDirectory(dir, { 'kept.json': '{"a":1}\n' }, { ...options, check: false });
    expect(readdirSync(dir)).toEqual(['kept.json']);
    expect(readFileSync(join(dir, 'kept.json'), 'utf8')).toBe('{"a":1}\n');
  });

  it('fails check mode on a stale or orphaned file and touches nothing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wof-catalog-'));
    writeFileSync(join(dir, 'kept.json'), 'old');
    writeFileSync(join(dir, 'orphan.json'), '{}');
    expect(() =>
      syncOwnedDirectory(dir, { 'kept.json': 'new' }, { ...options, check: true }),
    ).toThrow(/kept\.json[\s\S]*|orphan\.json/);
    expect(readdirSync(dir).sort()).toEqual(['kept.json', 'orphan.json']);
    expect(readFileSync(join(dir, 'kept.json'), 'utf8')).toBe('old');
  });

  it('names orphans in check mode even when every output is current', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wof-catalog-'));
    writeFileSync(join(dir, 'kept.json'), 'same');
    writeFileSync(join(dir, 'orphan.json'), '{}');
    expect(() =>
      syncOwnedDirectory(dir, { 'kept.json': 'same' }, { ...options, check: true }),
    ).toThrow(/orphan\.json/);
  });
});

describe('servedAudioName', () => {
  it('slugs punctuation hosts mangle and keeps plain names', () => {
    expect(servedAudioName("Everything's+Made+for+Love_.mp3")).toBe(
      'Everything_s_Made_for_Love.mp3',
    );
    expect(servedAudioName('I’m+the+Rainbow+Fog.mp3')).toBe('I_m_the_Rainbow_Fog.mp3');
    expect(servedAudioName('The+Monster+Mash+(Finale).mp3')).toBe('The_Monster_Mash_Finale.mp3');
    expect(servedAudioName('glam-sham-poo.mp3')).toBe('glam-sham-poo.mp3');
    expect(servedAudioPath('Daisy+Bell.mp3')).toBe('audio/Daisy_Bell.mp3');
  });

  it('refuses two sources that would share a served name', () => {
    expect(() => assertDistinctAudioNames(['A+B.mp3', 'A_B.mp3'])).toThrow(/audio\/A_B\.mp3/);
    expect(() => assertDistinctAudioNames(['A.mp3', 'B.mp3'])).not.toThrow();
  });
});

describe('pictureQuery', () => {
  it('keeps the source format as the fallback and skips formats it does not re-encode', () => {
    expect(pictureQuery('images/a.jpg')).toBe('?w=480;960;1440&format=avif;webp;jpg&as=picture');
    expect(pictureQuery('images/a.PNG')).toBe('?w=480;960;1440&format=avif;webp;png&as=picture');
    expect(pictureQuery('images/a.webp')).toBe('?w=480;960;1440&format=avif;webp&as=picture');
    expect(pictureQuery('images/a.gif')).toBeNull();
  });
});
