/** Named Fans states for the Widget Design Studio, built with the real model builder. */
import type { ResolvedEntity } from '@/types';
import { buildFansOverviewModel, type ProFansModel } from '../../../lib/overviewAppliances';
import type { WidgetState } from '../../../studio/types';

const fan = (id: string, room: string, pct: number, extra: Record<string, unknown> = {}) =>
  ({
    entity_id: `fan.${id}`,
    domain: 'fan',
    name: `${room} Fan`,
    state: pct > 0 ? 'on' : 'off',
    area: { name: room },
    attributes: { friendly_name: `${room} Fan`, percentage: pct, percentage_step: 33.33, supported_features: 3, ...extra }
  }) as unknown as ResolvedEntity;

const build = (e: ResolvedEntity[]) => buildFansOverviewModel(e);

export const FANS_STATES: WidgetState<ProFansModel>[] = [
  {
    id: 'running',
    label: 'Two running',
    model: build([fan('bedroom', 'Bedroom', 66, { oscillating: true }), fan('office', 'Office', 33), fan('living', 'Living Room', 0), fan('guest', 'Guest Room', 0)])
  },
  { id: 'max', label: 'Full blast', model: build([fan('bedroom', 'Bedroom', 100), fan('office', 'Office', 100), fan('living', 'Living Room', 100)]) },
  { id: 'off', label: 'All off', model: build([fan('bedroom', 'Bedroom', 0), fan('office', 'Office', 0), fan('living', 'Living Room', 0)]) },
  { id: 'one', label: 'One fan', model: build([fan('bedroom', 'Bedroom', 33)]) },
  { id: 'none', label: 'No fans', model: build([]) }
];
