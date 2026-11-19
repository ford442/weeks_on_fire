import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MediaSessionProvider from '../contexts/MediaSessionProvider';
import { sequences, type SequenceRecord } from '../data/sequences';
import { createSequenceGl } from '../lib/webgl/context';
import { createSequenceScene } from '../sequences/registry';

import SequencePlayer from './SequencePlayer';

vi.mock('../lib/webgl/context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/webgl/context')>()),
  createSequenceGl: vi.fn(),
}));
vi.mock('../lib/webgl/engine', () => ({
  SequenceEngine: class {
    dispose() {}
  },
}));
vi.mock('../sequences/registry', () => ({ createSequenceScene: vi.fn() }));

const base = sequences[0];
if (!base) throw new Error('sequence fixture is empty');
const sequence: SequenceRecord = { ...base, id: 'clock-test', durationSec: 10 };

function makeScene() {
  return { init: vi.fn(), draw: vi.fn(), dispose: vi.fn() };
}

function renderPlayer(props: { capture?: boolean } = {}) {
  return render(
    <MediaSessionProvider>
      <SequencePlayer sequence={sequence} {...props} />
    </MediaSessionProvider>,
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
    vi.mocked(createSequenceGl).mockReturnValue({} as ReturnType<typeof createSequenceGl>);
    vi.mocked(createSequenceScene).mockReturnValue(scene);
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
    expect(vi.mocked(createSequenceScene)).toHaveBeenCalledTimes(2);
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
