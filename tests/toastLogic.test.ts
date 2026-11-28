import { describe, expect, it } from 'vitest';
import { cleanTitle, fromAlertToast, fromShellToast } from '@/pro/lib/toastLogic';
import type { AlertToast } from '@/store/useAlertStore';

const alert = (extra: Partial<AlertToast>): AlertToast => ({ id: 'a', title: 'T', message: '', severity: 'info', timestamp: 1, ...extra });

describe('toastLogic', () => {
  it('cleans titles', () => {
    expect(cleanTitle('SMOKE DETECTED')).toBe('Smoke detected');
    expect(cleanTitle('🔔 Front Door Opened')).toBe('Front Door Opened');
  });

  it('maps alert toasts to tone, icon and timeout', () => {
    expect(fromAlertToast(alert({ severity: 'warning', iconType: 'lock_open', title: 'Front Door Unlocked' }))).toMatchObject({ variant: 'warning', icon: 'unlock', timeout: 5000 });
    expect(fromAlertToast(alert({ iconType: 'lock' }))).toMatchObject({ variant: 'success', icon: 'lock' });
    expect(fromAlertToast(alert({ iconType: 'window', durationMs: 4500 }))).toMatchObject({ variant: 'default', icon: 'window', timeout: 4500 });
    expect(fromAlertToast(alert({ severity: 'critical', category: 'hazard', durationMs: 0, title: 'WATER LEAK DETECTED' }))).toMatchObject({
      variant: 'danger',
      icon: 'hazard',
      timeout: 0,
      title: 'Water leak detected'
    });
    expect(fromAlertToast(alert({ category: 'persistent_notification', message: ' Backup done ' }))).toMatchObject({ icon: 'message', description: 'Backup done' });
    expect(fromAlertToast(alert({ severity: 'warning', category: 'system' })).icon).toBe('alert');
  });

  it('maps shell toasts', () => {
    expect(fromShellToast({ title: 'Dashboard Refreshed', type: 'info' })).toMatchObject({ variant: 'default', icon: 'info', timeout: 4000 });
    expect(fromShellToast({ title: 'Saved', type: 'success', duration: 2000 })).toMatchObject({ variant: 'success', icon: 'check', timeout: 2000 });
  });
});
