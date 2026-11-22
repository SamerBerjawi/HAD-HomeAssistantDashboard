/** Demo/test model for the Switches widget. */
import type { ResolvedEntity } from '@/types';
import { buildControlDomainModel } from '../../lib/overviewControls';

const sw = (id: string, name: string, area: string, on: boolean, power?: number) =>
  ({ entity_id: `switch.${id}`, domain: 'switch', name, state: on ? 'on' : 'off', area_name: area, powerWatts: power, attributes: { friendly_name: name } }) as unknown as ResolvedEntity;

export const SWITCHES_FIXTURE_ENTITIES: ResolvedEntity[] = [
  sw('coffee', 'Coffee Machine', 'Kitchen', true, 1200),
  sw('desk_plug', 'Desk Plug', 'Office', true, 85),
  sw('heater', 'Bathroom Heater', 'Bathroom', false),
  sw('tree', 'Garden Lights Plug', 'Outside', false)
];

export const SWITCHES_FIXTURE = buildControlDomainModel('switches', SWITCHES_FIXTURE_ENTITIES);
