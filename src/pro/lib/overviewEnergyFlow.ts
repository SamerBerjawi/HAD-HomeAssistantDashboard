/**
 * Pure Sankey graph builder for Home Assistant "Energy flow" widget & detail view, laid out like
 * HA's energy Sankey (2026-11-21): sources (battery, grid, solar) in the first column; Home, the
 * battery being charged and the grid being exported to in the second; then floors, areas and
 * tracked devices, with untracked consumption last. Small flows stay (as thin lines), so floors
 * and areas with low use still show; devices are named like HA (the device name, not "Desk Energy").
 */
import type { HAArea, HAFloor, ResolvedEntity } from '@/types';
import type { ProSankeyLinkInput, ProSankeyNodeInput } from '../ui/bklit/SankeyChart';

export interface EnergySankeyData {
  nodes: ProSankeyNodeInput[];
  links: ProSankeyLinkInput[];
}

export interface EnergySankeySourceInput {
  homeKwh: number;
  solarToHomeKwh: number;
  solarToBatteryKwh: number;
  solarToGridKwh: number;
  gridToHomeKwh: number;
  batteryToHomeKwh: number;
  /** Grid power that charged the battery (HA draws Grid → Battery). */
  gridToBatteryKwh?: number;
  /** Battery power sent to the grid (HA draws Battery → Grid). */
  batteryToGridKwh?: number;
  devices: Array<{ id: string; name: string; kwh: number }>;
  untrackedKwh: number;
  resolvedEntities?: Record<string, ResolvedEntity>;
  areas?: HAArea[];
  floors?: HAFloor[];
}

/** Below this a flow is treated as none (kWh). HA draws any flow above zero; this only drops rounding noise. */
const EPS = 0.001;

/**
 * HA names a device's energy by its device when the sensor is the device's own ("Desk", not
 * "Desk Energy"). A name the user set in the energy settings is kept as it is.
 */
export function energyDeviceLabel(name: string, entity: ResolvedEntity | undefined): string {
  const device = entity?.device;
  const deviceName = (device?.name_by_user || device?.name || '').trim();
  const friendly = String(entity?.attributes?.friendly_name ?? entity?.name ?? '');
  if (!deviceName || name !== friendly) return name;
  const startsWithDevice = name.toLowerCase().startsWith(deviceName.toLowerCase()) && name.length > deviceName.length;
  return startsWithDevice ? deviceName : name;
}

const DEVICE_COLORS = ['var(--chart-1)', 'var(--success)', 'var(--energy-solar)', 'var(--energy-export)', 'var(--energy-battery)', 'var(--energy-untracked)'];

