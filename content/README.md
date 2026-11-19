# Content index

Authoring sources for the React production hub. **`npm run codegen`** reads these files and emits typed modules under [`src/data/generated/`](../src/data/generated/).

## Production status (one set, every tab)

Songs, gallery items, cutaways, scene videos and Timeline scenes share one `status` pipeline:

`suggested` → `ready-to-generate` → `generated` → `in-edit` → `approved` → `final`

- Defined once in `scripts/content-index/schemas.ts` (`PRODUCTION_STATUSES`); labels and badge
  colors in `src/lib/status.ts`, rendered by `src/components/StatusBadge.tsx`.
- Status is the stage only. Type stays in its own field (`imageKind`, `mediaType`, cutaway `kind`).
- Gallery items and cutaways require `status`. Songs may set `status:` in frontmatter; omitted, it
  is `final` when the song has `audioFile`, else `generated`.
- Timeline still reads the old `draft` status from exports / localStorage as `suggested`.
- Anything `approved` or `final` shows up on **Finalized** (`/show/finalized`).
- The **Video** view (`/show/video`) lists everything video-shaped that has a take, with this badge. It is derived, not authored: scene `videos`, committed Timeline scenes (`episodes/*/scenes.json`), gallery items with `mediaType: video`, and cutaways past `ready-to-generate`. An idea with no take yet (`suggested`, `ready-to-generate`) stays on its own page unless it already has a linked file.

## Adding a song

1. Create `songs/Your_Track.md` with YAML frontmatter:

