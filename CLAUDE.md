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

## Hub views

Visual Archive, Timeline, Songs, Daisy Bell, Suggestions, Characters, Crew (`/staff`).

## Repository Structure

**`src/`** — React app. Thin `src/data/*.ts` shims re-export generated modules.  
**`content/`** — Cutaways, gallery, characters, staff, Daisy Bell JSON.  
**`songs/`** — YAML-frontmatter markdown + optional mp3.  
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
npm run agent-docs       # public/llms*.txt + sitemap.xml
npm run lint             # ESLint: src/ and scripts/
npm run format
npm run build            # codegen + agent-docs + tsc -b + vite
```

`tsc -b` includes `tsconfig.scripts.json` so codegen is typechecked. App `tsconfig` enables `noUncheckedIndexedAccess` and `verbatimModuleSyntax`.

## Adding catalog content

See `content/README.md`. Typical path:

1. Edit `content/` or add `songs/Your_Track.md`
2. `npm run codegen`
3. Commit sources and generated TS

Staff bios: `content/staff.json`.  
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
