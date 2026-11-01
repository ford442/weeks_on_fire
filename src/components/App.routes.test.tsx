import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import App from '../App';
import MediaSessionProvider from '../contexts/MediaSessionProvider';
import { cartoons } from '../data/cartoons';
import { seriesCharacters } from '../data/characters';
import { episodes } from '../data/episodes';
import { filmScenes } from '../data/films';
import { sequences } from '../data/sequences';
import { songs } from '../data/songs';
import { staffMembers } from '../data/staff';
import { cutawaySuggestions } from '../data/suggestions';

// jsdom has no WebGL; the sequence player falls back to its "unsupported" message.
vi.mock('../lib/webgl/context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/webgl/context')>()),
  createSequenceGl: () => null,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MediaSessionProvider>
        <App />
        <LocationProbe />
      </MediaSessionProvider>
    </MemoryRouter>,
  );
}

async function settled() {
  await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull(), { timeout: 5000 });
}

/** Waits for the lazy route, then expects a heading whose text is one of `titles`. */
async function expectHeadingFrom(titles: readonly string[]) {
  await settled();
  const wanted = new Set(titles.map((title) => title.trim()));
  const headings = await screen.findAllByRole('heading');
  expect(headings.some((heading) => wanted.has(heading.textContent.trim()))).toBe(true);
}

function first<T>(items: readonly T[]): T {
  const item = items[0];
  if (item === undefined) throw new Error('catalog fixture is empty');
  return item;
}

describe('App lazy routes render', () => {
  it('/ (Gallery)', async () => {
    renderRoute('/');
    await expectHeadingFrom(filmScenes.map((scene) => scene.title));
  });

  it('/index.html (Gallery alias)', async () => {
    renderRoute('/index.html');
    await expectHeadingFrom(filmScenes.map((scene) => scene.title));
  });

  it('/timeline', async () => {
    renderRoute('/timeline');
    await settled();
    expect(await screen.findByRole('button', { name: /Export to clip_stacker/ })).toBeTruthy();
  });

  it('/songs', async () => {
    renderRoute('/songs');
    await expectHeadingFrom(songs.map((song) => song.title));
  });

  it('/daisy-bell', async () => {
    renderRoute('/daisy-bell');
    await expectHeadingFrom(['Daisy Bell']);
  });

  it('/suggestions', async () => {
    renderRoute('/suggestions');
    await expectHeadingFrom(cutawaySuggestions.map((cutaway) => cutaway.title));
  });

  it('/cartoons', async () => {
    renderRoute('/cartoons');
    await expectHeadingFrom(cartoons.map((cartoon) => cartoon.title));
  });

  it('/sequences', async () => {
    renderRoute('/sequences');
    await expectHeadingFrom(sequences.map((sequence) => sequence.title));
  });

  it('/characters', async () => {
    renderRoute('/characters');
    await expectHeadingFrom(seriesCharacters.map((character) => character.name));
  });

  it('/episodes', async () => {
    renderRoute('/episodes');
    await expectHeadingFrom(episodes.map((episode) => episode.title));
  });

  it('/staff', async () => {
    renderRoute('/staff');
    await expectHeadingFrom(staffMembers.map((member) => member.name));
  });
});

describe('App detail routes keep their id', () => {
  const details = [
    ['/songs', () => first(songs).id],
    ['/suggestions', () => first(cutawaySuggestions).id],
    ['/cartoons', () => first(cartoons).id],
    ['/sequences', () => first(sequences).id],
    ['/episodes', () => first(episodes).id],
  ] as const;

  it.each(details)('%s/:id', async (base, pickId) => {
    const path = `${base}/${pickId()}`;
    renderRoute(path);
    await settled();
    expect((await screen.findAllByRole('heading')).length).toBeGreaterThan(0);
    expect(screen.getByTestId('location').textContent).toBe(path);
  });

  it.each(['/cartoons', '/sequences', '/songs', '/suggestions', '/episodes'])(
    '%s/:id redirects an unknown id to the list',
    async (base) => {
      renderRoute(`${base}/no-such-id`);
      await waitFor(() => expect(screen.getByTestId('location').textContent).toBe(base));
    },
  );

  it('unknown paths redirect to the gallery', async () => {
    renderRoute('/no/such/page');
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'));
  });
});

describe('filters live in the URL', () => {
  it('restores the Songs search from ?q=', async () => {
    renderRoute('/songs?q=zz-no-such-song-zz');
    await settled();
    expect(await screen.findByText('No songs match the current filters.')).toBeTruthy();
    expect(screen.getByPlaceholderText<HTMLInputElement>(/Search songs/).value).toBe(
      'zz-no-such-song-zz',
    );
  });

  it('tabs return to the filters a visitor left behind', async () => {
    renderRoute('/songs?q=waltz');
    await settled();
    fireEvent.click(screen.getByRole('link', { name: 'Suggestions' }));
    await settled();
    expect(screen.getByRole('link', { name: 'Songs' }).getAttribute('href')).toBe('/songs?q=waltz');
  });
});

describe('site search', () => {
  it('opens with / and jumps to a result', async () => {
    renderRoute('/');
    await settled();
    fireEvent.keyDown(document.body, { key: '/' });
    const input = await screen.findByRole('combobox', { name: /Search songs, suggestions/ });
    const song = first(songs);
    fireEvent.change(input, { target: { value: song.title } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(`/songs/${song.id}`),
    );
  });
});
