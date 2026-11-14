export type PublicLegalPage = 'privacy' | 'terms' | null;

const LEGAL_PATH_SUFFIX_REGEX = /\/(?:privacy(?:-policy|\.html)?|terms(?:-of-service|\.html)?|index\.html)\/?$/i;

export function getBasePathname(
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/'
): string {
  const stripped = pathname.replace(LEGAL_PATH_SUFFIX_REGEX, '');
  if (!stripped || stripped === '/') return '/';
  return stripped.endsWith('/') ? stripped : `${stripped}/`;
}

export function getPublicLegalUrl(page: 'privacy' | 'terms'): string {
  if (typeof window === 'undefined') return `?page=${page}`;
  const basePath = getBasePathname(window.location.pathname);
  return `${window.location.origin}${basePath}?page=${page}`;
}

export function getPublicLegalPageFromUrl(): PublicLegalPage {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const pageParam = (params.get('page') || '').toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');

  if (
    pageParam === 'privacy' ||
    params.has('privacy') ||
    hash === '#privacy' ||
    path.endsWith('/privacy') ||
    path.endsWith('/privacy-policy') ||
    path.endsWith('/privacy.html')
  ) {
    return 'privacy';
  }

  if (
    pageParam === 'terms' ||
    params.has('terms') ||
    hash === '#terms' ||
    path.endsWith('/terms') ||
    path.endsWith('/terms-of-service') ||
    path.endsWith('/terms.html')
  ) {
    return 'terms';
  }

  return null;
}
