# clip_stacker integration

The Production Timeline can export a reduced JSON payload for external **clip_stacker** tooling and import it back with merge rules.

## Not to be confused with `clip_stacker_directions.md`

This document is the machine-readable **`clip-stacker-NN.json`** export/import contract only —
schema-validated fields for the Timeline's clip_stacker payload. It is a different artifact from
**`clip_stacker_directions.md`**, a prose "edit grammar" reference for production notes
(referenced from files under `ideas/` and `prompts/`, e.g. `prompts/home-sweet-void-segments.md`).
That file is not committed to this repo — it's an external production artifact, the same way
`daisyBellMeta.slideshowUrl` points at a hosted video rather than a git-tracked one. If you're
looking for narrative edit-grammar guidance, that's the wrong doc; if you're looking for the JSON
field contract, you're in the right place.

This repo also has no in-repo C++/emscripten toolchain and no `compile_commands.json` — native
clip/video assembly from this JSON contract is out of scope for this SPA and is tracked separately
in issue #43, consumed by a separate repo.

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
3. **Matched scenes** — update `title`, `timestamp`, `order`, `status`, `mediaUrl`, `description`; preserve `prompt`, `addedAt`, and prior `history`; append an `"Imported from clip_stacker"` history entry.
4. **New clip IDs** — create a new scene with defaults; append import history.
5. `episodeHistory` from the payload **replaces** the episode history.
6. `title` ← `project`; `lastUpdated` ← import time.

### Data loss warnings

- Import cannot restore `prompt` or per-scene history for clips whose `id` does not match a committed scene.
- Re-importing after editing only in clip_stacker will overwrite matched scene fields.

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
