import { describe, expect, it } from 'vitest';
import type { ResolvedEntity } from '@/types';
import type { VacuumDeviceData } from '@/types/vacuum';
import {
  buildFansOverviewModel,
  buildVacuumsOverviewModel,
  filterAndGroupFanItems
} from '../src/pro/lib/overviewAppliances';
import {
  buildMediaOverviewModel,
  buildMediaUpNextQueue,
  generateSongWaveform
} from '../src/pro/lib/overviewMedia';

function makeEntity(
  entityId: string,
  state: string,
  name: string,
  attrs: Record<string, unknown> = {},
  areaName?: string
): ResolvedEntity {
  return {
    entity_id: entityId,
    state,
    attributes: attrs,
    domain: entityId.split('.')[0],
    name,
    area_id: areaName ? areaName.toLowerCase().replace(/\s+/g, '_') : null,
    area: areaName ? { area_id: areaName.toLowerCase(), name: areaName } : null,
    floor_id: null,
    device_id: null,
    resolutionSource: 'direct_entity_area',
    hidden: false,
    isDiagnostic: false,
    disabled_by: null
  };
}

function makeVacuumDevice(overrides: Partial<VacuumDeviceData> = {}): VacuumDeviceData {
  return {
    entityId: 'vacuum.roborock',
    name: 'Roborock S8',
    state: 'docked',
    batteryLevel: 92,
    batteryCharging: true,
    statusText: 'Docked & Charged',
    fanSpeed: 'Balanced',
    fanSpeedList: ['Quiet', 'Balanced', 'Turbo', 'Max'],
    waterFlowList: [],
    availableMaps: [],
    consumables: {},
    supports: {
      pause: true,
      stop: true,
      returnToBase: true,
      fanSpeed: true,
      battery: true,
      status: true,
      locate: true,
      cleanSpot: true,
      map: true
    },
    ...overrides
  };
}

describe('overviewAppliances & overviewMedia helpers', () => {
  it('builds fans model with active counts, average speed, and room grouping', () => {
    const f1 = makeEntity(
      'fan.living_tower',
      'on',
      'Living Room Tower',
      { percentage: 75, oscillating: true, preset_modes: ['Normal', 'Sleep'] },
      'Living Room'
    );
    const f2 = makeEntity('fan.office_desk', 'on', 'Office Desk', { percentage: 45 }, 'Office');
    const f3 = makeEntity('fan.bedroom_ceiling', 'off', 'Bedroom Ceiling', { percentage: 0 }, 'Bedroom');

    const model = buildFansOverviewModel([f3, f2, f1]);
    expect(model.onCount).toBe(2);
    expect(model.totalCount).toBe(3);
    expect(model.avgSpeedPct).toBe(60);
    expect(model.oscillatingCount).toBe(1);
    expect(model.badgeText).toBe('60% avg');
    expect(model.badgeTone).toBe('accent');
    expect(model.items[0].isOn).toBe(true);
    expect(model.items[2].entityId).toBe('fan.bedroom_ceiling');

    const groups = filterAndGroupFanItems(model.items, { onlyOn: true });
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.roomName)).toEqual(['Living Room', 'Office']);
  });

  it('builds vacuums model prioritizing error/cleaning vacuums and assigning semantic battery & status tones', () => {
    const docked = makeVacuumDevice({ entityId: 'vacuum.downstairs', name: 'Downstairs Bot', state: 'docked', batteryLevel: 100 });
    const cleaning = makeVacuumDevice({
      entityId: 'vacuum.upstairs',
      name: 'Upstairs Bot',
      state: 'cleaning',
      currentRoom: 'Kitchen',
      batteryLevel: 38
    });

    const model = buildVacuumsOverviewModel([docked, cleaning]);
    expect(model.primaryVacuum?.entityId).toBe('vacuum.upstairs');
    expect(model.cleaningCount).toBe(1);
    expect(model.badgeTone).toBe('success');
    expect(model.badgeText).toBe('Cleaning');
    expect(model.primaryVacuum?.batteryTone).toBe('warning');
    expect(model.items[1].batteryTone).toBe('success');

    const faultModel = buildVacuumsOverviewModel([
      makeVacuumDevice({ state: 'error', batteryLevel: 14 })
    ]);
    expect(faultModel.badgeTone).toBe('danger');
    expect(faultModel.badgeText).toBe('Attention');
    expect(faultModel.primaryVacuum?.batteryTone).toBe('danger');
  });

  it('generates deterministic, song-specific waveforms within valid percentage bounds', () => {
    const waveA1 = generateSongWaveform('After Hours', 'The Weekend Dreamer', 234, 40);
    const waveA2 = generateSongWaveform('After Hours', 'The Weekend Dreamer', 234, 40);
    const waveB = generateSongWaveform('Velvet Skyline', 'Klara Sol', 212, 40);

    expect(waveA1).toHaveLength(40);
    expect(waveA1).toEqual(waveA2);
    expect(waveA1).not.toEqual(waveB);
    for (const h of [...waveA1, ...waveB]) {
      expect(h).toBeGreaterThanOrEqual(16);
      expect(h).toBeLessThanOrEqual(96);
    }
  });

  it('resolves live queue attributes first and falls back to rotated demo queue in demo mode', () => {
    const livePlayer = makeEntity('media_player.sonos', 'playing', 'Sonos Arc', {
      media_title: 'Current Track',
      queue: [
        { media_title: 'Song Two', media_artist: 'Artist B', media_duration: 185 },
        { media_title: 'Song Three', media_artist: 'Artist C', media_duration: 210 }
      ]
    });
    const liveQueue = buildMediaUpNextQueue(livePlayer, false);
    expect(liveQueue.source).toBe('live');
    expect(liveQueue.tracks).toHaveLength(2);
    expect(liveQueue.tracks[0].durationLabel).toBe('3:05');

    const plainLivePlayer = makeEntity('media_player.sonos', 'playing', 'Sonos Arc', {
      media_title: 'After Hours (Lofi Ambient Cover)'
    });
    expect(buildMediaUpNextQueue(plainLivePlayer, false)).toEqual({ tracks: [], source: 'unavailable' });

    const demoQueue = buildMediaUpNextQueue(plainLivePlayer, true);
    expect(demoQueue.source).toBe('demo');
    expect(demoQueue.tracks.length).toBeGreaterThan(2);
    expect(demoQueue.tracks.some((t) => t.title === 'After Hours (Lofi Ambient Cover)')).toBe(false);

    const idlePlayer = makeEntity('media_player.bedroom', 'idle', 'Bedroom HomePod');
    const mediaModel = buildMediaOverviewModel({
      mediaEntities: [idlePlayer, plainLivePlayer],
      isDemo: true
    });
    expect(mediaModel.activePlayer?.entityId).toBe('media_player.sonos');
    expect(mediaModel.playingCount).toBe(1);
    expect(mediaModel.badgeTone).toBe('accent');
  });
});
