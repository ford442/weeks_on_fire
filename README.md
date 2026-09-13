# Weeks on Fire

**AI-generated short-film series** blending musical cutaways (Minimax Music) with visuals from **Grok Imagine / xAI** — plus an open production hub for stills, prompts, screenplays, and soundtrack notes.

## Live production hub

**https://ford442.github.io/weeks_on_fire**

React + Vite gallery with seven views:

| View               | What you get                                             |
| ------------------ | -------------------------------------------------------- |
| **Visual Archive** | Grok Imagine stills, prompt variations, music cues       |
| **Timeline**       | Scene status, local edits, exportable production JSON    |
| **Songs**          | Minimax catalog — style prompts, lyrics, episode ties    |
| **Daisy Bell**     | Keyframe board, color vs period treatments, sequence     |
| **Suggestions**    | Cutaways, gags, and scene suggestions with timed prompts |
| **Characters**     | Recurring cast bible                                     |
| **Crew**           | Fictional series crew bios                               |

Agent-friendly files on the live site: [`/llms.txt`](https://ford442.github.io/weeks_on_fire/llms.txt) · [`/llms-full.txt`](https://ford442.github.io/weeks_on_fire/llms-full.txt) · [`/sitemap.xml`](https://ford442.github.io/weeks_on_fire/sitemap.xml)

## Episodes

All episode content lives in `episodes/`:

| Episode                     | Status                                 | Files                                                                                                                                                            |
| --------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Episode 1**               | Synopsis + screenplay + scenes JSON    | [`synopsis.md`](episodes/episode-01/synopsis.md) · [`screenplay.md`](episodes/episode-01/screenplay.md) · [`scenes.json`](episodes/episode-01/scenes.json)       |
| **Episode 2**               | Synopsis + studio huddle + scenes JSON | [`synopsis.md`](episodes/episode-02/synopsis.md) · [`studio-huddle.md`](episodes/episode-02/studio-huddle.md) · [`scenes.json`](episodes/episode-02/scenes.json) |
| **Episode 3**               | Laser Snakes — most developed visuals  | [`synopsis.md`](episodes/episode-03/synopsis.md) · [`scenes.md`](episodes/episode-03/scenes.md) · [`scenes.json`](episodes/episode-03/scenes.json)               |
| **Episode 4**               | HOA / Morning After (synopsis ready)   | [`synopsis.md`](episodes/episode-04/synopsis.md) · [`scenes.md`](episodes/episode-04/scenes.md) · [`scenes.json`](episodes/episode-04/scenes.json)               |
| **Episode 5** _(candidate)_ | The Long Way Up (wordy episode)        | draft in [`notes/scenes/the-long-way-up.md`](notes/scenes/the-long-way-up.md) · [`docs/season-arc.md`](docs/season-arc.md)                                       |

## Production Timeline

Scene production data lives in [`episodes/episode-NN/scenes.json`](episodes/episode-01/scenes.json) per episode. The Timeline view loads these files dynamically and supports Episodes 01–04.

| Concern          | Behavior                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **Schema**       | `episode`, `title`, `lastUpdated`, `scenes[]`, `episodeHistory[]` — see Episode 01 for reference |
| **Local edits**  | Auto-saved to `localStorage` key `wof:production:episode-NN` (schema version 1)                  |
| **Sync banner**  | “Matches committed file” vs “Unsaved local edits”                                                |
| **Reset**        | Clears localStorage and restores the bundled `scenes.json`                                       |
| **Export JSON**  | Downloads current state — replace the committed file and git commit to persist                   |
| **clip_stacker** | Reduced export/import round-trip — see [`docs/clip-stacker.md`](docs/clip-stacker.md)            |

## Adding content (build-time index)

Catalog data is **not** hand-edited in `src/data/*.ts`. Author in markdown/JSON, then codegen:

| What       | Source of truth                                                | Generated output                   |
| ---------- | -------------------------------------------------------------- | ---------------------------------- |
| Songs      | `songs/*.md` (YAML frontmatter + STYLE/LYRICS/NOTES)           | `src/data/generated/songs.ts`      |
| Cutaways   | `content/cutaways/*.json` (+ optional `prompts/*-segments.md`) | `src/data/generated/cutaways.ts`   |
| Gallery    | `content/gallery.json`                                         | `src/data/generated/gallery.ts`    |
| Characters | `content/characters.json`                                      | `src/data/generated/characters.ts` |
| Staff      | `content/staff.json`                                           | `src/data/generated/staff.ts`      |
| Daisy Bell | `content/daisy-bell.json`                                      | `src/data/generated/daisy-bell.ts` |

```bash
npm run codegen        # regenerate src/data/generated/*
npm run codegen:check  # fail if generated output drifted (CI-friendly)
npm run build          # codegen + tsc + vite (always run before deploy)
```

See [`content/README.md`](content/README.md) for schemas and examples. **New song = one `songs/Foo.md` with frontmatter only** — no `songs.ts` edit.

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run codegen      # regenerate src/data/generated from content/
npm run build        # codegen + typecheck + vite build → dist/
npm run preview      # preview production build
```

Do **not** open root `index.html` with a plain static server — it is the Vite entry. Use `npm run dev` or serve `dist/` after build.

### Deploy

- **GitHub Pages**: push to `main` runs [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) (`npm ci && npm run build`, deploys `dist/`).  
  One-time: **Settings → Pages → Source = GitHub Actions**.
- **Contabo / storage**:

```bash
export DEPLOY_TOKEN="your_token_from_vps_env"
npm run build && python deploy.py
```

Uploads `dist/` as project `weeks-on-fire`. The deploy token must be set via environment variable — it is never stored in the repo. **Rotate the token on the VPS** if it was ever committed to a public repository.

`vite.config.ts` uses `base: './'` so the build works on project Pages (`/weeks_on_fire/`) and subdirectory hosts.

## Assets & repo size

- Prefer **external hosting** (Drive / Imgur / etc.) for large video and batch images.
- Small references, cast portraits, and selected stills may live in-repo for the gallery bundle.
- Agents and collaborators: see [`AGENTS.md`](AGENTS.md) (technical) and [`grok.md`](grok.md) (creative direction).

## Keywords

short film · AI-generated · Grok Imagine · Minimax Music · cinematic · production hub · screenplay · prompt engineering

---

Made with Grok Imagine magic ✨
