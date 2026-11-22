import { describe, expect, it } from 'vitest';
import { buildDefaultDeviceLayout, normalizeDeviceLayout, withWidgetStyle } from '@/pro/lib/overviewLayout';
import { WIDGET_BY_ID, WIDGET_LAYOUT_INFO } from '@/pro/widgets/registry';
import { resolveDesign } from '@/pro/widgets/types';
import { WEATHER_STATES } from '@/pro/widgets/weather/states';
import { hasHours, isWeatherEmpty } from '@/pro/widgets/weather/concepts/shared';

describe('widget styles (WIDGET_DESIGN.md pilot)', () => {
  const weather = WIDGET_BY_ID.get('weather')!;

  it('weather offers three styles with Sky as the default', () => {
    expect(weather.designs?.map((d) => d.id)).toEqual(['sky', 'minimal', 'trend']);
    expect(resolveDesign(weather)?.id).toBe('sky');
    expect(resolveDesign(weather, 'trend')?.id).toBe('trend');
    expect(resolveDesign(weather, 'gone')?.id).toBe('sky');
  });

  it('widgets carry their style ids in their layout info', () => {
    const info = WIDGET_LAYOUT_INFO.find((w) => w.id === 'weather');
    expect(info?.designIds).toEqual(['sky', 'minimal', 'trend']);
    expect(WIDGET_LAYOUT_INFO.find((w) => w.id === 'energy_now')?.designIds).toEqual(['glow']);
  });

  it('a default layout has no styles; picking one stores it', () => {
    const layout = buildDefaultDeviceLayout(WIDGET_LAYOUT_INFO, 'phone');
    expect(layout.styles).toBeUndefined();
    expect(withWidgetStyle(layout, 'weather', 'minimal').styles).toEqual({ weather: 'minimal' });
  });

  it('normalize keeps valid styles and drops unknown widgets, styles and junk', () => {
    const base = buildDefaultDeviceLayout(WIDGET_LAYOUT_INFO, 'desktop');
    const kept = normalizeDeviceLayout({ ...base, styles: { weather: 'trend' } }, WIDGET_LAYOUT_INFO, 'desktop');
    expect(kept.styles).toEqual({ weather: 'trend' });
    const dropped = normalizeDeviceLayout({ ...base, styles: { weather: 'neon', energy_now: 'sky', nope: 'sky', media: 3 } }, WIDGET_LAYOUT_INFO, 'desktop');
    expect(dropped.styles).toBeUndefined();
    expect(normalizeDeviceLayout({ ...base, styles: ['sky'] }, WIDGET_LAYOUT_INFO, 'desktop').styles).toBeUndefined();
  });

  it("Phase 1–4 widgets wear the owner's chosen design (one each, so no style picker)", () => {
    const chosen: Record<string, string> = {
      lights: 'glow',
      media: 'cover',
      vacuums: 'floor',
      users: 'portraits',
      switches: 'board',
      fans: 'airflow',
      thermostat: 'climate',
      scenes: 'palette',
      areas: 'rooms',
      alarm: 'shield',
      cameras: 'framed',
      openings: 'draught',
      safety: 'calm',
      motion: 'timeline',
      energy_now: 'glow',
      energy_today: 'balance',
      energy_flow: 'sankey',
      locks: 'bolts',
      car: 'status'
    };
    for (const [id, design] of Object.entries(chosen)) {
      const w = WIDGET_BY_ID.get(id)!;
      expect(w.designs?.map((d) => d.id)).toEqual([design]);
      expect(resolveDesign(w)?.id).toBe(design);
    }
  });

  it('the new Thermostat and Scenes widgets replace their placeholders in the right sections', () => {
    expect(WIDGET_BY_ID.get('thermostat')?.section).toBe('climate');
    expect(WIDGET_BY_ID.get('scenes')?.section).toBe('lights');
  });

  it('studio states have forecasts; an empty model is detected', () => {
    for (const s of WEATHER_STATES) {
      expect(hasHours(s.model)).toBe(true);
      expect(isWeatherEmpty(s.model)).toBe(false);
    }
    const empty = { ...WEATHER_STATES[0].model, hasEntity: false, daily: [], hourly: [] };
    expect(isWeatherEmpty(empty)).toBe(true);
    expect(hasHours(empty)).toBe(false);
  });
});
