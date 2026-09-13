import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseSegmentPromptsFile } from './parsers/segment-prompts';
import { formatFrontmatter } from './parsers/frontmatter';

const repoRoot = join(import.meta.dirname, '../..');

const SEGMENTS_SOURCE_MAP: Record<string, string> = {
  'choose-your-basalt': 'prompts/choose-your-basalt-segments.md',
  'studio-huddle': 'prompts/studio-huddle-segments.md',
  'spooky-telephone-poles': 'prompts/spooky-telephone-poles-segments.md',
  'monster-mash-finale': 'prompts/monster-mash-finale-segments.md',
  'molten-silver-sphere': 'prompts/molten-silver-sphere-segments.md',
  'the-soft-gyre': 'prompts/the-soft-gyre-segments.md',
  'the-long-way-up': 'prompts/the-long-way-up-segments.md',
  'ultra-refreshed-water-lab': 'prompts/ultra-refreshed-water-lab-segments.md',
  'mv-ultra-screech': 'prompts/glam-sham-poo-segments.md',
};

const SOFT_GYRE_STILLS: Record<string, string> = {
  'gyre-a-hover': 'ideas/soft-gyre/shot-a-hover.jpg',
  'gyre-b-weather': 'ideas/soft-gyre/shot-b-weather.jpg',
  'gyre-c-interior': 'ideas/soft-gyre/shot-c-interior.jpg',
  'gyre-d-answer': 'ideas/soft-gyre/shot-d-answer.jpg',
  'gyre-e-soft-set': 'ideas/soft-gyre/shot-e-soft-set.jpg',
};

function parseImportMap(tsSource: string): Map<string, string> {
  const map = new Map<string, string>();
  const importPattern = /import\s+(\w+)\s+from\s+['"](\.\.\/[^'"]+)['"]/g;
  for (const match of tsSource.matchAll(importPattern)) {
    const alias = match[1];
    const relPath = match[2];
    if (!alias || !relPath) continue;
    map.set(alias, relPath.replace(/^\.\.\/\.\.\//, ''));
  }
  return map;
}

function extractArray(tsSource: string, name: string): string {
  const pattern = new RegExp(`(?:export )?const ${name}(?::[^=]+)?\\s*=\\s*\\[`);
  const match = pattern.exec(tsSource);
  if (!match) throw new Error(`Could not find ${name}`);

  const arrayStart = match.index + match[0].length - 1;
  let depth = 0;
  let inString: "'" | '"' | '`' | null = null;
  let escaped = false;

  for (let i = arrayStart; i < tsSource.length; i += 1) {
    const char = tsSource[i];
    if (char === undefined) continue;

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === inString) inString = null;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      inString = char;
      continue;
    }

    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return tsSource.slice(arrayStart, i + 1);
    }
  }

  throw new Error(`Could not extract array for ${name}`);
}

function evalArray<T>(arraySource: string, importMap: Map<string, string>): T[] {
  const prelude = [...importMap.entries()]
    .map(([alias, path]) => `const ${alias} = ${JSON.stringify(path)};`)
    .join('\n');
  return new Function(`${prelude}\nreturn ${arraySource}`)() as T[];
}

