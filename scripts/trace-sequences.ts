/// <reference lib="dom" />
/**
 * Profile gate for the 3D Sequences engine (issue #94, Phase D). Plays films in Chromium and
 * reports, per build and renderer:
 *
 * - GL calls per frame at fixed film times (draws, uniform*, buffer uploads, everything else),
 *   counted by wrapping the page's WebGL prototypes. In-thread renderers only: a worker's
 *   context is out of the page's reach (the engine's own counters cover it, see `?stats`).
 * - A Chrome trace of free playback at 2x DPR: CPU per frame on the thread that draws, how much
 *   of it is the geometry kernel (`writePoints` and the mesh builders), and main-thread busy
 *   time and long tasks.
 *
 * The CPU profile needs real function names, so profile an unminified build:
 *
 *   npx vite build --base /weeks_on_fire/ --minify false --outDir dist-profile
 *   npx vite preview --base /weeks_on_fire/ --outDir dist-profile --port 4175 --strictPort &
 *   npx tsx scripts/trace-sequences.ts --target branch=http://127.0.0.1:4175/weeks_on_fire/
 *
 * Add `--target base=<url>` for an older build to compare against (its player ignores
 * `?renderer=`, so it is measured in-thread only), `--traces <dir>` to keep the raw traces, and
 * `--out <file.json>` for the summary. Results live in docs/perf/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { chromium, type Browser, type Page } from '@playwright/test';

interface Target {
  name: string;
  url: string;
}

type Mode = 'worker' | 'main';

interface Options {
  targets: Target[];
  /** Films traced during playback. */
  traced: string[];
  /** Films whose per-frame GL calls are counted at fixed times. */
  counted: string[];
  seconds: number;
  /** Film time to start tracing from, per film (default: the opening). */
  from: Record<string, number>;
  out: string | null;
  traces: string | null;
}

/** The TS geometry kernel: per-frame point rewrites and every mesh builder. */
const KERNEL_FUNCTIONS = new Set([
  'writePoints',
  'createRibbon',
  'ribbonPoint',
  'createSphere',
  'createLathe',
  'createBox',
  'createCylinder',
  'createTorus',
  'createPlane',
  'createIcosahedron',
  'createIcosahedronLines',
  'createLineCube',
  'createPoints',
  'toLineMesh',
  'finalizeMesh',
  'integrateParticles',
  'hoseChain',
]);

const UPLOAD_FUNCTIONS = new Set(['updatePositions', 'updateNormals']);

const TRACE_CATEGORIES = [
  'toplevel',
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'v8.execute',
  'disabled-by-default-v8.cpu_profiler',
  'disabled-by-default-v8.cpu_profiler.hires',
];

function parseArgs(argv: string[]): Options {
  const options: Options = {
    targets: [],
    traced: ['hose-chase', 'kick-lattice', 'mobius-chrome', 'lattice-hymn'],
    counted: [
      'hose-chase',
      'kick-lattice',
      'lattice-hymn',
      'mobius-chrome',
      'rubber-hose-errand',
      'screen-door-recessional',
      'spoon-whip',
      'tunnel-smash',
      'kitchen-counter-orbit',
    ],
    seconds: 8,
    // Möbius Chrome's ribbon only re-meshes while it morphs (40-55 of 75 s at full length).
    from: { 'mobius-chrome': 33 },
    out: null,
    traces: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1] ?? '';
    if (flag === '--target') {
      const [name, url] = value.split('=');
      if (!name || !url) throw new Error(`--target wants name=url, got "${value}"`);
      options.targets.push({ name, url: url.endsWith('/') ? url : `${url}/` });
    } else if (flag === '--traced') options.traced = value.split(',');
    else if (flag === '--counted') options.counted = value.split(',');
    else if (flag === '--seconds') options.seconds = Number(value);
    else if (flag === '--from') {
      const [film, at] = value.split('=');
      if (!film || at === undefined) throw new Error(`--from wants film=seconds, got "${value}"`);
      options.from[film] = Number(at);
    } else if (flag === '--out') options.out = value;
    else if (flag === '--traces') options.traces = value;
    else throw new Error(`unknown flag ${flag}`);
    i += 1;
  }
  if (options.targets.length === 0) throw new Error('give at least one --target name=url');
  return options;
}

