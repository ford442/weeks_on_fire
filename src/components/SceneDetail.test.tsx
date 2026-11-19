import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import MediaSessionProvider from '../contexts/MediaSessionProvider';

import SceneDetail from './SceneDetail';

import type { SceneBoard } from '../data/sceneBoards';

function renderBoard(board: SceneBoard) {
  return render(
    <MemoryRouter>
      <MediaSessionProvider>
        <SceneDetail board={board} />
      </MediaSessionProvider>
    </MemoryRouter>,
  );
}

/** A scene with none of Daisy Bell's specifics: one look, no song, no extras, no cut yet. */
const plain: SceneBoard = {
  id: 'plain-scene',
  title: 'Plain Scene',
  status: 'suggested',
  pitch: 'A single look, shot once.',
  locks: [],
  treatments: [],
  beats: [],
  frames: [
    {
      id: 'f1',
      order: 1,
      title: 'Only frame',
      beat: 'Opening',
      description: 'The one frame.',
      prompt: 'A kettle on a stove.',
      tags: ['kettle'],
    },
  ],
  videos: [],
};

describe('SceneDetail template', () => {
  it('renders a board with no treatments, extras, song or video without Daisy Bell content', () => {
    renderBoard(plain);

    expect(screen.getByRole('heading', { level: 2, name: 'Plain Scene' })).toBeTruthy();
    expect(screen.getByText('Suggested')).toBeTruthy();
    expect(screen.getByText('1 keyframe')).toBeTruthy();
    expect(screen.getByText('A kettle on a stove.')).toBeTruthy();
    expect(screen.getByText('No song is linked to this scene.')).toBeTruthy();
    expect(screen.getByText(/No cut of this scene is linked yet/)).toBeTruthy();

    // Sections the board does not use are left out rather than rendered empty.
    expect(screen.queryByText('Core sequence')).toBeNull();
    expect(screen.queryByText(/Prompt lock blocks/)).toBeNull();
    expect(screen.queryByRole('group', { name: 'Filter by treatment' })).toBeNull();
    expect(screen.queryByText(/Fleet Street/)).toBeNull();
    expect(screen.queryByText('Strange sights on the ride')).toBeNull();
  });

  it('takes its labels, filter and extras heading from the board', () => {
    renderBoard({
      ...plain,
      id: 'two-look',
      title: 'Two Look',
      format: 'Gag',
      cast: 'Kenji',
      treatments: [
        { id: 'warm', label: 'Warm tungsten', short: 'Warm', tone: 'amber', description: 'Amber.' },
        { id: 'cool', label: 'Cool fluorescent', short: 'Cool', tone: 'sky', description: 'Blue.' },
      ],
      frames: [
        { ...plain.frames[0]!, id: 'w', title: 'Warm one', treatment: 'warm' },
        { ...plain.frames[0]!, id: 'c', title: 'Cool one', treatment: 'cool', order: 2 },
      ],
      extras: {
        heading: 'Things on the shelf',
        items: [{ id: 'x', cue: 'tick', title: 'A clock', description: 'It is wrong.' }],
      },
    });

    expect(screen.getByText('Gag · Kenji')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Filter by treatment' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Warm' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cool' })).toBeTruthy();
    expect(screen.getByText('1 Warm')).toBeTruthy();
    expect(screen.getByText('Things on the shelf')).toBeTruthy();
    expect(screen.getByText('“tick”')).toBeTruthy();
  });
});
