import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom has no matchMedia; `usePrefersReducedMotion` reads it on mount.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

window.scrollTo = () => undefined;

// Detail views fetch their full record from public/catalog/<kind>/<id>.json (src/data/records.ts).
// jsdom has no server, so answer those requests from the committed files.
const catalogFiles = import.meta.glob<string>('../../public/catalog/*/*.json', {
  query: '?raw',
  import: 'default',
});
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const match = /\/catalog\/([a-z-]+)\/([^/?#]+\.json)$/.exec(url);
  if (!match) return nativeFetch(input, init);
  const load = catalogFiles[`../../public/catalog/${match[1]}/${decodeURIComponent(match[2]!)}`];
  if (!load) return new Response('Not found', { status: 404 });
  return new Response(await load(), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
