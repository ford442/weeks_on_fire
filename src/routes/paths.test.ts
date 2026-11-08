import { describe, expect, it } from 'vitest';

import { pathnameToView } from './paths';

describe('pathnameToView', () => {
  it('maps sequence routes', () => {
    expect(pathnameToView('/show/sequences')).toBe('sequences');
    expect(pathnameToView('/show/sequences/lattice-hymn')).toBe('sequences');
  });

  it('keeps cartoons distinct from sequences', () => {
    expect(pathnameToView('/show/cartoons')).toBe('cartoons');
  });
});
