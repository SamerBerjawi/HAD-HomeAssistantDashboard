/**
 * A car as one HA device (Area page build, phase 1): its entities (battery, range, charging, lock,
 * climate, tracker) become one `CarTileModel`, and the entity ids the actions need. Integrations
 * name things differently (Tesla, Kia / Hyundai, VW, BMW, Ford…), so each part is found by device
 * class first, then by words in the entity id or name.
 *
 * A device counts as a car when it has a range sensor, or a lock or climate together with a
 * battery and a tracker or charging state; door locks, thermostats and phones don't.
 */
import type { ResolvedEntity } from '@/types';
import type { CarTileModel } from '../tileTypes';
import { base, deviceClass, num, str, type MapContext } from './haTileModels';

export interface CarTargets {
  lock?: string;
  climate?: string;
  /** A switch that starts / stops charging. */
  charge?: string;
  /** A number entity for the charge limit. */
  chargeLimit?: string;
}

const words = (e: ResolvedEntity) => `${e.entity_id} ${e.name ?? ''}`.toLowerCase();
const has = (e: ResolvedEntity, re: RegExp) => re.test(words(e));

function find(list: readonly ResolvedEntity[], domain: string, test: (e: ResolvedEntity) => boolean) {
  return list.find((e) => e.domain === domain && test(e));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

/** The car's parts, or null when the device isn't a car. */
export function carParts(entities: readonly ResolvedEntity[]) {
  const battery =
    find(entities, 'sensor', (e) => deviceClass(e) === 'battery' && !has(e, /12v|12 v|key|phone/)) ?? find(entities, 'sensor', (e) => has(e, /state_of_charge|\bsoc\b|_soc|battery_level|ev_battery/) && num(e.state) !== null);
  const range = find(entities, 'sensor', (e) => has(e, /range/) && !has(e, /fuel/) && (deviceClass(e) === 'distance' || /km|mi/.test(String(e.attributes?.unit_of_measurement ?? ''))));
  const chargingBinary = find(entities, 'binary_sensor', (e) => deviceClass(e) === 'battery_charging' || has(e, /charging/));
  const plugBinary = find(entities, 'binary_sensor', (e) => deviceClass(e) === 'plug' || has(e, /plug|cable|charger_connected/));
  const chargingText = find(entities, 'sensor', (e) => has(e, /charging_state|charge_state|charging status|charging_status/) && num(e.state) === null);
  const chargePower = find(entities, 'sensor', (e) => deviceClass(e) === 'power' && has(e, /charg/));
  const chargeTime = find(entities, 'sensor', (e) => has(e, /time_to_full|time to full|charge_time|charging_time|remaining_charg/) && num(e.state) !== null);
  const limit = find(entities, 'number', (e) => has(e, /charge_limit|charge limit|target_soc|charging_target|max_charge/)) ?? find(entities, 'sensor', (e) => has(e, /charge_limit|target_soc/));
  const chargeSwitch = find(entities, 'switch', (e) => has(e, /charg/));
  const lock = find(entities, 'lock', () => true);
  const climate = find(entities, 'climate', () => true);
  const tracker = find(entities, 'device_tracker', () => true);

  const charging = Boolean(chargingBinary || plugBinary || chargingText);
  const isCar = Boolean(range) || (Boolean(lock || climate) && Boolean(battery) && (Boolean(tracker) || charging));
  if (!isCar) return null;
  return { battery, range, chargingBinary, plugBinary, chargingText, chargePower, chargeTime, limit, chargeSwitch, lock, climate, tracker };
}

function chargingState(p: NonNullable<ReturnType<typeof carParts>>): CarTileModel['charging'] {
  const text = p.chargingText?.state.toLowerCase() ?? '';
  if (p.chargingBinary?.state === 'on' || /^charging|in.progress/.test(text)) return 'charging';
  if (p.plugBinary?.state === 'on' || /plugged|connected|complete|stopped|waiting/.test(text)) return /disconnected|unplugged/.test(text) ? 'unplugged' : 'plugged';
  if (p.plugBinary || p.chargingText || p.chargingBinary) return 'unplugged';
  return null;
}

/** "Home", "Away", or the zone's name. */
function place(tracker: ResolvedEntity | undefined): string | null {
  if (!tracker || tracker.state === 'unavailable' || tracker.state === 'unknown') return null;
  if (tracker.state === 'home') return 'Home';
  if (tracker.state === 'not_home') return 'Away';
  return cap(tracker.state);
}

/**
 * One car device → the tile model (focus: battery; the page sets the focus per X-small / Small tile)
 * and the entities its actions call. `name` is the device's name.
 */
export function carModel(entities: readonly ResolvedEntity[], name: string, deviceId: string, ctx: MapContext): { model: CarTileModel; targets: CarTargets } | null {
  const p = carParts(entities);
  if (!p) return null;
  const main = p.battery ?? p.range ?? p.tracker ?? p.lock ?? p.climate!;
  const b = base(main, ctx);
  const powerRaw = p.chargePower ? num(p.chargePower.state) : null;
  const powerUnit = String(p.chargePower?.attributes?.unit_of_measurement ?? 'kW');
  const chargeKw = powerRaw === null ? null : powerUnit === 'W' ? Math.round(powerRaw / 100) / 10 : powerRaw;
  const timeRaw = p.chargeTime ? num(p.chargeTime.state) : null;
  const timeUnit = String(p.chargeTime?.attributes?.unit_of_measurement ?? 'min');
  const charging = chargingState(p);
  const picture = entities.map((e) => str(e.attributes?.entity_picture)).find(Boolean) ?? null;
  // The car "sleeps" when its main entities are unavailable; the tile says Asleep then.
  const available = [p.battery, p.range, p.tracker, p.lock].some((e) => e && e.state !== 'unavailable');
  return {
    model: {
      kind: 'car',
      ...b,
      entityId: `device.${deviceId}`,
      name,
      available,
      isOn: charging === 'charging' || (p.climate ? p.climate.state !== 'off' && p.climate.state !== 'unavailable' : false),
      focus: 'battery',
      battery: p.battery ? num(p.battery.state) : null,
      rangeKm: p.range ? num(p.range.state) : null,
      charging,
      chargeKw: charging === 'charging' ? chargeKw : null,
      chargeLimit: p.limit ? num(p.limit.state) : null,
      chargeMinutes: charging === 'charging' && timeRaw !== null ? Math.round(timeUnit.startsWith('h') ? timeRaw * 60 : timeRaw) : null,
      locked: p.lock && p.lock.state !== 'unavailable' ? p.lock.state === 'locked' : null,
      climateOn: p.climate && p.climate.state !== 'unavailable' ? p.climate.state !== 'off' : null,
      cabinTemp: p.climate ? num(p.climate.attributes?.current_temperature) : null,
      climateTarget: p.climate ? num(p.climate.attributes?.temperature) : null,
      location: place(p.tracker),
      picture: picture ? (ctx.picture ? ctx.picture(picture) : picture) : null,
      uploadedPicture: null,
      can: { lock: Boolean(p.lock), climate: Boolean(p.climate), charge: Boolean(p.chargeSwitch) }
    },
    targets: { lock: p.lock?.entity_id, climate: p.climate?.entity_id, charge: p.chargeSwitch?.entity_id, chargeLimit: p.limit?.domain === 'number' ? p.limit.entity_id : undefined }
  };
}
