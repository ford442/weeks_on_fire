import { publicPath } from './basePath';

/**
 * Registers the Workbox service worker that vite-plugin-pwa writes to `dist/sw.js`: it precaches
 * the app shell and catalog indexes, and caches view chunks, stills and per-record JSON as they
 * are used, so the bible reads offline after one visit. Audio is never cached. Production only;
 * the worker and its scope resolve against the site base, not the current deep route.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    void import('workbox-window').then(({ Workbox }) =>
      new Workbox(publicPath('sw.js'), { scope: publicPath('') }).register(),
    );
  });
}
