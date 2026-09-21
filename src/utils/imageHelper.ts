import React from 'react';

/**
 * Universal Asset URL resolver for GitHub Pages, custom domains, and local dev.
 * Automatically handles repo subpaths (e.g. /my-repo/), spaces in filenames, and fallbacks.
 */
export function getImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Clean leading slashes or dots
  const clean = path.replace(/^(\.|\/)+/, '');

  let base = './';
  if (typeof window !== 'undefined' && window.location) {
    const pathname = window.location.pathname || '/';
    const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
    const isFile = lastSegment.includes('.');
    let dir = pathname;
    if (isFile) {
      dir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    } else if (!dir.endsWith('/')) {
      dir = `${dir}/`;
    }
    if (dir && dir !== '/') {
      base = dir;
    }
  }

  return `${base}${clean}`;
}

/**
 * Image fallback handler for <img> elements:
 * If an image fails to load, attempts alternative paths (e.g. in /images/ subfolder, encoded spaces, or root relative).
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackSrc?: string) {
  const target = e.currentTarget;
  const currentSrc = target.src;
  const retryCount = parseInt(target.dataset.retryCount || '0', 10);

  if (retryCount >= 4) {
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

  const urlObj = new URL(currentSrc, window.location.href);
  const rawPath = urlObj.pathname;
  const filename = rawPath.split('/').pop() || '';
  const decodedFilename = decodeURIComponent(filename);

  if (retryCount === 0) {
    // Try inside images/ subfolder
    if (!rawPath.includes('/images/')) {
      target.src = getImageUrl(`images/${decodedFilename}`);
    } else {
      target.src = getImageUrl(decodedFilename);
    }
  } else if (retryCount === 1) {
    // Try encoded URI
    target.src = getImageUrl(encodeURIComponent(decodedFilename));
  } else if (retryCount === 2) {
    // Try relative ./ or ./images/
    target.src = `./${decodedFilename}`;
  } else {
    target.src = `./images/${decodedFilename}`;
  }
}

