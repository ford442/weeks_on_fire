# Engine v2 profile gate (issue #94)

Issue #94 allowed a C++/WASM geometry kernel (Phase C) only if a profile showed the TypeScript
kernel, `writePoints` and the mesh builders, taking **at least 25% of frame CPU** on
`hose-chase` and `kick-lattice` at 2x DPR. Otherwise Phase C closes with the trace attached and
the `GeometryKernel` interface is kept.

**Result: the gate fails.** The kernel is 0.3% of the render worker's CPU on hose-chase and 1.6%
on kick-lattice. The highest share anywhere is 4.7%, on mobius-chrome while its ribbon re-meshes
every few frames. No `native/`, no Emscripten build, no `compile_commands.json`. The interface
stays (`src/lib/webgl/kernel.ts`) with one implementation, and its fixtures
(`kernel.fixtures.json`) are what a native kernel would have to match.

Raw numbers: [`engine-v2-profile.json`](engine-v2-profile.json). Recorded 2026-11-20.

## Method

`scripts/trace-sequences.ts` against two production builds of the hub, both unminified so CPU
profile frames keep their function names:

- **before**: `main` at 3e68355 (in-thread engine, no instancing, uniforms per draw);
- **after**: this branch, on the render worker and in-thread (`?renderer=main`).

```bash
npx vite build --base /weeks_on_fire/ --minify false --outDir dist-profile
npx vite preview --base /weeks_on_fire/ --outDir dist-profile --port 4175 --strictPort &
npm run perf:trace -- --target branch=http://127.0.0.1:4175/weeks_on_fire/ \
  --out docs/perf/engine-v2-profile.json --traces <dir>
```

Add `--target base=<url>` for the build to compare against. It runs headless Chromium with
SwiftShader (software GL, as in the e2e harness) at 1280x720 and **deviceScaleFactor 2**, so the
player's buffer is 2x its CSS size.

- **GL calls per frame.** The page's WebGL prototypes are wrapped and counted while the paused
  player draws single frames at 0, 25, 50 and 75% of each film. These runs are in-thread, because
  the page cannot see a worker's context. The engine's own counters (`?stats`) agree with them.
- **Playback.** Eight seconds of free playback per film and thread with a Chrome trace recording
  (`toplevel`, `devtools.timeline`, `v8.cpu_profiler.hires`, about one sample every 175 µs).
  CPU is the time-weighted non-idle profile samples on the thread that drew. The **kernel share**
  is the CPU with a kernel function anywhere on the stack: `writePoints`, every `create*` mesh
  builder, `ribbonPoint`, `finalizeMesh`, `integrateParticles`, `hoseChain`. It is also given
  against script CPU alone (minus `(program)`), which is the denominator most favourable to the
  kernel. **Main-thread task time** sums top-level tasks, including time blocked on the GPU
  process, since a blocked main thread is as unresponsive as a busy one. **Long tasks** are Long
  Tasks API entries during recording.

Raw traces (about 1.1-1.7 MB gzipped each, 16 MB for the set) are not committed. The repo keeps
large binaries out, and the command above regenerates them.

## Per-frame GL calls

The busiest of the four sampled frames per film, in-thread. "All GL calls" counts every WebGL
method call, including binds and state changes.

| Film                    | Film time | Draws before → after | `uniform*` before → after | All GL calls before → after |
| ----------------------- | --------- | -------------------- | ------------------------- | --------------------------- |
| hose-chase              | 4 s       | 43 → 8 (5.4×)        | 774 → 21                  | 1077 → 89 (12.1×)           |
| kick-lattice            | 0 s       | 7 → 4 (1.8×)         | 44 → 13                   | 107 → 54 (2.0×)             |
| lattice-hymn            | 0 s       | 7 → 4 (1.8×)         | 44 → 13                   | 105 → 54 (1.9×)             |
| mobius-chrome           | 56.25 s   | 2 → 1 (2.0×)         | 36 → 2                    | 77 → 19 (4.1×)              |
| screen-door-recessional | 0 s       | 50 → 6 (8.3×)        | 888 → 19                  | 1246 → 75 (16.6×)           |
| rubber-hose-errand      | 0 s       | 13 → 8 (1.6×)        | 234 → 41                  | 327 → 101 (3.2×)            |
| spoon-whip              | 0 s       | 11 → 8 (1.4×)        | 186 → 48                  | 272 → 112 (2.4×)            |
| tunnel-smash            | 0 s       | 10 → 10 (1.0×)       | 168 → 67                  | 247 → 140 (1.8×)            |
| kitchen-counter-orbit   | 0 s       | 8 → 8 (1.0×)         | 132 → 53                  | 197 → 114 (1.7×)            |

