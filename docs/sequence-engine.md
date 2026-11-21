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

**Record** under the player records one full pass as a WebM take ([capture.md](capture.md)). For
the take only, it draws in-thread at 1280 px wide with the drawing buffer preserved, then hands the
film back to the worker.

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
- `npm run test:e2e`: every film at 0s, mid-film and 100% on the worker, in-thread WebGL2,
  in-thread WebGL1, and in-thread WebGL1 without instancing or VAOs, all against the same
  fixtures; plus a run with the worker script blocked, which must fall back in-thread, and the
  graph editor (`e2e/editor.spec.ts`). The eight films that started as TypeScript factories were
  recorded from those factories, then ported to graphs and diffed against them. Fixtures are
  written by the in-thread WebGL2 run: a worker frame can reach the page's placeholder canvas a
  few hundred ms after the worker reports it, and an update cannot retry. `?capture=1` loads
  publish `data-frame-time`, the film time of the last frame drawn, and the harness waits for it.
- `src/sequences/graph/*.test.ts`: expressions, the evaluator (hierarchy, copies, treadmill,
  squash, fields), emitters (seekable), hoses, the schema's error messages, and the editor's
  JSON locator, retiming, diagnostics and draft storage.
- `npx tsx scripts/trace-sequences.ts`: the profile behind the gate (see the perf doc).

## Graph v2 (`src/sequences/graph/`)

Every film is a `content/sequences/<id>.graph.json` (authoring guide: `content/README.md` →
"Authoring a 3D sequence"). The pipeline, per film:

```
schema.ts      Zod, run by codegen and by the editor. Calls compile.ts, so expression, scope,
               parent and copy errors come back with their JSON path; issues.ts turns paths into
               "node leg-l: scale[1] must be positive".
compile.ts     Every expression (expr.ts: a small parser, no eval) compiled once into a closure
               over a slot array: built-ins t p dur i n k, then graph vars, then node vars (each
               its own slot, so scopes never collide).
evaluate.ts    Pure, no GL: per frame, graph vars, camera, environment, then nodes in order; each
               copy restores its ancestors' vars for that copy, composes the parent transform,
               applies clips, layout / repeat offsets, spin, squash and wobble.
interpreter.ts GL: rewrites dynamic meshes (field, emitter, ribbon, hose), then draws in node
               order with point sprites last; consecutive copies with one mesh and shading are
               one instanced draw.
```

- **Determinism.** A frame is a function of film time. Emitters (`emitter.ts`) step at a fixed
  60 Hz from 0 through `kernel.integrateParticles` and replay from 0 on a backward seek; ribbons
  re-mesh on whole steps of `mix` rather than a change threshold; ghosts re-draw earlier moments
  instead of accumulating. Seeks, loops and captures show the frame playback would.
- **Kernel.** Spheres, lathes, ribbons, particles and hoses (`hose.ts` sweeps
  `kernel.hoseChain` into a tube with parallel-transport frames) all go through
  `GeometryKernel`, so a WASM kernel could take them without touching the graph.
- **Post** (`src/lib/webgl/post.ts`, built on first use). Vignette is one full-screen triangle
  multiplied onto the frame, no framebuffer. Ghosts are the engine's first framebuffers: the
  current moment and each earlier one are drawn into two RGBA8 targets sharing a 16-bit depth
  buffer, and the earlier-minus-now difference is blended onto the antialiased canvas (added
  for `lighten`, reverse-subtracted for `darken`). Comparing two identical non-antialiased
  targets makes static edges cancel exactly. Core WebGL1 and WebGL2, no float textures; an
  incomplete framebuffer skips ghosts and the film plays without them.
- **Escape hatch.** `customSceneFactories` in `src/sequences/scenes/index.ts` is empty. A film
  that needs something the graph cannot say should get a node type, not a factory.

## Graph editor (`/show/sequences/:id/edit`)

`src/components/sequenceEditor/`: a lazy route (CodeMirror and the Zod schema are further lazy
chunks; `check-bundle-size` fails if either reaches the main entry). The player previews the
last draft that passed `diagnoseGraphText` (codegen's checks, with text ranges for the lint);
`SequencePlayer`'s `seekRequest` / `onTimeUpdate` props tie it to the keyframe strip, which
retimes a key by rewriting only that `t` in the text (`timeline.ts`, `jsonLocate.ts`). Drafts
are text in localStorage (`src/lib/sequenceDraftStorage.ts`); the hub never writes the repo.
