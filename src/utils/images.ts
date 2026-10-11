import type { ImageMetadata } from 'astro';

/**
 * All images under src/assets/images are bundled and optimized by astro:assets.
 * JSON data keeps referencing them with the historical `/assets/images/...` paths.
 */
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{webp,png,jpg,jpeg,avif}',
  { eager: true }
);

export function hasImage(path: string): boolean {
  return `/src${path}` in images;
}

export function getImage(path: string): ImageMetadata {
  const entry = images[`/src${path}`];
  if (!entry) {
    throw new Error(`Image not found: "${path}". Expected a file at src${path}`);
  }
  return entry.default;
}
