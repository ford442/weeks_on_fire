import { useEffect, useState } from 'react';

import { publicPath } from '../lib/basePath';

import type { RecordKind } from '../../scripts/content-index/record-schemas';

/**
 * Full catalog records, fetched one at a time from `public/catalog/<kind>/<id>.json`.
 *
 * The bundle carries only list-view summaries (`src/data/generated/*.ts`); a detail view asks for
 * the rest here. Every response is validated with the same Zod schema codegen wrote it with, and
 * kept in memory for the session, so a record prefetched on hover (or by a route loader) renders
 * synchronously when the view opens. Per-kind loaders live beside their index (`./songs.ts`,
 * `./suggestions.ts`) so one view's chunk never carries another catalog's summaries.
 */

export class RecordNotFoundError extends Error {
  constructor(
    readonly kind: RecordKind,
    readonly id: string,
  ) {
    super(`No ${kind} record "${id}"`);
    this.name = 'RecordNotFoundError';
  }
}

type Settled = { ok: true; value: unknown } | { ok: false; error: Error };

const settled = new Map<string, Settled>();
const inflight = new Map<string, Promise<unknown>>();

export function recordUrl(kind: RecordKind, id: string): string {
  return publicPath(`catalog/${kind}/${encodeURIComponent(id)}.json`);
}

export interface RecordSource<T> {
  kind: RecordKind;
  /** Ids in the bundled index; anything else is a 404 without a request. */
  known: ReadonlySet<string>;
  /** Validates the fetched JSON (and resolves anything bundle-relative, like still URLs). */
  parse: (raw: unknown) => T;
}

export function fetchRecord<T>(source: RecordSource<T>, id: string): Promise<T> {
  const key = `${source.kind}/${id}`;
  const done = settled.get(key);
  if (done) return done.ok ? Promise.resolve(done.value as T) : Promise.reject(done.error);
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const request = (async () => {
    if (!source.known.has(id)) throw new RecordNotFoundError(source.kind, id);
    const url = recordUrl(source.kind, id);
    const response = await fetch(url);
    if (response.status === 404) throw new RecordNotFoundError(source.kind, id);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return source.parse(await response.json());
  })().then(
    (value) => {
      settled.set(key, { ok: true, value });
      inflight.delete(key);
      return value;
    },
    (error: unknown) => {
      inflight.delete(key);
      const failure = error instanceof Error ? error : new Error(String(error));
      // A missing record stays missing; a network blip is retried on the next request.
      if (failure instanceof RecordNotFoundError) settled.set(key, { ok: false, error: failure });
      throw failure;
    },
  );
  inflight.set(key, request);
  return request;
}

/** Warm the cache (hover, focus, touchstart). Errors are left for the view that needs the record. */
export function prefetch<T>(source: RecordSource<T>, id: string): void {
  fetchRecord(source, id).catch(() => undefined);
}

export type RecordState<T> =
  | { status: 'loading'; record?: undefined; error?: undefined }
  | { status: 'ready'; record: T; error?: undefined }
  | { status: 'error'; record?: undefined; error: Error };

function peek<T>(key: string | undefined): RecordState<T> {
  const done = key ? settled.get(key) : undefined;
  if (!done) return { status: 'loading' };
  return done.ok
    ? { status: 'ready', record: done.value as T }
    : { status: 'error', error: done.error };
}

/** The full record for `id`: synchronous when already cached, otherwise fetched on mount. */
export function useRecord<T>(source: RecordSource<T>, id: string | undefined): RecordState<T> {
  const key = id ? `${source.kind}/${id}` : undefined;
  // Bumped when a fetch settles; the state itself always comes from the shared cache.
  const [, setVersion] = useState(0);
  const [failure, setFailure] = useState<{ key: string; error: Error }>();

  useEffect(() => {
    if (!id || !key || settled.has(key)) return;
    let live = true;
    fetchRecord(source, id).then(
      () => live && setVersion((version) => version + 1),
      (error: unknown) =>
        live &&
        setFailure({ key, error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      live = false;
    };
  }, [id, key, source]);

  const state = peek<T>(key);
  if (state.status === 'loading' && failure && failure.key === key) {
    return { status: 'error', error: failure.error };
  }
  return state;
}

/** Test hook: forget every fetched record. */
export function clearRecordCache(): void {
  settled.clear();
  inflight.clear();
}
