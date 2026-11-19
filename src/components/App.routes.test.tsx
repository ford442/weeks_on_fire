import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import App from '../App';
import { crewPath } from '../routes/paths';
import MediaSessionProvider from '../contexts/MediaSessionProvider';
import { about } from '../data/about';
import { cartoons } from '../data/cartoons';
import { seriesCharacters } from '../data/characters';
import { episodes } from '../data/episodes';
import { filmScenes } from '../data/films';
import { sceneBoards } from '../data/sceneBoards';
import { sequences } from '../data/sequences';
import { songs } from '../data/songs';
import { crewMembers } from '../data/crew';
import { cutawaySuggestions } from '../data/suggestions';

// jsdom has no WebGL; the sequence player falls back to its "unsupported" message.
vi.mock('../lib/webgl/context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/webgl/context')>()),
  createSequenceGl: () => null,
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <>
      <output data-testid="location">{location.pathname}</output>
      <output data-testid="search">{location.search}</output>
    </>
  );
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
  it('/show (Overview)', async () => {
    renderRoute('/show');
    await settled();
    expect(await screen.findByRole('heading', { level: 1, name: 'About the show' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: about.logline })).toBeTruthy();
  });

  it('/show?theme=… still opens the archive, filters intact', async () => {
    renderRoute('/show?q=zz-no-such-still-zz');
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(crewPath('/archive')),
    );
    await settled();
    expect(screen.getByPlaceholderText<HTMLInputElement>(/Search/).value).toBe(
      'zz-no-such-still-zz',
    );
  });

  it('/show/finalized lists every Approved or Final song', async () => {
    renderRoute(crewPath('/finalized'));
    await settled();
    expect(await screen.findByRole('heading', { level: 1, name: 'Finalized' })).toBeTruthy();
    const finished = songs.filter((song) => song.status === 'final' || song.status === 'approved');
    for (const song of finished) {
      expect(
        screen
          .getAllByRole('link', { name: song.title })
          .some((link) => link.getAttribute('href') === crewPath(`/songs/${song.id}`)),
      ).toBe(true);
    }
  });

  it('/show/archive (Gallery)', async () => {
    renderRoute(crewPath('/archive'));
    await expectHeadingFrom(filmScenes.map((scene) => scene.title));
  });

  it('/ is the public site', async () => {
    renderRoute('/');
    expect(await screen.findByRole('heading', { name: 'Weeks of Fire' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Public site' })).toBeTruthy();
  });

  it('/timeline', async () => {
    window.localStorage.setItem('wof:edit-mode', '1');
    renderRoute(crewPath('/timeline'));
    await settled();
    expect(await screen.findByRole('button', { name: /Export to clip_stacker/ })).toBeTruthy();
    window.localStorage.removeItem('wof:edit-mode');
  });

  it('/songs', async () => {
    renderRoute(crewPath('/songs'));
    await expectHeadingFrom(songs.map((song) => song.title));
  });

  it('/scenes lists every scene board, each linking to its own page', async () => {
    renderRoute(crewPath('/scenes'));
    await settled();
    expect(await screen.findByRole('heading', { level: 1, name: 'Scenes' })).toBeTruthy();
    for (const board of sceneBoards) {
      const card = screen.getByRole('link', { name: new RegExp(board.title) });
      expect(card.getAttribute('href')).toBe(crewPath(`/scenes/${board.id}`));
    }
  });

  it('/scenes/daisy-bell renders the shared scene template', async () => {
    const board = sceneBoards.find((entry) => entry.id === 'daisy-bell');
    if (!board) throw new Error('daisy-bell scene board is missing');
    const { container } = renderRoute(crewPath('/scenes/daisy-bell'));
    await settled();

    expect(await screen.findByRole('heading', { level: 2, name: board.title })).toBeTruthy();
    expect(screen.getByText(`${board.frames.length} keyframes`)).toBeTruthy();
    expect(screen.getByRole('link', { name: /All scenes/ }).getAttribute('href')).toBe(
      crewPath('/scenes'),
    );
    // The scene's slideshow plays in the page, with the hub-wide status badge beside it.
    const slideshow = board.videos[0];
    expect(container.querySelector('video')?.getAttribute('src')).toBe(slideshow?.url);
    expect(screen.getAllByText('Generated').length).toBeGreaterThanOrEqual(2);
    // Treatments, locks and extras come from the board, not the template.
    expect(screen.getByRole('button', { name: 'Period' })).toBeTruthy();
    expect(screen.getByText(board.locks[0]?.label ?? '')).toBeTruthy();
    expect(screen.getByText(board.extras?.heading ?? '')).toBeTruthy();
  });

  it('filters the keyframe board by treatment from the URL', async () => {
    renderRoute(`${crewPath('/scenes/daisy-bell')}?treatment=period`);
    await settled();
    expect(
      (await screen.findByRole('button', { name: 'Period' })).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getByRole('button', { name: 'Color' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it.each(['/daisy-bell', '/show/daisy-bell', '/show/daisy-bell/'])(
    '%s (the old Daisy Bell tab) redirects to its scene page',
    async (legacy) => {
      renderRoute(`${legacy}?treatment=period`);
      await waitFor(() =>
        expect(screen.getByTestId('location').textContent).toBe(crewPath('/scenes/daisy-bell')),
      );
      expect(screen.getByTestId('search').textContent).toBe('?treatment=period');
      await settled();
      expect(await screen.findByRole('heading', { level: 2, name: 'Daisy Bell' })).toBeTruthy();
    },
  );

  it('/video collects clips and slideshows with their status', async () => {
    renderRoute(crewPath('/video'));
    await settled();
    expect(await screen.findByRole('heading', { level: 1, name: 'Video' })).toBeTruthy();
    // Scene slideshow + Timeline clips (episode 01 has generated and in-edit scenes).
    expect(await screen.findByRole('link', { name: 'Daisy Bell — Timed slideshow' })).toBeTruthy();
    expect(await screen.findByRole('link', { name: /Final Flames/ })).toBeTruthy();
    expect(screen.getByText('In edit')).toBeTruthy();
  });

  it('/video?source= narrows by source and ?status= by stage', async () => {
    renderRoute(`${crewPath('/video')}?source=scene`);
    await settled();
    expect(await screen.findByRole('link', { name: 'Daisy Bell — Timed slideshow' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Final Flames/ })).toBeNull();
  });

  it('/video says so when nothing matches', async () => {
    renderRoute(`${crewPath('/video')}?status=final`);
    await settled();
    expect(await screen.findByText('No video matches the current filters.')).toBeTruthy();
  });

  it('/suggestions', async () => {
    renderRoute(crewPath('/suggestions'));
    await expectHeadingFrom(cutawaySuggestions.map((cutaway) => cutaway.title));
  });

  it('/cartoons', async () => {
    renderRoute(crewPath('/cartoons'));
    await expectHeadingFrom(cartoons.map((cartoon) => cartoon.title));
  });

  it('/sequences', async () => {
    renderRoute(crewPath('/sequences'));
    await expectHeadingFrom(sequences.map((sequence) => sequence.title));
  });

  it('/characters', async () => {
    renderRoute(crewPath('/characters'));
    await expectHeadingFrom(seriesCharacters.map((character) => character.name));
  });

  it('/episodes', async () => {
    renderRoute(crewPath('/episodes'));
    await expectHeadingFrom(episodes.map((episode) => episode.title));
  });

  it('/crew', async () => {
    renderRoute(crewPath('/crew'));
    await expectHeadingFrom(crewMembers.map((member) => member.name));
  });

  it.each(['/staff', '/show/staff'])('%s redirects to the Crew view', async (legacy) => {
    renderRoute(legacy);
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/show/crew'));
    await expectHeadingFrom(crewMembers.map((member) => member.name));
  });
});

describe('App detail routes keep their id', () => {
  const details = [
    [crewPath('/songs'), () => first(songs).id],
    [crewPath('/suggestions'), () => first(cutawaySuggestions).id],
    [crewPath('/scenes'), () => first(sceneBoards).id],
    [crewPath('/cartoons'), () => first(cartoons).id],
    [crewPath('/sequences'), () => first(sequences).id],
    [crewPath('/episodes'), () => first(episodes).id],
  ] as const;

  it.each(details)('%s/:id', async (base, pickId) => {
    const path = `${base}/${pickId()}`;
    renderRoute(path);
    await settled();
    expect((await screen.findAllByRole('heading')).length).toBeGreaterThan(0);
    expect(screen.getByTestId('location').textContent).toBe(path);
  });

  it.each([
    crewPath('/cartoons'),
    crewPath('/sequences'),
    crewPath('/songs'),
    crewPath('/suggestions'),
    crewPath('/scenes'),
    crewPath('/episodes'),
  ])('%s/:id redirects an unknown id to the list', async (base) => {
    renderRoute(`${base}/no-such-id`);
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe(base));
  });

  it('unknown paths redirect to the public home', async () => {
    renderRoute('/no/such/page');
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'));
    expect(screen.getByRole('navigation', { name: 'Public site' })).toBeTruthy();
  });
});

describe('archive and Suggestions share one source', () => {
  it('has no Suggestion lane of its own, only a link into Suggestions with its full count', async () => {
    renderRoute(crewPath('/archive'));
    await settled();
    expect(await screen.findByRole('button', { name: /^Scene \(/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Suggestion/ })).toBeNull();
    const link = screen.getByRole('link', {
      name: new RegExp(`^Suggestions \\(${cutawaySuggestions.length}\\)`),
    });
    expect(link.getAttribute('href')).toBe(crewPath('/suggestions'));
  });

  it('carries a typed archive search into Suggestions', async () => {
    renderRoute(`${crewPath('/archive')}?q=gyre`);
    await settled();
    const link = await screen.findByRole('link', { name: /^Suggestions \(/ });
    expect(link.getAttribute('href')).toBe(`${crewPath('/suggestions')}?q=gyre`);
  });

  it('no longer lists cutaway shots as archive items', () => {
    expect(filmScenes.some((scene) => scene.tags.includes('suggestion'))).toBe(false);
    expect(filmScenes.some((scene) => scene.id.startsWith('suggestion-'))).toBe(false);
  });
});

describe('site sections', () => {
  it('lists Scenes and Video, and no longer a Daisy Bell tab', async () => {
    renderRoute('/show');
    await settled();
    const nav = await screen.findByRole('navigation', { name: 'Site sections' });
    // Tabs reopen a view where the visitor left it, so earlier tests may have added a query.
    const hrefOf = (name: string) => within(nav).getByRole('link', { name }).getAttribute('href');
    expect(hrefOf('Scenes')).toMatch(new RegExp(`^${crewPath('/scenes')}(\\?|$)`));
    expect(hrefOf('Video')).toMatch(new RegExp(`^${crewPath('/video')}(\\?|$)`));
    expect(within(nav).queryByRole('link', { name: 'Daisy Bell' })).toBeNull();
  });
});

describe('filters live in the URL', () => {
  it('restores the Songs search from ?q=', async () => {
    renderRoute(`${crewPath('/songs')}?q=zz-no-such-song-zz`);
    await settled();
    expect(await screen.findByText('No songs match the current filters.')).toBeTruthy();
    expect(screen.getByPlaceholderText<HTMLInputElement>(/Search songs/).value).toBe(
      'zz-no-such-song-zz',
    );
  });

  it('tabs return to the filters a visitor left behind', async () => {
    renderRoute(`${crewPath('/songs')}?q=waltz`);
    await settled();
    fireEvent.click(screen.getByRole('link', { name: 'Suggestions' }));
    await settled();
    expect(screen.getByRole('link', { name: 'Songs' }).getAttribute('href')).toBe(
      `${crewPath('/songs')}?q=waltz`,
    );
  });
});

describe('site search', () => {
  it('opens with / and jumps to a result', async () => {
    renderRoute('/show');
    await settled();
    fireEvent.keyDown(document.body, { key: '/' });
    const input = await screen.findByRole('combobox', {
      name: /Search songs, scenes, suggestions/,
    });
    const song = first(songs);
    fireEvent.change(input, { target: { value: song.title } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(crewPath(`/songs/${song.id}`)),
    );
  });
});

describe('public site', () => {
  it('/lace-waterfall renders the band page', async () => {
    renderRoute('/lace-waterfall');
    expect(await screen.findByRole('heading', { level: 1, name: 'Lace Waterfall' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lillith' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Rubella' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Public site' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Site sections' })).toBeNull();
  });

  it('/listen renders the public player without crew tabs', async () => {
    renderRoute('/listen');
    expect(await screen.findByRole('navigation', { name: 'Public site' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Site sections' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Crew hub →' }).getAttribute('href')).toBe('/show');
    expect(screen.queryByRole('link', { name: 'Weeks on Fire' })).toBeNull();
  });

  it('links from the public home to the music index and both projects', async () => {
    renderRoute('/');
    const nav = await screen.findByRole('navigation', { name: 'Public site' });
    expect(screen.getByRole('link', { name: /^Night Side/ }).getAttribute('href')).toBe(
      '/albums/night-side',
    );
    fireEvent.click(within(nav).getByRole('link', { name: 'Music' }));
    expect(await screen.findByRole('heading', { name: 'Music projects' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /^Lace Waterfall/ }).getAttribute('href')).toBe(
      '/albums/lace-waterfall',
    );
  });

  it.each([
    ['night-side', 'Night Side', 'G Train Fluorescent', 'Heavy Water'],
    ['lace-waterfall', 'Lace Waterfall', 'Heavy Water', 'G Train Fluorescent'],
  ])(
    'shows only the %s project tracks and lets visitors select an upcoming track',
    async (albumId, title, track, unrelatedTrack) => {
      renderRoute(`/albums/${albumId}?track=daisy-bell`);
      expect(await screen.findByRole('heading', { name: title, level: 1 })).toBeTruthy();
      expect(screen.queryByRole('link', { name: new RegExp(unrelatedTrack) })).toBeNull();
      expect(screen.getByRole('heading', { name: 'Audio coming soon' })).toBeTruthy();

      const link = screen.getByRole('link', { name: new RegExp(track) });
      expect(link.getAttribute('href')).toMatch(new RegExp(`^/albums/${albumId}\\?track=`));
      fireEvent.click(link);
      const player = screen.getByRole('region', { name: 'Now playing' });
      expect(await within(player).findByRole('heading', { name: track })).toBeTruthy();
      expect(within(player).getByText('Audio coming soon')).toBeTruthy();
      expect(within(player).queryByRole('button', { name: /^Play / })).toBeNull();
    },
  );

  it('moves a bare creator URL under /show', async () => {
    renderRoute('/songs');
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/show/songs'));
  });

  it('moves the old public listen URL out of /show', async () => {
    renderRoute('/show/listen/some-song');
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/listen/some-song'),
    );
  });
});
