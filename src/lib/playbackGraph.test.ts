import { describe, expect, it, vi } from 'vitest';

import { createMediaCoordinator } from './mediaCoordinator';
import {
  mediaElementTrack,
  PlaybackGraph,
  type GraphScheduler,
  type GraphSnapshot,
} from './playbackGraph';

/** A frame scheduler the test steps by hand: `advance(ms)` moves time and runs the next frame. */
function manualScheduler() {
  let now = 0;
  let pending: ((now: number) => void) | null = null;
  const scheduler: GraphScheduler = {
    now: () => now,
    request(callback) {
      pending = callback;
      return 1;
    },
    cancel() {
      pending = null;
    },
  };
  return {
    scheduler,
    get pending() {
      return pending !== null;
    },
    advance(ms: number) {
      now += ms;
      const run = pending;
      pending = null;
      run?.(now);
    },
  };
}

function recordingTrack() {
  return { transport: vi.fn(), frame: vi.fn(), dispose: vi.fn() };
}

function setup(durationSec = 10, loop = false) {
  const frames = manualScheduler();
  const graph = new PlaybackGraph({ durationSec, loop, scheduler: frames.scheduler });
  const track = recordingTrack();
  graph.addTrack(track);
  return { graph, frames, track };
}

describe('PlaybackGraph', () => {
  it('brings a new track to the current time, paused', () => {
    const { track } = setup();
    expect(track.transport).toHaveBeenCalledWith({ timeSec: 0, playing: false, jumped: true });
  });

  it('plays every track off one clock and stops at the end', () => {
    const { graph, frames, track } = setup(2);
    graph.play();
    expect(track.transport).toHaveBeenLastCalledWith({
      timeSec: 0,
      playing: true,
      jumped: false,
    });
    frames.advance(1000);
    expect(track.frame).toHaveBeenLastCalledWith({
      timeSec: 1,
      continuous: false,
      playing: true,
    });
    frames.advance(500);
    expect(track.frame).toHaveBeenLastCalledWith({
      timeSec: 1.5,
      continuous: true,
      playing: true,
    });
    frames.advance(1000);
    expect(track.frame).toHaveBeenLastCalledWith({ timeSec: 2, continuous: true, playing: false });
    expect(track.transport).toHaveBeenLastCalledWith({ timeSec: 2, playing: false, jumped: false });
    expect(graph.snapshot().playing).toBe(false);
    expect(frames.pending).toBe(false);
  });

  it('draws one frame after a seek while paused, marked as a jump', () => {
    const { graph, frames, track } = setup();
    frames.advance(16);
    graph.seek(4);
    expect(track.transport).toHaveBeenLastCalledWith({ timeSec: 4, playing: false, jumped: true });
    frames.advance(16);
    expect(track.frame).toHaveBeenLastCalledWith({ timeSec: 4, continuous: false, playing: false });
    expect(frames.pending).toBe(false);
  });

  it('tells element tracks about a loop wrap so the song restarts', () => {
    const { graph, frames, track } = setup(2, true);
    graph.play();
    frames.advance(1500);
    frames.advance(1000); // 2.5 s wraps to 0.5 s
    expect(track.transport).toHaveBeenCalledWith({ timeSec: 0.5, playing: true, jumped: true });
    expect(track.frame).toHaveBeenLastCalledWith({
      timeSec: 0.5,
      continuous: false,
      playing: true,
    });
  });

  it('play at the end starts over', () => {
    const { graph, frames, track } = setup(1);
    graph.play();
    frames.advance(2000);
    graph.play();
    expect(track.transport).toHaveBeenLastCalledWith({ timeSec: 0, playing: true, jumped: true });
  });

  it('a hold freezes the clock and pauses tracks without losing the play intent', () => {
    const { graph, frames, track } = setup();
    graph.play();
    frames.advance(1000);
    graph.hold('hidden');
    expect(track.transport).toHaveBeenLastCalledWith({ timeSec: 1, playing: false, jumped: false });
    expect(graph.snapshot()).toMatchObject({ playing: true, held: true, timeSec: 1 });
    frames.advance(5000); // the held span is dropped
    graph.release('hidden');
    expect(track.transport).toHaveBeenLastCalledWith({ timeSec: 1, playing: true, jumped: false });
    frames.advance(1000);
    expect(track.frame).toHaveBeenLastCalledWith({ timeSec: 2, continuous: true, playing: true });
  });

  it('notifies listeners on transport changes', () => {
    const { graph } = setup();
    const listener = vi.fn<(snapshot: GraphSnapshot) => void>();
    graph.subscribe(listener);
    graph.play();
    graph.pause();
    graph.setLoop(true);
    expect(listener.mock.calls.map(([snapshot]) => snapshot)).toEqual([
      expect.objectContaining({ playing: true, loop: false }),
      expect.objectContaining({ playing: false, loop: false }),
      expect.objectContaining({ playing: false, loop: true }),
    ]);
  });

  it('plays through the media coordinator: one thing at a time', () => {
    const coordinator = createMediaCoordinator();
    const { graph } = setup();
    const song = { play: vi.fn(), pause: vi.fn() };
    coordinator.activate('song:twilight-time', song);

    const disconnect = graph.connect(coordinator, 'cutaway:color-whip', { title: 'Color Whip' });
    graph.play();
    expect(song.pause).toHaveBeenCalled();
    expect(coordinator.getActiveId()).toBe('cutaway:color-whip');

    // Something else starting pauses the graph.
    coordinator.activate('song:daisy-bell', { play: vi.fn(), pause: vi.fn() });
    expect(graph.snapshot().playing).toBe(false);

    graph.play();
    graph.pause();
    expect(coordinator.getActiveId()).toBeUndefined();
    graph.play();
    disconnect();
    expect(coordinator.getActiveId()).toBeUndefined();
  });

  it('dispose pauses and disposes every track', () => {
    const { graph, track } = setup();
    graph.play();
    graph.dispose();
    expect(track.transport).toHaveBeenLastCalledWith(expect.objectContaining({ playing: false }));
    expect(track.dispose).toHaveBeenCalled();
    graph.play();
    expect(graph.snapshot().playing).toBe(false);
  });
});

