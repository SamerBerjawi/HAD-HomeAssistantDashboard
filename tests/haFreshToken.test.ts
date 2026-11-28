import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Tokens as authStorage keeps them (`had_auth_config_v1`). */
function storeTokens(tokens: Record<string, unknown>) {
  const data = new Map<string, string>();
  data.set(
    'had_auth_config_v1',
    JSON.stringify({ version: 1, authMethod: tokens.auth_type, serverUrl: 'wss://ha.example.com/api/websocket', httpUrl: 'https://ha.example.com', tokens, lastUpdated: Date.now() })
  );
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k)
  });
  vi.stubGlobal('window', { dispatchEvent: () => true, location: { origin: 'http://localhost:3000' } });
  vi.stubGlobal('CustomEvent', class { constructor(public type: string, public init?: unknown) {} });
  vi.stubGlobal('navigator', { onLine: true });
}

const oauth = (expiresInMs: number) => ({
  access_token: 'old-access',
  refresh_token: 'refresh-1',
  auth_type: 'oauth',
  server_url: 'wss://ha.example.com/api/websocket',
  expires_in: 1800,
  expires_at: Date.now() + expiresInMs
});

describe('tokens sent to Home Assistant are never expired', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getUsableHAToken leaves out an expired OAuth token, keeps a valid one and a long-lived one', async () => {
    storeTokens(oauth(-1000));
    let { getUsableHAToken } = await import('../src/services/haAuth');
    expect(getUsableHAToken()).toBeNull();

    vi.resetModules();
    storeTokens(oauth(10 * 60 * 1000));
    ({ getUsableHAToken } = await import('../src/services/haAuth'));
    expect(getUsableHAToken()).toBe('old-access');

    vi.resetModules();
    storeTokens({ access_token: 'llat-1', auth_type: 'llat', server_url: 'wss://ha.example.com/api/websocket' });
    ({ getUsableHAToken } = await import('../src/services/haAuth'));
    expect(getUsableHAToken()).toBe('llat-1');
  });

  it('getFreshHAToken refreshes an expired OAuth token before use', async () => {
    storeTokens(oauth(-1000));
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ access_token: 'new-access', expires_in: 1800 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { getFreshHAToken, freshTokenFor } = await import('../src/services/haAuth');
    expect(await getFreshHAToken()).toBe('new-access');
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://ha.example.com/auth/token');
    // The socket's copy of the old token is swapped for the new one; another token is left alone.
    expect(await freshTokenFor('new-access')).toBe('new-access');
    expect(await freshTokenFor('some-llat')).toBe('some-llat');
  });

  it('returns null, not the expired token, when the refresh fails', async () => {
    storeTokens(oauth(-1000));
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    const { getFreshHAToken } = await import('../src/services/haAuth');
    expect(await getFreshHAToken()).toBeNull();
  });

  it('does not refresh a token that is still valid', async () => {
    storeTokens(oauth(10 * 60 * 1000));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { getFreshHAToken } = await import('../src/services/haAuth');
    expect(await getFreshHAToken()).toBe('old-access');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
