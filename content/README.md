# Content index

Authoring sources for the React production hub. **`npm run codegen`** reads these files and emits typed modules under [`src/data/generated/`](../src/data/generated/).

## Adding a song

1. Create `songs/Your_Track.md` with YAML frontmatter:

```yaml
---
id: your-track-id
title: Your Track
genre: Genre label
description: One-line catalog blurb
episode: Episode 02 / cutaway tag
tags: [tag-one, tag-two]
instrumental: false
audioFile: null   # or "Daisy+Bell.mp3" when an mp3 exists in songs/
---
STYLE:

Minimax style prompt here.


LYRICS:

[Verse]
...


NOTES:

Production notes.
```

2. Run `npm run codegen` (or `npm run build`).
3. Commit the markdown file **and** the regenerated `src/data/generated/*.ts` files.

No edits to `src/data/songs.ts` are required.

## Adding a cutaway

1. Create `content/cutaways/your-cutaway-id.json`:

```json
{
  "id": "your-cutaway-id",
  "kind": "musical",
  "title": "Title",
  "status": "ready-to-generate",
  "runtime": "~55 seconds",
  "episode": "Musical Cutaway",
  "songId": "existing-song-id",
  "songTitle": "Song Title",
  "summary": "...",
  "visualArc": "...",
  "tags": ["tag"],
  "segments": []
}
```

2. **Optional:** set `"segmentsSource": "prompts/your-cutaway-segments.md"` instead of inline `segments` when timed Grok/Gemini prompts live in `prompts/`. Codegen parses `## A — Title (0:00–0:08)` headers when present; otherwise keep `segments` inline in JSON.

3. **Optional:** `"sightBank"` — candidate sights for open `[SIGHT]` slots (Well Fall). Each item: `id`, `title`, `category`, `lane` (`fall` for mid-drop slots, `ending` for the last open slot), `prompt` (replaces `[SIGHT]`), `description`. Shown as a click-to-preview picker on Suggestions. Does not lock slots.

4. `songId` must match a song `id` from `songs/*.md` frontmatter.

5. Run `npm run codegen` and commit.

## Gallery, characters, staff, Daisy Bell

| File                                 | Purpose                                                           |
| ------------------------------------ | ----------------------------------------------------------------- |
| [`gallery.json`](gallery.json)       | Visual Archive cards (`imagePath` = repo-relative path)           |
| [`characters.json`](characters.json) | Cast bios                                                         |
| [`staff.json`](staff.json)           | Fictional crew bios (`imageFile` = filename under `public/cast/`) |
| [`daisy-bell.json`](daisy-bell.json) | Daisy Bell keyframe board                                         |
| [`episodes.json`](episodes.json)     | Episode Bible index (Episodes view) — see below                   |
| [`cartoons/*.json`](cartoons/)       | Short cartoon seeds (Cartoons view) — one file per idea           |

## Adding/editing an episode (Episode Bible)

