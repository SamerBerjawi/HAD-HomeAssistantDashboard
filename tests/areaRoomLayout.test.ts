import { describe, expect, it } from 'vitest';
import { defaultLayout, flatOrder, hide, isDirty, moveBy, moveOnto, moveSection, readAreaLayout, reconcile, sectionOf, setSize, show, togglePin, visibleSections, withAreaLayout, type RoomItem } from '@/pro/areas/page/roomLayout';
import { isActive, isAlert, roomFacts, roomSentence } from '@/pro/areas/page/roomSummary';
import { LIGHT_STATES, MEDIA_STATES, OPENING_STATES, READING_STATES, SAFETY_STATES, LOCK_STATES } from '@/pro/areas/studio/areaStates';

const item = (key: string, section: RoomItem['section']): RoomItem => ({ key, section, size: { phone: 's', wide: 'w' } });
const ITEMS = [item('scene.a', 'scenes'), item('light.a', 'lights'), item('light.b', 'lights'), item('light.c', 'lights'), item('lock.a', 'security')];
const model = <M,>(list: { id: string; model: M }[], id: string) => list.find((s) => s.id === id)!.model;

describe('room layout', () => {
  it('groups by section in the fixed order with per-device sizes', () => {
    const l = defaultLayout(ITEMS, 'wide');
    expect(l.sectionOrder).toEqual(['scenes', 'lights', 'security']);
    expect(l.sizes['light.a']).toBe('w');
    expect(defaultLayout(ITEMS, 'phone').sizes['light.a']).toBe('s');
  });

  it('moves a tile only inside its section', () => {
    const l = defaultLayout(ITEMS, 'wide');
    expect(moveOnto(l, 'light.c', 'light.a').order.lights).toEqual(['light.c', 'light.a', 'light.b']);
    expect(moveOnto(l, 'light.a', 'lock.a')).toBe(l);
  });

  it('steps over hidden tiles when moving by one', () => {
    const l = hide(defaultLayout(ITEMS, 'wide'), 'light.b');
    expect(moveBy(l, 'light.a', 1).order.lights).toEqual(['light.b', 'light.c', 'light.a']);
    expect(moveBy(l, 'light.a', -1)).toBe(l);
  });

  it('hides, shows, pins, resizes and reorders sections', () => {
    let l = defaultLayout(ITEMS, 'wide');
    l = togglePin(l, 'lock.a');
    l = hide(l, 'lock.a');
    expect(l.pinned).toEqual([]);
    expect(visibleSections(l).map((s) => s.id)).toEqual(['scenes', 'lights']);
    l = show(l, 'lock.a');
    l = setSize(l, 'lock.a', 'xs');
    l = moveSection(l, 'security', -1);
    expect(l.sectionOrder).toEqual(['scenes', 'security', 'lights']);
    expect(flatOrder(l)).toEqual(['scene.a', 'lock.a', 'light.a', 'light.b', 'light.c']);
    expect(l.sizes['lock.a']).toBe('xs');
    expect(isDirty(l, defaultLayout(ITEMS, 'wide'))).toBe(true);
  });

  it('puts each kind in its section', () => {
    expect(sectionOf('reading')).toBe('climate');
    expect(sectionOf('camera')).toBe('security');
    expect(sectionOf('car')).toBe('machines');
    expect(sectionOf('switch')).toBe('power');
  });
});

