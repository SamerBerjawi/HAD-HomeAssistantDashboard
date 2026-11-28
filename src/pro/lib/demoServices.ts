/**
 * Demo mode (Overview Phase 4): in demo, service calls reach no Home Assistant, so widgets would
 * snap back or do nothing. This works out the state a real HA would report after a call, so the
 * demo home responds like a real one. Pure; `useServiceCall` applies the result in demo only.
 * Widgets that already set an optimistic state get the same state again (harmless).
 */
export interface DemoEffect {
  entityId: string;
  /** New state, or null to keep the state and only merge attributes. */
  state: string | null;
  attributes?: Record<string, unknown>;
}

type StateOf = (entityId: string) => { state: string; attributes?: Record<string, unknown> } | undefined;

const ON_OFF = new Set(['light', 'switch', 'fan', 'input_boolean', 'automation', 'siren', 'humidifier']);

const ALARM: Record<string, string> = {
  alarm_disarm: 'disarmed',
  alarm_arm_home: 'armed_home',
  alarm_arm_away: 'armed_away',
  alarm_arm_night: 'armed_night',
  alarm_arm_vacation: 'armed_vacation',
  alarm_arm_custom_bypass: 'armed_custom_bypass',
  alarm_trigger: 'triggered'
};

const VACUUM: Record<string, string> = { start: 'cleaning', pause: 'paused', stop: 'idle', return_to_base: 'returning', clean_spot: 'cleaning', clean_area: 'cleaning' };

export function demoServiceEffects(domain: string, service: string, data: Record<string, unknown>, entityIds: readonly string[], stateOf: StateOf): DemoEffect[] {
  const out: DemoEffect[] = [];
  for (const id of entityIds) {
    const cur = stateOf(id);
    const d = id.split('.')[0];
    const on = (yes: boolean): DemoEffect => ({ entityId: id, state: yes ? 'on' : 'off' });
    if ((domain === 'homeassistant' || domain === d) && ON_OFF.has(d) && ['turn_on', 'turn_off', 'toggle'].includes(service)) {
      out.push(on(service === 'toggle' ? cur?.state !== 'on' : service === 'turn_on'));
    } else if (domain === 'lock' && (service === 'lock' || service === 'unlock' || service === 'open')) {
      out.push({ entityId: id, state: service === 'lock' ? 'locked' : service === 'open' ? 'open' : 'unlocked', attributes: { changed_by: 'You' } });
    } else if (domain === 'alarm_control_panel' && ALARM[service]) {
      out.push({ entityId: id, state: ALARM[service], attributes: { changed_by: 'You' } });
    } else if (domain === 'cover' && ['open_cover', 'close_cover', 'toggle'].includes(service)) {
      const open = service === 'toggle' ? cur?.state !== 'open' : service === 'open_cover';
      out.push({ entityId: id, state: open ? 'open' : 'closed' });
    } else if (domain === 'media_player' && ['media_play_pause', 'media_play', 'media_pause', 'media_stop'].includes(service)) {
      const playing = service === 'media_play_pause' ? cur?.state !== 'playing' : service === 'media_play';
      out.push({ entityId: id, state: playing ? 'playing' : 'paused' });
    } else if (domain === 'vacuum' && VACUUM[service]) {
      out.push({ entityId: id, state: VACUUM[service] });
    } else if (domain === 'climate' && service === 'set_hvac_mode' && typeof data.hvac_mode === 'string') {
      out.push({ entityId: id, state: data.hvac_mode });
    } else if (domain === 'climate' && service === 'set_temperature' && typeof data.temperature === 'number') {
      out.push({ entityId: id, state: null, attributes: { temperature: data.temperature } });
    } else if (domain === 'scene' && service === 'turn_on') {
      out.push({ entityId: id, state: new Date().toISOString() });
    }
  }
  return out;
}
