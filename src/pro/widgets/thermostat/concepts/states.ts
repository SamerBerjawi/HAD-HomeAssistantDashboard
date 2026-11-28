/** Named Thermostat states for the Widget Design Studio, built with the real model builder. */
import type { ResolvedEntity } from '@/types';
import { buildThermostatModel, type ProThermostatModel } from '../../../lib/overviewThermostat';
import type { WidgetState } from '../../../studio/types';

const climate = (id: string, room: string, state: string, attrs: Record<string, unknown>) =>
  ({
    entity_id: `climate.${id}`,
    domain: 'climate',
    name: `${room} Thermostat`,
    state,
    area: { name: room },
    attributes: { friendly_name: `${room} Thermostat`, hvac_modes: ['off', 'heat', 'cool', 'heat_cool'], min_temp: 7, max_temp: 35, target_temp_step: 0.5, ...attrs }
  }) as unknown as ResolvedEntity;

const living = (state: string, action: string, current: number, target: number) =>
  climate('living', 'Living Room', state, { current_temperature: current, temperature: target, hvac_action: action, current_humidity: 48 });
const bedroom = climate('bedroom', 'Bedroom', 'heat', { current_temperature: 20.5, temperature: 21, hvac_action: 'idle', current_humidity: 50 });
const office = climate('office', 'Office', 'off', { current_temperature: 19.2, hvac_action: 'off' });
const build = (e: ResolvedEntity[]) => buildThermostatModel(e);

export const THERMOSTAT_STATES: WidgetState<ProThermostatModel>[] = [
  { id: 'cooling', label: 'Cooling', model: build([living('cool', 'cooling', 23.6, 21), bedroom, office]) },
  { id: 'heating', label: 'Heating', model: build([living('heat', 'heating', 18.4, 21.5), bedroom]) },
  { id: 'idle', label: 'Idle', model: build([living('heat', 'idle', 21, 21), bedroom]) },
  { id: 'off', label: 'Off', model: build([climate('living', 'Living Room', 'off', { current_temperature: 20.1, hvac_action: 'off' })]) },
  {
    id: 'fahrenheit',
    label: '°F',
    model: build([
      climate('living', 'Living Room', 'heat', { current_temperature: 66, temperature: 70, hvac_action: 'heating', temperature_unit: '°F', min_temp: 45, max_temp: 95, target_temp_step: 1 })
    ])
  },
  { id: 'none', label: 'No thermostats', model: build([]) }
];