/** Page init script: counts WebGL calls by kind on every context the page creates. */
function countGlCalls(): void {
  const counts = { draw: 0, instancedDraw: 0, uniform: 0, upload: 0, clear: 0, other: 0 };
  const kindOf = (name: string): keyof typeof counts => {
    if (/^draw(Arrays|Elements)Instanced$/.test(name)) return 'instancedDraw';
    if (/^draw(Arrays|Elements)$/.test(name)) return 'draw';
    if (/^uniform(?!BlockBinding)/.test(name)) return 'uniform';
    if (/^buffer(Sub)?Data$/.test(name)) return 'upload';
    if (name === 'clear') return 'clear';
    return 'other';
  };
  for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, name);
      const original: unknown = descriptor?.value;
      if (typeof original !== 'function' || name === 'constructor') continue;
      const kind = kindOf(name);
      Object.defineProperty(proto, name, {
        ...descriptor,
        value(this: unknown, ...args: unknown[]): unknown {
          counts[kind] += 1;
          return (original as (...a: unknown[]) => unknown).apply(this, args);
        },
      });
    }
  }
  (window as unknown as { __glCounts: typeof counts }).__glCounts = counts;
}

/** Page init script: counts animation frames and long tasks. */
function countFrames(): void {
  const state = { frames: 0, longTasks: 0, longTaskMs: 0 };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) =>
    raf((time) => {
      state.frames += 1;
      callback(time);
    });
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.longTasks += 1;
        state.longTaskMs += entry.duration;
      }
    }).observe({ type: 'longtask', buffered: false });
  } catch {
    // No Long Tasks API: the trace still has the task durations.
  }
  (window as unknown as { __frames: typeof state }).__frames = state;
}

type GlCounts = Record<'draw' | 'instancedDraw' | 'uniform' | 'upload' | 'clear' | 'other', number>;

interface FrameCount {
  film: string;
  timeSec: number;
  gl: GlCounts;
}

async function openFilm(page: Page, target: Target, film: string, query: string): Promise<void> {
  await page.goto(`${target.url}show/sequences/${film}${query}`);
  await page.locator('canvas[role="img"][data-gl], canvas[role="img"]').first().waitFor();
  // The base build has no data-gl readiness marker on the worker path; give both a moment.
  await page.waitForTimeout(800);
}

function nextFrames(page: Page, count = 3): Promise<void> {
  return page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const step = (left: number) =>
          requestAnimationFrame(() => (left <= 1 ? resolve() : step(left - 1)));
        step(n);
      }),
    count,
  );
}

/** GL calls for one frame at each of 0, 25, 50 and 75% of the film, drawn while paused. */
async function countFrameCalls(browser: Browser, target: Target, film: string) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  await context.addInitScript(NAME_SHIM);
  await context.addInitScript(countGlCalls);
  const page = await context.newPage();
  await openFilm(page, target, film, '?renderer=main');
  const slider = page.getByRole('slider').first();
  const duration = Number(await slider.getAttribute('max'));
  const results: FrameCount[] = [];
  // Park away from every measured time, so each seek below really draws a frame.
  await slider.fill(String(Math.round(duration * 0.9)));
  for (const share of [0, 0.25, 0.5, 0.75]) {
    const timeSec = Math.round(duration * share * 20) / 20;
    await nextFrames(page);
    const before = await page.evaluate(() => ({
      ...(window as unknown as { __glCounts: GlCounts }).__glCounts,
    }));
    await slider.fill(String(timeSec));
    await nextFrames(page);
    const after = await page.evaluate(() => ({
      ...(window as unknown as { __glCounts: GlCounts }).__glCounts,
    }));
    const frames = Math.max(1, after.clear - before.clear);
    const gl = Object.fromEntries(
      Object.entries(after).map(([key, value]) => [
        key,
        (value - before[key as keyof GlCounts]) / frames,
      ]),
    ) as GlCounts;
    results.push({ film, timeSec, gl });
  }
  await context.close();
  return results;
}

