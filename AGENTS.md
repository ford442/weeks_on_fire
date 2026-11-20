# AGENTS.md — weeks_of_fire

> Read this first if you are an AI coding agent working on this repository.

---

## Project Overview

`weeks_of_fire` is a **creative short-film series production hub**: synopses, screenplays, Minimax music notes, Grok Imagine prompts, and a **React + Vite + TypeScript** gallery that indexes that archive.

- **Concept**: Musical cutaways (Minimax Music) intercut with AI-generated visuals (Grok Imagine / xAI) and narrative scenes.
- **Live hub**: `https://ford442.github.io/weeks_on_fire` (GitHub Pages deploys `dist/` via Actions).
- **npm package name**: `weeks-on-fire-gallery`.
- **Creative guide**: See `grok.md`. This file is the technical guide.

Root `index.html` is the **Vite entry** (`/src/main.tsx`). It is not a standalone static page. Do not serve it with `python3 -m http.server`. Use `npm run dev` or `npm run preview` after `npm run build`.

---

## Technology Stack

| Layer           | Technology                     | Notes                                                                                                                                                |
| --------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| App             | React 19 + TypeScript + Vite 8 | Source in `src/`. Tailwind CSS v4 via `@tailwindcss/vite`.                                                                                           |
| Content index   | Markdown / JSON → codegen      | Author in `content/` and `songs/`. Emit to `src/data/generated/`.                                                                                    |
| Codegen         | `tsx` + Zod (devDependency)    | `scripts/content-index/*.ts`. No extra runtime libraries.                                                                                            |
| Episode archive | Markdown + SRT + `scenes.json` | Separate from the React catalog index.                                                                                                               |
| Python helpers  | stdlib-only scripts            | Imagine API, slideshow assemble, episode scaffold.                                                                                                   |
| Deploy          | GitHub Actions → Pages         | `.github/workflows/deploy-pages.yml` (`npm ci && npm run build`). Pull requests run the same checks plus the e2e frame harness; only `main` deploys. |

TypeScript is the hub language. Do not add a new runtime library, in-repo C++, or `compile_commands.json` unless explicitly asked.

---

## Hub views

Header navigation in `src/components/SiteHeader.tsx` / `scripts/content-index/views.ts`:

| View           | Path           | What you get                                                   |
| -------------- | -------------- | -------------------------------------------------------------- |
| Visual Archive | `/`            | Grok Imagine stills, prompt variations, music cues             |
| Video          | `/video`       | Generated clips and slideshows with production status          |
| Timeline       | `/timeline`    | Scene status, local edits, exportable production JSON          |
| Songs          | `/songs`       | Minimax catalog — style prompts, lyrics, episode ties          |
| Scenes         | `/scenes`      | Scene pages (`/scenes/:id`): locks, sequence, keyframes, video |
| Suggestions    | `/suggestions` | EyeWash schedule: cutaways in time slots, timed prompts        |
| Cartoons       | `/cartoons`    | Short cartoon seeds from agents (no song id)                   |
| 3D Sequences   | `/sequences`   | Playable in-hub 3D video sequences (10s–2min)                  |
| Characters     | `/characters`  | Cast bible; `/characters/:id` profile with an Appears-in strip |
| Episodes       | `/episodes`    | Read-only episode bible                                        |
| Crew           | `/staff`       | Fictional series crew bios                                     |
| Search         | `/search?q=`   | Every catalog at once (not a tab; header `/` or Ctrl/⌘-K)      |

---

## Directory Layout

```
weeks_of_fire/
├── src/                 # React gallery (App, components, data shims)
│   └── data/generated/  # AUTO-GENERATED — do not hand-edit
├── content/             # Catalog JSON (cutaways, gallery, characters, staff, episodes, cartoons, sequences, scene boards)
├── songs/               # Minimax markdown + some mp3
├── episodes/            # Per-episode synopsis, screenplay, SRT, scenes.json
├── characters/          # Reference stills + character notes
│   └── bible/           # Committed on-screen cast sheets (voice, backstory, tone rules)
├── prompts/             # Grok Imagine / segment prompt archive
├── notes/               # Scratchpad, scene/song suggestions, dialog versions
├── ideas/               # Raw brainstorming
├── scripts/             # content-index (TS) + Python helpers
├── templates/           # Episode boilerplate
├── docs/                # Production logs and references
├── public/              # llms.txt, sitemap, robots, OG, cast portraits
├── index.html           # Vite entry + crawler-facing shell
├── grok.md              # Creative AI assistant guide
└── README.md
```

