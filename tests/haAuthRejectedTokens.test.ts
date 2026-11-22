import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const undiciFetch = vi.fn();
vi.mock('undici', async (importOriginal) => ({ ...(await importOriginal<typeof import('undici')>()), fetch: (...args: unknown[]) => undiciFetch(...args) }));

/** One request through requireHAAuth; resolves with the status it answered (200 = passed on). */
function call(requireHAAuth: (req: never, res: never, next: () => void) => unknown, token: string): Promise<number> {
  return new Promise((resolve) => {
    const req = { headers: { authorization: `Bearer ${token}` }, query: {}, ip: '10.0.0.5', socket: {} };
    const res = {
      setHeader: () => {},
      status: (code: number) => ({ json: () => resolve(code) })
    };
    void requireHAAuth(req as never, res as never, () => resolve(200));
  });
}

describe('server token check: Home Assistant is asked about a rejected token rarely', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('HASS_URL', 'http://ha.local:8123');
    undiciFetch.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('remembers a 401 for 10 minutes (each check is a "Login attempt failed" in HA)', async () => {
    undiciFetch.mockResolvedValue({ status: 401 });
    const { createHaAuth } = await import('../server/auth/haAuth');
    const { requireHAAuth } = createHaAuth({ configDir: '/tmp/had-test-none', haDispatcher: undefined as never });

    expect(await call(requireHAAuth, 'expired-token')).toBe(401);
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(await call(requireHAAuth, 'expired-token')).toBe(401);
    expect(undiciFetch).toHaveBeenCalledTimes(1);
  });

  it('asks again soon after an uncertain answer (a proxy 502)', async () => {
    undiciFetch.mockResolvedValue({ status: 502 });
    const { createHaAuth } = await import('../server/auth/haAuth');
    const { requireHAAuth } = createHaAuth({ configDir: '/tmp/had-test-none', haDispatcher: undefined as never });

    expect(await call(requireHAAuth, 'some-token')).toBe(401);
    vi.advanceTimersByTime(31 * 1000);
    undiciFetch.mockResolvedValue({ status: 200 });
    expect(await call(requireHAAuth, 'some-token')).toBe(200);
    expect(undiciFetch).toHaveBeenCalledTimes(2);
  });
});