interface TraceEvent {
  ph: string;
  name: string;
  pid: number;
  tid: number;
  ts: number;
  dur?: number;
  id?: string;
  args?: {
    name?: string;
    data?: {
      cpuProfile?: {
        nodes?: { id: number; parent?: number; callFrame: { functionName: string } }[];
        samples?: number[];
      };
      /** Microseconds since the previous sample, one per sample. */
      timeDeltas?: number[];
    };
  };
}

interface ThreadReport {
  /**
   * Wall time inside top-level tasks, ms per second of playback. Includes time blocked on the
   * GPU process (a main thread blocked there is as unresponsive as a busy one).
   */
  taskMsPerSec: number;
  /** CPU the thread actually spent (non-idle profile samples, time-weighted), ms per second. */
  cpuMsPerSec: number;
  tasksOver50ms: number;
  longestTaskMs: number;
  /** CPU in JS and GL API calls: non-idle minus "(program)" (native time no script owns). */
  scriptCpuMsPerSec: number;
  /** Share of the thread's CPU with a geometry-kernel function on the stack. */
  kernelShare: number;
  /** The same, of script CPU only: the share most favourable to the kernel. */
  kernelShareOfScript: number;
  /** Share with a GL vertex upload (`updatePositions` / `updateNormals`) on the stack. */
  uploadShare: number;
  /** The heaviest functions by inclusive CPU. */
  top: { name: string; share: number }[];
}

function analyzeThread(events: TraceEvent[], pid: number, tid: number, spanMs: number) {
  const onThread = events.filter((e) => e.pid === pid && e.tid === tid && e.ph === 'X');
  // RunTask and ThreadControllerImpl::RunTask nest; count each task once.
  const taskName = onThread.some((e) => e.name === 'ThreadControllerImpl::RunTask')
    ? 'ThreadControllerImpl::RunTask'
    : 'RunTask';
  const durations = onThread.filter((e) => e.name === taskName).map((e) => (e.dur ?? 0) / 1000);
  const taskMs = durations.reduce((sum, d) => sum + d, 0);

  // CPU profile: Profile / ProfileChunk events share an id; nodes arrive incrementally. Time
  // blocked in IPC (waiting on the GPU process) samples as "(idle)".
  const profileIds = new Set(
    events.filter((e) => e.name === 'Profile' && e.pid === pid && e.tid === tid).map((e) => e.id),
  );
  const nodes = new Map<number, { parent?: number; name: string }>();
  const samples: { node: number; us: number }[] = [];
  for (const event of events) {
    if (event.name !== 'ProfileChunk' || !profileIds.has(event.id)) continue;
    const profile = event.args?.data?.cpuProfile;
    for (const node of profile?.nodes ?? []) {
      nodes.set(node.id, { parent: node.parent, name: node.callFrame.functionName });
    }
    const deltas = event.args?.data?.timeDeltas ?? [];
    (profile?.samples ?? []).forEach((node, i) => samples.push({ node, us: deltas[i] ?? 0 }));
  }
  let activeUs = 0;
  let scriptUs = 0;
  let kernelUs = 0;
  let uploadUs = 0;
  const inclusive = new Map<string, number>();
  for (const { node, us } of samples) {
    const stack: string[] = [];
    for (let id: number | undefined = node; id !== undefined; id = nodes.get(id)?.parent) {
      const name = nodes.get(id)?.name;
      if (name) stack.push(name);
    }
    if (stack.length === 0 || stack[0] === '(idle)') continue;
    activeUs += us;
    if (stack[0] !== '(program)') scriptUs += us;
    if (stack.some((name) => KERNEL_FUNCTIONS.has(name))) kernelUs += us;
    if (stack.some((name) => UPLOAD_FUNCTIONS.has(name))) uploadUs += us;
    for (const name of new Set(stack)) inclusive.set(name, (inclusive.get(name) ?? 0) + us);
  }
  const top = [...inclusive.entries()]
    .filter(([name]) => name !== '(root)' && name !== '')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, us]) => ({ name, share: activeUs > 0 ? us / activeUs : 0 }));
  const perSec = 1000 / spanMs;
  const report: ThreadReport = {
    taskMsPerSec: taskMs * perSec,
    cpuMsPerSec: (activeUs / 1000) * perSec,
    scriptCpuMsPerSec: (scriptUs / 1000) * perSec,
    tasksOver50ms: durations.filter((d) => d > 50).length,
    longestTaskMs: Math.max(0, ...durations),
    kernelShare: activeUs > 0 ? kernelUs / activeUs : 0,
    kernelShareOfScript: scriptUs > 0 ? kernelUs / scriptUs : 0,
    uploadShare: activeUs > 0 ? uploadUs / activeUs : 0,
    top,
  };
  return report;
}

