# Assembling a cutaway preview

`scripts/assemble-cutaway.py` turns a cutaway's stills and its song into a timed MP4 preview: one
still per segment, cut on the segment times, an optional Ken Burns move, the song underneath. It
generalizes `scripts/assemble-daisy-slideshow.py` (which has Daisy Bell's cue map hard-coded) to
any cutaway.

It is a preview tool, not the edit. Its job is to answer "does this cut breathe against the song
before we spend more Grok Imagine credits?" The result goes to `videos/` (gitignored); the real
timeline lives in the Timeline view and the external editor (see [clip-stacker.md](clip-stacker.md)).

For a quicker look, the cutaway preview on Suggestions can record the same cut in the browser, song
included, as a WebM take ([capture.md](capture.md)). This script stays the quality path: exact frame
boundaries, H.264, any size.

**Needs `ffmpeg` and `ffprobe` on `PATH`** (`apt install ffmpeg` / `brew install ffmpeg`). Python
standard library only, like every script in this repo. No npm packages are involved.

## Quick start

```bash
# 1. Stills for every segment (paid API: dry-run first; see AGENTS.md → xai-batch.py)
python3 scripts/xai-batch.py mv-ultra-screech --dry-run
python3 scripts/xai-batch.py mv-ultra-screech

# 2. See the plan and the exact ffmpeg command; nothing is written
python3 scripts/assemble-cutaway.py --manifest content/cutaways/mv-ultra-screech.json --dry-run

# 3. Assemble (about 50 s for a 3-minute cut with pans)
python3 scripts/assemble-cutaway.py --manifest content/cutaways/mv-ultra-screech.json --pan auto
# → videos/mv-ultra-screech-preview.mp4
```

Without stills yet, `--allow-missing` plays black for the segments that have none, which is enough
to check timing against the song.

## `--manifest` takes one of two things

### A cutaway record: `content/cutaways/<id>.json`

Everything is read from the generated catalog, so the ids and times are the ones Suggestions shows.
Run `npm run codegen` after editing a prompts file.

| Needed       | Taken from                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Segments     | `public/catalog/cutaways/<id>.json` → `segments[]` (`id`, `start`, `end`)                                                                                            |
| A still      | the segment's registered still (`segmentStills` → `stillImagePath`), else `images/<name>/<segment-id>.<jpg\|jpeg\|png\|webp>` (where `xai-batch.py` writes; `--images DIR` overrides) |
| Audio        | the cutaway's `songId` → `public/catalog/songs/<songId>.json` → `songs/<audioFile>` (`--audio PATH` overrides)                                                       |
| Output       | `videos/<id>-preview.mp4` (`--out PATH` overrides)                                                                                                                   |

`<name>` is the prompts file's name without `-segments.md` (`glam-sham-poo` for
`mv-ultra-screech`), or the cutaway id when there is no prompts file.

It stops, before writing anything, when a segment has no still (listing the paths it looked for and
the `xai-batch.py` command that makes them), when the song has no audio yet, or when a segment time
in the catalog is not a time. A few cutaways have junk there (`"5:40 PM"`, `"Button"`) because the
prompts markdown is free text; for those, use an assembly manifest.

### An assembly manifest

A JSON file you write, or derive and then edit:

```bash
python3 scripts/assemble-cutaway.py --manifest content/cutaways/the-soft-gyre.json \
  --allow-missing --write-manifest ideas/soft-gyre/assembly.json   # writes the manifest, makes no video
# edit it: point `image` at the real files, add pans, fix times
python3 scripts/assemble-cutaway.py --manifest ideas/soft-gyre/assembly.json --no-audio
```

```json
{
  "version": 1,
  "cutaway": "mv-ultra-screech",
  "audio": "songs/glam-sham-poo.mp3",
  "size": "1280x720",
  "fps": 24,
  "out": "videos/glam-sham-poo-preview.mp4",
  "previewUrl": "https://drive.google.com/…",
  "defaultPan": "auto",
  "segments": [
    { "id": "a", "image": "images/glam-sham-poo/a.jpg", "start": 0, "end": 6 },
    { "id": "b", "image": "images/glam-sham-poo/b.jpg", "start": "0:06", "end": "0:21", "pan": "left" },
    {
      "id": "c",
      "image": "images/glam-sham-poo/c.jpg",
      "end": "0:42",
      "pan": { "from": { "zoom": 1.0, "x": 0.3, "y": 0.5 }, "to": { "zoom": 1.3, "x": 0.6, "y": 0.4 } }
    },
    { "id": "d", "image": null, "end": "0:53" }
  ]
}
```

| Field        | Required | Meaning                                                                                                                              |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `version`    | yes      | `1`. This is what tells a manifest from a cutaway record.                                                                            |
| `segments`   | yes      | In time order. See below.                                                                                                            |
| `cutaway`    | no       | A cutaway id. Names the output (`videos/<id>-preview.mp4`) and supplies `audio` when that is omitted.                                |
| `audio`      | no       | Audio file, repo-relative or absolute. Required unless `cutaway` supplies it, or you pass `--no-audio`.                              |
| `size`       | no       | `WIDTHxHEIGHT`, both even. Default `1280x720`.                                                                                       |
| `fps`        | no       | Whole number, 1–120. Default `24`.                                                                                                   |
| `out`        | no       | Where to write. Default `videos/<cutaway or file name>-preview.mp4`.                                                                 |
| `previewUrl` | no       | Where the finished MP4 is **hosted** (Drive / Imgur). Informational: printed after a run, never fetched or uploaded. See Output.     |
| `defaultPan` | no       | Pan for segments that set none: a preset, or `auto`. Default `none`.                                                                 |
| `note`       | no       | Free text for humans; ignored.                                                                                                       |