describe('saved layouts', () => {
  it('fits a saved layout to the room as it is now', () => {
    let saved = defaultLayout(ITEMS, 'wide');
    saved = moveOnto(saved, 'light.c', 'light.a');
    saved = setSize(saved, 'light.c', 'l');
    saved = hide(saved, 'light.b');
    saved = togglePin(saved, 'scene.a');
    saved = moveSection(saved, 'security', -1);
    // light.b leaves the room; a fan (new section) and light.d arrive.
    const now = [item('scene.a', 'scenes'), item('light.a', 'lights'), item('light.c', 'lights'), item('light.d', 'lights'), item('lock.a', 'security'), item('fan.a', 'air')];
    const r = reconcile(saved, now, 'wide');
    expect(r.order.lights).toEqual(['light.c', 'light.a', 'light.d']);
    expect(r.sizes['light.c']).toBe('l');
    expect(r.sizes['light.d']).toBe('w');
    expect(r.hidden).toEqual([]);
    expect(r.pinned).toEqual(['scene.a']);
    // Air comes before Security by default, so it lands there.
    expect(r.sectionOrder).toEqual(['scenes', 'air', 'security', 'lights']);
  });

  it('starts some tiles in the Hidden tray, once', () => {
    const withExtra = [...ITEMS, { ...item('device.car#range', 'machines'), hidden: true }];
    expect(defaultLayout(withExtra, 'wide').hidden).toEqual(['device.car#range']);
    // Saved before the tile existed: it arrives hidden. Saved after the owner showed it: it stays shown.
    expect(reconcile(defaultLayout(ITEMS, 'wide'), withExtra, 'wide').hidden).toEqual(['device.car#range']);
    expect(reconcile(show(defaultLayout(withExtra, 'wide'), 'device.car#range'), withExtra, 'wide').hidden).toEqual([]);
  });

  it('survives junk and nothing saved', () => {
    expect(reconcile(null, ITEMS, 'phone')).toEqual(defaultLayout(ITEMS, 'phone'));
    const junk = { sectionOrder: 'x', order: { lights: 'nope' }, sizes: { 'light.a': 'huge' }, hidden: [3], pinned: null, collapsed: ['bogus'] } as unknown as Parameters<typeof reconcile>[0];
    const r = reconcile(junk, ITEMS, 'phone');
    expect(r.order.lights).toEqual(['light.a', 'light.b', 'light.c']);
    expect(r.sizes['light.a']).toBe('s');
    expect(r.collapsed).toEqual([]);
  });

  it('reads and writes one area and device without touching the rest', () => {
    const l = defaultLayout(ITEMS, 'wide');
    const prefs = withAreaLayout({ proOverviewLayout: { version: 1 } }, 'living_room', 'wide', l);
    const both = withAreaLayout(prefs, 'living_room', 'phone', defaultLayout(ITEMS, 'phone'));
    expect(readAreaLayout(both, 'living_room', 'wide')).toEqual(l);
    expect(readAreaLayout(both, 'living_room', 'phone')?.sizes['light.a']).toBe('s');
    expect(readAreaLayout(both, 'kitchen', 'wide')).toBeNull();
    expect((both as { proOverviewLayout: unknown }).proOverviewLayout).toEqual({ version: 1 });
  });
});

describe('room summary', () => {
  const now = Date.now();
  const light = model(LIGHT_STATES, 'warm');
  const off = model(LIGHT_STATES, 'off');
  const window = { ...model(OPENING_STATES, 'open'), name: 'Window', lastChanged: now - 12 * 60000 };

  it('knows what is active and what is an alert', () => {
    expect(isActive(light)).toBe(true);
    expect(isActive(off)).toBe(false);
    expect(isActive(model(MEDIA_STATES, 'playing'))).toBe(true);
    expect(isAlert(model(SAFETY_STATES, 'smoke'))).toBe(true);
    expect(isAlert(model(LOCK_STATES, 'jammed'))).toBe(true);
  });

  it('reads the facts', () => {
    const f = roomFacts([light, off, model(READING_STATES, 'temp'), model(READING_STATES, 'humidity')]);
    expect(f.lights).toBe(2);
    expect(f.lightsOn).toBe(1);
    expect(f.temperature).not.toBeNull();
    expect(f.humidity).not.toBeNull();
  });

  it('says it in one sentence, alerts first', () => {
    expect(roomSentence([off], now)).toBe('All quiet.');
    expect(roomSentence([light, window], now)).toBe('1 light on, window open for 12 min.');
    expect(roomSentence([light, model(SAFETY_STATES, 'smoke')], now).startsWith(model(SAFETY_STATES, 'smoke').name)).toBe(true);
  });
});