/** Frames the drawing thread drew: worker message handlers, or main-thread animation frames. */
function framesDrawn(events: TraceEvent[], pid: number, tid: number, mode: Mode): number {
  const name = mode === 'worker' ? 'HandlePostMessage' : 'FireAnimationFrame';
  return events.filter((e) => e.pid === pid && e.tid === tid && e.ph === 'X' && e.name === name)
    .length;
}

interface PlaybackReport {
  target: string;
  mode: Mode;
  film: string;
  /** Film time the recording started from. */
  fromSec: number;
  /** Frames the drawing thread drew, and the main thread's animation frames, per second. */
  drawnFps: number;
  rafFps: number;
  /** Long Tasks API entries on the main thread while recording. */
  longTasks: number;
  main: ThreadReport;
  /** The thread that ran the scene: the worker, or the main thread itself. */
  render: ThreadReport;
  /** Render-thread CPU per drawn frame, ms. */
  renderCpuMsPerFrame: number;
}

async function tracePlayback(
  browser: Browser,
  target: Target,
  mode: Mode,
  film: string,
  seconds: number,
  from: number,
  traces: string | null,
): Promise<PlaybackReport> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    serviceWorkers: 'block',
  });
  await context.addInitScript(NAME_SHIM);
  await context.addInitScript(countFrames);
  const page = await context.newPage();
  await openFilm(page, target, film, `?renderer=${mode}`);
  if (from > 0) await page.getByRole('slider').first().fill(String(from));
  await page.waitForTimeout(1000);

  const startFrames = await page.evaluate(() => ({
    ...(window as unknown as { __frames: { frames: number; longTasks: number } }).__frames,
  }));
  await browser.startTracing(page, { categories: TRACE_CATEGORIES });
  const started = Date.now();
  await page.waitForTimeout(seconds * 1000);
  const buffer = await browser.stopTracing();
  const spanMs = Date.now() - started;
  const endFrames = await page.evaluate(() => ({
    ...(window as unknown as { __frames: { frames: number; longTasks: number } }).__frames,
  }));
  await context.close();

  if (traces) {
    mkdirSync(traces, { recursive: true });
    writeFileSync(join(traces, `${target.name}-${mode}-${film}.json.gz`), gzipSync(buffer));
  }

  const { traceEvents } = JSON.parse(buffer.toString('utf8')) as { traceEvents: TraceEvent[] };
  const threads = traceEvents.filter((e) => e.ph === 'M' && e.name === 'thread_name');
  const mains = threads.filter((e) => e.args?.name === 'CrRendererMain');
  // The page's renderer is the one that did the most work while recording.
  const busiest = (candidates: TraceEvent[]) =>
    candidates
      .map((t) => ({ t, n: traceEvents.filter((e) => e.pid === t.pid && e.tid === t.tid).length }))
      .sort((a, b) => b.n - a.n)[0]?.t;
  const main = busiest(mains);
  if (!main) throw new Error('no CrRendererMain thread in the trace');
  const worker = busiest(
    threads.filter((e) => e.pid === main.pid && /DedicatedWorker/.test(e.args?.name ?? '')),
  );
  const renderThread = mode === 'worker' ? worker : main;
  if (!renderThread) throw new Error(`no render thread for ${mode} in the trace`);

  const spanSec = spanMs / 1000;
  const drawn = framesDrawn(traceEvents, renderThread.pid, renderThread.tid, mode);
  const render = analyzeThread(traceEvents, renderThread.pid, renderThread.tid, spanMs);
  return {
    target: target.name,
    mode,
    film,
    fromSec: from,
    drawnFps: drawn / spanSec,
    rafFps: (endFrames.frames - startFrames.frames) / spanSec,
    longTasks: endFrames.longTasks - startFrames.longTasks,
    main: analyzeThread(traceEvents, main.pid, main.tid, spanMs),
    render,
    renderCpuMsPerFrame: drawn > 0 ? (render.cpuMsPerSec * spanSec) / drawn : 0,
  };
}

