import { describe, expect, it } from 'vitest';

import { pathnameToView } from './paths';

describe('pathnameToView', () => {
  it('maps sequence routes', () => {
    expect(pathnameToView('/sequences')).toBe('sequences');
    expect(pathnameToView('/sequences/lattice-hymn')).toBe('sequences');
  });

  it('keeps cartoons distinct from sequences', () => {
    expect(pathnameToView('/cartoons')).toBe('cartoons');
  });
});
