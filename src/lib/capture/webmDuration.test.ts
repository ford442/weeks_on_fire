import { describe, expect, it } from 'vitest';

import {
  encodeSize,
  patchWebmDuration,
  readWebmDurationSec,
  withWebmDuration,
} from './webmDuration';

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));
const UNKNOWN_SIZE = [0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

/** The EBML header Chromium's MediaRecorder writes (DocType `webm`, version 4). */
const EBML_HEADER = [
  0x1a,
  0x45,
  0xdf,
  0xa3,
  0x9f,
  0x42,
  0x86,
  0x81,
  0x01,
  0x42,
  0xf7,
  0x81,
  0x01,
  0x42,
  0xf2,
  0x81,
  0x04,
  0x42,
  0xf3,
  0x81,
  0x08,
  0x42,
  0x82,
  0x84,
  ...ascii('webm'),
  0x42,
  0x87,
  0x81,
  0x04,
  0x42,
  0x85,
  0x81,
  0x02,
];

function element(id: number[], data: number[]): number[] {
  const size = encodeSize(data.length);
  if (!size) throw new Error('too big');
  return [...id, ...size, ...data];
}

function float64(value: number): number[] {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setFloat64(0, value);
  return [...out];
}

interface HeadOptions {
  timecodeScale?: number[];
  duration?: number[];
  seekHead?: boolean;
  /** Pad Info so its size field needs two bytes once Duration is added. */
  bigInfo?: boolean;
  segmentSize?: 'unknown' | 'known';
}

function webm(options: HeadOptions = {}): Uint8Array<ArrayBuffer> {
  const info = element(
    [0x15, 0x49, 0xa9, 0x66],
    [
      ...element([0x2a, 0xd7, 0xb1], options.timecodeScale ?? [0x0f, 0x42, 0x40]),
      ...element([0x4d, 0x80], ascii('Chrome')),
      ...element([0x57, 0x41], ascii('Chrome')),
      ...(options.duration ? element([0x44, 0x89], options.duration) : []),
      ...(options.bigInfo ? element([0xec], new Array<number>(100).fill(0)) : []),
    ],
  );
  const tracks = element([0x16, 0x54, 0xae, 0x6b], [0xae, 0x82, 0xd7, 0x81]);
  const cluster = [0x1f, 0x43, 0xb6, 0x75, ...UNKNOWN_SIZE, 0xe7, 0x81, 0x00, 0xa3, 0x81, 0x42];
  const seekHead = options.seekHead ? element([0x11, 0x4d, 0x9b, 0x74], [0xec, 0x80]) : [];
  const body = [...seekHead, ...info, ...tracks, ...cluster];
  const segmentSize =
    options.segmentSize === 'known' ? [...(encodeSize(body.length, 8) ?? [])] : UNKNOWN_SIZE;
  return new Uint8Array([...EBML_HEADER, 0x18, 0x53, 0x80, 0x67, ...segmentSize, ...body]);
}

function apply(bytes: Uint8Array, durationSec: number): Uint8Array {
  const patch = patchWebmDuration(bytes, durationSec);
  if (!patch) throw new Error('expected a patch');
  const out = new Uint8Array(patch.head.length + bytes.length - patch.consumed);
  out.set(patch.head);
  out.set(bytes.subarray(patch.consumed), patch.head.length);
  return out;
}

describe('patchWebmDuration', () => {
  it('reads no duration from a MediaRecorder-style head', () => {
    expect(readWebmDurationSec(webm())).toBeNull();
  });

  it('adds Duration to Info and leaves every later byte alone', () => {
    const original = webm();
    const patch = patchWebmDuration(original, 12.5);
    expect(patch).not.toBeNull();
    const patched = apply(original, 12.5);
    expect(readWebmDurationSec(patched)).toBeCloseTo(12.5, 6);
    expect(patched.length).toBe(original.length + 11);
    expect([...patched.subarray(patch?.head.length)]).toEqual([
      ...original.subarray(patch?.consumed),
    ]);
  });

  it('scales by a non-default TimecodeScale', () => {
    // 100 µs ticks: 12.5 s is 125000 ticks.
    const patched = apply(webm({ timecodeScale: [0x01, 0x86, 0xa0] }), 12.5);
    expect(readWebmDurationSec(patched)).toBeCloseTo(12.5, 6);
  });

  it('overwrites a zero Duration in place', () => {
    const original = webm({ duration: float64(0) });
    const patched = apply(original, 3);
    expect(patched.length).toBe(original.length);
    expect(readWebmDurationSec(patched)).toBe(3);
  });

  it('leaves a positive Duration alone', () => {
    expect(patchWebmDuration(webm({ duration: float64(4000) }), 9)).toBeNull();
  });

  it('widens the Info size field when Duration pushes it past one byte', () => {
    const patched = apply(webm({ bigInfo: true }), 61.25);
    expect(readWebmDurationSec(patched)).toBeCloseTo(61.25, 6);
  });

  it('grows a known Segment size along with Info', () => {
    const patched = apply(webm({ segmentSize: 'known' }), 7);
    expect(readWebmDurationSec(patched)).toBe(7);
    // Segment data must still end exactly at the end of the file.
    // An 8-byte size VINT: byte 0 is the marker (0x01), bytes 1-7 the value.
    const sizeField = patched.subarray(EBML_HEADER.length + 4, EBML_HEADER.length + 12);
    expect(sizeField[0]).toBe(0x01);
    let size = 0;
    for (const byte of sizeField.subarray(1)) size = size * 256 + byte;
    expect(EBML_HEADER.length + 12 + size).toBe(patched.length);
  });

  it('refuses a head with a SeekHead, whose offsets would shift', () => {
    expect(patchWebmDuration(webm({ seekHead: true }), 5)).toBeNull();
  });

  it('refuses bytes that are not WebM, and non-positive durations', () => {
    expect(patchWebmDuration(new Uint8Array([0, 1, 2, 3]), 5)).toBeNull();
    expect(patchWebmDuration(webm(), 0)).toBeNull();
    expect(patchWebmDuration(webm(), Number.NaN)).toBeNull();
  });
});

describe('withWebmDuration', () => {
  it('returns a blob that reports its duration and keeps its type', async () => {
    const blob = new Blob([webm()], { type: 'video/webm' });
    const patched = await withWebmDuration(blob, 30);
    expect(patched.type).toBe('video/webm');
    expect(readWebmDurationSec(new Uint8Array(await patched.arrayBuffer()))).toBe(30);
  });

  it('passes through a blob it cannot patch', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' });
    expect(await withWebmDuration(blob, 30)).toBe(blob);
  });
});

describe('encodeSize', () => {
  it('uses the shortest VINT, or a wider one on request', () => {
    expect([...(encodeSize(0x19) ?? [])]).toEqual([0x99]);
    expect([...(encodeSize(127) ?? [])]).toEqual([0x40, 0x7f]);
    expect([...(encodeSize(0x19, 2) ?? [])]).toEqual([0x40, 0x19]);
  });
});