const pct = (share: number) => `${(share * 100).toFixed(1)}%`;

/**
 * tsx (esbuild, keepNames) wraps functions in a `__name(fn, "name")` helper, and Playwright
 * serializes those functions into the page as-is, so the page needs the helper too.
 */
const NAME_SHIM = 'globalThis.__name = globalThis.__name || ((fn) => fn);';

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const counts: Record<string, FrameCount[]> = {};
  const playback: PlaybackReport[] = [];
  try {
    for (const target of options.targets) {
      counts[target.name] = [];
      for (const film of options.counted) {
        counts[target.name]!.push(...(await countFrameCalls(browser, target, film)));
      }
      const modes: Mode[] = target.name === 'base' ? ['main'] : ['worker', 'main'];
      for (const film of options.traced) {
        for (const mode of modes) {
          const report = await tracePlayback(
            browser,
            target,
            mode,
            film,
            options.seconds,
            options.from[film] ?? 0,
            options.traces,
          );
          playback.push(report);
          console.log(
            `${target.name.padEnd(7)} ${mode.padEnd(6)} ${film.padEnd(14)} ` +
              `drawn ${report.drawnFps.toFixed(0).padStart(3)} fps  ` +
              `render CPU ${report.renderCpuMsPerFrame.toFixed(3)} ms/frame  ` +
              `kernel ${pct(report.render.kernelShare)} (of script ${pct(report.render.kernelShareOfScript)})  ` +
              `main tasks ${report.main.taskMsPerSec.toFixed(0)} ms/s, CPU ${report.main.cpuMsPerSec.toFixed(0)} ms/s  ` +
              `long tasks ${report.longTasks} (trace >50ms: ${report.main.tasksOver50ms})`,
          );
        }
      }
    }
  } finally {
    await browser.close();
  }

  for (const [target, rows] of Object.entries(counts)) {
    for (const row of rows) {
      const g = row.gl;
      console.log(
        `${target.padEnd(7)} ${row.film.padEnd(24)} t=${String(row.timeSec).padEnd(6)} ` +
          `draws ${g.draw + g.instancedDraw} (instanced ${g.instancedDraw})  uniform ${g.uniform}  ` +
          `upload ${g.upload}  other ${g.other}`,
      );
    }
  }

  const summary = { recordedAt: new Date().toISOString(), options, counts, playback };
  if (options.out) writeFileSync(options.out, `${JSON.stringify(summary, null, 2)}\n`);
}

await main();
