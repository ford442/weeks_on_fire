/**
 * Where the app is mounted. GitHub Pages serves it under `/weeks_on_fire/` (or the older
 * `/weeks-on-fire/`); a plain `npm run build` uses a relative base and may sit at the root.
 */
export function routerBasename(pathname: string = window.location.pathname): string {
  if (!import.meta.env.PROD) return '/';
  const first = pathname.split('/').filter(Boolean)[0];
  if (first === 'weeks-on-fire' || first === 'weeks_on_fire') {
    return `/${first}`;
  }
  return '/';
}

/**
 * Absolute URL path for a file in `public/` (`catalog/songs/x.json`, `audio/x.mp3`). A build with an
 * absolute base (`--base /weeks_on_fire/`) knows its prefix; a relative-base build (`./`) cannot
 * resolve `public/` paths against a deep route like `/show/songs/x`, so it uses the router basename.
 */
export function publicPath(file: string): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.startsWith('/') ? base : `${routerBasename().replace(/\/$/, '')}/`;
  return `${prefix}${file.replace(/^\//, '')}`;
}