### Episode folders

Each `episodes/episode-NN/` typically has YAML-frontmatter `synopsis.md`, `subtitles.srt`, and `scenes.json`. Episode 03 also has `scenes.md` / `laser_snakes.md`.

### Content index (author here, not in generated TS)

| What       | Source of truth            | Generated output                     |
| ---------- | -------------------------- | ------------------------------------ |
| Songs      | `songs/*.md`               | `src/data/generated/songs.ts` (summaries) + `public/catalog/songs/` |
| Cutaways   | `content/cutaways/*.json`  | `src/data/generated/cutaways.ts` (summaries) + `public/catalog/cutaways/` |
| Gallery    | `content/gallery.json`     | `src/data/generated/gallery.ts`      |
| Characters | `content/characters.json`  | `src/data/generated/characters.ts`   |
| Staff      | `content/staff.json`       | `src/data/generated/staff.ts`        |
| Scenes     | `content/scenes/*.json`    | `src/data/generated/scene-boards.ts` |
| Cartoons   | `content/cartoons/*.json`  | `src/data/generated/cartoons.ts`     |
| Sequences  | `content/sequences/*.json` | `src/data/generated/sequences.ts`    |

**Cast voice, look, backstory, and tone rules** live in the character bible, [`characters/bible/README.md`](characters/bible/README.md) (index, template, open questions), with pairings in [`characters/bible/relationship-map.md`](characters/bible/relationship-map.md). `content/characters.json` is the short catalog card; its `bibleSheet` field links each entry to its sheet. New seeds go in `characters/suggested-characters.md`.

**Songs and cutaways have two outputs.** The bundled TS module holds only list-view summaries
(no style prompts, lyrics, notes, segments or sight banks; cutaways carry `segmentCount` /
`sightCount`). The full record is `public/catalog/<kind>/<id>.json`, with `index.json` beside it;
detail views fetch it with `loadSong` / `loadCutaway` (`src/data/songs.ts`, `src/data/suggestions.ts`),
validated by the same Zod schemas codegen wrote it with (`scripts/content-index/record-schemas.ts`).
Never hand-edit `public/catalog/`; `codegen:check` fails on drifted or orphaned files there too.

Song mp3s stay in `songs/` but are served at `audio/<slug>.mp3` (see
`scripts/content-index/audio-names.ts`), never imported. Card stills render through
`src/components/Still.tsx` (AVIF/WebP `srcset` from `vite-imagetools`, see
`scripts/content-index/image-variants.ts`). Production builds register a Workbox service worker
(app shell + catalog indexes precached; audio never cached).

`src/data/*.ts` files are thin shims (types + re-exports). **Exception:** `src/data/sceneDialogVersions.ts` is hand-authored TypeScript. Dialog audition pages in `notes/scenes/versions/` are prose, not a codegen schema. See `content/README.md`.

---

## Commands

```bash
npm install
npm run dev              # http://localhost:5173  (pass -- --host to bind 0.0.0.0)
npm run codegen          # content/ + songs/ → src/data/generated/
npm run codegen:check    # fail if generated files drifted (read-only, never writes)
npm run agent-docs       # regenerate public/llms.txt, llms-full.txt, sitemap.xml
npm run agent-docs:check # read-only drift check
npm run lint             # type-aware ESLint (typescript-eslint, jsx-a11y, import-x) on src/, scripts/ and e2e/
npm run format           # Prettier check on src/, scripts/ and e2e/
npm run format:write
npm run test             # Vitest: libs in node, src/components/** in jsdom
npm run test:coverage    # same, with v8 coverage (no threshold yet)
npm run test:py          # Python helper tests (stdlib unittest, local fake xAI server; no key, no network)
npm run test:e2e         # real-GL frame harness: Playwright + Chromium vs e2e/fixtures/ (needs a Pages-base build)
npm run test:e2e:update  # regenerate e2e/fixtures/*.frames.json after an intentional visual change
npm run build            # codegen + agent-docs + tsc -b + vite + encoding check + dist/1ink.1ink
npm run build:check      # build + raw chunk budgets (scripts/check-bundle-size.ts)
npm run budgets          # Lighthouse CI on a Pages-base build (lighthouserc.json); CI blocks deploy on failure
npm run preview
```

