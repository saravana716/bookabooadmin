/**
 * Utility to validate and sanitize image URLs.
 * Filters out mobile local storage/cache paths (e.g. file:///data/user/0/... or content://)
 * which modern web browsers block due to cross-origin local resource security restrictions.
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('file://') || trimmed.startsWith('content://')) {
    return false;
  }
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/');
};

export const sanitizeImageUrl = (url, fallback = null) => {
  return isValidImageUrl(url) ? url.trim() : fallback;
};
