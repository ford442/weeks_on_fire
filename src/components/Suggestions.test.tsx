import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { schedule } from '../data/schedule';
import { cutawaySuggestions } from '../data/suggestions';
import { buildGuide } from '../lib/schedule';
import { crewPath } from '../routes/paths';
import { rememberedViewLocation } from '../routes/viewSearch';
import { renderApp } from '../test/renderApp';

const guide = buildGuide(schedule, cutawaySuggestions);
const base = crewPath('/suggestions');
const CRT_KEY = 'wof:suggestions-crt';

/** Renders the hub at `path` and waits for the Suggestions view (the station card) to arrive. */
async function open(path: string) {
  renderApp(path);
  await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull(), { timeout: 5000 });
  await screen.findByRole('heading', { level: 2, name: 'EyeWash Station' });
}

const search = () => screen.getByTestId('search').textContent;
const rowIds = () =>
  [...document.querySelectorAll('li[id^="slot-"]')].map((row) => row.id.replace('slot-', ''));
const slotRow = (key: string): HTMLElement => {
  const row = document.getElementById(`slot-${key}`);
  if (!row) throw new Error(`no slot row ${key}`);
  return row;
};
/** Titles of the rows in the schedule: timed slots plus the unscheduled bin. */
const rowTitles = () =>
  new Set(
    [
      ...document.querySelectorAll(
        'li[id^="slot-"] h3, section[aria-labelledby="block-unscheduled"] li h3',
      ),
    ].map((heading) => heading.textContent.trim()),
  );
