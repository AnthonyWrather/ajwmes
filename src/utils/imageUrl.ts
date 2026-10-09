/**
 * Normalizes image paths to ensure compatibility both in Vite development mode,
 * production static bundle, and when deployed on Firebase Hosting.
 */
export function normalizeImageUrl(url?: string): string {
  if (!url) return '';
  // If the path references /src/assets/images/, normalize to /assets/images/
  if (url.startsWith('/src/assets/images/')) {
    return url.replace('/src/assets/images/', '/assets/images/');
  }
  return url;
}
