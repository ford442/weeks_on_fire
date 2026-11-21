import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { useMediaCoordinator } from '../contexts/MediaSessionContext';
import MediaSessionProvider from '../contexts/MediaSessionProvider';
import { sequences, type SequenceRecord } from '../data/sequences';
import { getTakes, resetTakesForTest } from '../lib/capture/takes';
import { createSequenceGl } from '../lib/webgl/context';
import { resetWorkerAvailability } from '../sequences/render/workerHost';
import { createScene } from '../sequences/scenes';

import SequencePlayer, { type RendererPreference } from './SequencePlayer';

import type { MediaCoordinator } from '../lib/mediaCoordinator';
import type { MainToWorkerMessage, WorkerToMainMessage } from '../sequences/worker/protocol';

vi.mock('../lib/webgl/context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/webgl/context')>()),
  createSequenceGl: vi.fn(),
}));
vi.mock('../lib/webgl/engine', () => ({
  SequenceEngine: class {
    stats = { drawCalls: 3, instances: 9, uniformCalls: 12, bufferUploads: 1 };
    beginFrame() {}
    dispose() {}
  },
}));
vi.mock('../sequences/scenes', () => ({ createScene: vi.fn() }));

/** A GL context stub: enough for the in-thread host, which only reads the attributes back. */
const stubGl = {
  getContextAttributes: () => ({ preserveDrawingBuffer: false }),
} as unknown as ReturnType<typeof createSequenceGl>;

const base = sequences[0];
if (!base) throw new Error('sequence fixture is empty');
const sequence: SequenceRecord = { ...base, id: 'clock-test', durationSec: 10 };

function makeScene() {
  return { init: vi.fn(), draw: vi.fn(), dispose: vi.fn() };
}

function renderPlayer(
  props: { capture?: boolean; renderer?: RendererPreference; stats?: boolean } = {},
) {
  return render(
    <MediaSessionProvider>
      <SequencePlayer sequence={sequence} {...props} />
    </MediaSessionProvider>,
    { wrapper: MemoryRouter },
  );
}

