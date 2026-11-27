import { describe, expect, it } from 'vitest';
import { applySampleAction, clockOf, groupName, groupsOf, homeLine, leadPlayer, positionNow, tintOf } from '@/pro/lib/mediaHome';
import { sampleMediaHome } from '@/pro/lib/media/sampleMedia';

describe('media home', () => {
  it('says what plays where', () => {
    expect(homeLine(sampleMediaHome('evening'))).toBe('Playing in Living room');
    expect(homeLine(sampleMediaHome('party'))).toBe('Playing in Living room + 2');
    expect(homeLine(sampleMediaHome('quiet'))).toBe('Nothing playing');
    expect(homeLine(sampleMediaHome('mixed'))).toBe('Playing in 2 places');
  });

  it('keeps a group together, the leader first', () => {
    const groups = groupsOf(sampleMediaHome('party').players);
    expect(groups[0].map((p) => p.id)).toEqual(['hp-living', 'hp-kitchen', 'hp-bedroom']);
    expect(groupName(groups[0])).toBe('Living room + 2');
    expect(groups).toHaveLength(3);
  });

  it('leads with music before TV, playing before paused', () => {
    expect(leadPlayer(sampleMediaHome('tv'))?.id).toBe('tv-living');
    expect(leadPlayer(sampleMediaHome('evening'))?.id).toBe('hp-living');
    expect(leadPlayer(sampleMediaHome('evening'), 'hp-kitchen')?.id).toBe('hp-kitchen');
  });

  it('counts the position on while playing', () => {
    const home = sampleMediaHome('evening');
    const p = home.players.find((x) => x.id === 'hp-living')!;
    expect(positionNow(p, home.now + 10_000)).toBe(81);
    expect(clockOf(81)).toBe('1:21');
    expect(clockOf(3725)).toBe('1:02:05');
  });

  it('groups and ungroups rooms like AirPlay', () => {
    let home = sampleMediaHome('evening');
    home = applySampleAction(home, 'hp-living', { type: 'group', with: ['hp-living', 'hp-kitchen'] });
    const kitchen = home.players.find((x) => x.id === 'hp-kitchen')!;
    expect(kitchen).toMatchObject({ state: 'playing', group: ['hp-living'] });
    expect(kitchen.media?.title).toBe('Neon Harbour');
    // Pausing the leader pauses the group.
    home = applySampleAction(home, 'hp-living', { type: 'play-pause' });
    expect(home.players.find((x) => x.id === 'hp-kitchen')?.state).toBe('paused');
    // Dropping the kitchen stops it there.
    home = applySampleAction(home, 'hp-living', { type: 'group', with: ['hp-living'] });
    expect(home.players.find((x) => x.id === 'hp-kitchen')).toMatchObject({ state: 'idle', group: [], media: null });
  });

  it('skips to the next track from the queue', () => {
    const home = applySampleAction(sampleMediaHome('evening'), 'hp-living', { type: 'next' });
    const p = home.players.find((x) => x.id === 'hp-living')!;
    expect(p.media?.title).toBe('Copper Skies');
    expect(p.queue[0].title).toBe('Undertow');
  });

  it('tints by the artwork’s hue, neutral without one', () => {
    expect(tintOf({ src: null, hue: 262 }, false).hue).toBe(262);
    expect(tintOf(null, true).hue).toBeNull();
  });
});