/** Titles of the cards in the flat list. */
const cardTitles = () =>
  new Set([...document.querySelectorAll('article h2')].map((h) => h.textContent.trim()));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Suggestions as the EyeWash program schedule', () => {
  it('is titled as the program schedule and keeps its Suggestions tab', async () => {
    await open(base);
    expect(screen.getByRole('heading', { level: 1, name: 'Program schedule' })).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Site sections' });
    expect(
      within(nav).getByRole('link', { name: 'Suggestions' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('lists the slots in broadcast order, each with its clock time', async () => {
    await open(base);
    expect(rowIds()).toEqual(guide.slots.map((slot) => slot.key));
    const times = [...document.querySelectorAll('li[id^="slot-"] time')].map((time) =>
      time.getAttribute('datetime'),
    );
    expect(times).toEqual(guide.slots.map((slot) => slot.clock));
  });

  it('groups slots into the station’s programming blocks', async () => {
    await open(base);
    for (const block of schedule.blocks) {
      expect(screen.getByRole('heading', { level: 2, name: block.title })).toBeTruthy();
    }
  });

  it('puts every cutaway on the page: scheduled in a slot, or unscheduled', async () => {
    await open(base);
    const titles = rowTitles();
    for (const cutaway of cutawaySuggestions)
      expect(titles.has(cutaway.title), cutaway.id).toBe(true);
    const unscheduled = screen.getByRole('region', { name: 'Unscheduled' });
    expect(within(unscheduled).getByRole('heading', { name: 'Marble Tick Tack' })).toBeTruthy();
  });
});

describe('now playing', () => {
  it('shows what is on at a pinned time, and what is next', async () => {
    await open(`${base}?at=02:10`);
    const now = screen.getByRole('region', { name: 'Now playing' });
    expect(within(now).getByText('2AM Laundromat Slow Dance')).toBeTruthy();
    expect(within(now).getByText('Tuned to 2:10 AM')).toBeTruthy();
    expect(within(now).getByText(/Up next:/).textContent).toContain('2:20 AM');
    expect(within(now).getByText(/Up next:/).textContent).toContain('The Laundromat Saints');

    const onAir = document.querySelectorAll('[data-on-air="true"]');
    expect(onAir).toHaveLength(1);
    expect(onAir[0]?.id).toBe('slot-rinse-cycle@02:00');
    expect(onAir[0]?.textContent).toContain('On air');
  });

  it('keeps the last slot of the night on air until the day starts again', async () => {
    await open(`${base}?at=05:59`);
    expect(document.querySelector('[data-on-air="true"]')?.id).toBe('slot-test-pattern@05:15');
    expect(screen.getByRole('region', { name: 'Now playing' }).textContent).toContain('Color Whip');
  });

  it('follows the viewer’s clock when nothing is pinned', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 19, 3, 44, 30));
    await open(base);
    const now = screen.getByRole('region', { name: 'Now playing' });
    expect(within(now).getByText('Rinse Cycle')).toBeTruthy();
    expect(within(now).getByText('3:44 AM · your clock')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back to live' })).toBeNull();
  });

  it('tunes to a time, keeps it in the URL, and goes back to live', async () => {
    await open(base);
    const input = screen.getByLabelText<HTMLInputElement>('Tune to');
    fireEvent.change(input, { target: { value: '23:20' } });
    await waitFor(() => expect(search()).toBe('?at=23%3A20'));
    const now = screen.getByRole('region', { name: 'Now playing' });
    expect(within(now).getByText('Closed for Cosmic Reasons')).toBeTruthy();
    expect(within(now).getByText('Tuned to 11:20 PM')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Back to live' }));
    await waitFor(() => expect(search()).toBe(''));
    expect(screen.queryByRole('button', { name: 'Back to live' })).toBeNull();
  });

  it('ignores a malformed ?at= and follows the clock', async () => {
    await open(`${base}?at=25:99`);
    expect(screen.queryByRole('button', { name: 'Back to live' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Now playing' }).textContent).toContain('your clock');
  });

  it('opens the on-air board from the station card', async () => {
    await open(`${base}?at=14:25`);
    const now = screen.getByRole('region', { name: 'Now playing' });
    fireEvent.click(within(now).getByRole('button', { name: 'Open board' }));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(`${base}/911-wrong-shade`),
    );
  });
});

describe('slot badges, ad breaks and episode links', () => {
  it('marks idents, sponsors and reruns', async () => {
    await open(base);
    expect(within(slotRow('sign-on@06:00')).getByText('Ident')).toBeTruthy();
    expect(within(slotRow('continuing-education@10:45')).getByText('Sponsor')).toBeTruthy();
    expect(within(slotRow('continuing-education@10:30')).getByText('Rerun')).toBeTruthy();
    expect(within(slotRow('continuing-education@10:00')).queryByText('Rerun')).toBeNull();
    expect(within(slotRow('sign-off@03:48')).getByText('Rerun')).toBeTruthy();
    expect(within(slotRow('sign-off@03:48')).getByText('Ident')).toBeTruthy();
  });

  it('shows a fake-sponsor ad break right after the slot it follows', async () => {
    await open(base);
    const adBreak = slotRow('community-notice-board@14:22').nextElementSibling;
    expect(adBreak?.getAttribute('data-ad-break')).toBe('brads-bins');
    expect(adBreak?.textContent).toContain('Brad’s Bins');
    expect(adBreak?.textContent).toContain('Every shade of blue. One of them is correct.');
    expect(adBreak?.textContent).toContain('Not affiliated with the HOA.');
    expect(document.querySelectorAll('[data-ad-break]')).toHaveLength(
      guide.slots.filter((slot) => slot.adBreak).length,
    );
  });

  it('keeps the episode link tappable without making a dead zone of its row', async () => {
    await open(base);
    const row = slotRow('community-notice-board@14:22');
    const link = within(row).getByRole('link', { name: 'Ep. 4' });
    // The strip under the title lets taps through to the stretched title button; only the link
    // takes them (jsdom cannot hit-test, so check the classes that guarantee it).
    expect(link.className).toContain('pointer-events-auto');
    expect(link.className).toContain('z-10');
    expect(link.parentElement?.className).toContain('pointer-events-none');
    expect(
      within(row).getByRole('button', { name: /911 for the Wrong Shade of Blue/ }),
    ).toBeTruthy();
  });

  it('links a slot to its episode in the Episode Bible', async () => {
    await open(base);
    const link = within(slotRow('community-notice-board@14:22')).getByRole('link', {
      name: 'Ep. 4',
    });
    expect(link.getAttribute('href')).toBe(crewPath('/episodes/04'));
  });
});

describe('deep links', () => {
  it('/suggestions/marble-tick-tack opens that board', async () => {
    await open(`${base}/marble-tick-tack`);
    expect(screen.getByTestId('location').textContent).toBe(`${base}/marble-tick-tack`);
    const row = screen.getByRole('button', { name: 'Marble Tick Tack', current: true });
    expect(row.closest('section')?.getAttribute('aria-labelledby')).toBe('block-unscheduled');
    // Its prompt board is in the panel: the cutaway's title also heads the segment detail.
    expect(screen.getAllByText('Marble Tick Tack').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Grok Imagine prompt')).toBeTruthy();
  });

  it('opens the board as a bottom sheet on a phone', async () => {
    // The overlay is rendered only while the bottom sheet is open; the close "X" is always there.
    await open(`${base}/marble-tick-tack`);
    expect(screen.getAllByRole('button', { name: 'Close details' })).toHaveLength(2);
  });

  it('leaves the sheet closed on the plain guide', async () => {
    await open(base);
    expect(screen.getAllByRole('button', { name: 'Close details' })).toHaveLength(1);
  });

  it('opens on the on-air board when there is no deep link', async () => {
    await open(`${base}?at=02:10`);
    expect(
      screen.getAllByRole('button', { name: '2AM Laundromat Slow Dance', current: true }),
    ).toHaveLength(1);
  });

  it('opening a row deep-links it and keeps the view, filters and pinned time', async () => {
    await open(`${base}?at=02:10&kind=gag`);
    fireEvent.click(screen.getByRole('button', { name: 'Furnace Season' }));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(`${base}/gag-furnace-season`),
    );
    const params = new URLSearchParams(search());
    expect(params.get('at')).toBe('02:10');
    expect(params.get('kind')).toBe('gag');
  });

  it('forgets the board when its sheet is closed, so the tab does not reopen it', async () => {
    await open(`${base}/marble-tick-tack`);
    expect(rememberedViewLocation('suggestions', 'fallback')).toBe(`${base}/marble-tick-tack`);
    fireEvent.click(screen.getAllByRole('button', { name: 'Close details' })[0]!);
    expect(rememberedViewLocation('suggestions', 'fallback')).toBe(base);
  });
});

describe('filters keep working in both views', () => {
  it('filters the schedule by kind and counts cutaways, not airings', async () => {
    await open(`${base}?kind=gag`);
    const gags = cutawaySuggestions.filter((cutaway) => cutaway.kind === 'gag');
    expect(rowTitles()).toEqual(new Set(gags.map((cutaway) => cutaway.title)));
    expect(
      screen.getByText(`${gags.length} of ${cutawaySuggestions.length} suggestions`),
    ).toBeTruthy();
  });

  it('switches kind with the chips and marks the pressed one', async () => {
    await open(base);
    fireEvent.click(screen.getByRole('button', { name: /^Scenes \(/ }));
    await waitFor(() => expect(search()).toContain('kind=scene'));
    expect(screen.getByRole('button', { name: /^Scenes \(/ }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: /^All \(/ }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('carries the Archive’s ?q= search into the schedule', async () => {
    await open(`${base}?q=gyre`);
    expect(rowTitles()).toEqual(new Set(['The Soft Gyre']));
    expect(screen.getByText(`1 of ${cutawaySuggestions.length} suggestions`)).toBeTruthy();
  });

  it('finds the slot that carries a sponsor’s ad break by the sponsor’s name', async () => {
    await open(`${base}?q=perpetual%20optics`);
    expect(rowTitles()).toEqual(new Set(['Spooky Telephone Poles']));
    expect(document.querySelector('[data-ad-break="perpetual-optics"]')).toBeTruthy();
  });

  it('says so when nothing matches', async () => {
    await open(`${base}?q=zz-no-such-suggestion-zz`);
    expect(screen.getByText('No suggestions match the current filters.')).toBeTruthy();
  });

  it('keeps the flat list one switch away, with the same filters', async () => {
    await open(`${base}?kind=gag`);
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    await waitFor(() => expect(search()).toContain('view=list'));
    expect(screen.getByRole('button', { name: 'List' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('region', { name: 'Now playing' })).toBeNull();
    const gags = cutawaySuggestions.filter((cutaway) => cutaway.kind === 'gag');
    expect(document.querySelectorAll('article')).toHaveLength(gags.length);
    expect(cardTitles().has('Furnace Season')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    await waitFor(() => expect(search()).not.toContain('view='));
    expect(screen.getByRole('region', { name: 'Now playing' })).toBeTruthy();
    expect(search()).toContain('kind=gag');
  });

  it('opens straight into the list from ?view=list, every suggestion in catalog order', async () => {
    await open(`${base}?view=list`);
    expect(document.querySelectorAll('article')).toHaveLength(cutawaySuggestions.length);
    expect(
      screen.getByText(`${cutawaySuggestions.length} of ${cutawaySuggestions.length} suggestions`),
    ).toBeTruthy();
  });

  it('copies prompts from a board reached through the schedule', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await open(`${base}/gag-furnace-season`);
    const copy = screen.getAllByRole('button', { name: /Copy/ })[0]!;
    fireEvent.click(copy);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
  });
});

describe('CRT effect', () => {
  const reduceMotion = () =>
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );

  it('is off by default', async () => {
    await open(base);
    const toggle = screen.getByRole('button', { name: 'CRT off' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('.crt-screen')).toBeNull();
  });

  it('turns on, is remembered for next time, and turns off again', async () => {
    await open(base);
    fireEvent.click(screen.getByRole('button', { name: 'CRT off' }));
    expect(screen.getByRole('button', { name: 'CRT on' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(document.querySelectorAll('.crt-screen').length).toBeGreaterThan(0);
    expect(localStorage.getItem(CRT_KEY)).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'CRT on' }));
    expect(document.querySelector('.crt-screen')).toBeNull();
    expect(localStorage.getItem(CRT_KEY)).toBeNull();
  });

  it('starts on for a viewer who left it on', async () => {
    localStorage.setItem(CRT_KEY, '1');
    await open(base);
    expect(screen.getByRole('button', { name: 'CRT on' })).toBeTruthy();
    expect(document.querySelectorAll('.crt-screen').length).toBeGreaterThan(0);
  });

  it('never applies under reduced motion, even for a viewer who left it on', async () => {
    reduceMotion();
    localStorage.setItem(CRT_KEY, '1');
    await open(base);
    const toggle = screen.getByRole('button', { name: 'CRT off' });
    expect((toggle as HTMLButtonElement).disabled).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('.crt-screen')).toBeNull();
    expect(screen.getByText('Unavailable: reduced motion is on.')).toBeTruthy();
  });

  it('does not use the scanline overlay on the prompt panel or the filters', async () => {
    localStorage.setItem(CRT_KEY, '1');
    await open(`${base}/marble-tick-tack`);
    const search = screen.getByPlaceholderText('Search titles, songs, tags...');
    expect(search.closest('.crt-screen')).toBeNull();
    expect(screen.getByText('Grok Imagine prompt').closest('.crt-screen')).toBeNull();
  });
});
