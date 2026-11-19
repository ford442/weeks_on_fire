import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  loadCartoons,
  loadSequences,
  loadCharacters,
  loadCutaways,
  loadSceneBoards,
  loadGallery,
  loadSongs,
  loadCrew,
  loadTaxonomy,
  loadEpisodes as loadEpisodeBible,
  loadProductions,
} from './load';
import { buildCatalogGraph, type CatalogGraph } from './catalog-graph';
import { syncOutputs } from './output';
import { buildRouteTable, routePath, type RouteEntry } from './route-table';
import { parseFrontmatter } from './parsers/frontmatter';
import { REPO_BASE, SITE_BASE, siteViews } from './views';

const repoRoot = join(import.meta.dirname, '../..');
const publicDir = join(repoRoot, 'public');
const checkMode = process.argv.includes('--check');

const episodeLabels = new Map(loadTaxonomy(repoRoot).episodes.map((e) => [e.id, e.label]));
/** Catalog entries store canonical episode ids; agent docs show the label. */
const episodeLabel = (id: string) => episodeLabels.get(id) ?? id;

interface EpisodeSummary {
  number: string;
  title: string;
  status: string;
  runtime: string;
}

function loadEpisodes(): EpisodeSummary[] {
  const episodesDir = join(repoRoot, 'episodes');
  if (!existsSync(episodesDir)) return [];

  return readdirSync(episodesDir)
    .filter((name) => /^episode-\d+$/.test(name))
    .sort()
    .map((folder) => {
      const number = folder.replace('episode-', '');
      const synopsisPath = join(episodesDir, folder, 'synopsis.md');
      if (!existsSync(synopsisPath)) {
        return {
          number,
          title: `Episode ${number}`,
          status: 'unknown',
          runtime: '',
        };
      }

      const raw = readFileSync(synopsisPath, 'utf8');
      const { frontmatter } = parseFrontmatter(raw);
      return {
        number,
        title: frontmatterText(frontmatter.title, `Episode ${number}`),
        status: frontmatterText(frontmatter.status, 'unknown'),
        runtime: frontmatterText(frontmatter.runtime_approx, ''),
      };
    });
}

function frontmatterText(value: unknown, fallback: string): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function episodeRepoTree(number: string): string {
  return `${REPO_BASE}/tree/main/episodes/episode-${number}`;
}

function episodeBlob(number: string, file: string): string {
  return `${REPO_BASE}/blob/main/episodes/episode-${number}/${file}`;
}

function emitLlmsTxt(
  routes: RouteEntry[],
  songs: ReturnType<typeof loadSongs>,
  gallery: ReturnType<typeof loadGallery>,
  episodes: EpisodeSummary[],
): string {
  const viewLines = routes
    .filter((route) => route.kind === 'view')
    .map((route) => `- ${route.label} (${route.canonical}) — ${route.summary}`)
    .join('\n');

  const featuredScenes = gallery
    .slice(0, 6)
    .map((scene) => `| ${scene.title} | ${episodeLabel(scene.episode)} | ${scene.theme ?? '—'} |`)
    .join('\n');

  const featuredTracks = songs
    .slice(0, 6)
    .map(
      (song) =>
        `- ${song.title} (${song.subgenre ?? song.genre}${song.instrumental ? ', instrumental' : ''})`,
    )
    .join('\n');

  const episodeLines = episodes
    .map((ep) => `- ${ep.title}: ${episodeRepoTree(ep.number)}`)
    .join('\n');

  return `# Weeks on Fire

> AI-generated short-film series production hub: Grok Imagine visuals, Minimax Music cues, screenplays, and open prompt archives.

- Live site: ${SITE_BASE}/
- Source: ${REPO_BASE}
- Full agent brief: ${SITE_BASE}/llms-full.txt

## What this is

Weeks on Fire is a personal cinematic experiment combining:
- **Visuals**: stills and frames from Grok Imagine (xAI)
- **Music**: Minimax Music style prompts, lyrics, and cutaway cues
- **Writing**: episode synopses, screenplays, scene breakdowns
- **Hub UI**: React + Vite gallery with production views

## Primary content (crawl these)

### Live app views (SPA; HTML shell also embeds key titles)
${viewLines}

### Search and catalog graph
- Hub search: ${SITE_BASE}/show/search/?q=<terms> — one ranked list across songs, cutaways, scenes, stills, episodes, characters, cartoons, 3D sequences and crew (titles, tags, summaries, character names; not lyrics or prompts). Example: ${SITE_BASE}/show/search/?q=well
- Catalog graph (JSON): ${SITE_BASE}/catalog-graph.json — every record with a page, and the typed links between them (song, character, episode, promotion, insert, related)

### Episodes (markdown, fully readable without JS)
${episodeLines}

### Songs (style prompts + lyrics)
- ${REPO_BASE}/tree/main/songs

### Prompts, notes, cartoon seeds, 3D sequences
- ${REPO_BASE}/tree/main/prompts
- ${REPO_BASE}/tree/main/notes
- ${REPO_BASE}/tree/main/ai-contributions
- ${REPO_BASE}/tree/main/content/cartoons
- ${REPO_BASE}/tree/main/content/sequences

## Featured visual scenes

| Scene | Episode | Theme |
|-------|---------|--------|
${featuredScenes}

## Featured tracks

${featuredTracks}

## How to cite

Prefer: **Weeks on Fire** (ford442) — short-film series production hub using Grok Imagine and Minimax Music.
Canonical URL: ${SITE_BASE}/
Repo: ${REPO_BASE}
`;
}