function lastDrawTime(scene: ReturnType<typeof makeScene>): number {
  const call = scene.draw.mock.lastCall;
  if (!call) throw new Error('scene never drew');
  return (call[0] as { timeSec: number }).timeSec;
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('SequencePlayer without WebGL', () => {
  beforeEach(() => {
    vi.mocked(createSequenceGl).mockReturnValue(null);
  });

  it('shows the unsupported message', () => {
    renderPlayer();
    expect(screen.getByText(/WebGL is unavailable/)).toBeTruthy();
  });

  it('reports data-gl="none" on the canvas', () => {
    renderPlayer();
    expect(screen.getByRole('img').getAttribute('data-gl')).toBe('none');
  });

  it('adds the browser statusMessage from webglcontextcreationerror to the overlay', () => {
    vi.mocked(createSequenceGl).mockImplementation((_canvas, opts) => {
      opts?.onCreationError?.('Could not create a WebGL2 context, VENDOR = 0xffff');
      opts?.onCreationError?.('Could not create a WebGL2 context, VENDOR = 0xffff');
      opts?.onCreationError?.('GPU process was unable to boot');
      return null;
    });
    renderPlayer();
    const text = screen.getByText(/WebGL is unavailable/).parentElement?.textContent ?? '';
    expect(text).toContain('Could not create a WebGL2 context, VENDOR = 0xffff');
    expect(text).toContain('GPU process was unable to boot');
    // The same message from the webgl2 and webgl attempts is listed once.
    expect(text.match(/VENDOR = 0xffff/g)).toHaveLength(1);
  });

  it('shows the bare message when the browser gave no reason', () => {
    renderPlayer();
    expect(screen.getByText(/WebGL is unavailable/).parentElement?.textContent).toBe(
      'WebGL is unavailable in this browser, so the in-hub player cannot run.',
    );
  });
});

describe('SequencePlayer context options', () => {
  beforeEach(() => {
    vi.mocked(createSequenceGl).mockReset();
    vi.mocked(createSequenceGl).mockReturnValue(null);
  });

  it('does not ask for a preserved drawing buffer by default', () => {
    renderPlayer();
    expect(vi.mocked(createSequenceGl).mock.lastCall?.[1]).toMatchObject({ capture: false });
  });

  it('asks for a preserved drawing buffer only when capture is set', () => {
    renderPlayer({ capture: true });
    expect(vi.mocked(createSequenceGl).mock.lastCall?.[1]).toMatchObject({ capture: true });
  });
});

describe('SequencePlayer with a stubbed GL context', () => {
  let scene: ReturnType<typeof makeScene>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    scene = makeScene();
    vi.mocked(createSequenceGl).mockReturnValue(stubGl);
    vi.mocked(createScene).mockReturnValue(scene);
  });

  afterEach(() => {
    setHidden(false);
    vi.useRealTimers();
  });

  const advance = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };

  it('reports the context type it got as data-gl', () => {
    renderPlayer();
    // jsdom has no WebGL2RenderingContext, so the stub counts as WebGL1.
    expect(screen.getByRole('img').getAttribute('data-gl')).toBe('webgl');
  });

  it('draws in-thread where the browser cannot hand a canvas to a worker (jsdom)', () => {
    renderPlayer();
    const canvas = screen.getByRole('img');
    expect(canvas.getAttribute('data-renderer')).toBe('main');
    expect(canvas.getAttribute('data-preserve-drawing-buffer')).toBe('false');
  });

  it('builds the scene from the record, graph included', () => {
    renderPlayer();
    expect(vi.mocked(createScene)).toHaveBeenCalledWith({
      id: 'clock-test',
      graph: sequence.graph,
    });
  });

  it('overlays frame stats with ?stats', () => {
    renderPlayer({ stats: true });
    advance(1000);
    const overlay = screen.getByRole('complementary', { name: 'Renderer stats' });
    expect(overlay.textContent).toContain('threadmain');
    expect(overlay.textContent).toContain('draws3 (9 objects)');
    expect(overlay.textContent).toContain('uniforms12');
  });

  it('shows why the scene failed to start instead of a bare "unavailable"', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    scene.init.mockImplementation(() => {
      throw new Error('ERROR: 0:12: undeclared identifier uTime');
    });
    renderPlayer();
    const overlay = screen.getByText(/WebGL is unavailable/).parentElement;
    expect(overlay?.textContent).toContain('ERROR: 0:12: undeclared identifier uTime');
    expect(error).toHaveBeenCalled();
    // The context itself was fine, so the canvas still reports it.
    expect(screen.getByRole('img').getAttribute('data-gl')).toBe('webgl');
    error.mockRestore();
  });

  it('plays, then pauses and holds the film time', () => {
    renderPlayer();
    advance(2000);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(lastDrawTime(scene)).toBeGreaterThan(1.5);

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    advance(16);
    const paused = lastDrawTime(scene);
    advance(5000);
    expect(lastDrawTime(scene)).toBeCloseTo(paused, 5);
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  });

  it('loops past the end by default', () => {
    renderPlayer();
    advance(13_000);
    expect(lastDrawTime(scene)).toBeLessThan(10);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('stops on the last frame when Loop is off', () => {
    renderPlayer();
    fireEvent.click(screen.getByLabelText('Loop'));
    advance(12_000);
    expect(lastDrawTime(scene)).toBe(10);
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  });

  it('seeks from the slider while paused', () => {
    renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
    advance(16);
    expect(lastDrawTime(scene)).toBeCloseTo(7, 5);
    expect(screen.getByText('0:07 / 0:10')).toBeTruthy();
  });

  it('restart rewinds to the start and plays', () => {
    renderPlayer();
    advance(4000);
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    advance(100);
    expect(lastDrawTime(scene)).toBeLessThan(0.5);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('does not jump ahead after the tab was hidden', () => {
    renderPlayer();
    advance(2000);
    setHidden(true);
    advance(60_000);
    setHidden(false);
    advance(100);
    expect(lastDrawTime(scene)).toBeLessThan(3);
  });

  it('shows a status on context loss and resumes on restore without losing time', () => {
    renderPlayer();
    advance(2000);
    const canvas = screen.getByRole('img');

    fireEvent(canvas, new Event('webglcontextlost', { cancelable: true }));
    expect(screen.getByRole('status').textContent).toMatch(/graphics context was lost/);
    expect(scene.dispose).toHaveBeenCalled();
    advance(30_000);

    fireEvent(canvas, new Event('webglcontextrestored'));
    advance(100);
    expect(screen.queryByRole('status')).toBeNull();
    expect(vi.mocked(createScene)).toHaveBeenCalledTimes(2);
    expect(lastDrawTime(scene)).toBeLessThan(3.5);
  });

  it('starts paused under prefers-reduced-motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );
    renderPlayer();
    advance(2000);
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    expect(lastDrawTime(scene)).toBe(0);
  });

  it('pressing Play at the end of a non-looping film starts over', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPlayer();
    await user.click(screen.getByLabelText('Loop'));
    advance(12_000);
    await user.click(screen.getByRole('button', { name: 'Play' }));
    advance(500);
    expect(lastDrawTime(scene)).toBeLessThan(1);
  });
});

