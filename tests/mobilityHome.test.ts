import { describe, expect, it } from 'vitest';
import { ago, drivesFromSpeeds, fleetReadiness, freshness, lowTyres, readiness, softwareLine, type Vehicle } from '@/pro/lib/mobilityHome';
import { todaysDrives } from '@/pro/pages/mobility/home/whereTripsConcepts';
import { studioMobilityHome } from '@/pro/lib/mobility/sampleVehicles';
import { applyAction } from '@/pro/pages/mobility/studio/MobilityStudio';
import { chargeSentence } from '@/pro/pages/mobility/home/chargeClimateConcepts';
import { healthItems } from '@/pro/pages/mobility/home/conditionConcepts';
import { batteryFlow } from '@/pro/pages/mobility/home/parts';

const car = (id: Parameters<typeof studioMobilityHome>[0]) => {
  const h = studioMobilityHome(id);
  return { h, v: h.vehicles.find((x) => x.id === 'ford') as Vehicle };
};

const car_ = (id: Parameters<typeof studioMobilityHome>[0]) => car(id);

describe('readiness', () => {
  it('says the car is charging and when it will be ready', () => {
    const { h, v } = car('charging');
    const r = readiness(v, h.now);
    expect(r.tone).toBe('info');
    expect(r.title).toMatch(/^Charging, ready by /);
    expect(r.detail).toBe('262 km range · at Home');
  });

  it('says ready to go when nothing needs a look', () => {
    const { h, v } = car('ready');
    expect(readiness(v, h.now)).toMatchObject({ tone: 'good', title: 'Ready to go' });
  });

  it('counts what needs a look, worst first', () => {
    const { h, v } = car('attention');
    const r = readiness(v, h.now);
    expect(r.tone).toBe('warn');
    expect(r.title).toBe('5 things to check');
    expect(r.checks.map((c) => c.id).slice(0, 5)).toEqual(['lock', 'open-window-rear left', 'tyres', 'level', 'software']);
    expect(r.checks.find((c) => c.id === 'software')?.label).toBe('Update waiting: 12 V battery low');
    expect(r.checks.find((c) => c.id === 'tyres')?.label).toBe('Tyre low (front left)');
  });

  it('reports driving with its speed', () => {
    const { h, v } = car('driving');
    expect(readiness(v, h.now).title).toBe('Driving, 54 km/h');
  });

  it('puts stolen or crashed above everything', () => {
    const { h, v } = car('ready');
    const r = readiness({ ...v, security: { ...v.security, stolen: true } }, h.now);
    expect(r).toMatchObject({ tone: 'bad', title: 'Reported stolen' });
  });

  it('leaves out what a vehicle lacks: a bike with no lock or charging', () => {
    const h = studioMobilityHome('ready');
    const bike = h.vehicles.find((x) => x.kind === 'bike') as Vehicle;
    const r = readiness(bike, h.now);
    expect(r.title).toBe('Ready to go');
    expect(r.checks.some((c) => c.id === 'lock' || c.id === 'charge')).toBe(false);
  });
});

describe('fleet and helpers', () => {
  it('leads the fleet with the vehicle that needs you', () => {
    const f = fleetReadiness(studioMobilityHome('fleet'));
    expect(f.allReady).toBe(false);
    expect(f.worst.v.id).toBe('volvo');
    expect(f.worst.r.title).toBe('Service due in 21 days');
  });

  it('flags low tyres and says how long ago', () => {
    expect(lowTyres({ unit: 'bar', fl: 2.1, fr: 2.8, rl: null, rr: 2.3, low: 2.4 })).toEqual(['front left', 'rear right']);
    expect(ago(1000, 1000 + 90 * 60_000)).toBe('2 h ago');
    expect(ago(null, 0)).toBe('never');
  });

  it('applies the studio controls to the sample', () => {
    const { v } = car('charging');
    expect(applyAction(v, { type: 'unlock' }).security.locked).toBe(false);
    expect(applyAction(v, { type: 'charge', on: false }).charging?.state).toBe('stopped');
    expect(applyAction(v, { type: 'target', pct: 80 }).charging?.target).toBe(80);
    expect(applyAction(v, { type: 'temp', value: 22.5 }).climate?.target).toBe(22.5);
  });
});

describe('charging sentence', () => {
  it('says what charging is doing', () => {
    expect(chargeSentence(car('charging').v)).toMatch(/^Charging at 7\.2 kW, 90% by /);
    expect(chargeSentence(car('ready').v)).toBe('Charged to 90%, still plugged in.');
    expect(chargeSentence(car('attention').v)).toBe('Not plugged in.');
  });
});

