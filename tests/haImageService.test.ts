import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadHAImageBlob } from '../src/services/haImageService';

describe('haImageService.loadHAImageBlob', () => {
  // No stored sign-in: the token passed in is the one used.
  beforeEach(() => vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} }));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('falls back to /api/image-proxy with Bearer auth when direct CORS fetch fails for a protected HA /api/ image', async () => {
    vi.stubGlobal('window', {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:proxied-avatar');

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('https://ha.example.com/api/image/serve/')) {
        throw new TypeError('Failed to fetch (CORS)');
      }
      if (url.startsWith('/api/image-proxy?url=')) {
        const headers = (init?.headers || {}) as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer test-token-1');
        expect(headers['X-HA-URL']).toBe('https://ha.example.com');
        return new Response(new Blob(['img'], { type: 'image/png' }), {
          status: 200,
          headers: { 'content-type': 'image/png' }
        });
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadHAImageBlob(
      '/api/image/serve/person1/512x512',
      'https://ha.example.com',
      'test-token-1'
    );

    expect(result).toBe('blob:proxied-avatar');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns empty string instead of an unauthenticated HA /api/ URL when both direct and proxy fetches fail', async () => {
    vi.stubGlobal('window', {});

    const fetchMock = vi.fn(async () => new Response('Unauthorized', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadHAImageBlob(
      '/api/media_player_proxy/media_player.tv',
      'https://ha.example.com',
      'test-token-2'
    );

    expect(result).toBe('');
  });

  it('shows an uploaded person photo directly when HA blocks the fetch and the proxy fails (HA serves it without a login)', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/image-proxy')) return new Response('', { status: 503 });
      throw new TypeError('Failed to fetch (CORS)');
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadHAImageBlob('/api/image/serve/person2/512x512', 'https://ha.example.com', 'test-token-4');

    expect(result).toBe('https://ha.example.com/api/image/serve/person2/512x512');
  });

  it('shows a public photo directly without any request when there is no token', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadHAImageBlob('/local/people/sam.jpg', 'https://ha.example.com', '');

    expect(result).toBe('https://ha.example.com/local/people/sam.jpg');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never falls back to a ?token= HA URL in <img> (the token rotates; a stale one is logged as a failed login)', async () => {
    vi.stubGlobal('window', {});

    const fetchMock = vi.fn(async () => new Response('Not Found', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadHAImageBlob(
      '/api/camera_proxy/camera.front?token=abc123',
      'https://ha.example.com',
      'test-token-3'
    );

    expect(result).toBe('');
  });

  it('makes no request to HA when there is no token', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadHAImageBlob(
      '/api/camera_proxy/camera.front?token=stale',
      'https://ha.example.com',
      ''
    );

    expect(result).toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
