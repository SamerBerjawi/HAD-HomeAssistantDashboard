/**
 * Tile actions → Home Assistant service calls (Area page build, phase 2). Pure: given a tile and
 * what the user did, the calls to make, each with the state HA will report (so the tile answers at
 * once, before the round trip), and any change HA does not keep (a camera going live, rooms picked
 * for the next vacuum run, the scene that now holds), which the page keeps itself.
 *
 * Rules worth knowing:
 * - Unlocking only ever comes from the tiles' guarded controls (press, then hold); this maps it.
 * - Brightness, colour and white tone use `light.turn_on`, so they also switch a light on.
 * - A fan set to 0 % is turned off (some integrations reject 0 for `set_percentage`).
 * - A thermostat turned on goes to its first mode that isn't off (heat_cool, heat, cool, auto…).
 * - A vacuum with rooms picked cleans them with `vacuum.clean_area` (HA 2026.3+, the vacuum's
 *   segments mapped to areas in HA), when the page can tell the rooms' area ids; else `start`.
 * - A car action calls the entity of the car that does it (its lock, climate, charging switch).
 */
import type { TileAction, TileModel } from '../tileTypes';
import type { CarTargets } from './haCar';

export interface HaCall {
  domain: string;
  service: string;
  data: Record<string, unknown>;
  entityId: string;
  /** What HA will report afterwards: a new state (null: keep it) and attributes to merge. */
  optimistic?: { state: string | null; attributes?: Record<string, unknown> };
}

export interface TileActionResult {
  calls: HaCall[];
  /** Changes HA does not store, kept by the page on top of the tile's model. */
  local?: Partial<TileModel>;
}

export interface ActionOptions {
  /** A room name → its HA area id, for `vacuum.clean_area`. */
  areaIdOf?: (room: string) => string | null;
}

const NONE: TileActionResult = { calls: [] };
const call = (entityId: string, domain: string, service: string, data: Record<string, unknown> = {}, optimistic?: HaCall['optimistic']): HaCall => ({ domain, service, data, entityId, ...(optimistic ? { optimistic } : {}) });
const one = (c: HaCall, local?: Partial<TileModel>): TileActionResult => ({ calls: [c], ...(local ? { local } : {}) });

