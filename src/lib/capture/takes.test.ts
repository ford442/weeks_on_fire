import { afterEach, describe, expect, it, vi } from 'vitest';

import { isHostedMediaUrl, isSessionMediaUrl } from '../mediaUrl';

import {
  addTake,
  findTakeByUrl,
  getTakes,
  removeTake,
  resetTakesForTest,
  subscribeTakes,
  takeFileName,
} from './takes';

const input = {
  kind: 'sequence' as const,
  sourceId: 'hose-chase',
  title: 'Hose Chase',
  blob: new Blob([new Uint8Array(2048)], { type: 'video/webm' }),
  extension: 'webm',
  durationSec: 30.02,
  expectedDurationSec: 30,
};

afterEach(() => resetTakesForTest());

describe('session takes', () => {
  it('holds each take as a blob URL, newest first', () => {
    const first = addTake(input);
    const second = addTake({ ...input, sourceId: 'kick-lattice' });
    expect(getTakes()).toEqual([second, first]);
    expect(first.url.startsWith('blob:')).toBe(true);
    expect(first.sizeBytes).toBe(2048);
    expect(first.mimeType).toBe('video/webm');
    expect(findTakeByUrl(first.url)).toBe(first);
  });

  it('names the file after what was recorded and when', () => {
    const take = addTake(input, new Date(2026, 10, 21, 4, 15, 9));
    expect(take.fileName).toBe('wof-sequence-hose-chase-20261121-041509.webm');
    expect(takeFileName('cutaway', 'color-whip', new Date(2026, 0, 2, 3, 4, 5), 'mp4')).toBe(
      'wof-cutaway-color-whip-20260102-030405.mp4',
    );
  });

  it('revokes the URL and notifies subscribers on remove', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const listener = vi.fn();
    const unsubscribe = subscribeTakes(listener);
    const take = addTake(input);
    removeTake(take.id);
    expect(revoke).toHaveBeenCalledWith(take.url);
    expect(getTakes()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    addTake(input);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps the same list object until something changes', () => {
    addTake(input);
    expect(getTakes()).toBe(getTakes());
  });
});

describe('media URL kinds', () => {
  it('tells session takes from hosted links', () => {
    expect(isSessionMediaUrl('blob:http://localhost:5173/1234')).toBe(true);
    expect(isSessionMediaUrl('https://i.imgur.com/a.mp4')).toBe(false);
    expect(isHostedMediaUrl('https://drive.google.com/file/d/x')).toBe(true);
    expect(isHostedMediaUrl('http://example.com/a.webm')).toBe(true);
    expect(isHostedMediaUrl('blob:http://localhost/1')).toBe(false);
    expect(isHostedMediaUrl('videos/local.mp4')).toBe(false);
    expect(isHostedMediaUrl('')).toBe(false);
    expect(isHostedMediaUrl(undefined)).toBe(false);
  });
});
