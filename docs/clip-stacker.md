# clip_stacker integration

The Production Timeline can export a reduced JSON payload for external **clip_stacker** tooling and import it back with merge rules.

## Not to be confused with `clip_stacker_directions.md`

This document is the machine-readable **`clip-stacker-NN.json`** export/import contract only —
schema-validated fields for the Timeline's clip_stacker payload. It is a different artifact from
**`clip_stacker_directions.md`**, a prose "edit grammar" reference for production notes
(referenced from files under `ideas/` and `prompts/`, e.g. `prompts/home-sweet-void-segments.md`).
That file is not committed to this repo — it's an external production artifact, the same way
a scene video's `url` (`content/scenes/daisy-bell.json`) points at a hosted video rather than a git-tracked one. If you're
looking for narrative edit-grammar guidance, that's the wrong doc; if you're looking for the JSON
field contract, you're in the right place.

This repo also has no in-repo C++/emscripten toolchain and no `compile_commands.json` — native
clip/video assembly from this JSON contract is out of scope for this SPA and is tracked separately
in issue #43, consumed by a separate repo. (Stills → MP4 *previews* of a single cutaway are a different,
in-repo tool: [cutaway-assembly.md](cutaway-assembly.md). It does not read or write this payload.)

## Export payload (`clip-stacker-NN.json`)

The `clip_stacker` payload (`ClipStackerPayload`) and its `clips[]` items (`ClipStackerClip`) are
defined once, as runtime-validated Zod schemas, in
[`src/schemas/production.ts`](../src/schemas/production.ts) — `ClipStackerPayloadSchema` and
`ClipStackerClipSchema`. That module is the source of truth for field names, types, and the
`weeks_on_fire_v1` version tag; this document does not repeat the field list so it can't drift out
of sync. `EpisodeProduction` / `ProductionScene` (the committed `scenes.json` shape) live in the
same module.

Both `src/data/production.ts` (`exportToClipStacker`, `clipStackerToProduction`,
`isClipStackerPayload`) and `src/lib/productionStorage.ts` (the `wof:production:episode-NN`
localStorage wrapper) validate against these same schemas — there is no second, hand-rolled
parser. Unrecognized extra fields on a payload are accepted and stripped rather than rejected, so
the format can grow without breaking older exports. See `src/schemas/production.test.ts` for the
export → import round-trip and rejection cases covered by `npm run test`.

### Catalog refs

A scene (`ProductionScene`) and a clip (`ClipStackerClip`) may each carry optional pointers to the
catalog records that play in that slot. The keys are defined once by `CatalogRefsSchema` in
[`src/schemas/production.ts`](../src/schemas/production.ts) — this document does not restate them.
They follow three rules:

- **Optional, and validated only when present.** A scene with just a prompt stays valid. Old
  payloads that omit the keys still parse; an external clip_stacker that does not know the fields
  keeps working, because unknown keys are stripped.
- **Unset is an omitted key, never `""` or `[]`.** A blank id fails validation, so "unset" and "set
  to blank" cannot be confused. Exports include a ref only when it is set; `version` stays
  `weeks_on_fire_v1`.
- **Ids, not titles.** A scene's own `title` remains the human label and may differ from the
  catalog title on purpose. In committed `episodes/episode-NN/scenes.json`, `npm run codegen`
  fails on an id that is not in the catalog it names (the same class of check as
  `cutaway.songId`); the Timeline editor only offers known ids.

### Session takes (`blob:` media)

A take recorded in the hub ([capture.md](capture.md)) can be attached to a scene from the Timeline
editor. Its `mediaUrl` is a `blob:` URL that only the recording tab can open, so it never leaves the
tab: the clip_stacker export sends `mediaUrl: null` for that scene, **Export JSON** drops it, and the
browser's saved edits store the scene with no media link. Host the take and paste its http(s) link
to have it exported.

### Omitted on export

These fields exist in `episodes/episode-NN/scenes.json` but are **not** included in clip_stacker exports:

- `episode` (episode number)
- `lastUpdated`
- Per-scene `prompt`
- Per-scene `addedAt`, `lastEditedAt`
- Per-scene `history`

