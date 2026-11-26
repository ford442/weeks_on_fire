import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { emitRouteHtml, escapeHtml, renderRouteHtml } from '../emit-route-html';

import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  buildRouteTable,
  clip,
  routePath,
  shortSeconds,
  type RouteEntry,
} from './route-table';

const repoRoot = join(import.meta.dirname, '../..');
const routes = buildRouteTable(repoRoot);

describe('route table', () => {
  it('has no duplicate paths, titles, descriptions or canonicals', () => {
    for (const key of ['path', 'title', 'description', 'canonical'] as const) {
      const values = routes.map((r) => r[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });

  it('includes every viewPaths entry', () => {
    const paths = new Set(routes.map((r) => r.path));
    // Parsed from source: importing src/routes/paths.ts drags .tsx into the scripts tsconfig.
    const source = readFileSync(join(repoRoot, 'src/routes/paths.ts'), 'utf8');
    const block = /export const viewPaths[^{]*\{([\s\S]*?)\n\};/.exec(source)?.[1] ?? '';
    const viewPaths = [...block.matchAll(/crewPath\('([^']*)'\)/g)].map((m) =>
      m[1] === '/' ? '/show' : `/show${m[1]}`,
    );
    expect(viewPaths.length).toBeGreaterThanOrEqual(10);
    for (const path of viewPaths) expect(paths).toContain(routePath(path));
  });

  it('keeps titles and descriptions within unfurl limits', () => {
    for (const route of routes) {
      expect(route.title.length, route.title).toBeLessThanOrEqual(TITLE_MAX);
      expect(route.description.length, route.description).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(route.description.length).toBeGreaterThan(20);
    }
  });

  it('never canonicalises a deep link to the home page', () => {
    const home = routes[0]!.canonical;
    expect(home).toBe('https://ford442.github.io/weeks_on_fire/show/');
    for (const route of routes.slice(1)) {
      expect(route.canonical).not.toBe(home);
      expect(route.canonical).toMatch(/^https:\/\/ford442\.github\.io\/weeks_on_fire\/show\/.+\/$/);
    }
  });

  it('formats helpers', () => {
    expect(shortSeconds('~6-8 seconds')).toBe('6–8s');
    expect(shortSeconds('~7 seconds')).toBe('7s');
    expect(shortSeconds('~4 min')).toBeUndefined();
    expect(clip('one two three four', 10)).toBe('one two…');
  });
});

const fixture = `<!doctype html>
<html><head>
<title>Home</title>
<meta
  name="description"
  content="home"
/>
<link rel="canonical" href="https://ford442.github.io/weeks_on_fire/" />
<meta property="og:type" content="website" />
<meta property="og:title" content="home" />
<meta property="og:description" content="home" />
<meta property="og:url" content="https://ford442.github.io/weeks_on_fire/" />
<meta property="og:image" content="x.webp" />
<meta property="og:image:alt" content="alt" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="home" />
<meta name="twitter:description" content="home" />
<meta name="twitter:image" content="x.webp" />
<script type="module" crossorigin src="/weeks_on_fire/assets/index-abc.js"></script>
<link rel="stylesheet" crossorigin href="/weeks_on_fire/assets/index-abc.css">
</head><body><a href="./llms.txt">llms</a></body></html>`;

const tricky: RouteEntry = {
  path: '/show/songs/x/',
  kind: 'song',
  title: `Tom's "Big" Song & <Co> — Weeks on Fire`,
  description: `It's "fine" & <calm>.`,
  canonical: 'https://ford442.github.io/weeks_on_fire/show/songs/x/',
  ogImage: 'https://ford442.github.io/weeks_on_fire/og-image.webp',
  ogImageAlt: `Alt's "x"`,
  ogType: 'music.song',
};

describe('emit-route-html', () => {
  const out = renderRouteHtml(fixture, tricky, '/weeks_on_fire/');

  it('replaces each tag exactly once', () => {
    for (const needle of [
      '<title>',
      'name="description"',
      'rel="canonical"',
      'property="og:type"',
      'property="og:title"',
      'property="og:description"',
      'property="og:url"',
      'property="og:image"',
      'property="og:image:alt"',
      'name="twitter:card"',
      'name="twitter:title"',
      'name="twitter:description"',
      'name="twitter:image"',
    ]) {
      expect(out.split(needle).length - 1, needle).toBe(1);
    }
    expect(out).not.toContain('content="home"');
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(out).toContain('href="https://ford442.github.io/weeks_on_fire/show/songs/x/"');
    expect(out).toContain('href="/weeks_on_fire/llms.txt"');
  });

  it('escapes quotes, ampersands, apostrophes and angle brackets', () => {
    expect(escapeHtml(`a'b"c&d<e>`)).toBe('a&#39;b&quot;c&amp;d&lt;e&gt;');
    expect(out).toContain(
      '<title>Tom&#39;s &quot;Big&quot; Song &amp; &lt;Co&gt; — Weeks on Fire</title>',
    );
    expect(out).toContain('content="It&#39;s &quot;fine&quot; &amp; &lt;calm&gt;."');
    expect(out).not.toContain(`It's "fine"`);
  });

  it('fails on a relative base', () => {
    const relative = fixture.replace(/\/weeks_on_fire\/assets/g, './assets');
    expect(() => renderRouteHtml(relative, tricky, '/weeks_on_fire/')).toThrow(/VITE_BASE/);
  });

  it('fails when a tag is missing or duplicated', () => {
    expect(() =>
      renderRouteHtml(
        fixture.replace(/<meta name="twitter:image"[^>]*>/, ''),
        tricky,
        '/weeks_on_fire/',
      ),
    ).toThrow(/twitter:image.*found 0/);
    expect(() =>
      renderRouteHtml(
        fixture.replace('<title>Home</title>', '<title>a</title><title>b</title>'),
        tricky,
        '/weeks_on_fire/',
      ),
    ).toThrow(/found 2/);
  });

  it.each([
    ['/weeks_on_fire/', '/weeks_on_fire/show/crew/', '/weeks_on_fire/assets/'],
    ['/preview', '/preview/show/crew/', '/preview/assets/'],
    ['/', '/show/crew/', '/assets/'],
    ['./', '../show/crew/', '../../assets/'],
  ])('emits the crew redirect and destination for base %s', (base, target, assets) => {
    const dist = mkdtempSync(join(tmpdir(), 'crew-routes-'));
    try {
      const template = fixture.replace(
        /\/weeks_on_fire\/assets\//g,
        base.startsWith('/') ? `${base.replace(/\/?$/, '/')}assets/` : './assets/',
      );
      writeFileSync(join(dist, 'index.html'), template);
      emitRouteHtml(repoRoot, dist, base);
      const redirect = readFileSync(join(dist, 'crew/index.html'), 'utf8');
      const crew = readFileSync(join(dist, 'show/crew/index.html'), 'utf8');
      expect(redirect).toContain(`content="0; url=${target}"`);
      expect(redirect).toContain(`href="${target}"`);
      expect(crew).toContain(`src="${assets}`);
      expect(crew).toContain(`href="${assets}`);
      expect(crew).toContain('https://ford442.github.io/weeks_on_fire/show/crew/');
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });
});