```yaml
---
id: your-track-id
title: Your Track
added: 2026-10-06   # day the file is written (YYYY-MM-DD), required
genre: Metal                     # a family from taxonomy.json "genres" (fixed list)
subgenre: Late-80s glam strut    # optional free-text detail under the genre
description: One-line catalog blurb
episode: "02"                    # an id from taxonomy.json "episodes" (quote numeric ids)
slot: Laundromat                 # optional free-text placement detail under the episode
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

### Taxonomy (episode ids, genres, themes, tools)

[`taxonomy.json`](taxonomy.json) is the only source of the values behind the filter dropdowns:

| Key        | Used by                                   | Rule                                                                  |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `episodes` | `songs/*.md` `episode`, gallery `episode` | Canonical id (`01`–`05`, `eyewash`, `cutaway`, …) with one label each |
| `genres`   | `songs/*.md` `genre`                      | Fixed list of families; put the specific style in `subgenre`          |
| `themes`   | gallery `theme`                           | A recurring visual motif, never a category (`imageKind` is that)      |
| `tools`    | gallery `tool` (optional)                 | One label per generator; "Grok Imagine" covers the xAI API too        |

`npm run codegen` fails on an unknown id, genre, theme or tool, and on two entries that differ only by
case or spacing. Add a new value to `taxonomy.json` first. Free-text nuance ("Skeleton Union Break",
"Short packet farm") goes in `slot`, not in `episode`. Drawer sketches in `songs/_drawer/` are not
codegen'd and keep their `Drawer / not promoted` note.

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

   **Standalone prompt docs:** every `prompts/*-segments.md` must be claimed by a cutaway (`segmentsSource`, or a cutaway whose id matches the file stem). Long-form docs with no cutaway of their own (drawer songs, companion docs to a cutaway that already has a `segmentsSource`) are listed one by one in [`standalone-prompts.json`](standalone-prompts.json) as `{ "path", "reason" }`. Codegen fails on unlisted orphans, on listed files that don't exist, and on listed files that later gain a cutaway.

3. **Optional:** `"sightBank"` — candidate sights for open `[SIGHT]` slots (Well Fall). Each item: `id`, `title`, `category`, `lane` (`fall` for mid-drop slots, `ending` for the last open slot), `prompt` (replaces `[SIGHT]`), `description`. Shown as a click-to-preview picker on Suggestions. Does not lock slots.

4. `songId` must match a song `id` from `songs/*.md` frontmatter.

5. Run `npm run codegen` and commit. The cutaway shows under **Unscheduled** on Suggestions until it has a slot in [`schedule.json`](schedule.json) (below).

## Adding to the schedule (EyeWash Station)

Suggestions is the Channel 12½ program guide. [`schedule.json`](schedule.json) is its rundown: one looping broadcast day that **arranges existing cutaways in time**. It never holds a cutaway idea of its own (those live once, in `cutaways/`), so a new cutaway needs no schedule entry: with no slot it simply shows under **Unscheduled**. To give it a time, add a slot.

```json
{
  "station": "EyeWash Station",
  "channel": "12½",
  "sponsors": [
    {
      "id": "brads-bins",
      "name": "Brad’s Bins",
      "tagline": "Every shade of blue. One of them is correct.",
      "smallPrint": "Not affiliated with the HOA. The HOA is affiliated with us."
    }
  ],
  "blocks": [
    {
      "id": "community-notice-board",
      "title": "Community Notice Board",
      "when": "Whenever, unannounced",
      "about": "Scrolling HOA text over library music. Occasionally libelous.",
      "slots": [
        { "at": "14:22", "cutawayId": "911-wrong-shade", "adBreak": "brads-bins" },
        { "at": "18:43", "cutawayId": "911-wrong-shade", "rerun": true }
      ]
    }
  ]
}
```

- **Times** are `HH:MM`, 24-hour, on the viewer's own clock. A slot runs until the next one starts; the last slot of the day runs until the first begins again. Write slots in broadcast order starting from the first slot's time (the file's first slot is the start of the day); the day may cross midnight once. Codegen fails on a slot that is not after the one before it.
- **`block`** `title`, `when` and `about` are the station's own wording for the slot (see `ideas/eyewash-station.md` → Programming blocks). `when` is display text ("Weekday mid-morning"), not a time; the slot `at` values are what the guide runs on.
- **`rerun: true`** on every airing of a cutaway after its first. The first airing is never a rerun, and an unmarked repeat fails codegen.
- **`adBreak`** names a `sponsors[].id`: a fake-sponsor spot that airs after that slot. Sponsor copy is transcribed from the ident pack (`ideas/eyewash-idents.md`), where the full spot lives; a sponsor nothing uses fails codegen. Idents and sponsor cutaways are _not_ listed here: a cutaway tagged `ident` or `sponsor` gets the matching badge wherever it airs.
- **Diegesis lock** (`docs/season-arc.md`): the series does not air an episode of itself on the station until a finale. Slot cutaways, not episodes.
- Codegen fails on an unknown cutaway or sponsor id, a duplicate block or sponsor id, a misspelled field, and a time that is not `HH:MM`. `npm run codegen` emits `src/data/generated/schedule.ts` (ids and times only); `npm run agent-docs` writes the readable rundown into `public/llms-full.txt`.
- "Now playing" follows the viewer's clock; `?at=HH:MM` on `/show/suggestions` pins the guide to a time (and the "Tune to" box sets it).

## Gallery, characters, crew, scenes

| File                                 | Purpose                                                           |
| ------------------------------------ | ----------------------------------------------------------------- |
| [`gallery.json`](gallery.json)       | Visual Archive cards (`imagePath` = repo-relative path)           |
| [`characters.json`](characters.json) | Cast bios                                                         |
| [`crew.json`](crew.json)             | Fictional crew bios (`imageFile` = filename under `public/cast/`) |
| [`scenes/*.json`](scenes/)           | Scene boards (Scenes view) — one file per scene                   |
| [`episodes.json`](episodes.json)     | Episode Bible index (Episodes view) — see below                   |
| [`cartoons/*.json`](cartoons/)       | Short cartoon seeds (Cartoons view) — one file per idea           |

**The archive has three lanes: `scene`, `test`, `character`.** There is no `suggestion` lane. Cutaway, gag and scene ideas are authored once, in `content/cutaways/`, and shown on Suggestions; the archive's "Suggestions (N)" chip links there (carrying the current search). A still for one shot of a cutaway belongs on that cutaway's segment (`segmentStills` in the cutaway JSON), not in `gallery.json` — codegen rejects `imageKind: "suggestion"`.

## Adding a scene (scene boards)

A scene is a cutaway or sequence that has grown its own page: pitch, prompt locks, a sequence of beats, a keyframe board and one or more finished videos. Every scene renders through the same template, so adding one is a JSON file — no component.

1. Create `content/scenes/your-scene-id.json` (the filename must equal `id`). Use [`scenes/daisy-bell.json`](scenes/daisy-bell.json) as the worked example:

```json
{
  "id": "your-scene-id",
  "title": "Title",
  "subtitle": "Optional line under the title",
  "format": "Musical cutaway",
  "cast": "Rubella & Lillith",
  "status": "generated",
  "tone": "emerald",
  "songId": "existing-song-id",
  "conceptFile": "ideas/your-scene.md",
  "pitch": "What the scene is.",
  "continuity": "What never changes between takes.",
  "locks": [{ "id": "subject", "label": "Subject", "text": "Paste-into-every-prompt block." }],
  "treatments": [
    {
      "id": "color",
      "label": "Full color HD",
      "short": "Color",
      "tone": "emerald",
      "description": "..."
    }
  ],
  "beats": [{ "id": "b1", "step": 1, "title": "Opening", "summary": "...", "treatment": "color" }],
  "frames": [
    {
      "id": "f1",
      "order": 1,
      "title": "Frame",
      "treatment": "color",
      "beat": "Beat label",
      "description": "...",
      "prompt": "Copy-ready Grok prompt",
      "imagePath": "images/your-scene/f1.webp",
      "tags": []
    }
  ],
  "extras": {
    "heading": "Strange sights",
    "items": [{ "id": "e1", "cue": null, "title": "...", "description": "..." }]
  },
  "videos": [
    {
      "id": "slideshow",
      "title": "Timed slideshow",
      "kind": "slideshow",
      "url": "https://host.example/scene.mp4",
      "status": "generated",
      "runtime": "~4:20"
    }
  ]
}
```

- Only `id`, `title`, `status`, `pitch`, `locks`, `treatments`, `beats`, `frames` and `videos` are required (the last five may be empty arrays). `format`, `cast`, `subtitle`, `tone`, `songId`, `conceptFile`, `continuity` and `extras` are optional; sections a scene doesn't use are left off the page.
- `treatments` are the scene's own looks. A frame or beat names one by `id`; the keyframe board gets a filter when two or more treatments have frames. `tone` is one of `emerald`, `stone`, `orange`, `sky`, `violet`, `cyan`, `amber`. `grayscale: true` draws that treatment's stills black and white.
- `videos[].url` must be a URL. A direct `.mp4`/`.webm` plays in the page; anything else (Drive, Imgur) opens in a new tab. Host large video elsewhere — do not commit it. `status` is the same pipeline as everywhere else, and the video appears on the **Video** view automatically.
- Codegen fails on an unknown `songId`, a missing `conceptFile` or `imagePath`, a frame or beat that names an undefined treatment, and duplicate ids.
- `npm run codegen`, then commit the JSON and the regenerated `src/data/generated/scene-boards.ts`.

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
- Three lanes:
  - Dry elegant stills, matching [`notes/one-panel-gags.md`](../notes/one-panel-gags.md).
  - Mid-90s animal / Family Guy cutaways: talking animals, unmotivated gags, 4:3 cel. Lead with the Episode 4 style block (`2D hand-drawn cel animation frame in early-1990s Warner Bros. television cartoon style, NOT photoreal, NOT 3D`). Do not use photoreal lens language on those prompts.
  - **Silly slapstick** (`register: "silly slapstick"`, tag `silly`): loud, physical, kid-readable. Same Episode 4 cel style block. The pool leans dry, so new batches should add to this lane. Rules:
    - A five-year-old gets it with the sound off. No concept, no irony needed.
    - One small cause, a way-too-big effect (sneeze, hiccup, one push, one more scoop).
    - Side characters do **big takes**: eyes pop, jaws hit the floor, feathers blow off. Only Lillith, Rubella, Pizza Guy and the black cat stay flat. The silly world happens around them.
    - Bonk, boing, splat, squeak, pop. Nobody gets hurt; the victim usually enjoyed it.
    - Kid-level gross only: a green cloud, a burp, polka-dot underwear.
    - Put the payoff on the music drop (third hiccup, the POP, the BWAAAMP).
- Do not reuse the locked gags listed in `notes/one-panel-gags.md`.
- Optional `stillImagePath` is shown on the Cartoons view. Local 6–8s I2V loops may live at `public/cartoons/<id>.mp4` (gitignored).
- When a seed is ready, promote it to `content/cutaways/` (Suggestions) and record the link on
  **both** files, so the cartoon page and the Suggestions board link to each other:
  - cartoon: `"status": "promoted"` and `"promotedToCutawayId": "<cutaway-id>"` (the parking lot
    keeps the credit);
  - cutaway: `"promotedFromCartoonId": "<cartoon-id>"`.

  Codegen fails if only one side is set, the two disagree, or `status` and `promotedToCutawayId`
  do not go together.

- Run `npm run codegen` and commit the JSON + `src/data/generated/` changes.

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
  "camera": {
    "type": "orbit",
    "radius": 5,
    "height": [
      { "t": 0, "v": 1 },
      { "t": 8, "v": 2 },
    ],
    "angle": [
      { "t": 0, "v": 0 },
      { "t": 16, "v": 360 },
    ],
    "fov": 48,
  },
  "environment": {
    "background": [0.02, 0.02, 0.02],
    "lightDir": [0.4, 0.75, 0.5],
    "fogDensity": 0.04,
  },
  "nodes": [
    {
      "id": "core",
      "geometry": { "type": "sphere", "radius": 0.3 },
      "material": { "kind": "lit", "color": [0.5, 0.2, 0.05], "emissive": [0.5, 0.15, 0.04] },
      "translation": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "spin": [0, 30, 0],
    },
  ],
  "clips": [
    {
      "target": "core",
      "property": "scale",
      "ease": "inOut",
      "keys": [
        { "t": 0, "v": [0, 0, 0] },
        { "t": 3.5, "v": [1, 1, 1] },
      ],
    },
  ],
  "loop": { "inSec": 0, "outSec": 16 },
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

## Linking records (catalog graph and search)

Records point at each other by **id**. Every link is optional, validated at codegen time, and
emitted into `src/data/generated/catalog-graph.ts` (nodes + typed edges) and
`public/catalog-graph.json` (the same, with absolute URLs, for agents). Character, song, episode,
cartoon, cutaway and sequence pages show the result as an **Appears in** / **Links** strip.

| Record         | Field                    | Points at                                  | Edge (`rel`)                                     |
| -------------- | ------------------------ | ------------------------------------------ | ------------------------------------------------ |
| Cutaway        | `songId` (required)      | song                                       | `song`                                           |
| Cutaway        | `characterIds`           | `characters.json` ids                      | `character`                                      |
| Cutaway        | `episodeId`              | `episodes.json` id                         | `episode`                                        |
| Cutaway        | `promotedFromCartoonId`  | cartoon (must point back)                  | `promotion`                                      |
| Cutaway        | `sequenceInsertIds`      | 3D sequences cut into it                   | `insert`                                         |
| Cartoon        | `promotedToCutawayId`    | cutaway (must point back)                  | `promotion`                                      |
| Sequence       | `relatedCutawayIds`      | cutaways it goes with (still no song id)   | `related`                                        |
| Sequence       | `characterIds`           | characters                                 | `character`                                      |
| Scene board    | `songId`, `characterIds` | song, characters                           | `song`, `character`                              |
| Song           | `episodeId`              | `episodes.json` id                         | `episode`                                        |
| Timeline scene | refs (see below)         | song / cutaway / sequence / cartoon / cast | `song`, `insert`, `character` (from the episode) |

- `episode` on songs and gallery items is a taxonomy id; when it is also an Episode Bible id
  (`01`–`05`) the episode edge is derived, so set song `episodeId` only when `episode` is a bucket
  (`cutaway`, `eyewash`, …). A song `episodeId` that contradicts an episode id fails codegen.
- Cutaway `episode` stays free-text placement ("Episode 03 / wellness ladies"); `episodeId` is the
  typed link. Leave it off when the placement is ambiguous ("Episode 03 / 04 witness").
- Only add a `characterIds` entry for someone on screen in the record itself (the summary or
  segments name them), not for a passing mention. Lists may not repeat an id and are never `[]`.
- The `sceneId` keys in `src/data/sceneDialogVersions.ts` must be cutaway ids.

**Search.** `npm run codegen` also writes `src/data/generated/search-index.ts`: one slim document
per record (title, subtitle, tags, summary clipped to 360 characters, linked character names, route)
— no lyrics, style prompts or Grok prompts. The header search (`/`, Ctrl/⌘-K) and
`/show/search?q=…&type=…` index it with MiniSearch, lazily; the build's bundle gate fails if
MiniSearch or the corpus lands in the main chunk.

## "What's new" on the Overview

The hub's Overview page shows the newest additions. Codegen reads `added: "YYYY-MM-DD"` (the day you add the record) and writes the picks to `src/data/generated/whats-new.ts`:

- **Songs** — `added` is required (frontmatter).
- **Cutaways, cartoons, 3D sequences, gallery items** — `added` is optional. Put it right under `id` when you add a new one; records without it never appear in the strip.

It shows the newest two of each kind (song, suggestion, cartoon, sequence, video, image), newest first. Existing records were backfilled from the date their file or entry first appeared in git. The Overview's own prose (logline, synopsis, tone, format) is `src/data/about.ts`.

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
- Catalog links: unknown or repeated `characterIds`, unknown `episodeId` / `sequenceInsertIds` /
  `relatedCutawayIds`, one-sided or mismatched cartoon ⇄ cutaway promotion, dialog `sceneId` keys
  (see [Linking records](#linking-records-catalog-graph-and-search))

## Migration from legacy TS

One-time export from the old hand-edited data layer:

```bash
npm run migrate:content
```

This reads the previous `src/data/*.ts` sources and writes `content/` + song frontmatter. Re-run only when recovering from legacy state.

## Catalog refs on Timeline scenes

A scene in `episodes/episode-NN/scenes.json` may point at the catalog records that play in its slot:
optional `songId`, `cutawayId`, `sequenceId`, `cartoonId` and `characterIds` (schema:
[`src/schemas/production.ts`](../src/schemas/production.ts)). Rules of thumb:

- Use the record's `id`, not its title. The scene `title` stays your own label.
- Leave a ref **out** when it is unset — never `""` or `[]`.
- Only add a ref that is already true in the episode files (e.g. the description names the
  cutaway). Refs are not required; a prompt-only scene is valid.
- `npm run codegen` checks every ref against the catalog and fails with
  `episode 01 scene-002 songId "no-such-track" is not a song id`.
- The Timeline editor picks from `src/data/generated/catalog-refs.ts`, a codegen'd `{ id, title }`
  list, so the Timeline chunk never imports full lyrics or segment prompts.

## Related

- Timeline production JSON: [`episodes/episode-NN/scenes.json`](../episodes/) — separate from this index; see [`docs/clip-stacker.md`](../docs/clip-stacker.md)
- Segment prompt docs: [`prompts/`](../prompts/)
- Season spine / Episode 5 candidate context: [`docs/season-arc.md`](../docs/season-arc.md)
