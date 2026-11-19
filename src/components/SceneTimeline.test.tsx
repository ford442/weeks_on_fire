import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import episode04Json from '../../episodes/episode-04/scenes.json';
import { AVAILABLE_EPISODES } from '../data/production';
import { EpisodeProductionSchema } from '../schemas/production';
import { renderApp } from '../test/renderApp';

import SceneEditorModal from './SceneEditorModal';
import SceneTimeline from './SceneTimeline';

import type { EpisodeProduction, ProductionScene } from '../data/production';

// jsdom has no WebGL; the sequence player falls back to its "unsupported" message.
vi.mock('../lib/webgl/context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/webgl/context')>()),
  createSequenceGl: () => null,
}));

const SEEDED_LINK = 'Cutaway: 911 for the Wrong Shade of Blue';

function episode04(): EpisodeProduction {
  return EpisodeProductionSchema.parse(episode04Json);
}

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function renderTimeline(production: EpisodeProduction, editMode = false) {
  return render(
    <MemoryRouter initialEntries={['/show/timeline']}>
      <SceneTimeline
        production={production}
        episodeId="04"
        availableEpisodes={AVAILABLE_EPISODES}
        onEpisodeChange={() => undefined}
        syncStatus="synced"
        isLoading={false}
        onEditScene={() => undefined}
        onAddScene={() => undefined}
        onExport={() => undefined}
        editMode={editMode}
      />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Timeline catalog links', () => {
  it('follows the seeded Episode 04 deep link all the way to the cutaway', async () => {
    renderApp('/show/timeline');

    const episodeSelect = await screen.findByDisplayValue('Episode 01', {}, { timeout: 5000 });
    await userEvent.selectOptions(episodeSelect, '04');

    const link = await screen.findByRole('link', { name: SEEDED_LINK }, { timeout: 5000 });
    expect(link.getAttribute('href')).toBe('/show/suggestions/911-wrong-shade');

    await userEvent.click(link);
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/show/suggestions/911-wrong-shade'),
    );
    expect(
      await screen.findAllByRole('heading', { name: /911 for the Wrong Shade of Blue/ }),
    ).not.toHaveLength(0);
  });

  it('shows links only on the scene that sets a ref', () => {
    renderTimeline(episode04());

    const lists = screen.getAllByRole('list', { name: 'Catalog links' });
    expect(lists).toHaveLength(1);
    expect(within(lists[0]!).getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: SEEDED_LINK })).toBeTruthy();
  });

  it('renders every ref kind and flags ids the catalog no longer has instead of linking them', () => {
    const production = episode04();
    const [scene] = production.scenes;
    if (!scene) throw new Error('fixture needs a scene');
    renderTimeline({
      ...production,
      scenes: [
        {
          ...scene,
          songId: 'call-forty-seven',
          sequenceId: 'lattice-hymn',
          cartoonId: 'cereal-wolf',
          characterIds: ['lillith', 'removed-character'],
        },
      ],
    });

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual([
      '/show/songs/call-forty-seven',
      '/show/sequences/lattice-hymn',
      '/show/cartoons/cereal-wolf',
      '/show/characters/lillith',
    ]);
    expect(screen.getByText(/removed-character \(not in catalog\)/)).toBeTruthy();
  });

  it('shows the links outside edit mode too', () => {
    renderTimeline(episode04(), false);
    expect(screen.getByRole('link', { name: SEEDED_LINK })).toBeTruthy();
  });
});

describe('SceneEditorModal catalog picker', () => {
  function scene(extra: Partial<ProductionScene> = {}): ProductionScene {
    return {
      id: 'scene-009',
      order: 9,
      title: 'My own scene title',
      timestamp: '00:00:09',
      description: 'A beat.',
      status: 'suggested',
      addedAt: '2026-01-01T00:00:00Z',
      lastEditedAt: '2026-01-01T00:00:00Z',
      history: [],
      ...extra,
    };
  }

  function openEditor(initial: ProductionScene) {
    const onSave = vi.fn<(updated: ProductionScene) => void>();
    render(
      <MemoryRouter>
        <SceneEditorModal scene={initial} onClose={() => undefined} onSave={onSave} />
      </MemoryRouter>,
    );
    return onSave;
  }

  function saved(onSave: ReturnType<typeof openEditor>): ProductionScene {
    expect(onSave).toHaveBeenCalledTimes(1);
    const [updated] = onSave.mock.calls[0] ?? [];
    if (!updated) throw new Error('onSave was not called with a scene');
    return updated;
  }

  it('writes ids, not titles, and leaves the scene title alone', async () => {
    const onSave = openEditor(scene());

    await userEvent.selectOptions(screen.getByLabelText('Song'), 'Call Forty-Seven');
    await userEvent.selectOptions(
      screen.getByLabelText('Cutaway'),
      '911 for the Wrong Shade of Blue',
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Lillith Vale' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Rubella Vale' }));
    await userEvent.click(screen.getByRole('button', { name: /Save & append history/ }));

    const updated = saved(onSave);
    expect(updated).toMatchObject({
      title: 'My own scene title',
      songId: 'call-forty-seven',
      cutawayId: '911-wrong-shade',
      characterIds: ['lillith', 'rubella'],
    });
    expect(updated).not.toHaveProperty('sequenceId');
    expect(updated).not.toHaveProperty('cartoonId');
    expect(updated.history.at(-1)).toMatchObject({ action: 'edited' });
  });

  it('removes the keys when refs are cleared, instead of saving blanks', async () => {
    const onSave = openEditor(
      scene({
        songId: 'call-forty-seven',
        cutawayId: '911-wrong-shade',
        characterIds: ['lillith'],
      }),
    );

    await userEvent.selectOptions(screen.getByLabelText('Song'), '— none —');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Lillith Vale' }));
    await userEvent.click(screen.getByRole('button', { name: /Save & append history/ }));

    const updated = saved(onSave);
    expect(updated.cutawayId).toBe('911-wrong-shade');
    expect(updated).not.toHaveProperty('songId');
    expect(updated).not.toHaveProperty('characterIds');
  });

  it('shows a link preview that opens in a new tab so unsaved edits survive', () => {
    openEditor(scene({ cutawayId: '911-wrong-shade' }));

    const link = screen.getByRole('link', { name: SEEDED_LINK });
    expect(link.getAttribute('href')).toBe('/show/suggestions/911-wrong-shade');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('keeps an id the catalog no longer has until the user changes it', async () => {
    const onSave = openEditor(scene({ songId: 'removed-song' }));

    const song = screen.getByLabelText('Song');
    expect((song as HTMLSelectElement).value).toBe('removed-song');
    expect(
      within(song).getByRole('option', { name: 'removed-song (not in catalog)' }),
    ).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /Save & append history/ }));
    expect(saved(onSave).songId).toBe('removed-song');
  });

  it('counts a ref change as an edit even when no other field moved', async () => {
    const onSave = openEditor(scene());

    fireEvent.change(screen.getByLabelText('Cartoon'), { target: { value: 'cereal-wolf' } });
    await userEvent.click(screen.getByRole('button', { name: /Save & append history/ }));

    const updated = saved(onSave);
    expect(updated.cartoonId).toBe('cereal-wolf');
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0]).toMatchObject({ action: 'edited', note: 'Updated via editor' });
  });

  it('does not touch history when nothing changed', async () => {
    const onSave = openEditor(scene({ cutawayId: '911-wrong-shade' }));
    await userEvent.click(screen.getByRole('button', { name: /Save & append history/ }));
    expect(saved(onSave).history).toHaveLength(0);
  });
});
