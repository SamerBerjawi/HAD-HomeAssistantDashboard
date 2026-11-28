/** Demo/test model for the Media widget. */
import type { ResolvedEntity } from '@/types';
import { buildMediaOverviewModel } from '../../lib/overviewMedia';

const player = (id: string, name: string, area: string, state: string, attrs: Record<string, unknown> = {}) =>
  ({ entity_id: `media_player.${id}`, domain: 'media_player', name, state, area_name: area, attributes: { friendly_name: name, supported_features: 152463, volume_level: 0.4, ...attrs } }) as unknown as ResolvedEntity;

export const MEDIA_FIXTURE_ENTITIES: ResolvedEntity[] = [
  player('living_room', 'Living Room Speaker', 'Living Room', 'playing', { media_title: 'Velvet Skyline', media_artist: 'Klara Sol', media_duration: 212, media_position: 64 }),
  player('kitchen', 'Kitchen Speaker', 'Kitchen', 'paused', { media_title: 'Morning News', media_artist: 'Radio One' }),
  player('tv', 'Bedroom TV', 'Bedroom', 'off')
];

export const MEDIA_FIXTURE = buildMediaOverviewModel({ mediaEntities: MEDIA_FIXTURE_ENTITIES });
