import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = 'dist/assets';
// Raw (pre-gzip) bytes. The entry is React + React Router's data router; Lighthouse CI
// (lighthouserc.json) budgets what is actually transferred.
const MAIN_ENTRY_LIMIT_BYTES = 360 * 1024;
/** View chunks that used to carry a whole catalog, and the catalog-index chunks they import. */
const ROUTE_CHUNK_LIMIT_BYTES = 100 * 1024;
const ROUTE_CHUNKS = ['Songs-', 'songs-', 'Suggestions-', 'suggestions-'] as const;
/** Every other lazy chunk: a ceiling that catches a catalog sliding back into a view. */
const ANY_CHUNK_LIMIT_BYTES = 200 * 1024;
/**
 * The graph editor's CodeMirror chunk (`/sequences/:id/edit`, desktop only). CodeMirror is one
 * library, loaded only when someone opens the editor, so it gets its own named budget instead of
 * the catch-all; the main entry must never carry it (checked below).
 */
const EDITOR_CHUNK = 'GraphCodeEditor-';
const EDITOR_CHUNK_LIMIT_BYTES = 480 * 1024;

/**
 * An emitted song or cutaway literal: a field only those records carry (a song's style prompt, a
 * cutaway segment's on-screen description) followed directly by a string. Component code reads these
 * fields but never writes them as literals, so a match means a full record is bundled. They live
 * only in public/catalog/<kind>/<id>.json now. (Cartoons, sequences and episodes still bundle
 * their own long fields; they are not split yet.)
 */
const RECORD_LITERAL = /\b(stylePrompt|onScreen):\s*[`"']/;

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

// Hub search is lazy: MiniSearch and the codegen'd corpus (`search-index.ts`) load with the search
// overlay or `/show/search`, never with the first paint. MiniSearch's error strings and the corpus
// record shape both survive minification.
const SEARCH_MARKERS: ReadonlyArray<[string, RegExp]> = [
  ['MiniSearch', /MiniSearch: duplicate ID/],
  // The minifier may quote with ", ' or ` (it currently prefers template literals).
  ['the search corpus', /id:["'`]song:[a-z0-9-]+["'`],type:["'`]song["'`]/],
];
const mainSource = readFileSync(mainPath, 'utf8');
const eagerSearch = SEARCH_MARKERS.filter(([, pattern]) => pattern.test(mainSource)).map(
  ([name]) => name,
);
if (eagerSearch.length > 0) {
  console.error(
    `\ncheck-bundle-size: main entry ${mainEntry} contains ${eagerSearch.join(' and ')}. ` +
      'Import src/lib/siteSearch.ts only from lazily loaded modules (SiteSearch, SearchPage).',
  );
  process.exit(1);
}
console.log('check-bundle-size: MiniSearch and the search corpus stay out of the main entry');

// The graph editor is lazy: CodeMirror and the graph schema (with Zod) load with
// `/sequences/:id/edit`, never with the first paint. Class names and the schema's own error text
// survive minification.
const EDITOR_MARKERS: ReadonlyArray<[string, RegExp]> = [
  ['CodeMirror', /cm-content/],
  ['the sequence graph schema', /material kind must be lit, cel, unlit or line/],
];
const eagerEditor = EDITOR_MARKERS.filter(([, pattern]) => pattern.test(mainSource)).map(
  ([name]) => name,
);
if (eagerEditor.length > 0) {
  console.error(
    `\ncheck-bundle-size: main entry ${mainEntry} contains ${eagerEditor.join(' and ')}. ` +
      'Import the graph editor only through the lazy /sequences/:id/edit route.',
  );
  process.exit(1);
}
console.log('check-bundle-size: CodeMirror and the graph schema stay out of the main entry');

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

// Route chunks stay small: the list views bundle summaries, not records.
const overBudget: string[] = [];
for (const prefix of ROUTE_CHUNKS) {
  const name = files.find((file) => file.startsWith(prefix));
  if (!name) {
    overBudget.push(`no ${prefix}*.js chunk (renamed? update ROUTE_CHUNKS)`);
    continue;
  }
  const size = statSync(join(DIST_DIR, name)).size;
  if (size > ROUTE_CHUNK_LIMIT_BYTES) {
    overBudget.push(`${name} is ${formatKb(size)} (limit ${formatKb(ROUTE_CHUNK_LIMIT_BYTES)})`);
  }
}
for (const name of files) {
  if (name === mainEntry) continue;
  const size = statSync(join(DIST_DIR, name)).size;
  const limit = name.startsWith(EDITOR_CHUNK) ? EDITOR_CHUNK_LIMIT_BYTES : ANY_CHUNK_LIMIT_BYTES;
  if (size > limit) {
    overBudget.push(`${name} is ${formatKb(size)} (limit ${formatKb(limit)})`);
  }
}
if (!files.some((name) => name.startsWith(EDITOR_CHUNK))) {
  overBudget.push(`no ${EDITOR_CHUNK}*.js chunk (renamed? update EDITOR_CHUNK)`);
}
if (overBudget.length > 0) {
  console.error(`\ncheck-bundle-size: chunk budgets exceeded:\n  ${overBudget.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `check-bundle-size: route chunks within ${formatKb(ROUTE_CHUNK_LIMIT_BYTES)}, the editor's CodeMirror within ${formatKb(EDITOR_CHUNK_LIMIT_BYTES)}, others within ${formatKb(ANY_CHUNK_LIMIT_BYTES)}`,
);

// No full song or cutaway record in any chunk, the entry included.
const bundledRecords = files.flatMap((name) => {
  const match = RECORD_LITERAL.exec(readFileSync(join(DIST_DIR, name), 'utf8'));
  return match ? [`${name} (${match[1]}: …)`] : [];
});
if (bundledRecords.length > 0) {
  console.error(
    `\ncheck-bundle-size: full catalog records are bundled:\n  ${bundledRecords.join('\n  ')}\n` +
      'Long fields belong in public/catalog/<kind>/<id>.json (see scripts/content-index/record-schemas.ts).',
  );
  process.exit(1);
}
console.log('check-bundle-size: no lyrics, style prompts or segment prompts in any JS chunk');
