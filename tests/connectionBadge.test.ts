import { describe, expect, it } from 'vitest';
import { connectionBadge } from '@/pro/lib/connectionBadge';

describe('connectionBadge', () => {
  it('shows demo whenever live mode is off, whatever the socket says', () => {
    expect(connectionBadge(false, 'connected').kind).toBe('demo');
  });

  it('maps the live socket states', () => {
    expect(connectionBadge(true, 'connected', '2026.11.1')).toMatchObject({ kind: 'live', color: 'success' });
    expect(connectionBadge(true, 'connected', '2026.11.1').description).toContain('v2026.11.1');
    expect(connectionBadge(true, 'connecting').kind).toBe('connecting');
    expect(connectionBadge(true, 'auth_failed')).toMatchObject({ kind: 'auth_failed', color: 'danger' });
  });

  it('treats anything else as offline', () => {
    expect(connectionBadge(true, 'disconnected').kind).toBe('offline');
    expect(connectionBadge(true, '').kind).toBe('offline');
  });
});
