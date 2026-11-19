import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Still from './Still';

const picture = {
  sources: {
    avif: '/a-480.avif 480w, /a-960.avif 960w',
    webp: '/a-480.webp 480w, /a-960.webp 960w',
    jpg: '/a-480.jpg 480w, /a-960.jpg 960w',
  },
  img: { src: '/a-960.jpg', w: 960, h: 1200 },
};

describe('Still', () => {
  it('renders AVIF and WebP sources and a sized fallback img', () => {
    const { container } = render(
      <Still picture={picture} src="/a.jpg" sizes="50vw" alt="A still" className="card" />,
    );
    const sources = [...container.querySelectorAll('source')];
    expect(sources.map((source) => source.getAttribute('type'))).toEqual([
      'image/avif',
      'image/webp',
    ]);
    expect(sources.every((source) => source.getAttribute('sizes') === '50vw')).toBe(true);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/a-960.jpg');
    expect(img.getAttribute('srcset')).toBe(picture.sources.jpg);
    expect(img.getAttribute('width')).toBe('960');
    expect(img.getAttribute('height')).toBe('1200');
    expect(img.className).toBe('card');
    expect(img.alt).toBe('A still');
  });

  it('falls back to the original file without a picture', () => {
    const { container } = render(<Still src="/a.gif" sizes="50vw" alt="" />);
    expect(container.querySelector('picture')).toBeNull();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/a.gif');
  });
});
