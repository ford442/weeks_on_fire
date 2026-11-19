import type { ImgHTMLAttributes } from 'react';
import type { Picture } from '../data/types';

const mime: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/** Modern formats go in `<source>`s; the source's own format is the `<img>` fallback. */
const modern = ['avif', 'webp'];

type StillProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> & {
  alt: string;
  /** The original file: used as-is when there is no `picture` (or for formats we don't re-encode). */
  src?: string;
  /** Responsive variants from codegen (`imagePicture` / `stillPicture`). */
  picture?: Picture;
  /** How wide the still renders, for the browser to pick a width, e.g. `(min-width: 1024px) 25vw, 50vw`. */
  sizes: string;
};

/**
 * A card or board still: AVIF / WebP / original-format `srcset` at 480, 960 and 1440 px, with the
 * fallback's intrinsic `width` / `height` so the layout reserves its box before the bytes arrive.
 * `<picture>` is `display: contents`, so the `<img>` keeps the classes the card styles.
 */
export default function Still({ picture, src, sizes, alt, ...img }: StillProps) {
  if (!picture) return <img src={src} alt={alt} {...img} />;

  const formats = Object.keys(picture.sources);
  const fallback = formats.find((format) => !modern.includes(format));
  return (
    <picture className="contents">
      {modern
        .filter((format) => picture.sources[format] && format !== fallback)
        .map((format) => (
          <source key={format} type={mime[format]} srcSet={picture.sources[format]} sizes={sizes} />
        ))}
      <img
        src={picture.img.src}
        srcSet={fallback ? picture.sources[fallback] : undefined}
        sizes={sizes}
        width={picture.img.w}
        height={picture.img.h}
        alt={alt}
        {...img}
      />
    </picture>
  );
}
