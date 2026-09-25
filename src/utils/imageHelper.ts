import React from 'react';

/**
 * High-reliability CDN fallback URLs for gaming assets and services.
 * Ensures images always display even when local files are not bundled or pushed on GitHub Pages.
 */
export const STABLE_CDN_IMAGES: Record<string, string> = {
  'It Takes Two.jpg': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  'FC 27 Ultimate Edition.jpg': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  'GTA VI.jpg': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
  'RDR2.jpg': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  'WWE 2K26.jpg': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
  'SpiderMan 2.jpg': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
  'NBA 2K20.jpg': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
  'Ghost of Yotei.jpg': 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80',
  'Hollow Knight Silksong.jpg': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
  'Diablo IV.jpg': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80',
  'Resident Evil Requeim.jpg': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
  'Gang Beasts.jpg': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  'WATCH DOGS 2.jpg': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'DETROIT BECOME HUMAN.jpg': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
  'Little Nightmares III.jpg': 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=800&q=80',
  'Ready or not.jpg': 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
  'CALL OF DUTY BLACK OPS 7.jpg': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  'Arc Raiders.jpg': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'Hogwarts Legacy.jpg': 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
  'THE LAST OF US PART II Remastered.jpg': 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  'A way Out.jpg': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  'NFS Heat.jpg': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  'NFS payback.jpg': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
  'Playstation Plus.jpg': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
  'Fortnite Vbucks.jpg': 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&w=800&q=80',
  'Rocket League Credits.jpg': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  'Rocket League Season Pass.jpg': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  'Hezo Boost.jpg': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
};

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
    let pathname = window.location.pathname || '/';

    // Remove any trailing index.html or document filename
    if (/\/[^/]+\.[a-zA-Z0-9]+$/.test(pathname)) {
      pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    }
    if (!pathname.endsWith('/')) {
      pathname = `${pathname}/`;
    }

    // Try SeenSoldThere/ path if no specific folder was provided
    let finalPath = encodedSegments;
    if (!encodedSegments.includes('/')) {
      finalPath = `SeenSoldThere/${encodedSegments}`;
    }

    return `${origin}${pathname}${finalPath}`;
  }

  return `/SeenSoldThere/${encodedSegments}`;
}

/**
 * Image fallback handler for <img> elements:
 * If an image fails to load, attempts alternative paths:
 * - Direct stable public CDN fallback if matching asset known
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

    // If we have a stable CDN mapping for this file, serve it directly
    if (STABLE_CDN_IMAGES[decodedFilename]) {
      target.src = STABLE_CDN_IMAGES[decodedFilename];
      return;
    }

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