Use Node 22 (`.nvmrc`), the version CI and Pages build with.

Lint runs `recommendedTypeChecked` with `--max-warnings 0`. `import-x/no-cycle` keeps `data/`, `sequences/` and `lib/webgl` acyclic and `import-x/order` sorts imports. Do not add `eslint-disable` in `src/lib/webgl` or `src/sequences`. `npm install` needs the `overrides` entry in `package.json` because `eslint-plugin-jsx-a11y` has not declared ESLint 10 support yet.

`tsc -b` typechecks **four** projects: `tsconfig.app.json` (src), `tsconfig.node.json` (vite.config.ts), `tsconfig.scripts.json` (`scripts/content-index` and the TS bundle checks), `tsconfig.e2e.json` (`e2e/` and `playwright.config.ts`). App compiler flags include `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and `noImplicitOverride`.

### Python helpers (real files)

| Script                                | Purpose                                                           |
| ------------------------------------- | ----------------------------------------------------------------- |
| `scripts/generate-prompts.py`         | Three Grok Imagine prompt variations from a scene string          |
| `scripts/xai-generate.py`             | One xAI Imagine image (`XAI_API_KEY`); `--retries`, `--json-log`  |
| `scripts/xai-batch.py`                | Every segment of one cutaway → stills, or `--video` clips         |
| `scripts/xai_api.py`                  | Shared client for the two above (retries, cost, video poll)       |
| `scripts/xai-api-spec.json`           | The request values xAI accepts (one source for CLIs and codegen)  |
| `scripts/assemble-daisy-slideshow.py` | ffmpeg slideshow over `songs/Daisy+Bell.mp3`                      |
| `scripts/assemble-cutaway.py`         | Any cutaway's stills + song → timed MP4 preview (needs ffmpeg)    |
| `scripts/create_episode.py`           | Scaffold `episodes/episode-NN/` from templates                    |
| `scripts/eyewash_idents_generator.py` | Scaffold EyeWash ident tables                                     |
| `scripts/cat_pov_generator.py`        | Scaffold a cat-POV cutaway outline                                |

There is **no** `srt-tools.py` or `update-index.py`. Do not invent them.

### Batch-generating cutaway stills and clips (`xai-batch.py`)

Needs `XAI_API_KEY` in the environment (or `--api-key`); it is never read from a file and never
committed, logged or written to a manifest. A paid API: always dry-run first.

```bash
python3 scripts/xai-batch.py prompts/glam-sham-poo-segments.md --dry-run    # plan, settings and every prompt; no API call
python3 scripts/xai-batch.py prompts/glam-sham-poo-segments.md \
  --model grok-imagine-image-quality --aspect 16:9 --out images/glam-sham-poo/ --json-log
python3 scripts/xai-batch.py mv-ultra-screech --only A,C --force           # by cutaway id; redo two segments
python3 scripts/xai-batch.py mv-ultra-screech --only A --model grok-imagine-image-2.0 \
  --resolution 2k --quality medium --response-format b64_json                # the other image options
