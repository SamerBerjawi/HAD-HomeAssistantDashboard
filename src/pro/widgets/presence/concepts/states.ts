/** Named Family presence states for the Widget Design Studio, built with the real model builder. */
import type { ResolvedEntity } from '@/types';
import { buildOverviewPresenceModel, type ProOverviewPresenceModel } from '../../../lib/overviewPresence';
import type { WidgetState } from '../../../studio/types';

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const person = (id: string, name: string, state: string, minutes = 20) =>
  ({ entity_id: `person.${id}`, domain: 'person', name, state, last_changed: ago(minutes), last_updated: ago(minutes), attributes: { friendly_name: name } }) as unknown as ResolvedEntity;

const build = (people: ResolvedEntity[]) => buildOverviewPresenceModel({ peopleEntities: people, resolvedZones: [] });

export const PRESENCE_STATES: WidgetState<ProOverviewPresenceModel>[] = [
  { id: 'evening', label: 'Most home', model: build([person('sarah', 'Sarah', 'home'), person('alex', 'Alex', 'home'), person('mia', 'Mia', 'home'), person('leo', 'Leo', 'not_home', 45)]) },
  {
    id: 'day',
    label: 'Work & school',
    model: build([person('sarah', 'Sarah', 'Work', 180), person('alex', 'Alex', 'home'), person('mia', 'Mia', 'School', 240), person('leo', 'Leo', 'not_home', 30)])
  },
  { id: 'all', label: 'Everyone home', model: build([person('sarah', 'Sarah', 'home'), person('alex', 'Alex', 'home'), person('mia', 'Mia', 'home'), person('leo', 'Leo', 'home')]) },
  {
    id: 'empty',
    label: 'Nobody home',
    model: build([person('sarah', 'Sarah', 'Work', 120), person('alex', 'Alex', 'not_home', 60), person('mia', 'Mia', 'School', 200), person('leo', 'Leo', 'not_home', 15)])
  },
  {
    id: 'big',
    label: 'Big family',
    model: build([
      person('sarah', 'Sarah', 'home'),
      person('alex', 'Alex', 'home'),
      person('mia', 'Mia', 'home'),
      person('leo', 'Leo', 'School', 90),
      person('nora', 'Nora Lindqvist', 'home'),
      person('omar', 'Omar', 'not_home', 10)
    ])
  },
  { id: 'none', label: 'No people', model: build([]) }
];