`episodes.json` is the source for the **Episodes** hub view (`/episodes`, `/episodes/:id`) — a
read-only logline/status/synopsis browser. It does **not** replace `episodes/episode-NN/scenes.json`
(that stays Timeline's editable production data).

Each entry:

```json
{
  "id": "01",
  "number": 1,
  "title": "The Burning Town",
  "register": "Glamour fire",
  "status": "synopsis-ready",
  "runtime": "~4 min",
  "logline": "One sentence, sourced from the episode's own synopsis/season-arc — don't invent one.",
  "files": {
    "synopsis": "episodes/episode-01/synopsis.md",
    "scenes": "episodes/episode-01/scenes.md",
    "screenplay": "episodes/episode-01/screenplay.md",
    "subtitles": "episodes/episode-01/subtitles.srt",
    "notes": "notes/scenes/some-note.md",
    "seasonArc": "docs/season-arc.md"
  }
}
```

- `status` is one of `synopsis-ready`, `in-production`, `candidate`.
- All `files` entries are repo-relative and optional; codegen fails if a referenced path doesn't
  exist. Only `synopsis`, `scenes`, `screenplay`, `notes`, and `seasonArc` render as in-app markdown
  (via `react-markdown` + `remark-gfm`) — `subtitles` is link-only.
- Parked, not-yet-shot episodes (e.g. the Episode 5 candidate) set `"isCandidate": true` and have no
  `episodes/episode-NN/` folder yet — link `notes`/`seasonArc` instead of `synopsis`/`scenes`.
- Run `npm run codegen` and commit `episodes.json` + the regenerated `src/data/generated/episodes.ts`.

## Adding a short cartoon idea (agents)

The **Cartoons** hub view (`/cartoons`) is a parking lot for short cartoon seeds — one still, a
6–8s loop, no song id, no timed segments. One JSON file per idea under
[`cartoons/`](cartoons/). Filename must match `id`.

```json
{
  "id": "your-idea-id",
  "title": "Title",
  "premise": "The gag in one or two sentences.",
  "visual": "What we see. Newspaper-comic test: if it needs a caption, the still is unfinished.",
  "status": "seed",
  "tags": ["tag"],
  "runtime": "~8 seconds",
  "register": "grounded surreal",
  "characterLean": "optional — who it leans toward",
  "grokImaginePrompt": "optional copy-ready still prompt",
  "motion": "optional 6–8s motion note",
  "notes": "optional production notes",
  "agent": "optional — which model/agent dropped this",
  "stillImagePath": "optional — repo-relative still, e.g. images/cartoons/your-idea.jpg"
}
```

- `status` is one of `seed`, `sketched`, `ready-to-generate`, `promoted`.
- Required: `id`, `title`, `premise`, `visual`, `status`, `tags`.
- Two lanes:
  - Dry elegant stills, matching [`notes/one-panel-gags.md`](../notes/one-panel-gags.md).
  - Mid-90s animal / Family Guy cutaways: talking animals, unmotivated gags, 4:3 cel. Lead with the Episode 4 style block (`2D hand-drawn cel animation frame in early-1990s Warner Bros. television cartoon style, NOT photoreal, NOT 3D`). Do not use photoreal lens language on those prompts.
- Do not reuse the locked gags listed in `notes/one-panel-gags.md`.
- Optional `stillImagePath` is shown on the Cartoons view. Local 6–8s I2V loops may live at `public/cartoons/<id>.mp4` (gitignored).
- When a seed is ready, promote it to `content/cutaways/` (Suggestions). Leave `status: "promoted"`
  on the cartoon file so the parking lot keeps the credit.
- Run `npm run codegen` and commit the JSON + `src/data/generated/cartoons.ts`.

## Adding a 3D sequence (in-hub player)

The **3D Sequences** hub view (`/sequences`, `/sequences/:id`) plays procedural WebGL
video sequences — 10 seconds to 2 minutes, no song id. One JSON file per sequence
under [`sequences/`](sequences/). Filename must match `id`. Each id is played by one of
two renderers (see [Graph vs custom](#graph-vs-custom-renderer)).

```json
{
  "id": "your-sequence-id",
  "title": "Title",
  "medium": "unreal",
  "runtime": "~18 seconds",
  "durationSec": 18,
  "premise": "What happens.",
  "visual": "What we see.",
  "motion": "Timed motion notes.",
  "tags": ["tag"]
}
```

- `medium` is one of `unreal`, `photoreal`, `cartoon`, `mixed`.
- `durationSec` must be between 10 and 120.
- Optional: `aspect` (`16:9` default, or `4:3`), `register`, `grokImaginePrompt`,
  `geminiOmniPrompt`, `notes`, `agent`, `stillImagePath`.
- The hub player is the sequence. Imagine prompts are copy-ready still / I2V
  packets, not a substitute for the in-app animation.
- Run `npm run codegen` and commit the JSON + `src/data/generated/sequences.ts`.

### Graph vs custom renderer

- **Graph (default, no TypeScript):** add `content/sequences/<id>.graph.json` next to the
  record (or a `graph` key on the record — not both). Codegen validates it with Zod
  (`scripts/content-index/graph-schema.ts`) and the hub plays it through
  `src/sequences/graph/`. Invalid tracks, unknown node ids, or times past `durationSec` fail
  `npm run codegen`. Reference: [`sequences/lattice-hymn.graph.json`](sequences/lattice-hymn.graph.json).
- **Custom (`"renderer": "custom"`):** a hand-written factory in `src/sequences/scenes/*.ts`
  registered in `src/sequences/registry.ts`. Use it only for unique deformers (e.g. the
  rubber-hose walk cycle). Codegen fails if a record has neither a graph nor
  `"renderer": "custom"` with a registered factory.

Graph shape (angles in degrees, times in seconds; unknown keys are rejected):

```jsonc
{
  "camera": { "type": "orbit", "radius": 5, "height": [{ "t": 0, "v": 1 }, { "t": 8, "v": 2 }], "angle": [{ "t": 0, "v": 0 }, { "t": 16, "v": 360 }], "fov": 48 },
  "environment": { "background": [0.02, 0.02, 0.02], "lightDir": [0.4, 0.75, 0.5], "fogDensity": 0.04 },
  "nodes": [
    { "id": "core", "geometry": { "type": "sphere", "radius": 0.3 },
      "material": { "kind": "lit", "color": [0.5, 0.2, 0.05], "emissive": [0.5, 0.15, 0.04] },
      "translation": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1], "spin": [0, 30, 0] }
  ],
  "clips": [
    { "target": "core", "property": "scale", "ease": "inOut",
      "keys": [{ "t": 0, "v": [0, 0, 0] }, { "t": 3.5, "v": [1, 1, 1] }] }
  ],
  "loop": { "inSec": 0, "outSec": 16 }
}
```

- `camera.type`: `locked` (`eye`, `target`), `perspective` (keyframable `eye`, `target`, `fov`),
  or `orbit` (keyframable `radius`, `height`, `angle`, optional `target`, `fov`). Any animated
  value is a constant or `[{ "t", "v", "ease?" }]` (held flat outside the first / last key).
- `geometry.type`: `box`, `sphere`, `cylinder`, `torus`, `plane`, `icosahedron`, `lathe`
  (`profile` of `[radius, y]`), `lineCube`, `icosahedronLines`, `line` (`points`, `closed`),
  `points` (seeded cloud: `count`, `radius: [min, max]`, `flatten`, `seed`).
- `material.kind`: `lit` / `cel` (`color`, `emissive`, `shininess`, `outline` on cel), `unlit`
  (flat; `size` / `alpha` for points), `line`. Triangle geometry takes `lit` / `cel` / `unlit`,
  line geometry takes `line`, `points` take `unlit`.
- `clips` animate `translation`, `rotation`, `scale`, `emissive` (lit / cel), `alpha` (points)
  on a node id, or `fogDensity` on target `scene`. `ease` is `linear`, `in`, `out`, `inOut`
  or `hold`; a key's own `ease` shapes the segment after it. A clip replaces the node's static
  value; `spin` (deg/s) is added on top so continuous rotation loops without a seam.
- `loop`: after `outSec`, scene time wraps back to `inSec`.
- No song id, no glTF, no three.js in v1.

## Dialog versions (intentional TS exception)

Long-form dialog audition pages live in [`notes/scenes/versions/`](../notes/scenes/versions/). They are prose (competing registers, fragments, juxtaposition notes), not a codegen schema.

The Suggestions workspace reads **only** the selected Riley Rosencrantz exchanges from hand-authored [`src/data/sceneDialogVersions.ts`](../src/data/sceneDialogVersions.ts). Do not add new catalog arrays there — new indexed content belongs in this folder.

## Validation

`npm run build` runs codegen with cross-reference checks:

- Duplicate ids
- `cutaway.songId` → known song
- Missing image paths
- Segment count vs `## Edit timeline` table (when present in prompts source)
- Orphan `prompts/*-segments.md` files (`npm run codegen:check`)
- Episode `files.*` paths exist on disk; duplicate episode `id`/`number`
- Cartoon filename matches `id`; duplicate cartoon ids

## Migration from legacy TS

One-time export from the old hand-edited data layer:

```bash
npm run migrate:content
```

This reads the previous `src/data/*.ts` sources and writes `content/` + song frontmatter. Re-run only when recovering from legacy state.

## Related

- Timeline production JSON: [`episodes/episode-NN/scenes.json`](../episodes/) — separate from this index; see [`docs/clip-stacker.md`](../docs/clip-stacker.md)
- Segment prompt docs: [`prompts/`](../prompts/)
- Season spine / Episode 5 candidate context: [`docs/season-arc.md`](../docs/season-arc.md)
