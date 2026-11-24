import { describe, expect, it } from 'vitest';
import {
  applySecurityAction,
  buildSecurityPhoneTabs,
  buildStudioSecuritySnapshot,
  STUDIO_SECURITY_STATES
} from '../src/pro/pages/security/studio/studioSecurity';

describe('studioSecurity', () => {
  it('builds valid snapshots for all 5 home states with 24 hourly pulse buckets', () => {
    for (const s of STUDIO_SECURITY_STATES) {
      const snap = buildStudioSecuritySnapshot(s.id);
      expect(snap.alarms.length).toBeGreaterThan(0);
      expect(snap.devices.length).toBeGreaterThan(0);
      expect(snap.cameras.length).toBeGreaterThan(0);
      expect(snap.hourlyPulse).toHaveLength(24);
      expect(snap.events.length).toBeGreaterThan(0);
    }
  });

  it('warns when arming away with open entries and arms cleanly once sealed or forced', () => {
    let snap = buildStudioSecuritySnapshot('attention');
    snap = applySecurityAction(snap, { type: 'arm', mode: 'armed_away' });
    expect(snap.alarms[0].state).toBe('disarmed');
    expect(snap.lastActionFeedback).toContain('Perimeter check');

    snap = applySecurityAction(snap, { type: 'arm', mode: 'armed_away', force: true });
    expect(snap.alarms[0].state).toBe('armed_away');
  });

  it('locks all unlocked locks, closes garage, and silences triggered sirens cleanly', () => {
    let att = buildStudioSecuritySnapshot('attention');
    expect(att.devices.filter((d) => d.kind === 'lock' && d.state === 'unlocked')).toHaveLength(2);
    att = applySecurityAction(att, { type: 'lockAll' });
    expect(att.devices.filter((d) => d.kind === 'lock' && d.state === 'unlocked')).toHaveLength(0);

    att = applySecurityAction(att, { type: 'toggleGarage', deviceId: 'cover.garage_door' });
    expect(att.devices.find((d) => d.id === 'cover.garage_door')?.state).toBe('closed');

    let trig = buildStudioSecuritySnapshot('triggered');
    expect(trig.devices.some((d) => d.kind === 'siren' && d.state === 'on')).toBe(true);
    trig = applySecurityAction(trig, { type: 'silenceSirens' });
    expect(trig.devices.some((d) => d.kind === 'siren' && d.state === 'on')).toBe(false);
  });

  it('computes phone tabs and hides empty camera/device tabs when absent', () => {
    const snap = buildStudioSecuritySnapshot('attention');
    const tabs = buildSecurityPhoneTabs(snap);
    expect(tabs.map((t) => t.id)).toEqual(['attention', 'cameras', 'activity', 'devices']);
    expect(tabs.find((t) => t.id === 'attention')?.badgeTone).toBe('warning');

    const noCams = { ...snap, cameras: [] };
    expect(buildSecurityPhoneTabs(noCams).map((t) => t.id)).not.toContain('cameras');
  });
});