describe('drives from speed', () => {
  it('finds runs of motion and estimates their distance', () => {
    const now = Date.parse('2026-11-26T12:00:00');
    const speeds = [0, 0, 40, 60, 0, 3, 0, 30];
    const d = drivesFromSpeeds(speeds, now);
    expect(d).toHaveLength(2);
    expect(d[0]).toMatchObject({ from: now - 5 * 15 * 60_000, to: now - 3 * 15 * 60_000, distance: 25, top: 60 });
    expect(d[1]).toMatchObject({ distance: 7.5, top: 30 });
  });

  it('keeps today’s drives only', () => {
    const { h, v } = car('driving');
    const drives = todaysDrives(v, h.now);
    expect(drives.map((x) => new Date(x.from).getHours())).toEqual([8, 12, 17]);
  });
});

describe('health items', () => {
  it('lists what needs a look first', () => {
    const items = healthItems(car('attention').v);
    expect(items.slice(0, 3).map((i) => [i.id, i.value])).toEqual([['tyres', 'Front left low'], ['12v', '11.9 V, low'], ['software', 'Waiting: 12 V battery low']]);
    expect(healthItems(car('ready').v).find((i) => i.id === 'software')?.value).toBe('2.3.1, up to date');
    expect(healthItems(car('charging').v).find((i) => i.id === 'software')).toMatchObject({ value: 'Downloading update', tone: 'info' });
  });

  it('folds the bike battery in only when asked', () => {
    const h = studioMobilityHome('attention');
    const bike = h.vehicles.find((x) => x.kind === 'bike') as Vehicle;
    expect(healthItems(bike).some((i) => i.id === 'inserted')).toBe(false);
    const all = healthItems(bike, { battery: true });
    expect(all.find((i) => i.id === 'inserted')).toMatchObject({ value: 'Not in the bike', tone: 'info' });
    expect(all.find((i) => i.id === 'software')).toMatchObject({ label: 'Firmware', value: '1.19.0 ready' });
  });

  it('puts the make’s warnings on top', () => {
    const volvo = studioMobilityHome('fleet').vehicles.find((x) => x.id === 'volvo') as Vehicle;
    expect(healthItems(volvo)[0]).toMatchObject({ label: 'Service due in 21 days', tone: 'warn' });
  });
});

describe('battery flow', () => {
  it('flows in while charging, out while driving or conditioning, still otherwise', () => {
    expect(batteryFlow(car('charging').v)).toEqual({ flow: 'in', why: 'Charging at 7.2 kW' });
    expect(batteryFlow(car('driving').v).flow).toBe('out');
    expect(batteryFlow(car('ready').v)).toEqual({ flow: 'out', why: 'Conditioning the cabin' });
    expect(batteryFlow(car('attention').v).flow).toBeNull();
  });
});

describe('software line', () => {
  const base = { installed: '2.3.1', latest: null, stage: 'idle' as const, lastUpdate: null, nextWindow: null, blocked: null, auto: true };
  const now = Date.parse('2026-11-27T10:00:00');
  it('says where an update stands', () => {
    expect(softwareLine(base, 'car', now)).toEqual({ value: '2.3.1, up to date', check: null, tone: 'good' });
    expect(softwareLine({ ...base, stage: 'installing' }, 'car', now)).toMatchObject({ check: 'Installing a software update', tone: 'warn' });
    expect(softwareLine({ ...base, stage: 'queued', nextWindow: Date.parse('2026-11-27T14:00:00') }, 'car', now).value).toMatch(/^Installs \d/);
    expect(softwareLine({ ...base, stage: 'failed' }, 'bike', now).check).toBe('Firmware update failed');
    expect(softwareLine({ ...base, installed: null, lastUpdate: Date.parse('2026-11-18T03:00:00') }, 'car', now).value).toMatch(/^Updated /);
  });
});

describe('freshness', () => {
  it('says when a car is asleep or an integration is not reporting', () => {
    const h = studioMobilityHome('quiet');
    const [car, bike] = h.vehicles;
    expect(freshness(car, h.now)).toEqual({ text: 'Asleep to save its 12 V battery. These numbers are from 3 h ago.', tone: 'info' });
    expect(freshness(bike, h.now)?.text).toBe('Cowboy isn’t reporting; last heard from 1 d ago. Check it in Home Assistant.');
    expect(readiness(bike, h.now)).toMatchObject({ tone: 'warn', title: 'Not reporting', checks: [] });
    expect(freshness(car, car.seen as number)).toMatchObject({ tone: 'info' });
    const { h: h2, v } = car_('ready');
    expect(freshness(v, h2.now)).toBeNull();
    expect(freshness({ ...v, seen: h2.now - 7 * 3600_000 }, h2.now)?.text).toBe('Last heard from 7 h ago.');
  });
});
