import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadCharacters,
  loadCutaways,
  loadDaisyBell,
  loadGallery,
  loadSongs,
  loadStaff,
} from './load';
import { parseFrontmatter } from './parsers/frontmatter';
import { REPO_BASE, SITE_BASE, siteUrl, siteViews } from './views';

const repoRoot = join(import.meta.dirname, '../..');
const publicDir = join(repoRoot, 'public');
const checkMode = process.argv.includes('--check');

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
        title: String(frontmatter.title ?? `Episode ${number}`),
        status: String(frontmatter.status ?? 'unknown'),
        runtime: String(frontmatter.runtime_approx ?? ''),
      };
    });
}

function episodeRepoTree(number: string): string {
  return `${REPO_BASE}/tree/main/episodes/episode-${number}`;
}

function episodeBlob(number: string, file: string): string {
  return `${REPO_BASE}/blob/main/episodes/episode-${number}/${file}`;
}

function emitLlmsTxt(
  songs: ReturnType<typeof loadSongs>,
  gallery: ReturnType<typeof loadGallery>,
  episodes: EpisodeSummary[],
): string {
  const viewLines = siteViews.map((view) => `- ${view.label} — ${view.description}`).join('\n');

  const featuredScenes = gallery
    .slice(0, 6)
    .map((scene) => `| ${scene.title} | ${scene.episode} | ${scene.theme ?? '—'} |`)
    .join('\n');

  const featuredTracks = songs
    .slice(0, 6)
    .map((song) => `- ${song.title} (${song.genre}${song.instrumental ? ', instrumental' : ''})`)
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
- **Hub UI**: React + Vite gallery with seven production views

## Primary content (crawl these)

### Live app views (SPA; HTML shell also embeds key titles)
${viewLines}

### Episodes (markdown, fully readable without JS)
${episodeLines}

### Songs (style prompts + lyrics)
- ${REPO_BASE}/tree/main/songs

### Prompts & notes
- ${REPO_BASE}/tree/main/prompts
- ${REPO_BASE}/tree/main/notes
- ${REPO_BASE}/tree/main/ai-contributions

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
  daisyBell: ReturnType<typeof loadDaisyBell>,
  staff: ReturnType<typeof loadStaff>,
  episodes: EpisodeSummary[],
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
        `${index + 1}. **${scene.title}** (${scene.episode}${scene.theme ? `, theme: ${scene.theme}` : ''})`,
    )
    .join('\n');

  const songTable = songs
    .map((song) => `| ${song.id} | ${song.title} | ${song.genre} | ${song.episode} |`)
    .join('\n');

  const characterLines = characters
    .map((character) => `- **${character.name}** — ${character.role}`)
    .join('\n');

  const cutawayLines = cutaways
    .map((cutaway) => `- **${cutaway.title}** (${cutaway.id}) — ${cutaway.summary}`)
    .join('\n');

  const staffLines = staff.map((member) => `- **${member.name}** — ${member.role}`).join('\n');

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

Weeks on Fire is a personal short-film series that intercuts narrative scenes with musical cutaways. Still images and video frames are generated with Grok Imagine; soundtrack cues are authored as Minimax Music style prompts (and sometimes full lyrics). The GitHub repo is the production archive (markdown synopses, screenplays, SRT placeholders, prompts). The deployed Vite app is a cinematic production hub with seven views: Visual Archive, Timeline, Songs, Daisy Bell, Suggestions, Characters, and Crew.

## Site structure (client SPA)

The hub is a single-page app. Views are toggled in-app:

${viewLines}

Crawlers that do not execute JavaScript still receive a content-rich HTML shell (title, description, Open Graph, JSON-LD \`TVSeries\`, and static lists of scenes/songs/episodes inside \`#root\`).

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

${staffLines}

## Cutaways & suggestions

${cutawayLines}

## Daisy Bell cutaway

- **Title**: ${daisyBell.meta.title}
- **Summary**: ${daisyBell.meta.pitch}
- **Sequence beats**: ${daisyBell.sequence.length} board entries

## Repo layout (high signal for agents)

\`\`\`
weeks_on_fire/
├── src/                 # React gallery app
├── content/             # Gallery, characters, staff, cutaways, Daisy Bell JSON
├── episodes/            # Per-episode synopsis, screenplay, SRT, assets
├── songs/               # Minimax style docs + some mp3
├── characters/          # Reference stills
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

function emitSitemap(episodes: EpisodeSummary[]): string {
  const spaUrls = siteViews.map((view) => ({
    loc: siteUrl(view.path),
    changefreq: 'weekly',
    priority: view.id === 'gallery' ? '1.0' : '0.8',
  }));

  const staticUrls = [
    { loc: `${SITE_BASE}/llms.txt`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_BASE}/llms-full.txt`, changefreq: 'monthly', priority: '0.5' },
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
    <loc>${url.loc}</loc>
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

function writeIfChanged(path: string, contents: string) {
  const normalized = contents.endsWith('\n') ? contents : `${contents}\n`;
  if (existsSync(path)) {
    const existing = readFileSync(path, 'utf8');
    if (existing === normalized) return;
  }
  writeFileSync(path, normalized);
}

function main() {
  const songs = loadSongs(repoRoot);
  const cutaways = loadCutaways(repoRoot);
  const gallery = loadGallery(repoRoot);
  const characters = loadCharacters(repoRoot);
  const daisyBell = loadDaisyBell(repoRoot);
  const staff = loadStaff(repoRoot);
  const episodes = loadEpisodes();

  const outputs = {
    'llms.txt': emitLlmsTxt(songs, gallery, episodes),
    'llms-full.txt': emitLlmsFullTxt(
      songs,
      gallery,
      characters,
      cutaways,
      daisyBell,
      staff,
      episodes,
    ),
    'sitemap.xml': emitSitemap(episodes),
  };

  for (const [name, contents] of Object.entries(outputs)) {
    writeIfChanged(join(publicDir, name), contents);
  }

  console.log(
    `Generated agent docs: ${siteViews.length} views, ${songs.length} songs, ${gallery.length} gallery scenes, ${characters.length} characters, ${cutaways.length} cutaways.`,
  );

  if (checkMode) {
    const status = execSync(
      'git status --porcelain public/llms.txt public/llms-full.txt public/sitemap.xml',
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    ).trim();
    if (status) {
      throw new Error('Agent docs are out of date. Run npm run agent-docs and commit the changes.');
    }
  }
}

main();
