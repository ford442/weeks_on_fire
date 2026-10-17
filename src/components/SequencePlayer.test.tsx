import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MediaSessionProvider from '../contexts/MediaSessionProvider';
import { sequences, type SequenceRecord } from '../data/sequences';
import { createSequenceGl } from '../lib/webgl/context';
import { createSequenceScene } from '../sequences/registry';

import SequencePlayer from './SequencePlayer';

vi.mock('../lib/webgl/context', () => ({ createSequenceGl: vi.fn() }));
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

function renderPlayer() {
  return render(
    <MediaSessionProvider>
      <SequencePlayer sequence={sequence} />
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