/** "rgb(255, 120, 60)", "rgb(255 120 60)" or "#ff783c" → [255, 120, 60]. */
export function parseRgb(v: string): [number, number, number] | null {
  const m = v.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  const h = v.match(/^#([0-9a-f]{6})$/i);
  if (h) return [0, 2, 4].map((i) => parseInt(h[1].slice(i, i + 2), 16)) as [number, number, number];
  return null;
}

const PREFERRED_ON = ['heat_cool', 'heat', 'cool', 'auto'];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function tileActionCalls(model: TileModel, a: TileAction, targets: CarTargets = {}, opts: ActionOptions = {}): TileActionResult {
  if (!model.available && model.kind !== 'car') return NONE;
  const id = model.entityId;
  switch (model.kind) {
    case 'light': {
      const entityDomain = id.split('.')[0] || 'light';
      if (a.type === 'toggle') return one(call(id, entityDomain, 'toggle', {}, { state: model.isOn ? 'off' : 'on' }));
      if (a.type === 'brightness') {
        const pct = clamp(Math.round(a.pct), 1, 100);
        return one(call(id, 'light', 'turn_on', { brightness_pct: pct }, { state: 'on', attributes: { brightness: Math.round(pct * 2.55) } }));
      }
      if (a.type === 'kelvin') return one(call(id, 'light', 'turn_on', { color_temp_kelvin: Math.round(a.kelvin) }, { state: 'on', attributes: { color_mode: 'color_temp', color_temp_kelvin: Math.round(a.kelvin) } }));
      if (a.type === 'color') {
        const rgb = parseRgb(a.rgb);
        return rgb ? one(call(id, 'light', 'turn_on', { rgb_color: rgb }, { state: 'on', attributes: { color_mode: 'rgb', rgb_color: rgb } })) : NONE;
      }
      return NONE;
    }
    case 'switch': {
      if (a.type !== 'toggle') return NONE;
      return one(call(id, id.split('.')[0], 'toggle', {}, { state: model.isOn ? 'off' : 'on' }));
    }
    case 'fan': {
      if (a.type === 'toggle') return one(call(id, 'fan', 'toggle', {}, { state: model.isOn ? 'off' : 'on' }));
      if (a.type === 'percentage') {
        const pct = clamp(Math.round(a.pct), 0, 100);
        return pct === 0 ? one(call(id, 'fan', 'turn_off', {}, { state: 'off' })) : one(call(id, 'fan', 'set_percentage', { percentage: pct }, { state: 'on', attributes: { percentage: pct } }));
      }
      if (a.type === 'preset') return one(call(id, 'fan', 'set_preset_mode', { preset_mode: a.mode }, { state: 'on', attributes: { preset_mode: a.mode } }));
      if (a.type === 'oscillate') return one(call(id, 'fan', 'oscillate', { oscillating: a.on }, { state: null, attributes: { oscillating: a.on } }));
      if (a.type === 'direction') return one(call(id, 'fan', 'set_direction', { direction: a.dir }, { state: null, attributes: { direction: a.dir } }));
      return NONE;
    }
    case 'climate': {
      if (a.type === 'target') {
        const t = Math.round(clamp(a.value, model.min, model.max) / model.step) * model.step;
        const value = Math.round(t * 10) / 10;
        return one(call(id, 'climate', 'set_temperature', { temperature: value }, { state: null, attributes: { temperature: value } }));
      }
      if (a.type === 'hvac') return one(call(id, 'climate', 'set_hvac_mode', { hvac_mode: a.mode }, { state: a.mode }));
      if (a.type === 'toggle') {
        const mode = model.isOn ? 'off' : (PREFERRED_ON.find((m) => model.modes.includes(m)) ?? model.modes.find((m) => m !== 'off') ?? 'auto');
        return one(call(id, 'climate', 'set_hvac_mode', { hvac_mode: mode }, { state: mode }));
      }
      return NONE;
    }
    case 'cover': {
      if (a.type === 'position') {
        const pct = clamp(Math.round(a.pct), 0, 100);
        return one(call(id, 'cover', 'set_cover_position', { position: pct }, { state: null, attributes: { current_position: pct } }));
      }
      if (a.type === 'cover') {
        if (a.cmd === 'stop') return one(call(id, 'cover', 'stop_cover'));
        return one(call(id, 'cover', a.cmd === 'open' ? 'open_cover' : 'close_cover', {}, { state: a.cmd === 'open' ? 'opening' : 'closing' }));
      }
      if (a.type === 'toggle') return one(call(id, 'cover', 'toggle', {}, { state: model.isOn ? 'closing' : 'opening' }));
      return NONE;
    }
    case 'media': {
      if (a.type === 'media') {
        switch (a.cmd) {
          case 'play':
            return one(call(id, 'media_player', 'media_play', {}, { state: 'playing' }));
          case 'pause':
            return one(call(id, 'media_player', 'media_pause', {}, { state: 'paused' }));
          case 'next':
            return one(call(id, 'media_player', 'media_next_track'));
          case 'previous':
            return one(call(id, 'media_player', 'media_previous_track'));
          case 'shuffle':
            return one(call(id, 'media_player', 'shuffle_set', { shuffle: !model.shuffle }, { state: null, attributes: { shuffle: !model.shuffle } }));
          case 'repeat':
            return one(call(id, 'media_player', 'repeat_set', { repeat: model.repeat ? 'off' : 'all' }, { state: null, attributes: { repeat: model.repeat ? 'off' : 'all' } }));
        }
        return NONE;
      }
      if (a.type === 'toggle') return one(call(id, 'media_player', 'media_play_pause', {}, { state: model.playing ? 'paused' : 'playing' }));
      if (a.type === 'volume') {
        const level = clamp(Math.round(a.pct), 0, 100) / 100;
        return one(call(id, 'media_player', 'volume_set', { volume_level: level }, { state: null, attributes: { volume_level: level, is_volume_muted: false } }));
      }
      if (a.type === 'mute') return one(call(id, 'media_player', 'volume_mute', { is_volume_muted: a.on }, { state: null, attributes: { is_volume_muted: a.on } }));
      if (a.type === 'source') return one(call(id, 'media_player', 'select_source', { source: a.source }, { state: null, attributes: { source: a.source } }));
      return NONE;
    }
    case 'scene': {
      if (a.type !== 'activate') return NONE;
      if (id.startsWith('script.')) return one(call(id, 'script', 'turn_on', {}, { state: 'on' }), { isOn: true });
      if (id.startsWith('button.')) return one(call(id, 'button', 'press', {}), { isOn: true });
      // Its state becomes the time it ran; that it holds is the page's to say.
      return one(call(id, 'scene', 'turn_on', {}, { state: new Date().toISOString() }), { isOn: true });
    }
    case 'camera':
      // Live or still is a choice on the screen, not something HA keeps.
      return a.type === 'toggle' ? { calls: [], local: { live: !model.live } as Partial<TileModel> } : NONE;
    case 'lock': {
      if (a.type !== 'lock' && a.type !== 'toggle') return NONE;
      const cmd = a.type === 'toggle' ? (model.state === 'locked' ? 'unlock' : 'lock') : a.cmd;
      return one(call(id, 'lock', cmd, {}, { state: cmd === 'lock' ? 'locking' : cmd === 'open' ? 'open' : 'unlocking' }));
    }
    case 'vacuum': {
      if (a.type === 'fanSpeed') return one(call(id, 'vacuum', 'set_fan_speed', { fan_speed: a.speed }, { state: null, attributes: { fan_speed: a.speed } }));
      if (a.type === 'rooms') return { calls: [], local: { target: a.rooms } as Partial<TileModel> };
      if (a.type !== 'vacuum') return NONE;
      if (a.cmd === 'start') {
        const areas = model.state === 'paused' ? [] : model.target.map((r) => opts.areaIdOf?.(r) ?? null);
        if (areas.length && areas.every((x): x is string => x !== null)) return one(call(id, 'vacuum', 'clean_area', { cleaning_area_id: areas }, { state: 'cleaning' }));
        return one(call(id, 'vacuum', 'start', {}, { state: 'cleaning' }));
      }
      if (a.cmd === 'pause') return one(call(id, 'vacuum', 'pause', {}, { state: 'paused' }));
      if (a.cmd === 'dock') return one(call(id, 'vacuum', 'return_to_base', {}, { state: 'returning' }), { target: [] } as Partial<TileModel>);
      return one(call(id, 'vacuum', 'locate'));
    }
    case 'car': {
      if (a.type === 'lock' && targets.lock && a.cmd !== 'open') return one(call(targets.lock, 'lock', a.cmd, {}, { state: a.cmd === 'lock' ? 'locking' : 'unlocking' }));
      if (a.type === 'charge' && targets.charge) return one(call(targets.charge, 'switch', a.on ? 'turn_on' : 'turn_off', {}, { state: a.on ? 'on' : 'off' }));
      if (a.type === 'carClimate' && targets.climate) return one(call(targets.climate, 'climate', a.on ? 'turn_on' : 'turn_off', {}, a.on ? undefined : { state: 'off' }));
      return NONE;
    }
    default:
      return NONE;
  }
}
