/**
 * Helper to ensure internal URLs respect import.meta.env.BASE_URL
 * Works with both root custom domain (/) and GitHub Pages subdirectory (/repo-name/)
 */
export function url(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('mailto:') || path.startsWith('#')) {
    return path;
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
