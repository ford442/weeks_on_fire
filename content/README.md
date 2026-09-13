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

## Migration from legacy TS

One-time export from the old hand-edited data layer:

```bash
npm run migrate:content
```

This reads the previous `src/data/*.ts` sources and writes `content/` + song frontmatter. Re-run only when recovering from legacy state.

## Related

- Timeline production JSON: [`episodes/episode-NN/scenes.json`](../episodes/) — separate from this index; see [`docs/clip-stacker.md`](../docs/clip-stacker.md)
- Segment prompt docs: [`prompts/`](../prompts/)
