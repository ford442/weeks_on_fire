import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRecordCache, fetchRecord, recordUrl, RecordNotFoundError } from './records';

import type { RecordSource } from './records';

const source: RecordSource<{ id: string }> = {
  kind: 'songs',
  known: new Set(['daisy']),
  parse: (raw) => raw as { id: string },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  clearRecordCache();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchRecord', () => {
  it('fetches public/catalog/<kind>/<id>.json once and serves repeats from memory', async () => {
    fetchMock.mockResolvedValue(json({ id: 'daisy' }));
    await expect(fetchRecord(source, 'daisy')).resolves.toEqual({ id: 'daisy' });
    await expect(fetchRecord(source, 'daisy')).resolves.toEqual({ id: 'daisy' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/catalog/songs/daisy.json');
  });

  it('shares one request between concurrent callers', async () => {
    fetchMock.mockResolvedValue(json({ id: 'daisy' }));
    await Promise.all([fetchRecord(source, 'daisy'), fetchRecord(source, 'daisy')]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an id missing from the bundled index without a request', async () => {
    await expect(fetchRecord(source, 'nope')).rejects.toBeInstanceOf(RecordNotFoundError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats a 404 as not found', async () => {
    fetchMock.mockResolvedValue(json(null, 404));
    await expect(fetchRecord(source, 'daisy')).rejects.toBeInstanceOf(RecordNotFoundError);
  });

  it('retries after a network failure instead of caching it', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    fetchMock.mockResolvedValueOnce(json({ id: 'daisy' }));
    await expect(fetchRecord(source, 'daisy')).rejects.toThrow('offline');
    await expect(fetchRecord(source, 'daisy')).resolves.toEqual({ id: 'daisy' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces a record that fails its schema', async () => {
    fetchMock.mockResolvedValue(json({ id: 'daisy' }));
    const strict: RecordSource<never> = {
      ...source,
      parse: () => {
        throw new Error('invalid record');
      },
    };
    await expect(fetchRecord(strict, 'daisy')).rejects.toThrow('invalid record');
  });
});

describe('recordUrl', () => {
  it('encodes the id', () => {
    expect(recordUrl('cutaways', 'a b')).toBe('/catalog/cutaways/a%20b.json');
  });
});
