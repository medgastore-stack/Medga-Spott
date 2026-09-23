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
 * - seensold there/ (lowercase with space, common on GitHub / computer)
 * - SeenSoldThere/ (PascalCase)
 * - seensoldthere/ (lowercase without space)
 * - SeenSold There/ (PascalCase with space)
 * - images/ subfolder
 * - Root and relative variants
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackSrc?: string) {
  const target = e.currentTarget;
  const currentSrc = target.src;
  const retryCount = parseInt(target.dataset.retryCount || '0', 10);

  // Allow up to 10 retries to cycle through all folder and casing variants
  if (retryCount >= 10) {
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

    const candidatePaths = [
      `seensold there/${decodedFilename}`,
      `SeenSoldThere/${decodedFilename}`,
      `seensoldthere/${decodedFilename}`,
      `SeenSold There/${decodedFilename}`,
      `images/${decodedFilename}`,
      decodedFilename,
      `./seensold there/${encodeURIComponent(decodedFilename)}`,
      `./SeenSoldThere/${encodeURIComponent(decodedFilename)}`,
      `./images/${encodeURIComponent(decodedFilename)}`,
      `./${encodeURIComponent(decodedFilename)}`,
    ];

    const nextPath = candidatePaths[retryCount % candidatePaths.length];
    if (nextPath.startsWith('./')) {
      target.src = nextPath;
    } else {
      target.src = getImageUrl(nextPath);
    }
  } catch {
    if (fallbackSrc) {
      target.src = fallbackSrc;
    }
  }
}


