/** Demo/test model for Family presence: 4 people, 3 at home. */
import type { ResolvedEntity } from '@/types';
import { buildOverviewPresenceModel } from '../../lib/overviewPresence';

const person = (id: string, name: string, state: string) =>
  ({ entity_id: `person.${id}`, domain: 'person', name, state, attributes: { friendly_name: name } }) as unknown as ResolvedEntity;

export const PRESENCE_FIXTURE_ENTITIES: ResolvedEntity[] = [
  person('sarah', 'Sarah', 'home'),
  person('alex', 'Alex', 'home'),
  person('mia', 'Mia', 'home'),
  person('leo', 'Leo', 'not_home')
];

export const PRESENCE_FIXTURE = buildOverviewPresenceModel({ peopleEntities: PRESENCE_FIXTURE_ENTITIES, resolvedZones: [] });
