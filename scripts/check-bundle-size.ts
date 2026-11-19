import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = 'dist/assets';
const MAIN_ENTRY_LIMIT_BYTES = 500 * 1024;

// Property names that only exist in the full generated catalogs (`songs.ts` carries every
// `stylePrompt` and lyric, `cutaways.ts` every segment `grokImaginePrompt`). Property names survive
// minification, so seeing one in a chunk means that chunk holds the heavy literals.
const HEAVY_CATALOG_MARKERS = ['stylePrompt', 'grokImaginePrompt'] as const;

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const files = readdirSync(DIST_DIR).filter((name) => name.endsWith('.js'));
const mainEntry = files.find((name) => name.startsWith('index-'));

if (!mainEntry) {
  console.error('check-bundle-size: no dist/assets/index-*.js entry chunk found');
  process.exit(1);
}

const mainPath = join(DIST_DIR, mainEntry);
const mainSize = statSync(mainPath).size;

console.log('Bundle sizes:');
for (const file of files.sort()) {
  const size = statSync(join(DIST_DIR, file)).size;
  const marker = file === mainEntry ? ' (main entry)' : '';
  console.log(`  ${file}: ${formatKb(size)}${marker}`);
}

if (mainSize > MAIN_ENTRY_LIMIT_BYTES) {
  console.error(
    `\ncheck-bundle-size: main entry ${mainEntry} is ${formatKb(mainSize)} — limit is ${formatKb(MAIN_ENTRY_LIMIT_BYTES)}`,
  );
  process.exit(1);
}

console.log(
  `\ncheck-bundle-size: main entry ${formatKb(mainSize)} is within ${formatKb(MAIN_ENTRY_LIMIT_BYTES)} limit`,
);

// The Timeline labels and links catalog records from the slim `{ id, title }` lists only. Walk the
// chunks it loads statically; none of them may be (or contain) the full songs / cutaways modules.
// The main entry is skipped: it loads on every route and is capped above.
function staticImports(source: string): string[] {
  return [...source.matchAll(/\b(?:from|import)\s*["']\.\/([^"']+\.js)["']/g)].flatMap((match) =>
    match[1] ? [match[1]] : [],
  );
}

const timelineEntry = files.find((name) => name.startsWith('TimelinePage-'));
if (!timelineEntry) {
  console.error('check-bundle-size: no dist/assets/TimelinePage-*.js chunk found');
  process.exit(1);
}

const closure = new Set<string>();
const pending = [timelineEntry];
while (pending.length > 0) {
  const name = pending.pop();
  if (name === undefined || closure.has(name)) continue;
  closure.add(name);
  pending.push(...staticImports(readFileSync(join(DIST_DIR, name), 'utf8')));
}

console.log('\nTimeline chunk loads:');
const heavy: string[] = [];
for (const name of [...closure].sort()) {
  const source = readFileSync(join(DIST_DIR, name), 'utf8');
  const markers = name === mainEntry ? [] : HEAVY_CATALOG_MARKERS.filter((m) => source.includes(m));
  const isGeneratedCatalogChunk = /^(songs|cutaways)-/.test(name);
  console.log(
    `  ${name}: ${formatKb(statSync(join(DIST_DIR, name)).size)}${name === mainEntry ? ' (main entry)' : ''}`,
  );
  if (markers.length > 0 && isGeneratedCatalogChunk) {
    heavy.push(`${name} contains ${markers.join(', ')}`);
  }
}

if (heavy.length > 0) {
  console.error(
    `\ncheck-bundle-size: the Timeline chunk pulls in the full song / cutaway catalogs:\n  ${heavy.join('\n  ')}\n` +
      'Use src/data/generated/catalog-refs.ts (or src/lib/catalogRefs.ts) instead of data/songs or data/suggestions.',
  );
  process.exit(1);
}

console.log('check-bundle-size: Timeline chunk has no full lyrics or segment prompts');
