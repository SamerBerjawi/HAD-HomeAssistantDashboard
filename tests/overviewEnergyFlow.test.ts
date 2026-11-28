import { describe, expect, it } from 'vitest';
import { buildEnergySankeyGraph, energyDeviceLabel } from '@/pro/lib/overviewEnergyFlow';
import type { ResolvedEntity } from '@/types';

const base = {
  homeKwh: 5,
  solarToHomeKwh: 2,
  solarToBatteryKwh: 3,
  solarToGridKwh: 0.2,
  gridToHomeKwh: 2.9,
  batteryToHomeKwh: 0.1,
  devices: [] as Array<{ id: string; name: string; kwh: number }>,
  untrackedKwh: 5
};

describe('energy flow Sankey (HA layout)', () => {
  it('puts the battery being charged and the grid export in the column next to Home', () => {
    const { nodes } = buildEnergySankeyGraph(base);
    const col = (id: string) => nodes.find((n) => n.id === id)?.column;
    expect(col('node_home')).toBe(1);
    expect(col('sink_battery')).toBe(1);
    expect(col('sink_grid')).toBe(1);
    expect(nodes.filter((n) => n.column === 1).map((n) => n.id)).toEqual(['node_home', 'sink_battery', 'sink_grid']);
  });

  it('draws grid → battery and battery → grid, and a small battery source', () => {
    const { nodes, links } = buildEnergySankeyGraph({ ...base, gridToBatteryKwh: 0.4, batteryToGridKwh: 0.05 });
    expect(links.find((l) => l.source === 'src_grid' && l.target === 'sink_battery')?.value).toBe(0.4);
    expect(links.find((l) => l.source === 'src_battery' && l.target === 'sink_grid')?.value).toBe(0.05);
    expect(nodes.find((n) => n.id === 'src_battery')?.value).toBeCloseTo(0.15, 5);
    expect(nodes.find((n) => n.id === 'sink_battery')?.value).toBeCloseTo(3.4, 5);
  });

  it('keeps devices with small use (HA shows them as thin lines)', () => {
    const { nodes } = buildEnergySankeyGraph({ ...base, devices: [{ id: 'sensor.tv_plug_energy', name: 'TV Plug', kwh: 0.01 }] });
    expect(nodes.some((n) => n.label === 'TV Plug')).toBe(true);
  });
});

describe('energy device names', () => {
  const entity = (friendly: string, device?: { name: string; name_by_user?: string | null }) =>
    ({ entity_id: 'sensor.desk_energy', name: friendly, attributes: { friendly_name: friendly }, device: device ? { id: 'd1', ...device } : null }) as unknown as ResolvedEntity;

  it('uses the device name for the device\'s own energy sensor', () => {
    expect(energyDeviceLabel('Desk Energy', entity('Desk Energy', { name: 'Desk' }))).toBe('Desk');
    expect(energyDeviceLabel('Desk Energy', entity('Desk Energy', { name: 'Desk', name_by_user: 'Standing desk' }))).toBe('Desk Energy');
  });
  it('keeps a name the user set, or one that does not start with the device', () => {
    expect(energyDeviceLabel('Office PC', entity('Desk Energy', { name: 'Desk' }))).toBe('Office PC');
    expect(energyDeviceLabel('Plug power', entity('Plug power', { name: 'Hot Water Pump' }))).toBe('Plug power');
    expect(energyDeviceLabel('Desk Energy', undefined)).toBe('Desk Energy');
  });
});