function fakeElement(duration = 60) {
  const element = {
    currentTime: 0,
    duration,
    paused: true,
    play: vi.fn(() => {
      element.paused = false;
      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      element.paused = true;
    }),
  };
  return element;
}

describe('mediaElementTrack', () => {
  it('seeks, plays and pauses with the graph', () => {
    const element = fakeElement();
    const track = mediaElementTrack(element as unknown as HTMLMediaElement);
    track.transport?.({ timeSec: 12, playing: true, jumped: true });
    expect(element.currentTime).toBe(12);
    expect(element.play).toHaveBeenCalled();
    track.transport?.({ timeSec: 13, playing: false, jumped: false });
    expect(element.pause).toHaveBeenCalled();
  });

  it('pulls a drifting element back to the graph', () => {
    const element = fakeElement();
    const track = mediaElementTrack(element as unknown as HTMLMediaElement);
    track.transport?.({ timeSec: 0, playing: true, jumped: true });
    element.currentTime = 9.2; // stalled while buffering
    track.frame?.({ timeSec: 10, continuous: true, playing: true });
    expect(element.currentTime).toBe(10);
    element.currentTime = 10.6;
    track.frame?.({ timeSec: 10.7, continuous: true, playing: true }); // inside the tolerance
    expect(element.currentTime).toBe(10.6);
  });

  it('does not start a song that has already run out', () => {
    const element = fakeElement(5);
    const track = mediaElementTrack(element as unknown as HTMLMediaElement);
    track.transport?.({ timeSec: 8, playing: true, jumped: true });
    expect(element.currentTime).toBe(5);
    expect(element.play).not.toHaveBeenCalled();
  });
});
