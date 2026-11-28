import { fetchWithTimeout } from '../lib/fetchWithTimeout';
import { useState, useEffect } from 'react';
import { getActiveHAToken, getFreshHAToken } from './haAuth';
import { getStoredAuthConfig } from './authStorage';
import { applyActiveUrl } from './haUrlResolver';

// In-memory cache for resolved Blob URLs to prevent duplicate network requests. Keyed by image URL
// only: the picture is the same whichever token fetched it, so a token refresh (every 30 minutes
// with OAuth) doesn't re-download every photo and cover.
const blobUrlCache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string>>();

/**
 * Converts any Home Assistant server URL (including ws://, wss://, /api/websocket)
 * into a clean, valid HTTP/S base URL.
 */
export function getHAHttpBaseUrl(serverUrl?: string | null): string {
  let target = serverUrl;
  if (!target && typeof window !== 'undefined') {
    const authConfig = getStoredAuthConfig();
    target = authConfig?.httpUrl || authConfig?.serverUrl;
    if (!target) {
      target = localStorage.getItem('ha_server_url') || localStorage.getItem('had_last_ha_url');
    }
  }

  if (!target) return '';

  return applyActiveUrl(target)
    .replace(/^wss:\/\//i, 'https://')
    .replace(/^ws:\/\//i, 'http://')
    .replace(/\/api\/websocket\/?$/i, '')
    .replace(/\/+$/, '');
}

/**
 * Normalizes a relative or absolute HA image URL.
 */
export function resolveHAImageUrl(url?: string | null, serverUrl?: string | null): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const base = getHAHttpBaseUrl(serverUrl);
  const path = url.startsWith('/') ? url : `/${url}`;
  return base ? `${base}${path}` : path;
}

/**
 * Home Assistant paths it serves without a login: uploaded pictures (a person's photo, set under
 * Settings > People) and files in `config/www`. HA's own frontend shows these with a plain <img>,
 * so handing one to <img src> sends no token and can't be logged as "Login attempt failed".
 */
export function isPublicHaImagePath(url: string): boolean {
  try {
    const { pathname, search } = new URL(url, 'http://placeholder.local');
    if (search.includes('token=')) return false;
    return pathname.startsWith('/api/image/serve/') || pathname.startsWith('/local/');
  } catch {
    return false;
  }
}

async function fetchViaImageProxy(
  rawUrl: string,
  token: string,
  haBase: string
): Promise<string | null> {
  if (typeof window === 'undefined' || !token) return null;
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`
    };
    if (haBase) {
      headers['X-HA-URL'] = haBase;
    }
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
    const res = await fetchWithTimeout(proxyUrl, { headers }, 10000);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType && !contentType.startsWith('image/')) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Fetches an image from Home Assistant using Bearer token authentication
 * and returns a cached Object URL (blob:...).
 */
export async function loadHAImageBlob(
  url?: string | null,
  serverUrl?: string | null,
  token?: string | null
): Promise<string> {
  if (!url) return '';

  // Already a self-contained URI or blob
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // External images (e.g. external CDN like Spotify or Apple Music) don't need HA Auth headers - return directly for <img>
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const base = getHAHttpBaseUrl(serverUrl);
    const isHAHost = base && url.startsWith(base);
    if (!isHAHost) {
      return url;
    }
  }

  const targetUrl = resolveHAImageUrl(url, serverUrl);
  if (!targetUrl) return '';

  const cacheKey = targetUrl;
  if (blobUrlCache.has(cacheKey)) {
    return blobUrlCache.get(cacheKey)!;
  }

  // Deduplicate ongoing requests
  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey)!;
  }

  const haBase = getHAHttpBaseUrl(serverUrl);

  const fallbackResult = async (activeToken: string): Promise<string> => {
    const proxied = await fetchViaImageProxy(url, activeToken, haBase);
    if (proxied) {
      blobUrlCache.set(cacheKey, proxied);
      return proxied;
    }
    // A picture HA serves without a login can still be shown directly: the fetch fails when HA
    // doesn't allow this dashboard's origin (cors_allowed_origins) and the server can't proxy it.
    if (isPublicHaImagePath(targetUrl)) return targetUrl;
    // Never hand any other Home Assistant URL to <img src>: the browser sends it without the token,
    // and even a `?token=` URL (camera and media proxies) carries a token that rotates every few
    // minutes, so a stale one gets a 401 that HA logs as "Login attempt failed".
    return '';
  };

  const fetchPromise = (async () => {
    // A stored OAuth token is refreshed first if it has expired (e.g. a tablet waking from sleep).
    // A token passed in (the store's copy) is only used when it isn't that same expired token.
    const fresh = await getFreshHAToken();
    const storedRaw = getActiveHAToken();
    const activeToken = fresh || (token && token !== storedRaw ? token : null);
    // Without a usable token any request to HA is unauthenticated and logs a "Login attempt failed" alert
    if (!activeToken) {
      pendingPromises.delete(cacheKey);
      return isPublicHaImagePath(targetUrl) ? targetUrl : '';
    }
    try {
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const response = await fetchWithTimeout(targetUrl, {
        headers,
        mode: 'cors'
      }, 10000);

      if (!response.ok) {
        return await fallbackResult(activeToken);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType && !contentType.startsWith('image/')) {
        return await fallbackResult(activeToken);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      blobUrlCache.set(cacheKey, objectUrl);
      return objectUrl;
    } catch {
      return await fallbackResult(activeToken);
    } finally {
      pendingPromises.delete(cacheKey);
    }
  })();

  pendingPromises.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * React hook to reactively resolve authenticated Home Assistant image blob URLs.
 * Synchronously uses cache when available, otherwise loads asynchronously.
 */
export function useHAImage(
  rawUrl?: string | null,
  serverUrl?: string | null
): { imageUrl: string; isLoading: boolean } {
  const isExternalUrl = (u?: string | null) => {
    if (!u) return false;
    if (u.startsWith('http://') || u.startsWith('https://')) {
      const base = getHAHttpBaseUrl(serverUrl);
      return !base || !u.startsWith(base);
    }
    return false;
  };

  const activeTokenForDeps = getActiveHAToken();
  const [imageUrl, setImageUrl] = useState<string>(() => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) return rawUrl;
    if (isExternalUrl(rawUrl)) return rawUrl;
    return blobUrlCache.get(resolveHAImageUrl(rawUrl, serverUrl)) || '';
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !imageUrl && Boolean(rawUrl));

  useEffect(() => {
    if (!rawUrl) {
      setImageUrl('');
      setIsLoading(false);
      return;
    }

    if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
      setImageUrl(rawUrl);
      setIsLoading(false);
      return;
    }

    if (isExternalUrl(rawUrl)) {
      setImageUrl(rawUrl);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    loadHAImageBlob(rawUrl, serverUrl).then((resolved) => {
      if (isMounted) {
        setImageUrl(resolved);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rawUrl, serverUrl, activeTokenForDeps]);

  return { imageUrl, isLoading };
}