/** Stands in for the render worker: records what the player posts, replies on demand. */
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  readonly posted: MainToWorkerMessage[] = [];
  readonly transfers: Transferable[][] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: MainToWorkerMessage, transfer: Transferable[] = []) {
    this.posted.push(message);
    this.transfers.push(transfer);
  }

  terminate() {
    this.terminated = true;
  }

  reply(message: WorkerToMainMessage) {
    act(() => {
      this.onmessage?.({ data: message } as MessageEvent<unknown>);
    });
  }

  frames() {
    return this.posted.filter((m) => m.type === 'tick' || m.type === 'seek');
  }
}

const frameStats = {
  timeSec: 0,
  cpuMs: 0.4,
  drawCalls: 8,
  instances: 41,
  uniformCalls: 20,
  bufferUploads: 3,
  width: 320,
  height: 180,
};

describe('SequencePlayer in the render worker', () => {
  const offscreen = { width: 0, height: 0 };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    FakeWorker.instances = [];
    resetWorkerAvailability();
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('OffscreenCanvas', class {});
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', {
      configurable: true,
      value: () => offscreen,
    });
    vi.mocked(createSequenceGl).mockReset();
    vi.mocked(createSequenceGl).mockReturnValue(stubGl);
    vi.mocked(createScene).mockReturnValue(makeScene());
  });

  afterEach(() => {
    delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).transferControlToOffscreen;
    vi.unstubAllGlobals();
    resetWorkerAvailability();
    vi.useRealTimers();
  });

  const advance = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };

  function worker(): FakeWorker {
    const instance = FakeWorker.instances[0];
    if (!instance) throw new Error('no worker was started');
    return instance;
  }

  it('transfers the canvas and starts the film in the worker', () => {
    renderPlayer({ capture: true });
    const init = worker().posted[0];
    expect(init).toMatchObject({
      type: 'init',
      sequenceId: 'clock-test',
      durationSec: 10,
      capture: true,
      env: { coarsePointer: false },
    });
    expect(worker().transfers[0]).toEqual([offscreen]);
    expect(screen.getByRole('img').getAttribute('data-renderer')).toBe('worker');
    // The page thread never asked for a context of its own.
    expect(vi.mocked(createSequenceGl)).not.toHaveBeenCalled();
  });

  it('publishes what the worker context reported', () => {
    renderPlayer();
    worker().reply({
      type: 'ready',
      kind: 'webgl2',
      preserveDrawingBuffer: false,
      renderer: null,
      kernel: 'ts',
    });
    const canvas = screen.getByRole('img');
    expect(canvas.getAttribute('data-gl')).toBe('webgl2');
    expect(canvas.getAttribute('data-preserve-drawing-buffer')).toBe('false');
  });

  it('keeps one frame in flight and sends the latest time when the worker answers', () => {
    renderPlayer();
    advance(200);
    // The first frame is a seek (nothing came before it); later ones wait for its reply.
    expect(worker().frames()).toHaveLength(1);
    expect(worker().frames()[0]?.type).toBe('seek');

    worker().reply({ type: 'frameStats', stats: frameStats });
    const [, next] = worker().frames();
    expect(next?.type).toBe('tick');
    expect((next as { timeSec: number }).timeSec).toBeGreaterThan(0.1);
  });

  it('sends a seek, not a tick, after the slider moves', () => {
    renderPlayer();
    advance(16);
    worker().reply({ type: 'frameStats', stats: frameStats });
    worker().reply({ type: 'frameStats', stats: frameStats });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
    advance(16);
    worker().reply({ type: 'frameStats', stats: frameStats });
    const last = worker().frames().at(-1);
    expect(last).toMatchObject({ type: 'seek' });
    expect((last as { timeSec: number }).timeSec).toBeCloseTo(7, 1);
  });

  it('tells the worker about a new drawing-buffer size', () => {
    renderPlayer();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(360);
    advance(16);
    expect(worker().posted).toContainEqual(
      expect.objectContaining({ type: 'resize', width: 640, height: 360 }),
    );
  });

  it('falls back in-thread on a fresh canvas when the worker has no GL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderPlayer();
    const first = screen.getByRole('img');
    worker().reply({
      type: 'failed',
      kind: 'none',
      stage: 'context',
      reason: 'no OffscreenCanvas GL',
    });

    const canvas = screen.getByRole('img');
    expect(canvas).not.toBe(first);
    expect(canvas.getAttribute('data-renderer')).toBe('main');
    expect(worker().terminated).toBe(true);
    expect(vi.mocked(createSequenceGl)).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
  });

  it('skips the worker for later players once it had no GL', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { unmount } = renderPlayer();
    worker().reply({ type: 'failed', kind: 'none', stage: 'context', reason: null });
    unmount();
    renderPlayer();
    expect(FakeWorker.instances).toHaveLength(1);
    expect(screen.getByRole('img').getAttribute('data-renderer')).toBe('main');
  });

  it('falls back when the worker script fails to load', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderPlayer();
    act(() => {
      worker().onerror?.({ message: '', preventDefault() {} } as ErrorEvent);
    });
    expect(screen.getByRole('img').getAttribute('data-renderer')).toBe('main');
  });

  it('shows the lost-context status from the worker and clears it on restore', () => {
    renderPlayer();
    advance(500);
    worker().reply({ type: 'contextLost' });
    expect(screen.getByRole('status').textContent).toMatch(/graphics context was lost/);
    worker().reply({ type: 'contextRestored' });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('never starts a worker under ?renderer=main', () => {
    renderPlayer({ renderer: 'main' });
    expect(FakeWorker.instances).toHaveLength(0);
    expect(screen.getByRole('img').getAttribute('data-renderer')).toBe('main');
  });

  it('shows worker frame stats in the overlay', () => {
    renderPlayer({ stats: true });
    advance(16);
    worker().reply({ type: 'frameStats', stats: frameStats });
    advance(300);
    const overlay = screen.getByRole('complementary', { name: 'Renderer stats' });
    expect(overlay.textContent).toContain('threadworker');
    expect(overlay.textContent).toContain('draws8 (41 objects)');
    expect(overlay.textContent).toContain('buffer320×180');
  });

  it('turns the stats overlay on without restarting the renderer', () => {
    const { rerender } = renderPlayer();
    rerender(
      <MediaSessionProvider>
        <SequencePlayer sequence={sequence} stats />
      </MediaSessionProvider>,
    );
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker().terminated).toBe(false);
    expect(screen.getByRole('complementary', { name: 'Renderer stats' })).toBeTruthy();
  });

  it('records a take in-thread, then hands the film back to the worker', async () => {
    const restore = stubCapture();
    try {
      renderPlayer();
      advance(300);
      fireEvent.click(screen.getByRole('button', { name: 'Record take' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Stop take' })).toBeTruthy());
      expect(worker().posted.at(-1)).toEqual({ type: 'dispose' });
      expect(screen.getByRole('img').getAttribute('data-renderer')).toBe('main');

      fireEvent.click(screen.getByRole('button', { name: 'Stop take' }));
      await waitFor(() => expect(getTakes()).toHaveLength(1));
      await waitFor(() =>
        expect(screen.getByRole('img').getAttribute('data-renderer')).toBe('worker'),
      );
      expect(FakeWorker.instances).toHaveLength(2);
    } finally {
      restore();
    }
  });

  it('disposes the worker when the player goes away', () => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout'],
    });
    const { unmount } = renderPlayer();
    unmount();
    expect(worker().posted.at(-1)).toEqual({ type: 'dispose' });
    vi.advanceTimersByTime(1000);
    expect(worker().terminated).toBe(true);
  });
});

