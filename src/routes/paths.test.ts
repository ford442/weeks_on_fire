import { describe, expect, it } from 'vitest';

import { crewPath, isLegacyArchiveLink, pathnameToView, viewPaths } from './paths';

describe('pathnameToView', () => {
  it('maps sequence routes', () => {
    expect(pathnameToView('/show/sequences')).toBe('sequences');
    expect(pathnameToView('/show/sequences/lattice-hymn')).toBe('sequences');
  });

  it('keeps cartoons distinct from sequences', () => {
    expect(pathnameToView('/show/cartoons')).toBe('cartoons');
  });
});

describe('overview and archive routes', () => {
  it('makes the Overview the hub home and moves the archive to /show/archive', () => {
    expect(viewPaths.overview).toBe('/show');
    expect(viewPaths.gallery).toBe('/show/archive');
    expect(pathnameToView('/show')).toBe('overview');
    expect(pathnameToView('/show/')).toBe('overview');
    expect(pathnameToView('/show/archive')).toBe('gallery');
  });

  it('falls back to the Overview for unknown hub paths', () => {
    expect(pathnameToView('/show/nope')).toBe('overview');
  });

  it('gives every view a distinct path', () => {
    const paths = Object.values(viewPaths);
    expect(new Set(paths).size).toBe(paths.length);
    expect(crewPath('/archive')).toBe(viewPaths.gallery);
  });
});

describe('isLegacyArchiveLink', () => {
  it('treats a filtered hub-home URL as an archive link', () => {
    expect(isLegacyArchiveLink('/show', '?theme=Laser%20Snakes')).toBe(true);
    expect(isLegacyArchiveLink('/show/', '?q=cat')).toBe(true);
  });

  it('leaves the plain home and other views alone', () => {
    expect(isLegacyArchiveLink('/show', '')).toBe(false);
    expect(isLegacyArchiveLink('/show', '?')).toBe(false);
    expect(isLegacyArchiveLink('/show/songs', '?q=cat')).toBe(false);
    expect(isLegacyArchiveLink('/', '?q=cat')).toBe(false);
  });
});
