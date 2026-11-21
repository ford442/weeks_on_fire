# 3D Sequences engine

How `/show/sequences/:id` draws a film. Issue #94 ("engine v2") moved the drawing off the page's
thread, added WebGL2 instancing and a frame uniform block, and put the CPU geometry behind a
kernel interface. The profile gate that decided against a C++/WASM kernel is in
[`perf/engine-v2-profile.md`](perf/engine-v2-profile.md).

## Who does what

```
main thread                                          render worker
─────────────────────────────────────────            ──────────────────────────────────────
SequencePlayer (React, transport, MediaSession)
  PlaybackClock ── rAF ── host.frame(t) ── tick/seek ─▶ runtime.ts
                          host.resize(w, h) ─ resize ─▶   SequenceRenderCore
  overlays (lost context, ?stats)  ◀── frameStats ──      SequenceEngine + scene
                                   ◀── ready / failed / contextLost / contextRestored
```

- **`src/components/SequencePlayer.tsx`** keeps the film clock, transport UI, MediaSession and
  the context-loss and stats overlays. It creates a fresh `<canvas>` per renderer session: a
  canvas handed to a worker can never be drawn on by the page again.
- **`src/sequences/render/workerHost.ts`** transfers the canvas (`transferControlToOffscreen`)
  to `src/sequences/worker/renderWorker.ts` and keeps **one frame in flight**: a frame asked
  for while the worker is drawing replaces any older pending one, so a slow device drops frames
  instead of queueing them.
- **`src/sequences/render/inThreadHost.ts`** is the same thing on the page's thread: the path
  for browsers without WebGL on `OffscreenCanvas` (Safari before 17), for a worker that fails
  for any reason, and for `?renderer=main`.
- **`src/sequences/render/core.ts`** (`SequenceRenderCore`) is engine + scene for one film on
  one context, with no DOM or worker code. Both hosts run it, so both threads draw the same
  frames (the e2e harness checks this).
- **`src/sequences/worker/protocol.ts`** is the typed message union. The worker never imports
  the catalog: graph films post their graph in `init`.

A worker failure (no context, script that will not load, scene that will not start) is always
recoverable: the player falls back in-thread on a new canvas. A worker with no GL at all also
marks the worker unavailable for the rest of the page, so later players go straight in-thread.

## URL flags

| Flag             | Effect                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| `?renderer=main` | Draw on the page's thread even where the worker would work                     |
| `?stats` / `=1`  | Overlay: thread, context, kernel, buffer size, CPU per frame, fps, GL counters |
| `?capture=1`     | Keep the drawing buffer so frames can be read back (e2e harness, capture)      |

The player also publishes what it got on the canvas: `data-renderer` (`worker` / `main`),
`data-gl` (`webgl2` / `webgl` / `none`), `data-preserve-drawing-buffer` and `data-kernel`, all as
reported by the context that was created, not as requested.

## Engine (`src/lib/webgl/`)

- **Shaders** are `shaders/*.glsl`, imported `?raw`. Each body is GLSL ES 1.00 and also
  compiles as 3.00 on WebGL2 (`shaders/index.ts` adds the preamble). The only include is
  `#include <frame>`, expanded in `composeShader`; there is no GLSL plugin.
- **Frame uniforms.** Camera, light, fog and point light are packed every draw and uploaded only
  when they changed: one `bufferSubData` into the std140 `FrameBlock` on WebGL2, or once per
  program per change as plain uniforms on WebGL1. Scenes keep assigning `engine.lightDir` etc.
  freely; nothing to call.
- **Instancing.** Push copies of one mesh into an `InstanceBatch` (model matrix, colour,
  emissive, shininess each) and draw them with `engine.drawLitInstanced(mesh, batch, { cel,
useVertexColor })` or `engine.drawLinesInstanced(mesh, batch)`. That is one call on WebGL2 or
  with `ANGLE_instanced_arrays`, else one plain draw per instance, with the same pixels. Reuse
  a batch per frame (`clear()`, then `push`). Instances draw in push order, so ghosts pushed
  before the real character still draw first.
- **Counters.** `engine.stats` (draw calls, instances, uniform calls, buffer uploads) is reset
  per frame and sent back with every `frameStats`.
- **Geometry kernel** (`kernel.ts`). `engine.kernel` builds spheres, lathes and ribbons and has
  two flat-array kernels for coming scenes: `integrateParticles` and `hoseChain` (rubber-hose
  limbs as constant-length arcs). Only the TypeScript kernel exists; renderers pick it at init
  with `selectGeometryKernel()`. Its outputs are pinned in `kernel.fixtures.json`, which any
  other kernel must reproduce within 1e-6 (`kernel.test.ts`).

Known issue, kept on purpose: `normalFromMat4` returns the inverse of the model's 3x3, not the
inverse-transpose, so rotated lit meshes are shaded as if rotated the other way. Every film and
frame fixture was made with it, and the instanced shader reproduces it. Fixing it is a visual
change for its own pull request (fix both, regenerate `e2e/fixtures/`).

## Tests

- `npm run test`: hosts, worker runtime, protocol, render core, engine (against a recording fake
  GL), shader composition, instance batches, kernel fixtures, and the player in both modes.
- `npm run test:e2e`: four films (lattice-hymn, hose-chase, kick-lattice, mobius-chrome) at 0s and
  50% on the worker, in-thread WebGL2, in-thread WebGL1, and in-thread WebGL1 without
  instancing or VAOs, all against the same fixtures; plus a run with the worker script blocked,
  which must fall back in-thread. The fixtures were taken from the engine before #94.
- `npx tsx scripts/trace-sequences.ts`: the profile behind the gate (see the perf doc).
