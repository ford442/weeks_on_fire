import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMediaCoordinator } from '../contexts/MediaSessionContext';
import MediaSessionProvider from '../contexts/MediaSessionProvider';

import CutawayPreview from './CutawayPreview';

import type { CutawaySegment } from '../data/suggestions';
import type { MediaCoordinator } from '../lib/mediaCoordinator';

function segment(id: string, start: string, end: string): CutawaySegment {
  return {
    id,
    label: id.toUpperCase(),
    start,
    end,
    durationSec: 0,
    onScreen: '',
    lyrics: '',
    musicCue: '',
    grokImaginePrompt: '',
    geminiOmniPrompt: '',
    promptVariations: [],
  };
}

const songTimed = [segment('a', '0:00', '0:04'), segment('b', '0:04', '0:10')];

let coordinator: MediaCoordinator | null = null;
const changes: string[] = [];

function Probe() {
  const value = useMediaCoordinator();
  useEffect(() => {
    coordinator = value;
  }, [value]);
  return null;
}

/** Feeds the preview's segment changes back in, as the Suggestions board does. */
function Board({ segments }: { segments: CutawaySegment[] }) {
  const [active, setActive] = useState(segments[0]?.id ?? '');
  return (
    <CutawayPreview
      cutaway={{ id: 'demo', title: 'Demo Cutaway' }}
      segments={segments}
      activeSegmentId={active}
      onActiveSegmentChange={(id) => {
        changes.push(id);
        setActive(id);
      }}
    />
  );
}

function renderBoard(segments = songTimed) {
  return render(
    <MediaSessionProvider>
      <Probe />
      <Board segments={segments} />
    </MediaSessionProvider>,
    { wrapper: MemoryRouter },
  );
}

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  changes.length = 0;
  coordinator = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CutawayPreview on the playback graph', () => {
  it('cuts the board on the segment times while it plays', () => {
    renderBoard();
    expect(screen.getByText('song-timed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    advance(3000);
    expect(changes).toEqual([]);
    advance(1500);
    expect(changes).toEqual(['b']);
    expect(screen.getByText('2 / 2')).toBeTruthy();
    advance(6000); // past the end: it stops
    expect(screen.getByRole('button', { name: 'Play preview' })).toBeTruthy();
  });

  it('plays through the media coordinator, pausing whatever else was playing', () => {
    renderBoard();
    const song = { play: vi.fn(), pause: vi.fn() };
    act(() => coordinator?.activate('song:daisy-bell', song));
    fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    expect(song.pause).toHaveBeenCalled();
    expect(coordinator?.getActiveId()).toBe('cutaway:demo');

    // And something else starting pauses the preview.
    act(() => coordinator?.activate('song:twilight-time', { play: vi.fn(), pause: vi.fn() }));
    expect(screen.getByRole('button', { name: 'Play preview' })).toBeTruthy();
  });

  it('steps to a segment and plays on from there', () => {
    renderBoard();
    fireEvent.click(screen.getByRole('button', { name: 'Next segment' }));
    expect(changes).toEqual(['b']);
    fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    advance(1000);
    expect(screen.getByText('2 / 2')).toBeTruthy();
    expect(changes).toEqual(['b']);
  });

  it('falls back to one-after-another when the times overlap', () => {
    renderBoard([segment('card', '0:00', '0:00'), segment('punch', '0:00', '0:07')]);
    expect(screen.getByText('sequential')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    advance(2600); // the 0 s card dwells 2.5 s
    expect(changes).toEqual(['punch']);
  });

  it('disables Record where the browser cannot record (jsdom has no MediaRecorder)', () => {
    renderBoard();
    const record = screen.getByRole('button', { name: 'Record take' });
    expect(record).toHaveProperty('disabled', true);
    expect(record.getAttribute('title')).toBe('This browser has no MediaRecorder.');
  });
});