Use **Export JSON** in the Timeline for the full committed schema.

## Import merge semantics

When importing a `clip-stacker-*.json` file:

1. Validate `version === "weeks_on_fire_v1"` and `clips` is an array.
2. For each clip, match by `id` against the **committed** `scenes.json` baseline for the current episode.
3. **Matched scenes** — update `title`, `timestamp`, `order`, `status`, `mediaUrl`, `description`; preserve `prompt`, `addedAt`, and prior `history`; append an `"Imported from clip_stacker"` history entry. Catalog refs the clip carries replace the scene's; refs the clip omits are kept (a tool that does not know the fields cannot erase them — clear a ref in the Timeline editor).
4. **New clip IDs** — create a new scene with defaults (and any refs the clip carries); append import history.
5. `episodeHistory` from the payload **replaces** the episode history.
6. `title` ← `project`; `lastUpdated` ← import time.

### Data loss warnings

- Import cannot restore `prompt` or per-scene history for clips whose `id` does not match a committed scene.
- Re-importing after editing only in clip_stacker will overwrite matched scene fields.

### Round-trip proof (Episode 01)

`src/schemas/production.test.ts` ("Timeline ↔ clip_stacker round trip on the committed Episode 01
file") runs the real `episodes/episode-01/scenes.json` through export → a JSON file (stringify and
parse, as a download and upload would) → import, and checks that:

- every scene keeps all of its fields, including `prompt`, `addedAt` and its existing history, and
  gains exactly one `"Imported from clip_stacker"` history entry;
- exporting the imported episode again gives the same `clips[]` (the round trip is stable);
- `mediaUrl` and `status` edited on a clip land on that scene only (`clips[].mediaUrl` ↔
  `ProductionScene.mediaUrl`; an unset `mediaUrl` is `""` in the scene and `null` in the clip);
- with no committed baseline, the Timeline can be rebuilt from the export alone, minus the
  per-scene `prompt` and history the payload does not carry (the data loss noted above).

## Stored edits (localStorage)

The Timeline keeps in-progress edits in `wof:production:episode-NN` as an envelope
(`schemaVersion`, `savedAt`, `production`; see `StoredProductionSchema`). Loading goes through
`migrateStoredProduction` in the same schema module, which `parseStoredProduction` calls:

- `schemaVersion` stays at **1** while every new key is optional — v1 documents with or without
  catalog refs both load as-is.
- A change old documents cannot satisfy bumps `PRODUCTION_STORAGE_SCHEMA_VERSION` and adds a
  `fromVersion` step (`fromV1`, then `fromV2`, …), so saved edits are carried forward instead of
  discarded. Unknown or newer versions, and payloads that fail the current schema, return `null`.

## Example minimal payload

```json
{
  "project": "Weeks on Fire - Episode 02",
  "version": "weeks_on_fire_v1",
  "exportedAt": "2026-08-29T14:00:00.000Z",
  "clips": [
    {
      "id": "scene-001",
      "title": "480p Feed Up / Warehouse Establish",
      "timestamp": "00:00:00",
      "order": 1,
      "status": "draft",
      "mediaUrl": null,
      "description": "Grainy 480p warehouse establish."
    }
  ],
  "episodeHistory": [
    {
      "date": "2026-08-29T12:00:00Z",
      "action": "scenes-json-initialized",
      "note": "Sparse production timeline scaffold created for Episode 02"
    }
  ]
}
```

## Related files

- Schema: [`src/schemas/production.ts`](../src/schemas/production.ts) (`ClipStackerPayloadSchema`, `EpisodeProductionSchema`, `StoredProductionSchema`)
- Export/import logic: [`src/data/production.ts`](../src/data/production.ts) (`exportToClipStacker`, `clipStackerToProduction`)
- Storage wrapper: [`src/lib/productionStorage.ts`](../src/lib/productionStorage.ts)
- Timeline UI: [`src/components/TimelinePage.tsx`](../src/components/TimelinePage.tsx)
- Committed scene data: [`episodes/episode-NN/scenes.json`](../episodes/)