/** MediaRecorder stand-in: the take's bytes arrive on stop. */
class FakeMediaRecorder extends EventTarget {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = (type: string) => type.startsWith('video/webm');
  state: RecordingState = 'inactive';
  readonly calls: string[] = [];

  constructor(
    readonly stream: MediaStream,
    readonly options?: MediaRecorderOptions,
  ) {
    super();
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.calls.push('start');
    this.state = 'recording';
  }
  pause() {
    this.calls.push('pause');
    this.state = 'paused';
  }
  resume() {
    this.calls.push('resume');
    this.state = 'recording';
  }
  stop() {
    this.calls.push('stop');
    this.state = 'inactive';
    const data = Object.assign(new Event('dataavailable'), {
      data: new Blob(['take'], { type: 'video/webm' }),
    });
    this.dispatchEvent(data);
    this.dispatchEvent(new Event('stop'));
  }
}

/** Gives jsdom MediaRecorder, canvas.captureStream and blob URLs. Returns the undo. */
function stubCapture(): () => void {
  FakeMediaRecorder.instances = [];
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  vi.stubGlobal(
    'MediaStream',
    class {
      constructor(private readonly tracks: unknown[]) {}
      getTracks() {
        return this.tracks;
      }
    },
  );
  const track = { stop: vi.fn() };
  Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
    configurable: true,
    value: vi.fn(() => ({ getVideoTracks: () => [track], getTracks: () => [track] })),
  });
  let urls = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: () => `blob:take-${(urls += 1)}`,
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined });
  return () => {
    resetTakesForTest();
    delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).captureStream;
    delete (URL as Partial<typeof URL>).createObjectURL;
    delete (URL as Partial<typeof URL>).revokeObjectURL;
    vi.unstubAllGlobals();
  };
}

