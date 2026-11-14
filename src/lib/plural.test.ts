import { describe, expect, it } from 'vitest';

import { pluralize } from './plural';

describe('pluralize', () => {
  it('uses the singular for exactly one', () => {
    expect(pluralize(1, 'segment')).toBe('1 segment');
  });

  it('uses the plural for zero and for many', () => {
    expect(pluralize(0, 'segment')).toBe('0 segments');
    expect(pluralize(2, 'segment')).toBe('2 segments');
  });

  it('accepts an irregular plural', () => {
    expect(pluralize(1, 'person', 'people')).toBe('1 person');
    expect(pluralize(3, 'person', 'people')).toBe('3 people');
  });
});
