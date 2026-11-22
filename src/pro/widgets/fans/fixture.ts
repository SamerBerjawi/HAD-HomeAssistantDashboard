/** Demo/test model for the Fans widget: 4 fans, 2 on. */
import type { ResolvedEntity } from '@/types';
import { buildFansOverviewModel } from '../../lib/overviewAppliances';

const fan = (id: string, name: string, area: string, on: boolean, pct: number) =>
  ({
    entity_id: `fan.${id}`,
    domain: 'fan',
    name,
    state: on ? 'on' : 'off',
    area_name: area,
    attributes: { friendly_name: name, percentage: on ? pct : 0, percentage_step: 33.33, supported_features: 1 }
  }) as unknown as ResolvedEntity;

export const FANS_FIXTURE_ENTITIES: ResolvedEntity[] = [
  fan('bedroom_ceiling', 'Bedroom Ceiling Fan', 'Master Bedroom', true, 66),
  fan('office_tower', 'Office Tower Fan', 'Office', true, 33),
  fan('living_ceiling', 'Living Room Ceiling Fan', 'Living Room', false, 0),
  fan('guest', 'Guest Room Fan', 'Guest Bedroom', false, 0)
];

export const FANS_FIXTURE = buildFansOverviewModel(FANS_FIXTURE_ENTITIES);
