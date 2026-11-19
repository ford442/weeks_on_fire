# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**weeks_of_fire** is a short-film series (Minimax Music cutaways + Grok Imagine / xAI visuals) plus an open production hub.

The runnable app is **weeks-on-fire-gallery**: React 19 + TypeScript + Vite + Tailwind CSS v4. Root `index.html` loads `/src/main.tsx`. It is **not** a static review page — use `npm run dev`, not `python3 -m http.server`.

Live hub: https://ford442.github.io/weeks_on_fire

### Key Principles

- Respect the artistic vision (`grok.md`)
- Keep the clone lightweight: prefer external media links; do not add large binaries without approval
- Author catalog data in `content/` and `songs/`, then codegen — never hand-edit `src/data/generated/`
- Before any writing or joke pass, read `notes/callback-bank.md` and pull at least three callbacks.
- Songs start from a video, not from a genre: read `docs/song-method.md` (owner lock) before writing any song, sketch or pitch.
- Writing and joke passes go to the **`wof-writer`** subagent (`.claude/agents/wof-writer.md`): reading order, comedy rules, locks, and where each kind of output is filed.

## Hub views

Overview (`/show`, the default: logline, synopsis, episode list, cast and crew cards, What's new), Finalized (`/show/finalized`: every Approved/Final song, image and video), Visual Archive (`/show/archive`), Video (`/show/video`), Timeline, Songs, Scenes (`/show/scenes`, `/show/scenes/:id`), Suggestions, Cartoons, 3D Sequences, Characters, Episodes, Crew (`/crew`).

**One home per idea.** Cutaway, gag and scene _ideas_ live only in `content/cutaways/` and show on Suggestions; the Visual Archive is stills only (lanes: scene, test, character) and links into Suggestions rather than keeping its own suggestion cards. Do not add an archive record for a cutaway shot — put the still on the cutaway segment (`segmentStills`).

Scenes (`/scenes`, `/scenes/:id`) are worked-up scenes with their own page (`content/scenes/<id>.json`: pitch, prompt locks, sequence, keyframe board, finished videos). Every scene renders through one template (`src/components/SceneDetail.tsx`); a new scene is a JSON file, not a component. Daisy Bell is the first. (Old `/daisy-bell` links redirect.)

Video (`/video`) collects every video-shaped record that has a take — scene videos, committed Timeline clips, archive clips (`mediaType: video`) and cutaways past `ready-to-generate` — with the shared status badge. It is derived (`src/lib/videos.ts`); there is no video catalog to edit. Finalized's Video section is the same list narrowed to Approved/Final.

Cartoons (`/cartoons`, `/cartoons/:id`) is the agent parking lot for short cartoon seeds
(`content/cartoons/<id>.json` — premise, still, optional prompt). No song id. Promote winners to
Suggestions.

3D Sequences (`/sequences`, `/sequences/:id`) plays procedural WebGL video sequences
(`content/sequences/<id>.json`, 10s–2min). Unreal, photoreal, cartoon, or mixed.

Overview copy (logline, synopsis, tone, format) lives in `src/data/about.ts`; episodes, cast and crew come from the catalog. "What's new" is codegen'd into `src/data/generated/whats-new.ts` from each record's `added: YYYY-MM-DD` (songs require it; cutaways, cartoons, sequences and gallery items take it optionally — set it when you add one).

Every item uses one production status set (`suggested → ready-to-generate → generated → in-edit →
approved → final`), shared badge `src/components/StatusBadge.tsx`; see `content/README.md`.

Episodes (`/episodes`, `/episodes/:id`) is a read-only episode bible: logline, status, runtime, and
in-app markdown (synopsis / scenes / screenplay / notes) sourced from `content/episodes.json` +
`episodes/`, `notes/`, `docs/`. Timeline remains the only place to edit `scenes.json`.

## Repository Structure

**`src/`** — React app. Thin `src/data/*.ts` shims re-export generated modules.  
**`content/`** — Cutaways, gallery, characters, crew, episodes, cartoons, sequences, scene boards (`scenes/`) JSON.  
**`songs/`** — YAML-frontmatter markdown + optional mp3. Frontmatter requires `added: YYYY-MM-DD`. `songs/_drawer/` holds unpromoted sketches (not codegen'd).  
**`characters/bible/`** — Canon cast sheets (voice, backstory, tone rules); `content/characters.json` links via `bibleSheet`.  
**`episodes/`** — Synopsis, scenes, SRT, `scenes.json` (Timeline).  
**`prompts/`** — Segment / Grok Imagine prompt docs (`segmentsSource`).  
**`notes/`** — Scratchpad and suggestion templates. `notes/scenes/versions/` is prose dialog audition (not codegen).  
**`scripts/content-index/`** — Zod-validated TypeScript codegen (`tsx`).  
**`scripts/*.py`** — stdlib helpers (see `scripts/README.md`).  
**`public/`** — Generated `llms.txt` / `sitemap.xml`, robots, OG, `cast/` portraits.

## Commands

```bash
npm run dev
npm run codegen          # content/ + songs/ → src/data/generated/
npm run codegen:check    # fail if generated files drifted
npm run agent-docs       # public/llms*.txt + sitemap.xml
npm run codegen:check    # read-only drift check (also: agent-docs:check)
npm run lint             # type-aware ESLint: src/, scripts/, e2e/
npm run format
npm run test             # Vitest (node for libs, jsdom for src/components/**)
npm run test:coverage    # v8 coverage, no threshold yet
npm run test:e2e         # real-GL frame harness (Playwright + Chromium, software GL)
npm run test:e2e:update  # rewrite e2e/fixtures/*.frames.json after an intentional visual change
npm run build            # codegen + agent-docs + tsc -b + vite + encoding check
```

Use Node 22 (`.nvmrc`).

`test:e2e` drives the production build, which must use the Pages base:
`VITE_BASE=/weeks_on_fire/ npm run build && npm run test:e2e` (first time:
`npx playwright install chromium`). It opens `/show/sequences/lattice-hymn?capture=1` and compares
downsampled frames at 0s and 50% to `e2e/fixtures/`. `?capture=1` is the only thing that sets
`preserveDrawingBuffer`; the player publishes the context it got as `data-gl`. Vitest (jsdom) cannot
run a shader, so this is the only check that does. CI runs it on every pull request.

`tsc -b` includes `tsconfig.scripts.json` so codegen is typechecked. App `tsconfig` enables `noUncheckedIndexedAccess` and `verbatimModuleSyntax`.

## Adding catalog content

See `content/README.md`. Typical path:

1. Edit `content/` or add `songs/Your_Track.md`
2. `npm run codegen`
3. Commit sources and generated TS

Timeline scenes (`episodes/episode-NN/scenes.json`) may carry optional catalog refs (`songId`, `cutawayId`, `sequenceId`, `cartoonId`, `characterIds`; schema in `src/schemas/production.ts`). Ids only, omitted when unset, and `npm run codegen` fails on an unknown id. See `content/README.md`.

Crew bios: `content/crew.json` (longer crew sheets in `docs/crew/`).

Filter values (episode ids, genres, gallery themes, tools) live in `content/taxonomy.json`; songs and gallery items must use them verbatim (codegen enforces it). Free-text nuance goes in `slot` / `subgenre`. Use `pluralize()` from `src/lib/plural.ts` for any "N things" label.  
**Do not** invent `srt-tools.py` or `update-index.py` — they do not exist.

## Python helpers (real)

```bash
python3 scripts/generate-prompts.py "scene description"
python3 scripts/xai-generate.py "prompt" -o images/out.jpg   # needs XAI_API_KEY
python3 scripts/create_episode.py 05 "Title"
python3 scripts/assemble-daisy-slideshow.py
```

## Media

Prefer Drive / Imgur for large video. Small stills and selected audio may live in-repo. No secrets in git.

## GitHub Pages

Push to `main` runs `.github/workflows/deploy-pages.yml` (`npm ci && npm run build`, deploy `dist/`). Settings → Pages → Source = GitHub Actions.

---

Made with Grok Imagine magic ✨
