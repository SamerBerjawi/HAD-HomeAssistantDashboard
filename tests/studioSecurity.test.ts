import { describe, expect, it } from 'vitest';
import { applySecurityAction, isCritical, needsCode, securityIssues, suggestedMode, securityVerdict, STUDIO_STATES, studioHome } from '../src/pro/pages/security/studio/studioSecurity';

const NOW = Date.UTC(2026, 10, 26, 19, 0);

describe('studioSecurity', () => {
  it('builds every sample home', () => {
    for (const s of STUDIO_STATES) {
      const home = studioHome(s.id, NOW);
      expect(home.cameras.length).toBeGreaterThan(0);
      expect(home.devices.length).toBeGreaterThan(0);
      expect(securityVerdict(home).title).not.toBe('');
    }
  });

  it('answers "secure" when nothing needs anyone', () => {
    const home = studioHome('secure', NOW);
    expect(securityIssues(home)).toEqual([]);
    expect(securityVerdict(home)).toMatchObject({ tone: 'calm', title: 'Home is secure', detail: 'Armed away · Nobody home' });
  });

  it('lists the evening problems with a Lock fix for each unlocked door', () => {
    const issues = securityIssues(studioHome('evening', NOW));
    expect(issues.map((i) => i.text)).toEqual(['Back Door is unlocked', 'Garage Side Door is unlocked', 'Garage Door is open', 'Patio Door is open']);
    expect(issues[2].fix?.label).toBe('Close');
    expect(issues.filter((i) => i.fix?.label === 'Lock')).toHaveLength(2);
    expect(securityVerdict(studioHome('evening', NOW))).toMatchObject({ tone: 'warning', title: '4 things need you' });
  });

  it('puts the triggered alarm first, then hazards and jammed locks', () => {
    const home = studioHome('triggered', NOW);
    const issues = securityIssues(home);
    expect(issues[0]).toMatchObject({ id: 'alarm', tone: 'danger', fix: { label: 'Silence' } });
    expect(issues.slice(1, 3).map((i) => i.text)).toEqual(['Water detected · Under Sink', 'Back Door is jammed']);
    expect(securityVerdict(home).tone).toBe('danger');
  });

  it('reports offline devices and low batteries at night', () => {
    const texts = securityIssues(studioHome('night', NOW)).map((i) => i.text);
    expect(texts).toEqual(expect.arrayContaining(['Bedroom Window is offline', 'Living Room camera is offline', 'Garage Side Door battery at 12%', 'Garden Motion battery at 14%']));
  });

  it('locks everything, arms and silences like HA would, and logs it', () => {
    let home = studioHome('evening', NOW);
    home = applySecurityAction(home, { type: 'lockAll' }, NOW);
    expect(securityIssues(home).some((i) => i.text.endsWith('unlocked'))).toBe(false);
    home = applySecurityAction(home, { type: 'arm', mode: 'armed_home' }, NOW);
    expect(home.alarm.state).toBe('armed_home');
    expect(home.events[0].text).toBe('You set the alarm to Home');

    let alarm = studioHome('triggered', NOW);
    alarm = applySecurityAction(alarm, { type: 'silence' }, NOW);
    expect(alarm.alarm.siren).toBe(false);
    expect(securityIssues(alarm)[0].fix).toBeNull();
  });

  it('unlocks a single lock through the tile action', () => {
    const home = applySecurityAction(studioHome('secure', NOW), { type: 'device', id: 'lock.front_door', action: { type: 'lock', cmd: 'unlock' } }, NOW);
    expect(securityIssues(home).map((i) => i.text)).toEqual(['Front Door is unlocked']);
    expect(securityVerdict(home).title).toBe('Front Door is unlocked');
    expect(home.events[0].text).toBe('You unlocked the Front Door');
  });

  it('suggests the next mode, marks critical changes and asks for the code only to disarm', () => {
    const away = studioHome('secure', NOW);
    expect(suggestedMode(away)).toBe('disarmed');
    expect(isCritical(away, 'disarmed')).toBe(true);
    expect(needsCode(away, 'disarmed')).toBe(true);
    expect(needsCode(away, 'armed_home')).toBe(false);

    const evening = studioHome('evening', NOW);
    expect(suggestedMode(evening)).toBe('armed_home');
    expect(isCritical(evening, 'armed_home')).toBe(false);
    expect(isCritical(evening, 'armed_away')).toBe(true);
    expect(isCritical(evening, 'disarmed')).toBe(false);

    expect(needsCode(studioHome('triggered', NOW), 'disarmed')).toBe(true);
    const flat = applySecurityAction(studioHome('flat', NOW), { type: 'arm', mode: 'armed_away' }, NOW);
    expect(needsCode(flat, 'disarmed')).toBe(false);
  });

  it('closes the garage and silences or tests sirens', () => {
    let home = applySecurityAction(studioHome('evening', NOW), { type: 'device', id: 'cover.garage_door', action: { type: 'cover', cmd: 'close' } }, NOW);
    expect(securityIssues(home).some((i) => i.text === 'Garage Door is open')).toBe(false);
    expect(home.events[0].text).toBe('You closed the Garage Door');

    home = applySecurityAction(home, { type: 'device', id: 'siren.hallway', action: { type: 'toggle' } }, NOW);
    expect(securityIssues(home)[0]).toMatchObject({ tone: 'danger', text: 'Hallway Siren is sounding', fix: { label: 'Silence' } });

    let alarm = studioHome('triggered', NOW);
    expect(alarm.devices.filter((d) => d.kind === 'siren' && d.isOn)).toHaveLength(2);
    alarm = applySecurityAction(alarm, { type: 'silence' }, NOW);
    expect(alarm.devices.some((d) => d.kind === 'siren' && d.isOn)).toBe(false);
  });
});