The issue asked for a **≥ 10× draw-call cut on kick-lattice. That is not met, and cannot be met
on that film as written**: it only ever issues 7 draws (four line cubes, the icosahedron, the
core and the sparks). The four cubes become one instanced draw, which leaves 4. Where a film
repeats a mesh, the cut is large: screen-door goes from 50 to 6 draws, and hose-chase's three
runners with afterimage ghosts go from 43 to 8. Uniform calls drop 2.5-47× everywhere, from the
frame block. tunnel-smash's eight rings all have different radii, and kitchen-counter-orbit draws
each mesh once, so neither has anything to instance and both keep their draw count.

## Playback at 2x DPR

| Film                      | Build, thread     | Frames drawn/s | Render-thread CPU / frame | Kernel share (of script CPU) | Main-thread task time | Main-thread CPU | Long tasks |
| ------------------------- | ----------------- | -------------- | ------------------------- | ---------------------------- | --------------------- | --------------- | ---------- |
| hose-chase                | before, in-thread | 41             | 22.24 ms                  | 0.0% (0.2%)                  | 899 ms/s              | 903 ms/s        | 1          |
| hose-chase                | after, worker     | 38             | 0.39 ms                   | 0.3% (0.3%)                  | 53 ms/s               | 84 ms/s         | 0          |
| hose-chase                | after, in-thread  | 40             | 22.12 ms                  | 0.0% (0.2%)                  | 882 ms/s              | 888 ms/s        | 3          |
| kick-lattice              | before, in-thread | 54             | 6.35 ms                   | 0.0% (0.7%)                  | 334 ms/s              | 343 ms/s        | 0          |
| kick-lattice              | after, worker     | 53             | 0.22 ms                   | 1.6% (1.6%)                  | 51 ms/s               | 84 ms/s         | 0          |
| kick-lattice              | after, in-thread  | 54             | 7.59 ms                   | 0.1% (1.1%)                  | 390 ms/s              | 408 ms/s        | 0          |
| lattice-hymn              | before, in-thread | 53             | 6.48 ms                   | 0.0% (0.0%)                  | 337 ms/s              | 347 ms/s        | 0          |
| lattice-hymn              | after, worker     | 52             | 0.23 ms                   | 0.0% (0.0%)                  | 50 ms/s               | 87 ms/s         | 0          |
| lattice-hymn              | after, in-thread  | 54             | 6.17 ms                   | 0.0% (0.0%)                  | 329 ms/s              | 335 ms/s        | 0          |
| mobius-chrome (from 33 s) | before, in-thread | 54             | 8.15 ms                   | 0.1% (2.8%)                  | 427 ms/s              | 436 ms/s        | 0          |
| mobius-chrome (from 33 s) | after, worker     | 53             | 0.18 ms                   | 4.7% (4.7%)                  | 53 ms/s               | 94 ms/s         | 0          |
| mobius-chrome (from 33 s) | after, in-thread  | 54             | 7.64 ms                   | 0.1% (2.8%)                  | 404 ms/s              | 410 ms/s        | 0          |

How to read it:

- **The worker takes the scene off the main thread.** With the renderer in-thread, the main
  thread spends 330-900 ms of every second inside tasks. Most of that is compositor commits
  waiting for the software GPU to finish the WebGL frame, which a real GPU would shorten but not
  remove. With the worker it spends about 50 ms/s, which is React's transport and timecode updates
  plus one `postMessage` per frame. Long tasks during playback: **0** with the worker on every film
  (1-3 in-thread on hose-chase).
- **In-thread "CPU per frame" is mostly that wait.** It shows up as `(program)` in the profile.
  The worker's 0.2-0.4 ms per frame is the scene's real CPU: JS, GL command encoding, and the
  reply.
- **The kernel is not where the frame goes.** On the worker the heaviest stacks are the draw
  calls and `gl.clear` (10-30%, the first call into a new OffscreenCanvas frame) and the
  `frameStats` reply (15-22%). Point rewrites are 28-48 points per frame. Mesh builders only run
  at init, except mobius-chrome's ribbon re-mesh, which is the 4.7% above.
- Frame rate is set by SwiftShader at 2x DPR (38-54 fps), the same on every path. The worker does
  not draw faster on a software GPU; it keeps the page responsive while it draws.

## When to re-run the gate

When a film starts integrating state per frame, re-run the command above on that film. The
cases are scene graph v2 emitters and deformers (#95), particles through `integrateParticles`,
and limbs through `hoseChain`. If the kernel share passes 25% on the render worker, Phase C's
plan in #94 still applies: `native/geometry/` (CMake + Emscripten, `-O3 -msimd128`), loaded only
inside the worker, held to `kernel.fixtures.json`, and never required by `npm run build`.
