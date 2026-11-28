/** Named Switches states for the Widget Design Studio, built with the real model builder. */
import type { ResolvedEntity } from '@/types';
import { buildControlDomainModel, type ProControlDomainModel } from '../../../lib/overviewControls';
import type { WidgetState } from '../../../studio/types';

const sw = (id: string, name: string, room: string, on: boolean, power?: number) =>
  ({
    entity_id: `switch.${id}`,
    domain: 'switch',
    name,
    state: on ? 'on' : 'off',
    area: { name: room },
    powerWatts: on ? power : undefined,
    attributes: { friendly_name: name }
  }) as unknown as ResolvedEntity;

const build = (e: ResolvedEntity[]) => buildControlDomainModel('switches', e);

const day = [
  sw('coffee', 'Coffee Machine', 'Kitchen', true, 1200),
  sw('desk', 'Desk Plug', 'Office', true, 85),
  sw('tv', 'TV & Soundbar', 'Living Room', true, 140),
  sw('heater', 'Bathroom Heater', 'Bathroom', false, 2000),
  sw('garden', 'Garden Lights Plug', 'Garden', false, 40),
  sw('dehum', 'Dehumidifier', 'Basement', true, 260)
];

export const SWITCHES_STATES: WidgetState<ProControlDomainModel>[] = [
  { id: 'day', label: 'Daytime', model: build(day) },
  { id: 'heavy', label: 'Heavy load', model: build(day.map((e) => (e.entity_id === 'switch.heater' ? sw('heater', 'Bathroom Heater', 'Bathroom', true, 2000) : e))) },
  { id: 'off', label: 'All off', model: build(day.map((e) => ({ ...e, state: 'off', powerWatts: undefined }) as ResolvedEntity)) },
  { id: 'nopower', label: 'No power data', model: build(day.map((e) => ({ ...e, powerWatts: undefined }) as ResolvedEntity)) },
  {
    id: 'many',
    label: 'Many switches',
    model: build([
      ...day,
      sw('fridge', 'Garage Fridge', 'Garage', true, 110),
      sw('router', 'Network Rack', 'Office', true, 45),
      sw('xmas', 'Holiday Lights', 'Living Room', false, 60),
      sw('pump', 'Pool Pump', 'Garden', true, 750)
    ])
  },
  { id: 'none', label: 'No switches', model: build([]) }
];
