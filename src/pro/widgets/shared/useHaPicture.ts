import { useEffect, useState } from 'react';
import { loadHAImageBlob } from '@/services/haImageService';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';

const RETRY_DELAYS_MS = [5_000, 30_000, 120_000];

/**
 * An image from Home Assistant (a person's photo, a cover) as a URL an <img> can show. Protected
 * HA paths (`/api/image/serve/...`) are fetched with the session token, like the classic
 * PersonAvatar does. `useHAImage` reads the token from saved login storage only, which is empty
 * for some sign-in methods, so photos never loaded on a real server.
 */
export function useHaPicture(raw?: string | null, serverUrlOverride?: string | null): string {
  const storeUrl = useAutoLayoutStore((s) => s.serverUrl);
  const serverUrl = serverUrlOverride || storeUrl;
  const token = useAutoLayoutStore((s) => s.haToken);
  const [url, setUrl] = useState('');
  useEffect(() => {
    let live = true;
    if (!raw) {
      setUrl('');
      return;
    }
    if (raw.startsWith('data:') || raw.startsWith('blob:')) {
      setUrl(raw);
      return;
    }
    // A failed load (token mid-refresh, HA restarting) comes back empty and isn't cached, so try
    // again a few times rather than leaving the initials up until the page reloads.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = (attempt: number) => {
      void loadHAImageBlob(raw, serverUrl, token || null).then((resolved) => {
        if (!live) return;
        setUrl(resolved);
        if (!resolved && attempt < RETRY_DELAYS_MS.length) {
          timer = setTimeout(() => load(attempt + 1), RETRY_DELAYS_MS[attempt]);
        }
      });
    };
    load(0);
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [raw, serverUrl, token]);
  return url;
}
