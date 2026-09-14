import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMediaCoordinator, type MediaCoordinator } from './mediaCoordinator';

function fixtureControls() {
  return { play: vi.fn(), pause: vi.fn() };
}

describe('media coordinator', () => {
  let coordinator: MediaCoordinator;

  beforeEach(() => {
    coordinator = createMediaCoordinator();
  });

  it('pauses the previously active id when a different id activates', () => {
    const a = fixtureControls();
    const b = fixtureControls();

    coordinator.activate('a', a);
    coordinator.activate('b', b);

    expect(a.pause).toHaveBeenCalledTimes(1);
    expect(b.pause).not.toHaveBeenCalled();
    expect(coordinator.getActiveId()).toBe('b');
  });

  it('does not pause a track when it reactivates itself', () => {
    const a = fixtureControls();

    coordinator.activate('a', a);
    coordinator.activate('a', a);

    expect(a.pause).not.toHaveBeenCalled();
    expect(coordinator.getActiveId()).toBe('a');
  });

  it('deactivating a non-active id is a no-op', () => {
    const a = fixtureControls();
    const c = fixtureControls();

    coordinator.activate('a', a);
    coordinator.deactivate('b');
    expect(coordinator.getActiveId()).toBe('a');

    coordinator.activate('c', c);
    expect(a.pause).toHaveBeenCalledTimes(1);
    expect(coordinator.getActiveId()).toBe('c');
  });

  it('tracks the active id through activate/deactivate transitions', () => {
    const a = fixtureControls();

    expect(coordinator.getActiveId()).toBeUndefined();
    coordinator.activate('a', a);
    expect(coordinator.getActiveId()).toBe('a');
    coordinator.deactivate('a');
    expect(coordinator.getActiveId()).toBeUndefined();
  });

  it('runs cleanly with no navigator.mediaSession available', () => {
    const a = fixtureControls();
    const b = fixtureControls();

    expect(() => {
      coordinator.activate('a', a);
      coordinator.activate('b', b);
      coordinator.deactivate('b');
    }).not.toThrow();
  });
});

describe('media coordinator with Media Session API', () => {
  let coordinator: MediaCoordinator;
  let setActionHandler: ReturnType<typeof vi.fn>;
  let mediaSession: {
    metadata: unknown;
    playbackState: string;
    setActionHandler: typeof setActionHandler;
  };

  beforeEach(() => {
    coordinator = createMediaCoordinator();
    setActionHandler = vi.fn();
    mediaSession = { metadata: null, playbackState: 'none', setActionHandler };

    vi.stubGlobal('navigator', { mediaSession });
    vi.stubGlobal(
      'MediaMetadata',
      class {
        title?: string;
        artist?: string;
        album?: string;
        constructor(init: { title?: string; artist?: string; album?: string }) {
          this.title = init.title;
          this.artist = init.artist;
          this.album = init.album;
        }
      },
    );
  });

  it('sets metadata and action handlers on activate, clears them on deactivate', () => {
    const a = fixtureControls();

    coordinator.activate('a', a, { title: 'Track A', artist: 'Weeks on Fire' });

    expect(mediaSession.playbackState).toBe('playing');
    expect(mediaSession.metadata).toMatchObject({ title: 'Track A', artist: 'Weeks on Fire' });
    expect(setActionHandler).toHaveBeenCalledWith('play', expect.any(Function));
    expect(setActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));

    coordinator.deactivate('a');

    expect(mediaSession.playbackState).toBe('none');
    expect(mediaSession.metadata).toBeNull();
    expect(setActionHandler).toHaveBeenCalledWith('play', null);
    expect(setActionHandler).toHaveBeenCalledWith('pause', null);
  });
});