function CoordinatorProbe({ onReady }: { onReady: (coordinator: MediaCoordinator) => void }) {
  const coordinator = useMediaCoordinator();
  useEffect(() => onReady(coordinator), [coordinator, onReady]);
  return null;
}

describe('SequencePlayer recording a take', () => {
  let scene: ReturnType<typeof makeScene>;
  let restore: () => void;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    restore = stubCapture();
    scene = makeScene();
    vi.mocked(createSequenceGl).mockReset();
    vi.mocked(createSequenceGl).mockReturnValue(stubGl);
    vi.mocked(createScene).mockReturnValue(scene);
  });

  afterEach(() => {
    setHidden(false);
    restore();
    vi.useRealTimers();
  });

  const advance = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };

  async function startTake() {
    fireEvent.click(screen.getByRole('button', { name: 'Record take' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stop take' })).toBeTruthy());
  }

  function recorder(): FakeMediaRecorder {
    const instance = FakeMediaRecorder.instances[0];
    if (!instance) throw new Error('no recorder was started');
    return instance;
  }

  it('records one full pass from 0 with a preserved buffer, then keeps the take', async () => {
    renderPlayer();
    advance(3000);
    await startTake();
    expect(vi.mocked(createSequenceGl).mock.lastCall?.[1]).toMatchObject({ capture: true });
    expect(recorder().options?.mimeType).toBe('video/webm;codecs=vp9');
    advance(16);
    expect(lastDrawTime(scene)).toBeLessThan(0.1);
    // Seeking or restarting would cut the take, so the controls are locked while it runs.
    expect(screen.getByRole('slider')).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Restart' })).toHaveProperty('disabled', true);

    advance(10_100); // loop is off for the take: it ends on the last frame
    await waitFor(() => expect(getTakes()).toHaveLength(1));
    expect(lastDrawTime(scene)).toBe(10);
    const [take] = getTakes();
    expect(take).toMatchObject({
      kind: 'sequence',
      sourceId: 'clock-test',
      expectedDurationSec: 10,
    });
    expect(Math.abs((take?.durationSec ?? 0) - 10)).toBeLessThan(0.1);
    expect(take?.fileName).toMatch(/^wof-sequence-clock-test-\d{8}-\d{6}\.webm$/);
    expect(await screen.findByText(/full take/)).toBeTruthy();

    // Back to playback: no preserved buffer, and Loop is the viewer's again.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Record take' })).toBeTruthy());
    expect(vi.mocked(createSequenceGl).mock.lastCall?.[1]).toMatchObject({ capture: false });
    expect(screen.getByLabelText('Loop')).toHaveProperty('checked', true);
  });

  it('pauses whatever else was playing, through the media coordinator', async () => {
    let coordinator: MediaCoordinator | null = null;
    const onReady = (value: MediaCoordinator) => {
      coordinator = value;
    };
    render(
      <MediaSessionProvider>
        <CoordinatorProbe onReady={onReady} />
        <SequencePlayer sequence={sequence} />
      </MediaSessionProvider>,
      { wrapper: MemoryRouter },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    const song = { play: vi.fn(), pause: vi.fn() };
    act(() => coordinator?.activate('song:daisy-bell', song, { title: 'Daisy Bell' }));

    await startTake();
    expect(song.pause).toHaveBeenCalled();
    expect(coordinator!.getActiveId()).toBe('sequence:clock-test');
  });

  it('pauses the take while the tab is hidden, so it stays as long as the film', async () => {
    renderPlayer();
    await startTake();
    advance(2000);
    setHidden(true);
    advance(30_000);
    setHidden(false);
    advance(8200);
    await waitFor(() => expect(getTakes()).toHaveLength(1));
    // Paused for the hidden span only; the end of the film closes the take.
    expect(recorder().calls).toEqual(['start', 'pause', 'resume', 'stop']);
    expect(Math.abs((getTakes()[0]?.durationSec ?? 0) - 10)).toBeLessThan(0.1);
  });

  it('Stop keeps what was recorded so far', async () => {
    renderPlayer();
    await startTake();
    advance(4000);
    fireEvent.click(screen.getByRole('button', { name: 'Stop take' }));
    await waitFor(() => expect(getTakes()).toHaveLength(1));
    expect(getTakes()[0]?.durationSec).toBeCloseTo(4, 1);
    expect(await screen.findByText(/stopped early/)).toBeTruthy();
  });

  it('offers no Record button where the browser cannot record', () => {
    vi.unstubAllGlobals();
    renderPlayer();
    const button = screen.getByRole('button', { name: 'Record take' });
    expect(button).toHaveProperty('disabled', true);
    expect(button.getAttribute('title')).toBe('This browser has no MediaRecorder.');
  });
});
