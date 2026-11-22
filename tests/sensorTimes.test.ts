import { describe, expect, it } from 'vitest';
import { byRecent, roomsByRecent, sensorWhen } from '@/pro/lib/sensorTimes';

const NOW = 1_800_000_000_000;
const min = (n: number) => NOW - n * 60_000;
const item = (domain: 'doors' | 'windows' | 'motion' | 'leak' | 'smoke', isActive: boolean, at: number | null, isOffline = false) => ({ domain, isActive, isOffline, lastChangedAt: at });

describe('sensorTimes', () => {
  it('words motion by its last change', () => {
    expect(sensorWhen(item('motion', true, min(1)), NOW)).toBe('Motion now');
    expect(sensorWhen(item('motion', false, min(5)), NOW)).toBe('Last motion 5 min ago');
    expect(sensorWhen(item('motion', false, null), NOW)).toBe('No motion');
  });

  it('words openings, hazards and offline sensors', () => {
    expect(sensorWhen(item('doors', true, min(120)), NOW)).toBe('Opened 2 h ago');
    expect(sensorWhen(item('windows', false, min(10)), NOW)).toBe('Closed 10 min ago');
    expect(sensorWhen(item('leak', false, min(3 * 24 * 60)), NOW)).toBe('Clear since 3 days ago');
    expect(sensorWhen(item('smoke', true, null), NOW)).toBe('Detected');
    expect(sensorWhen(item('motion', false, min(30), true), NOW)).toBe('Offline since 30 min ago');
  });

  it('orders active first, then most recent, unknown last', () => {
    const list = [item('motion', false, null), item('motion', false, min(60)), item('motion', true, min(500)), item('motion', false, min(2))];
    expect(list.sort(byRecent).map((i) => i.lastChangedAt)).toEqual([min(500), min(2), min(60), null]);
  });

  it('orders rooms by their most recent sensor', () => {
    const rooms = roomsByRecent([
      { key: 'Hall', items: [item('motion', false, min(90))] },
      { key: 'Kitchen', items: [item('motion', false, min(300)), item('motion', false, min(4))] }
    ]);
    expect(rooms.map((r) => r.key)).toEqual(['Kitchen', 'Hall']);
    expect(rooms[0].items[0].lastChangedAt).toBe(min(4));
  });
});
