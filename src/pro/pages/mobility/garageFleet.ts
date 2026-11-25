import type { ResolvedEntity } from '@/types';
import { carParts } from '../../areas/ha/haCar';
import { num } from '../../areas/ha/haTileModels';
import type { Vehicle } from './vehicle';

export function garageFleet(entities: Record<string, ResolvedEntity>): Vehicle[] {
  const groups = new Map<string, ResolvedEntity[]>();
  for (const e of Object.values(entities)) {
    if (!e.device_id || e.hidden || e.disabled_by || e.device?.disabled_by) continue;
    const group = groups.get(e.device_id);
    if (group) group.push(e);
    else groups.set(e.device_id, [e]);
  }
  const result: Vehicle[] = [];
  for (const [id, group] of groups) {
    const device = group[0].device;
    const signature = [device?.manufacturer, device?.model, device?.name, ...group.map(e => e.entity_id)].join(' ');
    const bike = /cowboy|dark_avenger|(?:^|[ ._-])(?:e-?bike|bike|bicycle)(?:$|[ ._-])/i.test(signature);
    const parts = carParts(group);
    const ford = /fordpass/i.test(signature);
    if (!bike && !parts && !ford) continue;
    const sensor = (pattern: RegExp) => group.find(e => e.domain === 'sensor' && pattern.test(e.entity_id));
    const battery = bike ? sensor(/(?:remaining_battery|bike_battery|cowboy_battery)(?:_\d+)?$/) ?? parts?.battery : parts?.battery ?? sensor(/_soc$/);
    const range = parts?.range ?? sensor(/_(?:elveh|range|remaining_range)$/);
    const lock = parts?.lock ?? group.find(e => e.domain === 'lock');
    const tracker = parts?.tracker ?? group.find(e => e.domain === 'device_tracker');
    const charging = parts?.chargingBinary?.state === 'on' || /^charging$/i.test((parts?.chargingText ?? sensor(/_elvehcharging$/))?.state ?? '');
    const state = charging ? 'Charging' : lock?.state === 'locked' ? 'Locked' : lock?.state === 'unlocked' ? 'Unlocked' : 'State unknown';
    const place = tracker?.state;
    result.push({ id, kind: bike ? 'Bike' : 'Car', name: device?.name_by_user || device?.name || id,
      charge: battery ? num(battery.state) : null, range: range ? num(range.state) : null,
      rangeUnit: String(range?.attributes.unit_of_measurement || 'km'), state,
      place: !place || ['unknown','unavailable'].includes(place) ? '' : place === 'home' ? 'Home' : place === 'not_home' ? 'Away' : place });
  }
  return result.sort((a,b) => a.name.localeCompare(b.name));
}
