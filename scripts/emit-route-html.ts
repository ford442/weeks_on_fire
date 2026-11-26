import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildRouteTable, type RouteEntry } from './content-index/route-table';

/**
 * Post-build head swap. GitHub Pages has no rewrites, so every hub deep link used to be
 * served by 404.html (HTTP 404, home-page meta). This copies dist/index.html to
 * dist/show/<route>/index.html and rewrites only <head>; the body stays client-rendered.
 * Run after check-index-encoding.ts.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Throws unless every local asset URL is absolute under `base` (e.g. `/weeks_on_fire/`). */
export function assertAbsoluteBase(html: string, base: string): void {
  const refs = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/gi)]
    .map((m) => m[1]!)
    .filter((url) => !/^(?:[a-z]+:)?\/\//i.test(url));
  if (refs.length === 0) throw new Error('emit-route-html: no local script/link assets found');
  const bad = refs.filter((url) => !url.startsWith(base));
  if (bad.length > 0) {
    throw new Error(
      `emit-route-html: asset URLs must start with ${base} (nested route pages break on a relative base). ` +
        `Build with VITE_BASE=${base}. Offending: ${bad.slice(0, 3).join(', ')}`,
    );
  }
}

type TagSpec = { name: string; pattern: RegExp; tag: string };

function tagSpecs(route: RouteEntry): TagSpec[] {
  const meta = (attr: 'name' | 'property', key: string, content: string): TagSpec => ({
    name: `${attr}="${key}"`,
    pattern: new RegExp(`<meta\\b[^>]*\\b${attr}="${key.replace(/:/g, '\\:')}"[^>]*>`, 'gi'),
    tag: `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`,
  });
  return [
    {
      name: '<title>',
      pattern: /<title>[\s\S]*?<\/title>/gi,
      tag: `<title>${escapeHtml(route.title)}</title>`,
    },
    meta('name', 'description', route.description),
    {
      name: 'rel="canonical"',
      pattern: /<link\b[^>]*\brel="canonical"[^>]*>/gi,
      tag: `<link rel="canonical" href="${escapeHtml(route.canonical)}" />`,
    },
    meta('property', 'og:type', route.ogType),
    meta('property', 'og:title', route.title),
    meta('property', 'og:description', route.description),
    meta('property', 'og:url', route.canonical),
    meta('property', 'og:image', route.ogImage),
    meta('property', 'og:image:alt', route.ogImageAlt),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', route.title),
    meta('name', 'twitter:description', route.description),
    meta('name', 'twitter:image', route.ogImage),
  ];
}

/** Replace (never append) each head tag; throws when a tag is missing or duplicated. */
export function renderRouteHtml(template: string, route: RouteEntry, base: string): string {
  assertAbsoluteBase(template, base);
  const headEnd = template.search(/<\/head>/i);
  if (headEnd < 0) throw new Error('emit-route-html: template has no </head>');
  let head = template.slice(0, headEnd);
  // Relative links in the body (e.g. ./llms.txt) would resolve under the nested route.
  const body = template.slice(headEnd).replace(/(\s(?:href|src))="\.\//g, `$1="${base}`);

  for (const spec of tagSpecs(route)) {
    const count = head.match(spec.pattern)?.length ?? 0;
    if (count !== 1) {
      throw new Error(
        `emit-route-html: expected exactly one ${spec.name} in <head>, found ${count}`,
      );
    }
    head = head.replace(spec.pattern, () => spec.tag);
  }
  return head + body;
}

/** `/show/songs/x/` → `<dist>/show/songs/x/index.html`. */
export function routeFile(distDir: string, path: string): string {
  return join(distDir, ...path.split('/').filter(Boolean), 'index.html');
}

export function emitRouteHtml(repoRoot: string, distDir: string, base: string): void {
  const absoluteBase = base.startsWith('/');
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const redirectTarget = absoluteBase ? `${normalizedBase}show/crew/` : '../show/crew/';
  const redirect = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(redirectTarget)}" />
<title>Redirecting to Crew</title></head>
<body><a href="${escapeHtml(redirectTarget)}">Continue to Crew</a></body></html>
`;
  const redirectFile = routeFile(distDir, '/crew/');
  mkdirSync(dirname(redirectFile), { recursive: true });
  writeFileSync(redirectFile, redirect);

  let template = readFileSync(join(distDir, 'index.html'), 'utf8');
  let routes = buildRouteTable(repoRoot);
  let assetBase = normalizedBase;
  if (!absoluteBase) {
    // Other relative-base routes keep the SPA fallback; the crew page needs root-relative assets
    // expressed from its own directory so it also works when mounted under an unknown prefix.
    routes = routes.filter((route) => route.path === '/show/crew/');
    assetBase = '../../';
    template = template.replace(/(\s(?:href|src))="\.\//g, `$1="${assetBase}`);
  }
  let bytes = 0;
  for (const route of routes) {
    const html = renderRouteHtml(template, route, assetBase);
    const file = routeFile(distDir, route.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    bytes += Buffer.byteLength(html);
  }
  console.log(
    `emit-route-html: wrote ${routes.length} route pages (${(bytes / 1024).toFixed(0)} KB) under dist/show/`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const repoRoot = join(import.meta.dirname, '..');
  emitRouteHtml(repoRoot, join(repoRoot, 'dist'), process.env.VITE_BASE ?? './');
}
