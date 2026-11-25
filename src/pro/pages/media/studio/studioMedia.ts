import { MEDIA_FIXTURE_ENTITIES } from '../../../widgets/media/fixture';
import { buildMediaOverviewModel } from '../../../lib/overviewMedia';

export type Scenario = 'Busy' | 'Quiet' | 'Missing metadata' | 'No players';

export function studioPlayers(scenario: Scenario) {
  const entities = MEDIA_FIXTURE_ENTITIES.map((entity, index) => {
    const attributes = { ...entity.attributes };
    if (index === 0 && scenario !== 'Missing metadata') {
      attributes.media_image = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop';
    }
    if (index === 1) attributes.source = 'Radio One';
    if (index === 2) {
      attributes.media_title = 'Planet Earth';
      attributes.media_artist = 'Mountains · Episode 2';
      attributes.media_duration = 2940;
      attributes.media_position = 812;
      attributes.supported_features = 16385; // Play and pause, without seeking.
    }
    if (scenario === 'Missing metadata') {
      delete attributes.media_title;
      delete attributes.media_artist;
    }

    const state = scenario === 'Quiet' ? entity.state === 'playing' ? 'paused' : entity.state
      : scenario === 'Missing metadata' && index === 2 ? 'unavailable' : 'playing';
    return { ...entity, attributes, state };
  });
  const players = buildMediaOverviewModel({ mediaEntities: scenario === 'No players' ? [] : entities }).players;
  // The Overview model supplies a demo duration for untimed streams. Use the fixture's actual timing here.
  return players.map(player => {
    const entity = entities.find(item => item.entity_id === player.entityId);
    return { ...player, durationSecs: Number(entity?.attributes.media_duration) || 0 };
  });
}

export type StudioPlayer = ReturnType<typeof studioPlayers>[number];

export function pauseStudioPlayer(players: StudioPlayer[], id: string) {
  return players.map(p => p.entityId === id ? { ...p, state: 'paused', isPlaying: false, isPaused: true } : p);
}