Segment fields (unknown keys are an error, so a typo like `strat` cannot silently do nothing):

| Field   | Required | Meaning                                                                                                                      |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`    | yes      | Unique within the manifest.                                                                                                  |
| `image` | yes      | Repo-relative or absolute path. `null` is a deliberate black segment. A path that does not exist is an error (or black with `--allow-missing`). |
| `end`   | yes      | Seconds (`21`, `21.5`) or `"M:SS"` / `"H:MM:SS"`. Must be after `start`.                                                     |
| `start` | no       | Same formats. Defaults to the previous segment's `end` (the first starts at 0).                                              |
| `pan`   | no       | A preset or a `from` / `to` object (below). Overrides `defaultPan` and `--pan`, including `"none"`.                          |
| `label` | no       | Shown by `--write-manifest`; ignored by the render.                                                                          |
| `note`  | no       | Free text for humans; ignored.                                                                                               |

## Timing

- **Frame-exact, no drift.** Each boundary is rounded to a frame from its absolute time
  (`round(t × fps)`), not from a running sum of rounded durations, so a long cut ends on the same
  frame as the song. Glam-Sham-Poo at 24 fps is exactly 4104 frames for 171.000 s of audio.
- **Gaps play black.** A gap between segments, or before the first, is filled with black and
  reported as a warning. An overlap, or segments out of order, is an error.
- **Length.** The video ends at the last segment's `end`. The song is trimmed to that, or padded with
  silence if it is shorter. It warns when the song is more than 0.5 s shorter or more than 1 s longer.
- **Frame size.** A still of another aspect ratio is fitted inside the frame with black bars, never
  stretched or cropped.

## Ken Burns

`pan` is a preset name or `{ "from": POINT, "to": POINT }`, where a point is `{ "zoom", "x", "y" }`
(zoom 1–4; `x` and `y` are the focal point as a fraction of the still, 0–1; all default to
1 / 0.5 / 0.5). The move is linear over the segment, and the window never leaves the still.

| Preset  | Move                                   |
| ------- | -------------------------------------- |
| `none`  | Hold (the default)                     |
| `push`  | Zoom 1.0 → 1.15 at the center          |
| `pull`  | Zoom 1.15 → 1.0 at the center          |
| `left`, `right`, `up`, `down` | Drift at zoom 1.15 in that direction |

`--pan auto` (or `"defaultPan": "auto"`) rotates push, left, pull, right over the stills that set no
pan of their own, so a preview is not a slideshow of holds. The prompts' own Ken Burns notes
(`geminiOmniPrompt`: "slow push on the bottle") are free text and are not read.

## Output and hosting

- The default output is `videos/<id>-preview.mp4`. `videos/` and `*.mp4` are gitignored; keep it
  that way. The repo stays lightweight: **do not commit the MP4.**
- The script writes `<out>.partial.mp4` and renames it on success, so a failed or interrupted run
  never leaves a half-written file at the real name.
- For a preview other people need to see, upload it to Drive / Imgur (see
  [external-assets.md](external-assets.md)) and record the link in the manifest's `previewUrl`. The
  script prints it after a run as a reminder; it does not upload anything.
- Segment-level `previewUrl` in the catalog (what the Suggestions preview plays) is a different,
  per-segment field and is not written by this script.

## Flags

| Flag                    | Effect                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `--manifest PATH`       | Required. A cutaway record or an assembly manifest.                                     |
| `--audio PATH`          | Use this audio instead of the song's / the manifest's.                                  |
| `--no-audio`            | Silent video.                                                                           |
| `--out PATH`            | Output file.                                                                            |
| `--images DIR`          | Stills folder (cutaway record only).                                                    |
| `--size WxH`, `--fps N` | Override the manifest.                                                                  |
| `--pan MOVE`            | Default pan for segments that set none: `auto` or a preset.                             |
| `--allow-missing`       | Black for segments with no still, instead of stopping.                                  |
| `--dry-run`             | Print the plan and the ffmpeg command; write nothing.                                   |
| `--write-manifest PATH` | Write the resolved plan as an assembly manifest and stop (no video).                    |

Exit codes: `0` done, `1` ffmpeg failed (its error is printed, nothing is left behind), `2` bad
input (nothing was written).

## How it differs from the Daisy Bell script

`assemble-daisy-slideshow.py` encodes each slide to a temp clip in `/tmp`, concatenates them and
muxes the song, with the cue map and image names in the source. This tool does one ffmpeg pass with
no temp files, reads times, stills and audio from the catalog or a manifest, and adds pans, gaps,
black segments and the missing-still / audio checks. The Daisy script is left as it is.

## Tests and CI

`scripts/tests/test_assemble_cutaway.py` runs with `npm run test:py`. The pure tests (manifest
validation, timeline math, the ffmpeg command, the CLI) need nothing installed. The smoke tests
assemble real 160×90 clips from fixtures the test generates itself (no binaries are committed) and
check frame counts, durations, the audio stream, black gaps and the no-partial-file guarantee; they
skip when ffmpeg is missing. CI has a dedicated job that installs ffmpeg and sets
`REQUIRE_FFMPEG=1`, so there a missing ffmpeg fails the job instead of skipping.
