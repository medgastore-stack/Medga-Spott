import React from 'react';

/**
 * Universal Asset URL resolver for GitHub Pages, custom domains, and local dev.
 * Supports:
 * - Direct files in public/
 * - Dedicated SeenSoldThere/ folders (local folder and repo subfolder)
 * - /images/ subfolder
 * Automatically handles spaces/special chars in filenames, repo subpaths (e.g. /my-repo/), and relative paths.
 */
export function getImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Clean leading slashes or dots
  const clean = path.replace(/^(\.|\/)+/, '');

  // Ensure individual path segments (like "FC 27 Ultimate Edition.jpg") have proper URI encoding for spaces and special characters
  const encodedSegments = clean
    .split('/')
    .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
    .join('/');

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname || '/';

    // If pathname ends with a file (e.g. index.html), strip the file
    let dir = pathname;
    if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
      dir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    } else if (!dir.endsWith('/')) {
      dir = `${dir}/`;
    }

    return `${origin}${dir}${encodedSegments}`;
  }

  return `/${encodedSegments}`;
}

/**
 * Image fallback handler for <img> elements:
 * If an image fails to load, attempts alternative paths:
 * 1. SeenSoldThere/ subfolder (matches your local computer folder on GitHub)
 * 2. /images/ subfolder
 * 3. Root relative
 * 4. Relative ./ and ./SeenSoldThere/
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackSrc?: string) {
  const target = e.currentTarget;
  const currentSrc = target.src;
  const retryCount = parseInt(target.dataset.retryCount || '0', 10);

  if (retryCount >= 6) {
    if (fallbackSrc && target.src !== fallbackSrc) {
      target.src = fallbackSrc;
    } else {
      // Elegant gaming SVG fallback
      const altText = target.alt || 'Medga Game';
      const initial = altText.slice(0, 2).toUpperCase();
      target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23131326"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="48" fill="%238b5cf6">${initial}</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="14" fill="%23a78bfa">MEDGA STORE</text></svg>`;
    }
    return;
  }

  target.dataset.retryCount = (retryCount + 1).toString();

  try {
    const urlObj = new URL(currentSrc, window.location.href);
    const rawPath = urlObj.pathname;
    const filename = rawPath.split('/').pop() || '';
    const decodedFilename = decodeURIComponent(filename);

    if (retryCount === 0) {
      // Try with SeenSoldThere/ folder first (direct match for user's computer folder)
      target.src = getImageUrl(`SeenSoldThere/${decodedFilename}`);
    } else if (retryCount === 1) {
      // Try with images/ subfolder
      target.src = getImageUrl(`images/${decodedFilename}`);
    } else if (retryCount === 2) {
      // Try root-relative directly
      target.src = `/${encodeURIComponent(decodedFilename)}`;
    } else if (retryCount === 3) {
      // Try relative ./SeenSoldThere/ directly
      target.src = `./SeenSoldThere/${encodeURIComponent(decodedFilename)}`;
    } else if (retryCount === 4) {
      // Try relative ./ directly
      target.src = `./${encodeURIComponent(decodedFilename)}`;
    } else {
      target.src = `./images/${encodeURIComponent(decodedFilename)}`;
    }
  } catch {
    // If URL parsing fails, fallback directly
    if (fallbackSrc) {
      target.src = fallbackSrc;
    }
  }
}


