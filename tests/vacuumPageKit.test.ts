import { describe, expect, it } from 'vitest';
import { cleanerSamples } from '@/pro/lib/vacuums/samples';
import { nowIds, sectionsOf } from '@/pro/pages/vacuums/page/vacuumPageKit';

const sample = (id: string) => cleanerSamples().find((s) => s.id === id)!.c;

describe('vacuum page sections and Now', () => {
  it('gives a robot its four sections and a stick its two', () => {
    expect(sectionsOf(sample('ready')).map((s) => s.id)).toEqual(['cleaning', 'upkeep', 'record', 'settings']);
    expect(sectionsOf(sample('stick-ready')).map((s) => s.id)).toEqual(['stick', 'energy']);
  });

  it('leaves out sections a plainer robot has nothing for', () => {
    expect(sectionsOf(sample('other')).map((s) => s.id)).not.toContain('settings');
  });

  it('puts in Now only what is running or needs the owner', () => {
    expect([...nowIds(sample('ready'))]).toEqual([]);
    expect([...nowIds(sample('cleaning'))]).toEqual(['status', 'rooms']);
    expect(nowIds(sample('chores')).has('station')).toBe(true);
    expect(nowIds(sample('worn')).has('care')).toBe(true);
    expect([...nowIds(sample('stick-full'))]).toEqual(['dock']);
  });
});
