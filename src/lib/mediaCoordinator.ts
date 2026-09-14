export interface MediaCoordinatorControls {
  play: () => void | Promise<void>;
  pause: () => void;
}

export interface MediaCoordinatorMetadata {
  title: string;
  artist?: string;
  album?: string;
}

export interface MediaCoordinator {
  activate(
    id: string,
    controls: MediaCoordinatorControls,
    metadata?: MediaCoordinatorMetadata,
  ): void;
  deactivate(id: string): void;
  getActiveId(): string | undefined;
}

function hasMediaSession(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function createMediaCoordinator(): MediaCoordinator {
  let activeId: string | undefined;
  let activeControls: MediaCoordinatorControls | undefined;

  function updateSessionForActivate(
    controls: MediaCoordinatorControls,
    metadata?: MediaCoordinatorMetadata,
  ) {
    if (!hasMediaSession()) return;
    const session = navigator.mediaSession;

    if (metadata && typeof MediaMetadata !== 'undefined') {
      session.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
      });
    }
    session.playbackState = 'playing';
    session.setActionHandler('play', () => {
      void controls.play();
    });
    session.setActionHandler('pause', () => {
      controls.pause();
    });
  }

  function clearSession() {
    if (!hasMediaSession()) return;
    const session = navigator.mediaSession;

    session.playbackState = 'none';
    session.setActionHandler('play', null);
    session.setActionHandler('pause', null);
    session.metadata = null;
  }

  return {
    activate(id, controls, metadata) {
      if (id === activeId) {
        activeControls = controls;
        updateSessionForActivate(controls, metadata);
        return;
      }

      const previousControls = activeControls;
      activeId = id;
      activeControls = controls;
      updateSessionForActivate(controls, metadata);
      previousControls?.pause();
    },
    deactivate(id) {
      if (id !== activeId) return;
      activeId = undefined;
      activeControls = undefined;
      clearSession();
    },
    getActiveId() {
      return activeId;
    },
  };
}