export function buildEnergySankeyGraph(
  input: EnergySankeySourceInput,
  options: { includeAreaHierarchy?: boolean; maxDevices?: number } = {}
): EnergySankeyData {
  const { includeAreaHierarchy = true, maxDevices = 6 } = options;
  const nodes: ProSankeyNodeInput[] = [];
  const links: ProSankeyLinkInput[] = [];

  const homeTotal = Math.max(
    0.1,
    input.homeKwh,
    input.solarToHomeKwh + input.gridToHomeKwh + input.batteryToHomeKwh
  );

  const gridToBattery = Math.max(0, input.gridToBatteryKwh ?? 0);
  const batteryToGrid = Math.max(0, input.batteryToGridKwh ?? 0);
  const solarOut = input.solarToHomeKwh + input.solarToBatteryKwh + input.solarToGridKwh;
  const gridIn = input.gridToHomeKwh;
  const batIn = input.batteryToHomeKwh;

  // Fallback balanced split if live totals are still 0
  const fallbackGrid = solarOut <= EPS && gridIn <= EPS && batIn <= EPS ? homeTotal : gridIn;

  // Column 0: Sources (HA order: battery, grid, solar)
  if (batIn + batteryToGrid > EPS) {
    nodes.push({
      id: 'src_battery',
      label: 'Battery',
      value: batIn + batteryToGrid,
      column: 0,
      color: 'var(--energy-battery)'
    });
    if (batIn > EPS) {
      links.push({
        id: 'lk_srcbat_home',
        source: 'src_battery',
        target: 'node_home',
        value: batIn,
        sourceColor: 'var(--energy-battery)',
        targetColor: 'var(--energy-solar)'
      });
    }
  }

  if (fallbackGrid + gridToBattery > EPS) {
    nodes.push({
      id: 'src_grid',
      label: 'Grid',
      value: fallbackGrid + gridToBattery,
      column: 0,
      color: 'var(--energy-grid)'
    });
    if (fallbackGrid > EPS) {
      links.push({
        id: 'lk_srcgrid_home',
        source: 'src_grid',
        target: 'node_home',
        value: fallbackGrid,
        sourceColor: 'var(--energy-grid)',
        targetColor: 'var(--energy-solar)'
      });
    }
  }

  if (solarOut > EPS) {
    nodes.push({
      id: 'src_solar',
      label: 'Solar',
      value: solarOut,
      column: 0,
      color: 'var(--energy-solar)'
    });
    if (input.solarToHomeKwh > EPS) {
      links.push({
        id: 'lk_srcsolar_home',
        source: 'src_solar',
        target: 'node_home',
        value: input.solarToHomeKwh,
        sourceColor: 'var(--energy-solar)',
        targetColor: 'var(--energy-solar)'
      });
    }
  }

  // Column 1: Home hub
  nodes.push({
    id: 'node_home',
    label: 'Home',
    value: homeTotal,
    column: 1,
    color: 'var(--energy-solar)'
  });

  // Column 1 under Home (as HA): the battery being charged and the grid being exported to.
  const chargedKwh = input.solarToBatteryKwh + gridToBattery;
  if (chargedKwh > EPS) {
    // HA draws the battery being charged in a lighter purple than the battery as a source.
    nodes.push({ id: 'sink_battery', label: 'Battery', value: chargedKwh, column: 1, color: 'var(--energy-gas)' });
    if (input.solarToBatteryKwh > EPS) {
      links.push({
        id: 'lk_srcsolar_sinkbat',
        source: 'src_solar',
        target: 'sink_battery',
        value: input.solarToBatteryKwh,
        sourceColor: 'var(--energy-solar)',
        targetColor: 'var(--energy-gas)'
      });
    }
    if (gridToBattery > EPS) {
      links.push({
        id: 'lk_srcgrid_sinkbat',
        source: 'src_grid',
        target: 'sink_battery',
        value: gridToBattery,
        sourceColor: 'var(--energy-grid)',
        targetColor: 'var(--energy-gas)'
      });
    }
  }
  const exportedKwh = input.solarToGridKwh + batteryToGrid;
  if (exportedKwh > EPS) {
    nodes.push({ id: 'sink_grid', label: 'Grid', value: exportedKwh, column: 1, color: 'var(--energy-export)' });
    if (input.solarToGridKwh > EPS) {
      links.push({
        id: 'lk_srcsolar_sinkgrid',
        source: 'src_solar',
        target: 'sink_grid',
        value: input.solarToGridKwh,
        sourceColor: 'var(--energy-solar)',
        targetColor: 'var(--energy-export)'
      });
    }
    if (batteryToGrid > EPS) {
      links.push({
        id: 'lk_srcbat_sinkgrid',
        source: 'src_battery',
        target: 'sink_grid',
        value: batteryToGrid,
        sourceColor: 'var(--energy-battery)',
        targetColor: 'var(--energy-export)'
      });
    }
  }

  // Sort & cap tracked devices
  const activeDevices = [...input.devices]
    .filter((d) => d.kwh > EPS)
    .sort((a, b) => b.kwh - a.kwh);
  const visibleDevices = activeDevices.slice(0, maxDevices);
  const overflowKwh = activeDevices.slice(maxDevices).reduce((s, d) => s + d.kwh, 0);

  const entityMap = input.resolvedEntities || {};
  const areaById = new Map((input.areas || []).map((a) => [a.area_id, a]));
  const floorById = new Map((input.floors || []).map((f) => [f.floor_id, f]));

  const deviceEntries = visibleDevices.map((dev, idx) => {
    const entity = entityMap[dev.id];
    const area = entity?.area_id ? areaById.get(entity.area_id) : undefined;
    const floor = area?.floor_id
      ? floorById.get(area.floor_id)
      : entity?.floor_id
      ? floorById.get(entity.floor_id)
      : undefined;
    return {
      ...dev,
      name: energyDeviceLabel(dev.name, entity),
      color: DEVICE_COLORS[idx % DEVICE_COLORS.length],
      areaId: area?.area_id ?? null,
      areaName: area?.name ?? null,
      floorId: floor?.floor_id ?? null,
      floorName: floor?.name ?? null
    };
  });

  const hasAreas = includeAreaHierarchy && deviceEntries.some((d) => d.areaId !== null);
  const distinctFloors = new Set(deviceEntries.map((d) => d.floorId).filter(Boolean));
  const hasFloors = hasAreas && distinctFloors.size >= 1;

  const floorCol = 2;
  const areaCol = hasFloors ? 3 : 2;
  const leafCol = hasAreas ? (hasFloors ? 4 : 3) : 2;

  // Build Floor -> Area -> Device links when hierarchy exists
  if (hasAreas) {
    const floorTotals = new Map<string, { label: string; value: number }>();
    const areaTotals = new Map<string, { label: string; value: number; floorKey: string | null }>();

    for (const dev of deviceEntries) {
      const aKey = dev.areaId ? `area_${dev.areaId}` : 'area_unassigned';
      const aLabel = dev.areaName || 'Other area';
      const fKey = dev.floorId ? `floor_${dev.floorId}` : hasFloors ? 'floor_main' : null;
      const fLabel = dev.floorName || 'Main floor';

      const prevArea = areaTotals.get(aKey) || { label: aLabel, value: 0, floorKey: fKey };
      prevArea.value += dev.kwh;
      areaTotals.set(aKey, prevArea);

      if (hasFloors && fKey) {
        const prevFloor = floorTotals.get(fKey) || { label: fLabel, value: 0 };
        prevFloor.value += dev.kwh;
        floorTotals.set(fKey, prevFloor);
      }
    }

    if (hasFloors) {
      for (const [fKey, fMeta] of floorTotals.entries()) {
        nodes.push({
          id: fKey,
          label: fMeta.label,
          value: fMeta.value,
          column: floorCol,
          color: 'var(--energy-solar)'
        });
        links.push({
          id: `lk_home_${fKey}`,
          source: 'node_home',
          target: fKey,
          value: fMeta.value,
          sourceColor: 'var(--energy-solar)',
          targetColor: 'var(--energy-solar)'
        });
      }
    }

    for (const [aKey, aMeta] of areaTotals.entries()) {
      nodes.push({
        id: aKey,
        label: aMeta.label,
        value: aMeta.value,
        column: areaCol,
        color: 'var(--energy-solar)'
      });
      const parentId = hasFloors && aMeta.floorKey ? aMeta.floorKey : 'node_home';
      links.push({
        id: `lk_${parentId}_${aKey}`,
        source: parentId,
        target: aKey,
        value: aMeta.value,
        sourceColor: 'var(--energy-solar)',
        targetColor: 'var(--energy-solar)'
      });
    }

    for (const dev of deviceEntries) {
      const devNodeId = `dev_${dev.id}`;
      const aKey = dev.areaId ? `area_${dev.areaId}` : 'area_unassigned';
      nodes.push({
        id: devNodeId,
        label: dev.name,
        value: dev.kwh,
        column: leafCol,
        color: dev.color
      });
      links.push({
        id: `lk_${aKey}_${devNodeId}`,
        source: aKey,
        target: devNodeId,
        value: dev.kwh,
        sourceColor: 'var(--energy-solar)',
        targetColor: dev.color
      });
    }
  } else {
    for (const dev of deviceEntries) {
      const devNodeId = `dev_${dev.id}`;
      nodes.push({
        id: devNodeId,
        label: dev.name,
        value: dev.kwh,
        column: leafCol,
        color: dev.color
      });
      links.push({
        id: `lk_home_${devNodeId}`,
        source: 'node_home',
        target: devNodeId,
        value: dev.kwh,
        sourceColor: 'var(--energy-solar)',
        targetColor: dev.color
      });
    }
  }

  if (overflowKwh > EPS) {
    nodes.push({
      id: 'dev_other',
      label: 'Other devices',
      value: overflowKwh,
      column: leafCol,
      color: 'var(--energy-untracked)'
    });
    links.push({
      id: 'lk_home_other',
      source: 'node_home',
      target: 'dev_other',
      value: overflowKwh,
      sourceColor: 'var(--energy-solar)',
      targetColor: 'var(--energy-untracked)'
    });
  }

  const untracked = Math.max(0, input.untrackedKwh);
  if (untracked > EPS || (deviceEntries.length === 0 && homeTotal > EPS)) {
    const val = untracked > EPS ? untracked : homeTotal;
    nodes.push({
      id: 'dev_untracked',
      label: 'Untracked consumption',
      value: val,
      column: leafCol,
      color: 'var(--energy-untracked)'
    });
    links.push({
      id: 'lk_home_untracked',
      source: 'node_home',
      target: 'dev_untracked',
      value: val,
      sourceColor: 'var(--energy-solar)',
      targetColor: 'var(--energy-untracked)'
    });
  }

  return { nodes, links };
}
