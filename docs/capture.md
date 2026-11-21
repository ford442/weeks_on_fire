# In-hub capture: record what the hub draws

A **Record** button on a 3D sequence and on a cutaway preview turns what the hub is already
playing into a video file: a **take**. It is the fast preview loop between "the stills exist" and
"the editor has a cut". The authoritative assembly is still the offline path,
[`scripts/assemble-cutaway.py`](cutaway-assembly.md) + ffmpeg (issue #43); a take is for watching
the cut against the song now and handing a rough to the Timeline or an editor.

Issue #74. No library was added: the browser's `MediaRecorder` over `canvas.captureStream()`.

## What you get

| Where                                       | Records                                                                                                                    | File                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 3D Sequences (`/show/sequences/:id`)        | One full pass of the film from 0, loop off, `durationSec` long                                                             | 1280×720 (1280×960 for 4:3), 30 fps, no audio |
| Suggestions board (`/show/suggestions/:id`) | The cutaway preview from 0: stills, Color Whip fields and placeholders on the segment times, with the song if it has audio | 1280×720, 30 fps, song as Opus                |

The file is WebM (VP9, else VP8) where the browser can encode it, else MP4 (Safari). Chromium's
MediaRecorder writes WebM without a Duration, so `video.duration` would read `Infinity` and an
editor could not seek it; the hub writes the Duration into the file's header before it hands the
take over (`src/lib/capture/webmDuration.ts`, about 200 lines, unit-tested). A full take matches the
catalog length within ±1 s; the e2e suite checks it.

## Takes are session only

A take lives in the tab that recorded it, as a `blob:` URL, until you close or reload the tab
(`src/lib/capture/takes.ts`). The **Takes (this tab only)** shelf under the player plays it, and
offers **Download** and **Discard**.

To keep a take: **Download** it, host it (Drive / Imgur), and paste the hosted link into the
scene. Never commit it: `*.mp4` and video binaries stay out of git.

## The Timeline

Open a scene in the Timeline editor (edit mode, `?edit=1`). Under **Media URL** there is a picker
of the takes recorded in this tab. Picking one puts its `blob:` URL in the scene for this session,
with a note that says so and a preview.

A `blob:` URL means nothing outside the tab, so it is never written anywhere:

- the browser's saved edits (`wof:production:episode-NN`) store that scene with no media link;
- **Export JSON** (the committed `scenes.json` shape) leaves it out;
- **Export to clip_stacker** sends `mediaUrl: null` for it (see [clip-stacker.md](clip-stacker.md)).

After an export that left takes out, the Timeline says how many. A hosted http(s) link pasted
over the take is kept and exported as before.

## How it records

**One clock.** The cutaway preview runs on a `PlaybackGraph` (`src/lib/playbackGraph.ts`): one
transport (play / pause / seek / loop) over the same `PlaybackClock` the sequence player uses,
with tracks hung off it: the song's `<audio>` (follows the graph and is pulled back if it drifts
more than 0.25 s), the stills (which segment is on screen), and, while recording, the canvas
compositor. The graph registers with the hub's media coordinator (`MediaSessionProvider`, #55) as
one player, so starting a preview or a take pauses whatever else was playing, and anything else
starting pauses it. A take is a graph track, so picture and song cannot disagree about time.

**Sequences.** The player keeps its own frame loop on its `PlaybackClock`. Pressing **Record**
rebuilds the renderer in-thread with `preserveDrawingBuffer: true` (only for the take), draws at
the take size instead of the screen size, resets the clock to 0 with loop off, and records the
canvas. When the take ends the renderer goes back to the worker and the buffer is no longer
preserved. Recording in-thread means the recorder reads the canvas the context draws into on every
engine; a canvas handed to the render worker is only a placeholder.

**Cutaways.** The compositor (`src/lib/capture/compositor.ts`) draws each frame on a 2D canvas,
following the assembler at a high level, not pixel for pixel:

- a still is fitted in the frame (letterboxed, never cropped) and moved with the assembler's
  `--pan auto` Ken Burns cycle (push, left, pull, right; 1.15x, 8%);
- the eight Color Whip dialects are the CSS fields of the live preview, redrawn on canvas;
- a segment with no still draws a labelled card; a gap between song-timed shots is black.

Segments are cut on their song times (`start` / `end`) when every one is a time, in order, and
none overlap; otherwise they play one after another for `durationSec` each (2.5 s for a 0 s card),
as the preview always did. The footer says which (`song-timed` / `sequential`).

The song is routed through Web Audio (`createMediaElementSource` → a stream destination, and the
speakers) so it is both heard and recorded; Safari has no `captureStream()` on media elements.

**Pauses.** The recorder pauses whenever the picture cannot advance: Pause, another player taking
over through the coordinator, a hidden tab, a lost GL context. Resuming continues the same take,
so the file stays as long as the cut. **Stop** ends the take early and keeps what was recorded.

**Stills from elsewhere.** A hosted still must be served with CORS, or drawing it would taint the
canvas and the recorder would refuse it. One that will not load that way is drawn as a card that
says so. Repo stills (`segmentStills`) are same-origin and always work. A segment's hosted
`previewUrl` video is not drawn into takes yet; its still (or card) is.

`prefers-reduced-motion` turns off the Ken Burns move and draws each Color Whip field still, as the
live preview does.

## Code

| File                                   | What                                                                  |
| -------------------------------------- | --------------------------------------------------------------------- |
| `src/lib/playbackGraph.ts`             | Transport, tracks, holds, media-coordinator hook; `mediaElementTrack` |
| `src/lib/cutawayTimeline.ts`           | Segment times → spans (song-timed or sequential); the stills track    |
| `src/lib/capture/support.ts`           | Can this browser record, and in what format (no recorder loaded)      |
| `src/lib/capture/recorder.ts`          | `TakeRecorder`: MediaRecorder with pause accounting                   |
| `src/lib/capture/webmDuration.ts`      | Writes Duration into a MediaRecorder WebM                             |
| `src/lib/capture/canvasTake.ts`        | Canvas (+ audio tracks) → take                                        |
| `src/lib/capture/compositor.ts`        | Cutaway frame: stills, Ken Burns, Color Whip, cards                   |
| `src/lib/capture/cutawayCapture.ts`    | Cutaway take: decode stills, song through Web Audio, record           |
| `src/lib/capture/takes.ts`             | The tab's takes (`blob:` URLs), download, discard                     |
| `src/components/capture/TakeShelf.tsx` | The shelf under each player                                           |

`canvasTake` and `cutawayCapture` (with the compositor) are lazy chunks loaded on the first
**Record** press; the main entry does not grow. No `@ffmpeg/ffmpeg`, no muxer library: if
MediaRecorder WebM ever is not enough for clip_stacker, evaluate `mediabunny` / `mp4-muxer` as a
lazy chunk first. There is no C++ encoder in this repo; one would belong to the external
clip_stacker tool.

## Tests

- `npm run test`: the Duration patcher, the recorder's pause accounting, the take store, the graph
  (transport, holds, loop wraps, coordinator), the timeline, compositor geometry, the player's
  record flow (in-thread, preserved buffer, hidden-tab pause, Stop), the preview on the graph, the
  Timeline picker and the export / storage rules.
- `npm run test:e2e` (`e2e/capture.spec.ts`): records Spoon Whip (12 s) and The Soft Gyre (30 s, local
  stills) in Chromium and reads each take back through a `<video>`: WebM, 1280×720, within ±1 s.
