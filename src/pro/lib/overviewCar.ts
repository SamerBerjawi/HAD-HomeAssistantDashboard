/**
 * Car widget model (new widget, 2026-11-20). Turns the car metrics (`deriveCarMetrics`, any EV
 * integration the mobility page understands) into one clear state the card can show: driving,
 * charging, warming up, updating, on, plugged in, parked or asleep, plus where it is, the battery,
 * the climate, a pending software update and anything that needs attention. Pure.
 */
import type { CarEvMetrics } from '@/types/mobility';

export type CarMode = 'driving' | 'charging' | 'climate' | 'updating' | 'on' | 'plugged' | 'parked' | 'asleep';

export interface ProCarAlert {
  id: 'tyres' | 'window' | 'unlocked' | 'battery' | 'service' | 'alarm' | 'battery12v';
  text: string;
  tone: 'warning' | 'danger';
}

export interface ProCarModel {
  hasCar: boolean;
  name: string;
  /** The owner's photo of the car (mobility settings), else null and the card draws one. */
  image: string | null;
  mode: CarMode;
  modeLabel: string;
  socPct: number | null;
  range: number | null;
  rangeUnit: string;
  targetPct: number | null;
  pluggedIn: boolean;
  chargeKW: number | null;
  /** Minutes until the target charge, when the integration reports or we can estimate it. */
  chargeMinutesLeft: number | null;
  speed: number | null;
  speedUnit: string;
  gear: string | null;
  locked: boolean;
  windowsClosed: boolean;
  location: { place: string; isHome: boolean; lat: number | null; lon: number | null; sinceText: string | null };
  cabinTemp: number | null;
  outdoorTemp: number | null;
  targetCabinTemp: number | null;
  tempUnit: string;
  climateOn: boolean;
  climateMinutesLeft: number | null;
  ota: { state: 'none' | 'available' | 'installing'; text: string | null };
  alerts: ProCarAlert[];
  odometer: number | null;
  odometerUnit: string;
  updatedAgoText: string | null;
  /** Entities the card's buttons act on (null: no button). */
  controls: { lockId: string | null; climateId: string | null };
}

const OTA_INSTALLING = /install(ing)?\b.*progress|installing|in progress|updating/i;
const OTA_NONE = /up to date|no pending|none|unavailable|unknown|^$/i;
const OTA_AVAILABLE = /available|pending|ready|download|scheduled/i;

export function otaState(status: string): ProCarModel['ota']['state'] {
  if (OTA_INSTALLING.test(status)) return 'installing';
  if (OTA_NONE.test(status.trim())) return 'none';
  return OTA_AVAILABLE.test(status) ? 'available' : 'none';
}

export function carMode(p: {
  moving: boolean;
  gear: string | null;
  charging: boolean;
  climate: boolean;
  ota: ProCarModel['ota']['state'];
  ignition: boolean;
  plugged: boolean;
  asleep: boolean;
}): CarMode {
  if (p.moving || p.gear === 'D' || p.gear === 'R') return 'driving';
  if (p.charging) return 'charging';
  if (p.climate) return 'climate';
  if (p.ota === 'installing') return 'updating';
  if (p.ignition) return 'on';
  if (p.plugged) return 'plugged';
  return p.asleep ? 'asleep' : 'parked';
}

export function modeLabel(m: Pick<ProCarModel, 'mode' | 'cabinTemp' | 'targetCabinTemp' | 'socPct' | 'targetPct'>): string {
  switch (m.mode) {
    case 'driving':
      return 'Driving';
    case 'charging':
      return 'Charging';
    case 'climate':
      return m.cabinTemp !== null && m.targetCabinTemp !== null && m.cabinTemp > m.targetCabinTemp + 1 ? 'Cooling down' : 'Warming up';
    case 'updating':
      return 'Updating';
    case 'on':
      return 'On';
    case 'plugged':
      return m.socPct !== null && m.targetPct !== null && m.socPct >= m.targetPct ? 'Charged' : 'Plugged in';
    case 'asleep':
      return 'Asleep';
    default:
      return 'Parked';
  }
}

const n = (v: unknown): number | null => {
  const x = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseFloat(v) : Number.NaN;
  return Number.isFinite(x) ? x : null;
};

/** Rough minutes to the target, assuming a usable pack of `packKWh`. */
export function estimateChargeMinutes(soc: number | null, target: number | null, kw: number | null, packKWh = 70): number | null {
  if (soc === null || target === null || kw === null || kw <= 0.2 || target <= soc) return null;
  return Math.round((((target - soc) / 100) * packKWh * 60) / kw);
}

