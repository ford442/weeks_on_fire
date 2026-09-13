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

| Layer           | Technology                     | Notes                                                             |
| --------------- | ------------------------------ | ----------------------------------------------------------------- |
| App             | React 19 + TypeScript + Vite 8 | Source in `src/`. Tailwind CSS v4 via `@tailwindcss/vite`.        |
| Content index   | Markdown / JSON → codegen      | Author in `content/` and `songs/`. Emit to `src/data/generated/`. |
| Codegen         | `tsx` + Zod (devDependency)    | `scripts/content-index/*.ts`. No extra runtime libraries.         |
| Episode archive | Markdown + SRT + `scenes.json` | Separate from the React catalog index.                            |
| Python helpers  | stdlib-only scripts            | Imagine API, slideshow assemble, episode scaffold.                |
| Deploy          | GitHub Actions → Pages         | `.github/workflows/deploy-pages.yml` (`npm ci && npm run build`). |

TypeScript is the hub language. Do not add a new runtime library, in-repo C++, or `compile_commands.json` unless explicitly asked.

---

## Hub views (seven)

Header navigation in `src/components/SiteHeader.tsx` / `scripts/content-index/views.ts`:

| View           | Path           | What you get                                          |
| -------------- | -------------- | ----------------------------------------------------- |
| Visual Archive | `/`            | Grok Imagine stills, prompt variations, music cues    |
| Timeline       | `/timeline`    | Scene status, local edits, exportable production JSON |
| Songs          | `/songs`       | Minimax catalog — style prompts, lyrics, episode ties |
| Daisy Bell     | `/daisy-bell`  | Keyframe board, period/color treatments, sequence     |
| Suggestions    | `/suggestions` | Cutaways, gags, scene suggestions, timed prompts      |
| Characters     | `/characters`  | Recurring cast bible                                  |
| Crew           | `/staff`       | Fictional series crew bios                            |

---

## Directory Layout

```
weeks_of_fire/
├── src/                 # React gallery (App, components, data shims)
│   └── data/generated/  # AUTO-GENERATED — do not hand-edit
├── content/             # Catalog JSON (cutaways, gallery, characters, staff, Daisy Bell)
├── songs/               # Minimax markdown + some mp3
├── episodes/            # Per-episode synopsis, screenplay, SRT, scenes.json
├── characters/          # Reference stills + character notes
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

| What       | Source of truth           | Generated output                   |
| ---------- | ------------------------- | ---------------------------------- |
| Songs      | `songs/*.md`              | `src/data/generated/songs.ts`      |
| Cutaways   | `content/cutaways/*.json` | `src/data/generated/cutaways.ts`   |
| Gallery    | `content/gallery.json`    | `src/data/generated/gallery.ts`    |
| Characters | `content/characters.json` | `src/data/generated/characters.ts` |
| Staff      | `content/staff.json`      | `src/data/generated/staff.ts`      |
| Daisy Bell | `content/daisy-bell.json` | `src/data/generated/daisy-bell.ts` |

`src/data/*.ts` files are thin shims (types + re-exports). **Exception:** `src/data/sceneDialogVersions.ts` is hand-authored TypeScript. Dialog audition pages in `notes/scenes/versions/` are prose, not a codegen schema. See `content/README.md`.

---

## Commands

```bash
npm install
npm run dev              # http://localhost:5173  (pass -- --host to bind 0.0.0.0)
npm run codegen          # content/ + songs/ → src/data/generated/
npm run codegen:check    # fail if generated files drifted
npm run agent-docs       # regenerate public/llms.txt, llms-full.txt, sitemap.xml
npm run agent-docs:check
npm run lint             # ESLint on src/ and scripts/ (ignores generated)
npm run format           # Prettier check on src/ and scripts/
npm run format:write
npm run build            # codegen + agent-docs + tsc -b + vite + encoding check
npm run preview
```

`tsc -b` typechecks **three** projects: `tsconfig.app.json` (src), `tsconfig.node.json` (vite.config.ts), `tsconfig.scripts.json` (`scripts/content-index` and the TS bundle checks). App compiler flags include `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and `noImplicitOverride`.

### Python helpers (real files)

| Script                                | Purpose                                                  |
| ------------------------------------- | -------------------------------------------------------- |
| `scripts/generate-prompts.py`         | Three Grok Imagine prompt variations from a scene string |
| `scripts/xai-generate.py`             | Call xAI Imagine API (`XAI_API_KEY`)                     |
| `scripts/assemble-daisy-slideshow.py` | ffmpeg slideshow over `songs/Daisy+Bell.mp3`             |
| `scripts/create_episode.py`           | Scaffold `episodes/episode-NN/` from templates           |
| `scripts/eyewash_idents_generator.py` | Scaffold EyeWash ident tables                            |
| `scripts/cat_pov_generator.py`        | Scaffold a cat-POV cutaway outline                       |

There is **no** `srt-tools.py` or `update-index.py`. Do not invent them.

---

## How to add catalog content

1. Author the markdown/JSON source (`content/README.md`).
2. `npm run codegen` (and `npm run agent-docs` if views/catalog summaries should change).
3. Commit sources **and** regenerated `src/data/generated/*` / `public/llms*.txt` as needed.

Cutaway `songId` values must exist in song frontmatter. `prompts/*-segments.md` used via `segmentsSource` must have a matching cutaway JSON entry.

---

## How to add an episode

1. `python3 scripts/create_episode.py 05 "Title"` or copy `templates/`.
2. Fill `synopsis.md` and `scenes.json`.
3. Timeline loads `episodes/episode-NN/scenes.json` dynamically; keep `AVAILABLE_EPISODES` in `src/data/production.ts` in sync if you add a number.

Do **not** add an episode card to a static `index.html`. The hub is the React app.

---

## Capturing new scenes, songs, visuals

- `notes/scratchpad.md` — rapid capture
- `notes/scene-suggestions.md` / `notes/song-suggestions.md` — structured templates
- `notes/image-prompt-captures.md` — stage Grok ideas, then move to `prompts/`
- `notes/scenes/versions/` — dialog audition pages (not codegen)

---

## Gotchas

- **Do not hand-edit** `src/data/generated/` or `public/llms.txt` / `llms-full.txt` / `sitemap.xml`.
- **Media**: prefer external hosting for large video; some stills and mp3s are already in-repo. Do not add large binaries without approval.
- **No secrets** in the repo. `xai-generate.py` and `deploy.py` read env vars.
- **Python** stays stdlib-only.
- `git.sh` commits with the hard-coded message `"push fix"` — prefer a descriptive `git commit`.

---

## Relationship to `grok.md`

- **`grok.md`**: artistic vision and visual polish.
- **`AGENTS.md`**: repository structure, codegen, typecheck, and safe edits.

When in doubt about creative direction, consult `grok.md`. When in doubt about where a file belongs, consult this file.

---

## Quick Reference

| Task                    | Command / Location                                           |
| ----------------------- | ------------------------------------------------------------ |
| Preview hub             | `npm run dev` → http://localhost:5173                        |
| Typecheck app + codegen | `npx tsc -b`                                                 |
| Generate catalog        | `npm run codegen`                                            |
| Agent crawl files       | `npm run agent-docs`                                         |
| Production build        | `npm run build`                                              |
| Grok prompt variations  | `python3 scripts/generate-prompts.py "scene"`                |
| xAI image               | `python3 scripts/xai-generate.py "prompt" -o images/out.jpg` |
| New episode folder      | `python3 scripts/create_episode.py 05 "Title"`               |
| Production log          | `docs/production-log.md`                                     |