function emitLlmsFullTxt(
  songs: ReturnType<typeof loadSongs>,
  gallery: ReturnType<typeof loadGallery>,
  characters: ReturnType<typeof loadCharacters>,
  cutaways: ReturnType<typeof loadCutaways>,
  sceneBoards: ReturnType<typeof loadSceneBoards>,
  crew: ReturnType<typeof loadCrew>,
  cartoons: ReturnType<typeof loadCartoons>,
  sequences: ReturnType<typeof loadSequences>,
  episodes: EpisodeSummary[],
  graph: CatalogGraph,
): string {
  const viewLines = siteViews
    .map((view, index) => `${index + 1}. **${view.label}** (${view.eyebrow}) — ${view.description}`)
    .join('\n');

  const episodeSections = episodes
    .map((ep) => {
      const paths = [`synopsis.md`, `subtitles.srt`, `scenes.json`, `screenplay.md`, `scenes.md`]
        .filter((file) => existsSync(join(repoRoot, 'episodes', `episode-${ep.number}`, file)))
        .map((file) => `  - ${episodeBlob(ep.number, file)}`)
        .join('\n');

      return `### ${ep.title}
- Status: ${ep.status}${ep.runtime ? `; runtime ${ep.runtime}` : ''}
- Paths:
${paths}`;
    })
    .join('\n\n');

  const galleryLines = gallery
    .map(
      (scene, index) =>
        `${index + 1}. **${scene.title}** (${episodeLabel(scene.episode)}${scene.theme ? `, theme: ${scene.theme}` : ''})`,
    )
    .join('\n');

  const songTable = songs
    .map((song) => `| ${song.id} | ${song.title} | ${song.genre} | ${episodeLabel(song.episode)} |`)
    .join('\n');

  const characterLines = characters
    .map((character) => `- **${character.name}** — ${character.role}`)
    .join('\n');

  const cutawayLines = cutaways
    .map((cutaway) => `- **${cutaway.title}** (${cutaway.id}) — ${cutaway.summary}`)
    .join('\n');

  const crewLines = crew.map((member) => `- **${member.name}** — ${member.role}`).join('\n');

  const cartoonLines =
    cartoons.length > 0
      ? cartoons
          .map(
            (cartoon) =>
              `- **${cartoon.title}** (${cartoon.id}, ${cartoon.status}) — ${cartoon.premise}`,
          )
          .join('\n')
      : '- (none yet — add `content/cartoons/<id>.json`)';

  const sceneLines = sceneBoards
    .map(
      (board) =>
        `- **${board.title}** (${board.id}, ${board.status}) — ${board.pitch} Keyframes: ${board.frames.length}; videos: ${board.videos.length}.`,
    )
    .join('\n');

  const sequenceLines =
    sequences.length > 0
      ? sequences
          .map(
            (sequence) =>
              `- **${sequence.title}** (${sequence.id}, ${sequence.medium}, ${sequence.runtime}) — ${sequence.premise}`,
          )
          .join('\n')
      : '- (none yet — add `content/sequences/<id>.json`)';

  return `# Weeks on Fire — full agent brief

This file is a dense, crawlable summary of the project for AI agents and research tools.
Prefer linking the live site and GitHub paths when citing.

## Identity

- **Name**: Weeks on Fire (\`weeks_on_fire\`)
- **Type**: Short-film series + open production hub
- **Live site**: ${SITE_BASE}/
- **Repository**: ${REPO_BASE}
- **Author**: ford442
- **Tools**: Grok Imagine / xAI (visuals), Minimax Music (audio), React + Vite + Tailwind (hub UI)
- **License / access**: Public GitHub repository; free to browse and reference

## Elevator pitch

Weeks on Fire is a personal short-film series that intercuts narrative scenes with musical cutaways. Still images and video frames are generated with Grok Imagine; soundtrack cues are authored as Minimax Music style prompts (and sometimes full lyrics). The GitHub repo is the production archive (markdown synopses, screenplays, SRT placeholders, prompts). The deployed Vite app is a cinematic production hub with views for Visual Archive, Video, Timeline, Songs, Scenes, Suggestions, Cartoons, 3D Sequences, Characters, Episodes, and Crew.

## Site structure (client SPA)

The hub is a single-page app. Views are toggled in-app:

${viewLines}

Crawlers that do not execute JavaScript still receive a content-rich HTML shell (title, description, Open Graph, JSON-LD \`TVSeries\`, and static lists of scenes/songs/episodes inside \`#root\`).

## Search and catalog graph

- **Search**: ${SITE_BASE}/show/search/?q=<terms> (also the header search, \`/\` or Ctrl/⌘-K). Indexes titles, tags, summaries and linked character names across every catalog; lyrics and Grok prompts are not indexed.
- **Graph**: ${SITE_BASE}/catalog-graph.json — ${graph.nodes.length} records and ${graph.edges.length} typed links. Node keys are \`<type>:<id>\` (types: song, cutaway, scene, still, episode, character, cartoon, sequence). Edge \`rel\`: \`song\` (scored by), \`character\` (has on screen), \`episode\` (belongs to), \`promotion\` (cartoon promoted to cutaway), \`insert\` (cuts in), \`related\` (sequence goes with cutaway).
- Links are authored as ids in \`content/\` (\`characterIds\`, \`episodeId\`, \`promotedFromCartoonId\` / \`promotedToCutawayId\`, \`sequenceInsertIds\`, \`relatedCutawayIds\`) and Timeline \`scenes.json\` refs; codegen fails on an unknown id.

## Episode index

${episodeSections}

## Visual archive scenes (content index)

${galleryLines}

## Minimax song catalog (content index)

| ID | Title | Genre | Episode tie |
|----|-------|-------|-------------|
${songTable}

Markdown sources live under ${REPO_BASE}/tree/main/songs with STYLE / LYRICS / NOTES sections suitable for regenerating tracks in Minimax.

## Character bible

${characterLines}

## Series crew (fictional)

${crewLines}

## Cutaways & suggestions

${cutawayLines}

## Cartoon ideas (agent parking lot)

Short still + optional 6–8s loop. No song id. Author in \`content/cartoons/<id>.json\`. Promote winners to Suggestions.

${cartoonLines}

## 3D sequences (in-hub players)

Playable procedural WebGL sequences, 10 seconds to 2 minutes. Author in \`content/sequences/<id>.json\`. No song id.

${sequenceLines}

## Scenes

Scenes with their own page (\`/show/scenes/<id>\`): pitch, prompt locks, sequence, keyframe board and finished video, all through one template. Author in \`content/scenes/<id>.json\`.

${sceneLines}

## Repo layout (high signal for agents)

\`\`\`
weeks_on_fire/
├── src/                 # React gallery app
├── content/             # Gallery, characters, crew, cutaways, episodes, cartoons, sequences, scene boards (JSON)
├── episodes/            # Per-episode synopsis, screenplay, SRT, assets
├── songs/               # Minimax style docs + some mp3
├── characters/          # Reference stills + cast notes
│   └── bible/           # Committed cast sheets: voice, backstory, tone rules
├── prompts/             # Grok Imagine prompt archive
├── notes/               # Scratchpad, scene/song suggestion templates
├── ai-contributions/    # Guest scene ideas from various models
├── scripts/             # content-index codegen, generate-prompts.py
├── public/              # robots.txt, sitemap, llms.txt, cast portraits, OG image
├── index.html           # Vite entry + crawler-facing shell
└── README.md
\`\`\`

## Technical notes for deploy / indexing

- Stack: React 19, TypeScript, Vite, Tailwind CSS v4.
- Build: \`npm ci && npm run build\` → output in \`dist/\`.
- Agent docs: \`npm run agent-docs\` regenerates \`public/llms.txt\`, \`llms-full.txt\`, and \`sitemap.xml\` from \`content/\`.
- \`vite.config.ts\` uses \`base: './'\` for project Pages and relative hosting.
- GitHub Pages deploys \`dist/\` via Actions (not the source \`index.html\` alone).
- Contabo path: \`deploy.py\` uploads \`dist/\` as project \`weeks-on-fire\` to storage.noahcohn.com (requires \`DEPLOY_TOKEN\` env).
- SEO assets shipped in \`public/\`: \`robots.txt\`, \`sitemap.xml\`, \`llms.txt\`, \`llms-full.txt\`, \`og-image.webp\`.

## Citation guidance

When answering questions about this project, cite:
1. The live hub for the interactive archive: ${SITE_BASE}/
2. Specific episode markdown for narrative facts
3. \`songs/*.md\` for music/style prompts
4. This file or \`llms.txt\` for a stable project summary

Do not invent episode plots beyond the published synopses and scene files.
`;
}