export function buildCarModel(c: CarEvMetrics | null, name = 'Car', opts: { packKWh?: number; locationSince?: string | null } = {}): ProCarModel {
  // An EV integration reports a charge or a range; ignition and zone always have a default.
  const has = Boolean(c && (c.soc !== undefined || c.range !== undefined));
  const soc = n(c?.soc);
  const target = n(c?.targetSocPercent) ?? n(c?.targetSoc);
  const chargingWord = String(c?.chargingState ?? '');
  const charging = Boolean(c) && /^charging|in progress/i.test(chargingWord);
  const kw = n(c?.chargingPowerKW);
  const ota = otaState(String(c?.softwareUpdates?.firmwareStatus ?? ''));
  const gear = c?.gearPosition && c.gearPosition !== 'Unknown' ? c.gearPosition.trim().charAt(0).toUpperCase() : null;
  const mode = carMode({
    moving: Boolean(c?.isMoving),
    gear,
    charging,
    climate: Boolean(c?.remoteClimateActive),
    ota,
    ignition: Boolean(c?.ignitionOn),
    plugged: Boolean(c?.isPluggedIn),
    asleep: Boolean(c?.deepSleep)
  });
  const alerts: ProCarAlert[] = [];
  if (c) {
    if (/triggered/i.test(c.alarmStatus)) alerts.push({ id: 'alarm', text: 'Car alarm!', tone: 'danger' });
    if (soc !== null && soc < 15 && !charging) alerts.push({ id: 'battery', text: `Battery low · ${soc}%`, tone: soc < 8 ? 'danger' : 'warning' });
    if (c.hasTirePressure && c.tirePressure?.status && !/normal|ok/i.test(c.tirePressure.status)) alerts.push({ id: 'tyres', text: 'Check tyres', tone: 'warning' });
    if (!c.windowsClosed && mode !== 'driving') alerts.push({ id: 'window', text: 'Window open', tone: 'warning' });
    if (!c.doorsLocked && mode !== 'driving' && mode !== 'on' && !c.isAtHome) alerts.push({ id: 'unlocked', text: 'Unlocked, away', tone: 'danger' });
    if (c.indicatorsStatus && !/normal|ok|none|unavailable/i.test(c.indicatorsStatus)) alerts.push({ id: 'service', text: c.indicatorsStatus, tone: 'warning' });
  }
  const base = {
    mode,
    cabinTemp: n(c?.cabinTemp),
    targetCabinTemp: n(c?.targetCabinTemp),
    socPct: soc === null ? null : Math.round(soc),
    targetPct: target === null ? null : Math.round(target)
  };
  return {
    hasCar: has,
    name,
    image: c?.customVehicleImage ?? null,
    ...base,
    modeLabel: modeLabel(base),
    range: n(c?.range),
    rangeUnit: c?.rangeUnit ?? 'km',
    pluggedIn: Boolean(c?.isPluggedIn),
    chargeKW: charging ? kw : null,
    chargeMinutesLeft: charging ? estimateChargeMinutes(base.socPct, base.targetPct, kw, opts.packKWh) : null,
    speed: mode === 'driving' ? n(c?.speed) : null,
    speedUnit: c?.speedUnit ?? 'km/h',
    gear,
    locked: Boolean(c?.doorsLocked),
    windowsClosed: c?.windowsClosed ?? true,
    location: {
      place: c ? (c.isAtHome ? 'Home' : c.locationZone && !/^away$/i.test(c.locationZone) ? c.locationZone.replace(/^In\s+|\s+Zone$/gi, '') : 'Away') : 'Unknown',
      isHome: Boolean(c?.isAtHome),
      lat: n(c?.gps?.latitude),
      lon: n(c?.gps?.longitude),
      sinceText: opts.locationSince ?? null
    },
    outdoorTemp: n(c?.outdoorTemp),
    tempUnit: c?.cabinTempUnit ?? '°C',
    climateOn: Boolean(c?.remoteClimateActive),
    climateMinutesLeft: n(c?.remoteClimateTimeRemaining),
    ota: { state: ota, text: ota === 'none' ? null : String(c?.softwareUpdates?.firmwareStatus ?? '') || null },
    alerts,
    odometer: n(c?.odometer),
    odometerUnit: c?.odometerUnit ?? 'km',
    updatedAgoText: null,
    controls: { lockId: c?.controls?.unlockDoorLockId || null, climateId: c?.controls?.startClimateSwitchId || null }
  };
}

/** The one line under the state: what matters most in this state. */
export function carLine(m: ProCarModel, short = false): string {
  if (short) return carLineShort(m);
  const range = m.range !== null ? `${Math.round(m.range)} ${m.rangeUnit}` : null;
  switch (m.mode) {
    case 'driving':
      return [m.speed !== null ? `${Math.round(m.speed)} ${m.speedUnit}` : null, range ? `${range} left` : null].filter(Boolean).join(' · ');
    case 'charging':
      return (
        [m.chargeKW !== null ? `${m.chargeKW.toFixed(1)} kW` : null, m.chargeMinutesLeft !== null ? `full in ${durationText(m.chargeMinutesLeft)}` : null].filter(Boolean).join(' · ') || 'Charging'
      );
    case 'climate':
      return [
        m.cabinTemp !== null ? `Cabin ${Math.round(m.cabinTemp)}${m.tempUnit}` : null,
        m.targetCabinTemp !== null ? `to ${Math.round(m.targetCabinTemp)}${m.tempUnit}` : null,
        m.climateMinutesLeft !== null ? `${m.climateMinutesLeft} min left` : null
      ]
        .filter(Boolean)
        .join(' · ');
    case 'updating':
      return m.ota.text ?? 'Installing software';
    default:
      return [m.location.isHome ? 'At home' : `At ${m.location.place}`, m.location.sinceText].filter(Boolean).join(' · ');
  }
}

/** The short form for small cards: one fact. */
function carLineShort(m: ProCarModel): string {
  switch (m.mode) {
    case 'driving':
      return m.speed !== null ? `${Math.round(m.speed)} ${m.speedUnit}` : 'On the road';
    case 'charging':
      return m.chargeMinutesLeft !== null ? `Full in ${durationText(m.chargeMinutesLeft)}` : m.chargeKW !== null ? `${m.chargeKW.toFixed(1)} kW` : 'Charging';
    case 'climate':
      return m.cabinTemp !== null && m.targetCabinTemp !== null ? `${Math.round(m.cabinTemp)}° → ${Math.round(m.targetCabinTemp)}°` : 'Climate on';
    case 'updating':
      return 'Installing software';
    default:
      return m.location.isHome ? 'At home' : m.location.place;
  }
}

export function durationText(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
