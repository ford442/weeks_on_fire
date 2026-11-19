import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { about } from '../data/about';
import { episodes } from '../data/episodes';
import { whatsNew } from '../data/generated/whats-new';
import { formatSongDate } from '../lib/songDate';
import { crewPath } from '../routes/paths';

import Overview from './Overview';

function renderOverview() {
  return render(
    <MemoryRouter initialEntries={[crewPath('/')]}>
      <Overview />
    </MemoryRouter>,
  );
}

describe('Overview', () => {
  it('introduces the show: logline, synopsis, tone, format, disclosure', () => {
    renderOverview();
    expect(screen.getByRole('heading', { level: 2, name: about.logline })).toBeTruthy();
    for (const paragraph of about.synopsis) expect(screen.getByText(paragraph)).toBeTruthy();
    const aside = screen.getByRole('complementary', { name: 'Tone and format' });
    expect(within(aside).getByText(about.tone.line)).toBeTruthy();
    for (const item of about.format) expect(within(aside).getByText(item.value)).toBeTruthy();
    expect(screen.getByText(about.disclosure)).toBeTruthy();
  });

  it('lists every announced episode with its status, and leaves out candidates', () => {
    renderOverview();
    const announced = episodes.filter((episode) => !episode.isCandidate);
    expect(announced.length).toBeGreaterThanOrEqual(4);
    const section = screen.getByRole('heading', { level: 2, name: 'Episodes' }).closest('section')!;
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(announced.length);

    for (const episode of announced) {
      const link = within(section).getByRole('link', {
        name: new RegExp(`Episode ${episode.number}\\b`),
      });
      expect(link.getAttribute('href')).toBe(crewPath(`/episodes/${episode.id}`));
      expect(within(link).getByText(episode.logline)).toBeTruthy();
    }
    for (const episode of episodes.filter((e) => e.isCandidate)) {
      expect(within(section).queryByText(episode.title)).toBeNull();
    }
  });

  it('links to the cast, the crew, and the Visual Archive', () => {
    renderOverview();
    expect(screen.getByRole('link', { name: /Meet the cast/ }).getAttribute('href')).toBe(
      crewPath('/characters'),
    );
    expect(screen.getByRole('link', { name: /Meet the crew/ }).getAttribute('href')).toBe(
      crewPath('/crew'),
    );
    expect(screen.getByRole('link', { name: /Open the Visual Archive/ }).getAttribute('href')).toBe(
      crewPath('/archive'),
    );
  });

  it("shows What's new newest first, each card with a date and a link", () => {
    renderOverview();
    const strip = screen.getByRole('list', { name: 'Latest additions, newest first' });
    const cards = within(strip).getAllByRole('listitem');
    expect(cards).toHaveLength(whatsNew.length);

    const first = whatsNew[0]!;
    const firstCard = cards[0]!;
    expect(within(firstCard).getByText(first.title)).toBeTruthy();
    expect(within(firstCard).getByText(formatSongDate(first.added))).toBeTruthy();
    expect(within(firstCard).getByRole('link').getAttribute('href')).toMatch(/^\/show\//);
  });
});