python3 scripts/xai-batch.py mv-ultra-screech --only A --video --dry-run    # a clip instead of a still
```

The Suggestions view builds these lines for you: every segment's prompt board has a **Generate on
xAI** block with a "Copy command" and a "Copy dry run" button, filled in with that segment's model,
aspect and other settings (plus a clip command when the content sets `generation.video`).

- **Target** is a `prompts/*-segments.md` file or a cutaway id. Segments and their ids are read
  from the generated `public/catalog/cutaways/<id>.json`, so the manifest's ids are the ids the
  Suggestions view uses. It refuses to run if that catalog has drifted from the markdown: run
  `npm run codegen` after editing a prompts file. Standalone prompt docs
  (`content/standalone-prompts.json`) have no segment ids and are refused.
- **Settings**, per segment, in order of precedence: the flags you pass (`--model --aspect
  --resolution --quality --response-format --n`), then the segment's `generation.image` in the
  catalog (the cutaway's `generationDefaults` merged with its `segmentGeneration` override, authored
  in `content/cutaways/<id>.json`; see `content/README.md`), then the built-ins in
  `scripts/xai-api-spec.json` (`grok-imagine-image-quality`, 16:9). Anything else is not sent, so the
  API applies its own default. One run can therefore mix aspect ratios: set them per segment in the
  content. `--quality` (`low` / `medium` / `auto`) is only accepted by `grok-imagine-image-2.0`; the
  script refuses, before any request and in a dry run too, a segment that asks for it on another
  model. `--response-format b64_json` returns the image inline (nothing to download); `--n 2`
  asks for several images per segment and saves `<segment-id>.jpg`, `<segment-id>-2.jpg`, ...
- **Output:** `<out>/<segment-id>.<jpg|png|webp>` and `<out>/manifest.json` (segment id →
  repo-relative path, prompt SHA-256, model, aspect, resolution, quality, size, time, `costUsd`,
  `usage`; `variants` when `n > 1`), rewritten after every image so an interrupted run loses
  nothing. `<out>` defaults to `images/<name>/`, where `<name>` is the prompts file's name without
  `-segments.md`.
- **Resume:** a segment is skipped when its image exists, when the cutaway already registers a
  still for it (`segmentStills`), when it has no Grok Imagine prompt, or when the prompt still has
  an unfilled `[PLACEHOLDER]` (Well Fall's `[SIGHT]`). `--force` regenerates, `--only` narrows.
  A changed prompt, or changed settings, on an existing image is flagged, not silently regenerated.
- **Clips (`--video`):** the same segments, text-to-video from the segment's Grok Imagine prompt,
  through the asynchronous API (`POST /v1/videos/generations`, then poll `GET /v1/videos/{request_id}`
  until `done`). Every segment is submitted first and then all are polled, so the wait is about one
  clip's, not N. Flags: `--model` (default `grok-imagine-video`), `--aspect`, `--resolution`
  (`480p` / `720p` / `1080p`), `--duration` 1–15 s (default: the content's
  `generation.video.durationSec`, else the segment's own timed length, else the API's 8),
  `--poll-interval`, `--poll-timeout` (default 900 s). Clips go to `videos/<name>/<segment-id>.mp4`
  with their own manifest (`"kind": "video"`); that folder is gitignored, so host big files on
  Drive / Imgur. A submitted request id is written to the manifest as `pending` at once and kept
  through a crash, a timeout or a failed download: re-running resumes it (the plan shows `RESUME`)
  instead of paying for a new clip. It is dropped only when xAI reports it `failed` or `expired`.
  A retried *submit* can't tell a lost reply from a lost request, so a network error after xAI
  accepted the job can start a second paid clip; use `--retries 0` if that matters more to you.
- **Failures:** 429 / 5xx / network errors retry with exponential backoff (`--retries`, default 3,
  honours `Retry-After`). A 401 / 403 stops the batch; any other failed segment is reported and the
  rest continue. Re-run the same command to redo just the failures.
- **Cost log:** `--json-log` appends one line per request to `docs/generation-log.jsonl` (model,
  aspect, resolution, quality, prompt hash, usage, `costUsd` from the response's
  `cost_in_usd_ticks`). Hash only, never the prompt text. Commit it if you want the spend history;
  it is created on first use.
- **Putting a still on the site:** the run prints a `segmentStills` block for
  `content/cutaways/<id>.json`; paste it and `npm run codegen`. Commit only stills you mean to
  ship (no large binaries without approval).

### Assembling a cutaway preview (`assemble-cutaway.py`)

Needs `ffmpeg` + `ffprobe`; no API key, no network. Reads the same generated catalog as
`xai-batch.py`, so run `npm run codegen` first and `xai-batch.py` before it.

```bash
python3 scripts/assemble-cutaway.py --manifest content/cutaways/mv-ultra-screech.json --dry-run
python3 scripts/assemble-cutaway.py --manifest content/cutaways/mv-ultra-screech.json --pan auto
python3 scripts/assemble-cutaway.py --manifest content/cutaways/<id>.json --write-manifest ideas/<name>/assembly.json
```

`--manifest` is a cutaway record or an assembly manifest (`"version": 1`, explicit images, times,
optional pans); the field reference, timing rules and flags are in
[docs/cutaway-assembly.md](docs/cutaway-assembly.md). Output goes to `videos/` (gitignored): never
commit the MP4; host it on Drive / Imgur and record the link in the manifest's `previewUrl`.

---

## How to add catalog content

1. Author the markdown/JSON source (`content/README.md`).
2. `npm run codegen` (and `npm run agent-docs` if views/catalog summaries should change).
3. Commit sources **and** regenerated `src/data/generated/*`, `public/catalog/**` / `public/llms*.txt` as needed.

Song frontmatter requires `added: YYYY-MM-DD`. `songs/_drawer/` holds unpromoted sketches and is not codegen'd. Cutaway `songId` values must exist in song frontmatter. `prompts/*-segments.md` used via `segmentsSource` must have a matching cutaway JSON entry.

Short cartoon ideas (one still + optional 6–8s loop, no song) go in `content/cartoons/<id>.json`. See `content/README.md`. Do not dump them into `notes/one-panel-gags.md` or invent a cutaway until they are ready to promote. Promotion is a two-sided id link (cartoon `promotedToCutawayId` + cutaway `promotedFromCartoonId`); codegen checks both.

3D video sequences (10s–2min, in-hub WebGL players) go in `content/sequences/<id>.json` plus a renderer in `src/sequences/`.

---

## How to add an episode

1. `python3 scripts/create_episode.py 05 "Title"` or copy `templates/`.
2. Fill `synopsis.md` and `scenes.json`.
3. Timeline loads `episodes/episode-NN/scenes.json` dynamically; keep `AVAILABLE_EPISODES` in `src/data/production.ts` in sync if you add a number.

Do **not** add an episode card to a static `index.html`. The hub is the React app.

---

## Capturing new scenes, songs, visuals

- `docs/song-method.md` — owner lock for songs: the video concept comes first, then the song is built around it
- `notes/scratchpad.md` — rapid capture
- `notes/scene-suggestions.md` / `notes/song-suggestions.md` — structured templates
- `notes/image-prompt-captures.md` — stage Grok ideas, then move to `prompts/`
- `notes/scenes/versions/` — dialog audition pages (not codegen)

---

## Gotchas

- **Do not hand-edit** `src/data/generated/` or `public/llms.txt` / `llms-full.txt` / `sitemap.xml`.
- **Media**: prefer external hosting for large video; some stills and mp3s are already in-repo. Do not add large binaries without approval.
- **No secrets** in the repo. `xai-generate.py`, `xai-batch.py` (`XAI_API_KEY`) and `deploy_storage.py` read env vars.
- **Python** stays stdlib-only (`scripts/deploy_storage.py` is the one legacy exception: it needs `requests`). Shared client code lives in `scripts/xai_api.py`; its tests are `scripts/tests/` (`npm run test:py`, run in CI).

---

## Relationship to `grok.md`

- **`grok.md`**: artistic vision and visual polish.
- **`AGENTS.md`**: repository structure, codegen, typecheck, and safe edits.

When in doubt about creative direction, consult `grok.md`. When in doubt about where a file belongs, consult this file.

---

## Quick Reference

| Task                    | Command / Location                                                  |
| ----------------------- | ------------------------------------------------------------------- |
| Preview hub             | `npm run dev` → http://localhost:5173                               |
| Typecheck app + codegen | `npx tsc -b`                                                        |
| Generate catalog        | `npm run codegen`                                                   |
| Agent crawl files       | `npm run agent-docs`                                                |
| Production build        | `npm run build`                                                     |
| Grok prompt variations  | `python3 scripts/generate-prompts.py "scene"`                       |
| xAI image               | `python3 scripts/xai-generate.py "prompt" -o images/out.jpg`        |
| Stills for a cutaway    | `python3 scripts/xai-batch.py prompts/<name>-segments.md --dry-run` |
| Preview MP4 of a cutaway | `python3 scripts/assemble-cutaway.py --manifest content/cutaways/<id>.json --dry-run` |
| New episode folder      | `python3 scripts/create_episode.py 05 "Title"`                      |
| Production log          | `docs/production-log.md`                                            |
