import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { crewPath } from '../routes/paths';
import { renderApp } from '../test/renderApp';

import type * as GraphModule from '../data/generated/catalog-graph';

// No cartoon has been promoted in the real catalog yet. Codegen only emits a promotion edge when
// both records agree (see validateCatalogLinks), so this adds the edge it would emit for one.
vi.mock('../data/generated/catalog-graph', async (importOriginal) => {
  const actual = await importOriginal<typeof GraphModule>();
  return {
    ...actual,
    catalogGraph: {
      nodes: actual.catalogGraph.nodes,
      edges: [
        ...actual.catalogGraph.edges,
        { from: 'cartoon:hold-music', to: 'cutaway:mv-call-forty-seven', rel: 'promotion' },
      ],
    },
  };
});

async function settled() {
  await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull(), { timeout: 5000 });
}

describe('cartoon → cutaway promotion', () => {
  it('links the cartoon to its Suggestions board and the board back to the cartoon', async () => {
    renderApp(crewPath('/cartoons/hold-music'));
    await settled();

    const cartoonLinks = await screen.findByRole('region', { name: 'Links' });
    const promotedTo = within(cartoonLinks).getByRole('list', { name: 'Promoted to Suggestions' });
    const toBoard = within(promotedTo).getByRole('link', { name: 'Call Forty-Seven' });
    expect(toBoard.getAttribute('href')).toBe(crewPath('/suggestions/mv-call-forty-seven'));

    fireEvent.click(toBoard);
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        crewPath('/suggestions/mv-call-forty-seven'),
      ),
    );
    await settled();

    const boardLinks = await screen.findByRole('region', { name: 'Call Forty-Seven — links' });
    const promotedFrom = within(boardLinks).getByRole('list', { name: 'Promoted from cartoon' });
    expect(
      within(promotedFrom).getByRole('link', { name: 'Hold Music' }).getAttribute('href'),
    ).toBe(crewPath('/cartoons/hold-music'));
  });
});
