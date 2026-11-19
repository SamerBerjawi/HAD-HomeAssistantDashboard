import { describe, expect, it } from 'vitest';
import { buildOverviewStatusPills, personInitials, type BuildOverviewPillsInput } from '@/pro/lib/overviewPills';
import type { ResolvedEntity } from '@/types';

const entity = (entity_id: string, state: string, name = entity_id, attributes: Record<string, unknown> = {}): ResolvedEntity => ({
  entity_id,
  domain: entity_id.split('.')[0],
  name,
  state,
  attributes,
  area_id: null,
  device_id: null,
  floor_id: null,
  resolutionSource: 'direct_entity_area' as ResolvedEntity['resolutionSource'],
  hidden: false,
  isDiagnostic: false
});

const emptyInput = (): BuildOverviewPillsInput => ({
  activeSmoke: [],
  activeLeaks: [],
  alarmEntity: undefined,
  openDoors: [],
  openWindows: [],
  activeMotion: [],
  peopleInZones: [],
  onLights: [],
  onSwitches: [],
  activeFans: [],
  cleaningVacuumsCount: 0,
  playingMedia: []
});

describe('overviewPills', () => {
  it('returns an empty list when nothing is active', () => {
    expect(buildOverviewStatusPills(emptyInput())).toEqual([]);
  });

  it('formats person initials for single-word, multi-word, and blank names', () => {
    expect(personInitials('Sarah')).toBe('S');
    expect(personInitials('Sarah Jenkins')).toBe('SJ');
    expect(personInitials('  Alex  van  Dijk ')).toBe('AV');
    expect(personInitials('   ')).toBe('U');
  });

  it('orders hazards first, then openings/motion, armed alarm, people, and active devices', () => {
    const pills = buildOverviewStatusPills({
      activeSmoke: [entity('binary_sensor.hallway_smoke', 'on', 'Hallway Smoke')],
      activeLeaks: [entity('binary_sensor.kitchen_leak', 'wet', 'Kitchen Leak')],
      alarmEntity: entity('alarm_control_panel.home', 'triggered', 'Home Alarm'),
      openDoors: [entity('binary_sensor.front_door', 'on', 'Front Door')],
      openWindows: [entity('binary_sensor.bay_window', 'on', 'Bay Window'), entity('binary_sensor.office_window', 'on', 'Office Window')],
      activeMotion: [entity('binary_sensor.hallway_motion', 'on', 'Hallway Motion')],
      peopleInZones: [
        { entity: entity('person.alex', 'Work', 'Alex Miller'), isHome: false, zoneName: 'Work' },
        { entity: entity('person.sarah', 'home', 'Sarah Jenkins'), isHome: true, zoneName: 'Home' }
      ],
      onLights: [entity('light.kitchen', 'on', 'Kitchen'), entity('light.living', 'on', 'Living')],
      onSwitches: [entity('switch.espresso', 'on', 'Espresso')],
      activeFans: [entity('fan.office', 'on', 'Office Fan')],
      cleaningVacuumsCount: 1,
      playingMedia: [entity('media_player.sonos', 'playing', 'Sonos', { media_title: 'Blue in Green' })]
    });

    expect(pills.map((p) => p.id)).toEqual([
      'smoke',
      'leak',
      'alarm',
      'doors',
      'windows',
      'motion',
      'person:person.sarah',
      'person:person.alex',
      'lights',
      'switches',
      'fans',
      'vacuums',
      'media'
    ]);
    expect(pills.slice(0, 3).map((p) => p.tone)).toEqual(['danger', 'danger', 'danger']);
    expect(pills.slice(3, 6).map((p) => p.tone)).toEqual(['warning', 'warning', 'warning']);
    expect(pills[6].tone).toBe('success');
    expect(pills[6].badgeText).toBe('Home');
    expect(pills[7].tone).toBe('accent');
    expect(pills[7].badgeText).toBe('Work');
    expect(pills[8].tone).toBe('warning');
    expect(pills[9].tone).toBe('default');
    expect(pills[10].tone).toBe('accent');
    expect(pills[11].tone).toBe('accent');
    expect(pills[12].tone).toBe('accent');
  });

  it('handles alarm states cleanly and omits disarmed or unavailable panels', () => {
    const armedHome = buildOverviewStatusPills({ ...emptyInput(), alarmEntity: entity('alarm_control_panel.home', 'armed_home') });
    expect(armedHome).toMatchObject([{ id: 'alarm', tone: 'success', badgeText: 'Armed home' }]);

    const arming = buildOverviewStatusPills({ ...emptyInput(), alarmEntity: entity('alarm_control_panel.home', 'arming') });
    expect(arming).toMatchObject([{ id: 'alarm', tone: 'warning', badgeText: 'Arming…' }]);

    const disarmed = buildOverviewStatusPills({ ...emptyInput(), alarmEntity: entity('alarm_control_panel.home', 'disarmed') });
    expect(disarmed).toEqual([]);

    const unavailable = buildOverviewStatusPills({ ...emptyInput(), alarmEntity: entity('alarm_control_panel.home', 'unavailable') });
    expect(unavailable).toEqual([]);
  });

  it('truncates single long media titles and summarizes multiple playing speakers', () => {
    const singleLong = buildOverviewStatusPills({
      ...emptyInput(),
      playingMedia: [
        entity('media_player.living', 'playing', 'Living Room', {
          media_title: 'An Extraordinarily Long Song Title That Should Truncate'
        })
      ]
    });
    expect(singleLong[0].badgeText).toBe('An Extraordinarily Long Son…');
    expect(singleLong[0].badgeText.length).toBe(28);

    const multiple = buildOverviewStatusPills({
      ...emptyInput(),
      playingMedia: [
        entity('media_player.living', 'playing', 'Living'),
        entity('media_player.office', 'playing', 'Office')
      ]
    });
    expect(multiple[0].badgeText).toBe('2 playing');
  });
});
