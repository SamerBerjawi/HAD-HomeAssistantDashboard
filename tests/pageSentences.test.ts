import { describe, expect, it } from 'vitest';
import {
  automationsSentence,
  energySentence,
  formatPower,
  healthSentence,
  integrationsSentence,
  mediaSentence,
  mobilitySentence,
  vehiclesSentence,
  networkSentence,
  overviewSentence,
  roomsSentence,
  securitySentence,
  sentenceText,
  settingsSentence,
  systemSentence,
  timeAgo,
  timeGreeting,
  vacuumsSentence,
  type SentencePart
} from '@/pro/lib/pageSentences';

const text = (parts: SentencePart[]) => sentenceText(parts);
const chips = (parts: SentencePart[]) => parts.filter((p) => typeof p !== 'string');

describe('pageSentences', () => {
  it('greets by time of day', () => {
    expect(timeGreeting(8)).toBe('Good morning');
    expect(timeGreeting(13)).toBe('Good afternoon');
    expect(timeGreeting(19)).toBe('Good evening');
    expect(timeGreeting(2)).toBe('Good night');
  });

  it('overview: weather and presence', () => {
    const s = overviewSentence({
      weather: { temperature: 18.4, unit: '°C', condition: 'partlycloudy', humidity: 55, windSpeed: 12, windUnit: 'km/h' },
      peopleHome: 2,
      peopleTotal: 3
    });
    expect(text(s)).toBe("It's 18°C and partly cloudy outside with 55% humidity and 12 km/h wind, and 2 of 3 are home.");
    expect(text(overviewSentence({ peopleHome: 0, peopleTotal: 2 }))).toBe("Weather isn't available from Home Assistant, and nobody is home.");
  });

  it('rooms: lights, openings, motion and media', () => {
    expect(text(roomsSentence({ lightsOn: 3, doorsOpen: 1, windowsOpen: 2, motionRooms: 1, mediaPlaying: 0 }))).toBe(
      'Right now: 3 lights on, 1 door and 2 windows open and motion in 1 room.'
    );
    expect(text(roomsSentence({ lightsOn: 0, doorsOpen: 0, windowsOpen: 0, motionRooms: 0, mediaPlaying: 0 }))).toBe(
      'Right now: all lights are off and doors and windows are closed.'
    );
  });

  it('energy: power flows and setup state', () => {
    expect(formatPower(0.42)).toBe('420 W');
    expect(formatPower(1.234)).toBe('1.2 kW');
    expect(text(energySentence({ configured: true, homeKW: 1.2, solarKW: 3.4, gridKW: -2.2, batterySoC: 76 }))).toBe(
      'The house is using 1.2 kW, solar is producing 3.4 kW, 2.2 kW goes back to the grid and the battery is at 76%.'
    );
    expect(text(energySentence({ configured: false, homeKW: 0, solarKW: 0, gridKW: 0, batterySoC: null }))).toContain("isn't set up");
  });

  it('security: alarm, locks and openings', () => {
    const s = securitySentence({ alarmState: 'armed_home', locks: 4, unlocked: 1, contactSensors: 6, doorsOpen: 1, windowsOpen: 0, hazards: 0, motion: 0 });
    expect(text(s)).toBe('The alarm is armed home, 3 of 4 locks locked and 1 door open.');
    expect(chips(s).map((c) => (typeof c === 'string' ? '' : c.tone))).toEqual(['success', 'warning', 'warning']);
    expect(text(securitySentence({ locks: 0, unlocked: 0, contactSensors: 0, doorsOpen: 0, windowsOpen: 0, hazards: 0, motion: 0 }))).toBe(
      'No security devices found in Home Assistant.'
    );
  });

  it('media: none, one and several players', () => {
    expect(text(mediaSentence({ playing: [] }))).toBe('Nothing is playing, all players are idle.');
    expect(text(mediaSentence({ playing: [{ title: 'Blue in Green', area: 'Living Room', isTv: false }] }))).toBe(
      'Blue in Green” is playing in the Living Room.'.replace(/^/, '“')
    );
    expect(
      text(mediaSentence({ playing: [{ title: 'News', area: 'Kitchen', isTv: true }, { title: 'Jazz', area: 'Office', isTv: false }] }))
    ).toBe('2 players are playing in 2 rooms, including “News”.');
  });

  it('mobility: car and bike', () => {
    expect(
      text(mobilitySentence({ car: { soc: 76, range: 312, rangeUnit: 'km', charging: false, plugged: true, locked: true }, bike: { battery: 80, locked: false } }))
    ).toBe('The car is at 76% with 312 km range, plugged in, locked; the bike is at 80%, unlocked.');
    expect(text(mobilitySentence({}))).toBe('No vehicles found in Home Assistant.');
  });

  it('health: activity and heart rate', () => {
    expect(text(healthSentence({ deviceName: 'iPhone', steps: 8214, activeKcal: 312, heartRate: 71.6 }))).toBe(
      'IPhone logged 8,214 steps and 312 kcal today, heart rate 72 bpm.'.replace('IPhone', 'iPhone')
    );
    expect(text(healthSentence({}))).toContain('No health data');
  });

  it('vacuums: error, cleaning and docked', () => {
    expect(text(vacuumsSentence({ vacuums: [] }))).toBe('No robot vacuums found in Home Assistant.');
    expect(text(vacuumsSentence({ vacuums: [{ name: 'Roborock', state: 'cleaning', battery: 64, room: 'Kitchen' }] }))).toBe(
      'Roborock is cleaning the Kitchen at 64% battery.'
    );
    expect(text(vacuumsSentence({ vacuums: [{ name: 'Roborock', state: 'error', battery: 64 }] }))).toBe('Roborock needs attention.');
    expect(text(vacuumsSentence({ vacuums: [{ name: 'A', state: 'docked', battery: 90 }, { name: 'B', state: 'docked', battery: 70 }] }))).toBe(
      'All 2 vacuums are docked with 70% battery or more.'
    );
  });

  it('system: host load and temperature', () => {
    expect(text(systemSentence({ cpu: 12, memory: 73.4, disk: 20.2, cpuTemp: 54 }))).toBe(
      'The host is using 12% CPU, 73% memory and 20% disk, with the CPU at 54°C.'
    );
    expect(text(systemSentence({}))).toContain('System Monitor');
  });

  it('network: speed test, AdGuard and clients', () => {
    expect(text(networkSentence({ downloadMbps: 842.5, uploadMbps: 486.2, blockedPercent: 17.31, clients: 23 }))).toBe(
      'The last speed test measured 843 Mbps down and 486 Mbps up, AdGuard blocked 17.3% of DNS queries and 23 devices are connected.'
    );
  });

  it('automations: counts and last run', () => {
    expect(timeAgo(0.5)).toBe('just now');
    expect(timeAgo(130)).toBe('2 h ago');
    expect(timeAgo(60 * 24)).toBe('1 day ago');
    expect(text(automationsSentence({ automationsOn: 24, automationsTotal: 26, scenes: 8, scriptsRunning: 0, last: { name: 'Morning lights', minutesAgo: 5 } }))).toBe(
      '24 of 26 automations on and 8 scenes ready, last run Morning lights, 5 min ago.'
    );
  });

  it('integrations and settings', () => {
    expect(text(integrationsSentence({ devices: 142, entities: 1204, updates: 3 }))).toBe(
      'Home Assistant manages 142 devices and 1,204 entities, with 3 updates available.'
    );
    expect(text(settingsSentence({ isDemo: false, version: '2026.11.1', userName: 'Samer', visiblePages: 12, totalPages: 13 }))).toBe(
      'Connected to Home Assistant v2026.11.1 as Samer, with 12 of 13 pages visible.'
    );
  });
});

describe('vehicles sentence', () => {
  it('has one clause per vehicle, from the page model', async () => {
    const { studioMobilityHome } = await import('@/pro/lib/mobility/sampleVehicles');
    expect(text(vehiclesSentence(studioMobilityHome('charging').vehicles))).toBe('The Ford is at 61% with 262 km range, charging, locked; Cowboy is at 64% with 45 km range.');
    expect(text(vehiclesSentence(studioMobilityHome('quiet').vehicles))).toBe('The Ford is at 90% with 386 km range, plugged in, locked, asleep; Cowboy isn’t reporting.');
    expect(text(vehiclesSentence([]))).toBe('No vehicles found in Home Assistant.');
  });
});