function migrateSongs() {
  const songsTs = readFileSync(join(repoRoot, 'src/data/songs.ts'), 'utf8');
  const importMap = parseImportMap(songsTs);
  const rawImportPattern = /import\s+(\w+)\s+from\s+['"](\.\.\/\.\.\/songs\/[^'"]+)['"]/g;
  for (const match of songsTs.matchAll(rawImportPattern)) {
    const alias = match[1];
    const relPath = match[2];
    if (!alias || !relPath) continue;
    const filePath = relPath.replace(/^\.\.\/\.\.\//, '').split('?')[0];
    if (!filePath) continue;
    importMap.set(alias, readFileSync(join(repoRoot, filePath), 'utf8'));
  }

  const songSources = evalArray<Record<string, unknown>>(
    extractArray(songsTs, 'songSources'),
    importMap,
  );

  for (const source of songSources) {
    const sourceFile = String(source.sourceFile);
    const path = join(repoRoot, 'songs', sourceFile);
    const raw = String(source.raw);
    const body = raw.startsWith('---') ? raw.replace(/^---[\s\S]*?---\n?/, '') : raw;

    writeFileSync(
      path,
      `${formatFrontmatter({
        id: source.id,
        title: source.title,
        genre: source.genre,
        description: source.description,
        episode: source.episode,
        tags: source.tags,
        instrumental: source.instrumental ?? false,
        audioFile: source.audioFile ?? null,
      })}${body}`,
    );
  }
}

function serializeCutaway(cutaway: Record<string, unknown>) {
  const id = String(cutaway.id);
  const segmentsSource = SEGMENTS_SOURCE_MAP[id];
  const output: Record<string, unknown> = {
    id,
    kind: cutaway.kind,
    title: cutaway.title,
    status: cutaway.status,
    runtime: cutaway.runtime,
    episode: cutaway.episode,
    songId: cutaway.songId,
    songTitle: cutaway.songTitle,
    summary: cutaway.summary,
    visualArc: cutaway.visualArc,
    tags: cutaway.tags,
  };

  if (segmentsSource) {
    const parsed = parseSegmentPromptsFile(repoRoot, segmentsSource, id);
    if (parsed.length > 0) {
      output.segmentsSource = segmentsSource;
      if (id === 'the-soft-gyre') output.segmentStills = SOFT_GYRE_STILLS;
    }
  }

  if (!output.segmentsSource) {
    output.segments = (cutaway.segments as Array<Record<string, unknown>>).map((segment) => ({
      id: segment.id,
      label: segment.label,
      start: segment.start,
      end: segment.end,
      durationSec: segment.durationSec,
      onScreen: segment.onScreen,
      lyrics: segment.lyrics,
      musicCue: segment.musicCue,
      grokImaginePrompt: segment.grokImaginePrompt,
      geminiOmniPrompt: segment.geminiOmniPrompt,
      promptVariations: segment.promptVariations ?? [],
    }));
  }

  return output;
}

function migrateCutaways() {
  const cutawaysDir = join(repoRoot, 'content/cutaways');
  if (existsSync(cutawaysDir) && readdirSync(cutawaysDir).length > 0) {
    console.log('content/cutaways already populated — skipping cutaway migration');
    return;
  }

  const suggestionsTs = readFileSync(join(repoRoot, 'src/data/suggestions.ts'), 'utf8');
  if (!suggestionsTs.includes('const coreCutaways')) {
    throw new Error(
      'Legacy coreCutaways not found. Restore *Cutaways.ts from git or author content/cutaways/*.json manually.',
    );
  }

  const importMap = parseImportMap(suggestionsTs);
  const coreCutaways = evalArray<Record<string, unknown>>(
    extractArray(suggestionsTs, 'coreCutaways'),
    importMap,
  );

  const extensionCutaways: Record<string, unknown>[] = [];
  console.warn(
    'Legacy *Cutaways.ts modules are no longer in src/data — migrating core cutaways only',
  );

  const all = [...coreCutaways, ...extensionCutaways];
  mkdirSync(cutawaysDir, { recursive: true });

  for (const cutaway of all) {
    writeFileSync(
      join(cutawaysDir, `${String(cutaway.id)}.json`),
      `${JSON.stringify(serializeCutaway(cutaway as Record<string, unknown>), null, 2)}\n`,
    );
  }
}

function migrateGallery() {
  const source = readFileSync(join(repoRoot, 'src/data/films.ts'), 'utf8');
  const importMap = parseImportMap(source);
  const scenes = evalArray<Record<string, unknown>>(extractArray(source, 'filmScenes'), importMap);

  const output = scenes.map((scene) => ({
    id: scene.id,
    imageKind: scene.imageKind,
    episode: scene.episode,
    title: scene.title,
    prompt: scene.prompt,
    promptVariations: scene.promptVariations ?? [],
    imagePath: scene.imageUrl ? importMap.get(String(scene.imageUrl)) : undefined,
    mediaType: scene.mediaType,
    musicCue: scene.musicCue,
    musicStyle: scene.musicStyle,
    description: scene.description,
    theme: scene.theme,
    tags: scene.tags,
  }));

  writeFileSync(join(repoRoot, 'content/gallery.json'), `${JSON.stringify(output, null, 2)}\n`);
}

function migrateCharacters() {
  const source = readFileSync(join(repoRoot, 'src/data/characters.ts'), 'utf8');
  const importMap = parseImportMap(source);
  const characters = evalArray<Record<string, unknown>>(
    extractArray(source, 'seriesCharacters'),
    importMap,
  );

  const output = characters.map((character) => ({
    id: character.id,
    name: character.name,
    nameNote: character.nameNote,
    role: character.role,
    episodes: character.episodes,
    traits: character.traits,
    bio: character.bio,
    props: character.props,
    tags: character.tags,
    imagePath: character.imageUrl ? importMap.get(String(character.imageUrl)) : undefined,
  }));

  writeFileSync(join(repoRoot, 'content/characters.json'), `${JSON.stringify(output, null, 2)}\n`);
}

function migrateDaisyBell() {
  const source = readFileSync(join(repoRoot, 'src/data/daisyBell.ts'), 'utf8');
  const importMap = parseImportMap(source);

  const metaMatch = source.match(/export const daisyBellMeta = (\{[\s\S]*?\}) as const;/);
  const subjectLockMatch = source.match(
    /export const daisyBellSubjectLock =\n\s*'((?:\\'|[^'])*)';/,
  );
  const stylishMatch = source.match(/export const daisyBellStylish1890s =\n\s*'((?:\\'|[^'])*)';/);
  const workingMatch = source.match(/export const daisyBellWorking1890s =\n\s*'((?:\\'|[^'])*)';/);

  const subjectLock = (subjectLockMatch?.[1] ?? '').replace(/\\'/g, "'");
  const stylish1890s = (stylishMatch?.[1] ?? '').replace(/\\'/g, "'");
  const working1890s = (workingMatch?.[1] ?? '').replace(/\\'/g, "'");

  importMap.set('daisyBellSubjectLock', subjectLock);
  importMap.set('daisyBellStylish1890s', stylish1890s);
  importMap.set('daisyBellWorking1890s', working1890s);

  const output = {
    meta: metaMatch?.[1] ? eval(`(${metaMatch[1]})`) : {},
    subjectLock,
    stylish1890s,
    working1890s,
    sequence: evalArray<Record<string, unknown>>(
      extractArray(source, 'daisyBellSequence'),
      importMap,
    ),
    sights: evalArray<Record<string, unknown>>(extractArray(source, 'daisyBellSights'), importMap),
    frames: evalArray<Record<string, unknown>>(
      extractArray(source, 'daisyBellFrames'),
      importMap,
    ).map((frame) => ({
      id: frame.id,
      order: frame.order,
      title: frame.title,
      treatment: frame.treatment,
      beat: frame.beat,
      description: frame.description,
      prompt: frame.prompt,
      imagePath: frame.imageUrl ? importMap.get(String(frame.imageUrl)) : undefined,
      tags: frame.tags,
    })),
  };

  writeFileSync(join(repoRoot, 'content/daisy-bell.json'), `${JSON.stringify(output, null, 2)}\n`);
}

function main() {
  migrateSongs();
  migrateCutaways();
  migrateGallery();
  migrateCharacters();
  migrateDaisyBell();
  console.log('Migration complete.');
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
