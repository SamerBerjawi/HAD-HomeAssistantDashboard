/** Named Lighting states for the Widget Design Studio, built with the real model builder. */
import type { ResolvedEntity } from '@/types';
import { buildControlDomainModel, type ProControlDomainModel } from '../../../lib/overviewControls';
import type { WidgetState } from '../../../studio/types';
import { LIGHTS_FIXTURE_ENTITIES } from '../fixture';

const set = (on: Record<string, number | false>) =>
  LIGHTS_FIXTURE_ENTITIES.map((e) => {
    const key = e.entity_id.replace('light.', '');
    if (!(key in on)) return { ...e, state: 'off', attributes: { ...e.attributes, brightness: undefined } } as ResolvedEntity;
    const pct = on[key];
    return pct === false ? e : ({ ...e, state: 'on', attributes: { ...e.attributes, brightness: Math.round(((pct as number) / 100) * 255) } } as ResolvedEntity);
  });

const build = (entities: ResolvedEntity[]) => buildControlDomainModel('lights', entities);

const many = Array.from(
  { length: 18 },
  (_, i) =>
    ({
      ...LIGHTS_FIXTURE_ENTITIES[i % LIGHTS_FIXTURE_ENTITIES.length],
      entity_id: `light.extra_${i}`,
      name: `${LIGHTS_FIXTURE_ENTITIES[i % LIGHTS_FIXTURE_ENTITIES.length].name} ${Math.floor(i / 10) + 1}`,
      state: i % 3 === 0 ? 'off' : 'on'
    }) as ResolvedEntity
);

export const LIGHTS_STATES: WidgetState<ProControlDomainModel>[] = [
  { id: 'evening', label: 'Evening', model: build(LIGHTS_FIXTURE_ENTITIES) },
  { id: 'few', label: 'A few on', model: build(set({ living_lamp: 35, kitchen_under: 60 })) },
  {
    id: 'bright',
    label: 'All on, bright',
    model: build(set({ living_ceiling: 100, living_lamp: 100, kitchen_island: 100, kitchen_under: 100, office_desk: 100, hall: 100, porch: 100, garden: 100, bedroom: 100, guest: 100 }))
  },
  { id: 'off', label: 'All off', model: build(set({})) },
  { id: 'many', label: 'Many lights', model: build(many) },
  {
    id: 'long',
    label: 'Long room names',
    model: build(
      LIGHTS_FIXTURE_ENTITIES.map((e, i) => ({ ...e, area: { name: ['Master Bedroom', 'Home Studio & Office', 'Kitchen & Dining', 'Living Room', 'Guest Bedroom Suite', 'Garden'][i % 6] } }) as ResolvedEntity)
    )
  }
];