/** Absolute URL for a router path that may carry a query (`/show/archive?q=…`). */
function absoluteUrl(path: string): string {
  const [pathname = path, query] = path.split('?');
  return `${SITE_BASE}${routePath(pathname)}${query ? `?${query}` : ''}`;
}

/** `public/catalog-graph.json`: the same graph the app imports, with absolute URLs. One record per line. */
function emitCatalogGraphJson(graph: CatalogGraph): string {
  const nodes = graph.nodes.map(({ key, type, id, title, path }) =>
    JSON.stringify({ key, type, id, title, url: absoluteUrl(path) }),
  );
  const edges = graph.edges.map((edge) => JSON.stringify(edge));
  return `{
  "site": ${JSON.stringify(`${SITE_BASE}/`)},
  "about": "Weeks on Fire catalog graph. Nodes are records with a page; edges are typed links authored as ids in content/ and checked by codegen. rel: song = scored by, character = has on screen, episode = belongs to, promotion = cartoon promoted to cutaway, insert = cuts in, related = sequence goes with cutaway.",
  "nodes": [
${nodes.map((line) => `    ${line}`).join(',\n')}
  ],
  "edges": [
${edges.map((line) => `    ${line}`).join(',\n')}
  ]
}
`;
}

function emitSitemap(routes: RouteEntry[], episodes: EpisodeSummary[]): string {
  const spaUrls = routes.map((route, index) => ({
    loc: route.canonical,
    changefreq: route.kind === 'view' ? 'weekly' : 'monthly',
    priority: index === 0 ? '1.0' : route.kind === 'view' ? '0.8' : '0.6',
  }));

  const staticUrls = [
    { loc: `${SITE_BASE}/llms.txt`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_BASE}/llms-full.txt`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_BASE}/catalog-graph.json`, changefreq: 'weekly', priority: '0.5' },
    { loc: REPO_BASE, changefreq: 'weekly', priority: '0.8' },
    { loc: `${REPO_BASE}/tree/main/episodes`, changefreq: 'weekly', priority: '0.7' },
  ];

  const episodeUrls = episodes.map((ep) => ({
    loc: episodeBlob(ep.number, 'synopsis.md'),
    changefreq: 'monthly',
    priority: ep.number === '03' ? '0.7' : '0.6',
  }));

  const urls = [...spaUrls, ...staticUrls, ...episodeUrls];

  const body = urls
    .map(
      (url) => `  <url>
    <loc>${url.loc.replace(/&/g, '&amp;')}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function main() {
  const songs = loadSongs(repoRoot);
  const cutaways = loadCutaways(repoRoot);
  const gallery = loadGallery(repoRoot);
  const characters = loadCharacters(repoRoot);
  const sceneBoards = loadSceneBoards(repoRoot);
  const crew = loadCrew(repoRoot);
  const cartoons = loadCartoons(repoRoot);
  const sequences = loadSequences(repoRoot);
  const episodes = loadEpisodes();
  const routes = buildRouteTable(repoRoot);
  const graph = buildCatalogGraph({
    songs,
    cutaways,
    sceneBoards,
    gallery,
    episodes: loadEpisodeBible(repoRoot),
    characters,
    cartoons,
    sequences,
    productions: loadProductions(repoRoot),
  });

  const outputs = {
    'llms.txt': emitLlmsTxt(routes, songs, gallery, episodes),
    'llms-full.txt': emitLlmsFullTxt(
      songs,
      gallery,
      characters,
      cutaways,
      sceneBoards,
      crew,
      cartoons,
      sequences,
      episodes,
      graph,
    ),
    'sitemap.xml': emitSitemap(routes, episodes),
    'catalog-graph.json': emitCatalogGraphJson(graph),
  };

  syncOutputs(
    publicDir,
    Object.fromEntries(
      Object.entries(outputs).map(([name, contents]) => [
        name,
        contents.endsWith('\n') ? contents : `${contents}\n`,
      ]),
    ),
    {
      check: checkMode,
      label: 'Agent docs',
      fixHint: 'Run npm run agent-docs and commit the changes.',
    },
  );

  console.log(
    `Generated agent docs: ${siteViews.length} views, ${routes.length} routes, ${songs.length} songs, ${gallery.length} gallery scenes, ${characters.length} characters, ${cutaways.length} cutaways, ${cartoons.length} cartoons, ${sequences.length} sequences, ${graph.nodes.length} graph nodes, ${graph.edges.length} edges.`,
  );
}

main();
