/**
 * Pure Sankey graph builder for Home Assistant "Energy flow" widget & detail view:
 * resolves Sources -> Home (+ returns) -> Floors -> Areas -> Tracked devices + Untracked consumption.
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
  devices: Array<{ id: string; name: string; kwh: number }>;
  untrackedKwh: number;
  resolvedEntities?: Record<string, ResolvedEntity>;
  areas?: HAArea[];
  floors?: HAFloor[];
}

const DEVICE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#14b8a6', '#64748b'];

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

  const solarOut = input.solarToHomeKwh + input.solarToBatteryKwh + input.solarToGridKwh;
  const gridIn = input.gridToHomeKwh;
  const batIn = input.batteryToHomeKwh;

  // Fallback balanced split if live totals are still 0
  const fallbackGrid = solarOut <= 0.01 && gridIn <= 0.01 && batIn <= 0.01 ? homeTotal : gridIn;

  // Column 0: Sources
  if (batIn > 0.01) {
    nodes.push({
      id: 'src_battery',
      label: 'Battery',
      value: batIn,
      column: 0,
      color: '#2dd4bf'
    });
    links.push({
      id: 'lk_srcbat_home',
      source: 'src_battery',
      target: 'node_home',
      value: batIn,
      sourceColor: '#2dd4bf',
      targetColor: '#f59e0b'
    });
  }

  if (fallbackGrid > 0.01) {
    nodes.push({
      id: 'src_grid',
      label: 'Grid',
      value: fallbackGrid,
      column: 0,
      color: '#0284c7'
    });
    links.push({
      id: 'lk_srcgrid_home',
      source: 'src_grid',
      target: 'node_home',
      value: fallbackGrid,
      sourceColor: '#0284c7',
      targetColor: '#f59e0b'
    });
  }

  if (solarOut > 0.01) {
    nodes.push({
      id: 'src_solar',
      label: 'Solar',
      value: solarOut,
      column: 0,
      color: '#f59e0b'
    });
    if (input.solarToHomeKwh > 0.01) {
      links.push({
        id: 'lk_srcsolar_home',
        source: 'src_solar',
        target: 'node_home',
        value: input.solarToHomeKwh,
        sourceColor: '#f59e0b',
        targetColor: '#f59e0b'
      });
    }
  }

  // Column 1: Home hub
  nodes.push({
    id: 'node_home',
    label: 'Home',
    value: homeTotal,
    column: 1,
    color: '#f59e0b'
  });

  // Sort & cap tracked devices
  const activeDevices = [...input.devices]
    .filter((d) => d.kwh > 0.02)
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
          color: '#f59e0b'
        });
        links.push({
          id: `lk_home_${fKey}`,
          source: 'node_home',
          target: fKey,
          value: fMeta.value,
          sourceColor: '#f59e0b',
          targetColor: '#f59e0b'
        });
      }
    }

    for (const [aKey, aMeta] of areaTotals.entries()) {
      nodes.push({
        id: aKey,
        label: aMeta.label,
        value: aMeta.value,
        column: areaCol,
        color: '#f59e0b'
      });
      const parentId = hasFloors && aMeta.floorKey ? aMeta.floorKey : 'node_home';
      links.push({
        id: `lk_${parentId}_${aKey}`,
        source: parentId,
        target: aKey,
        value: aMeta.value,
        sourceColor: '#f59e0b',
        targetColor: '#f59e0b'
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
        sourceColor: '#f59e0b',
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
        sourceColor: '#f59e0b',
        targetColor: dev.color
      });
    }
  }

  if (overflowKwh > 0.05) {
    nodes.push({
      id: 'dev_other',
      label: 'Other devices',
      value: overflowKwh,
      column: leafCol,
      color: '#64748b'
    });
    links.push({
      id: 'lk_home_other',
      source: 'node_home',
      target: 'dev_other',
      value: overflowKwh,
      sourceColor: '#f59e0b',
      targetColor: '#64748b'
    });
  }

  const untracked = Math.max(0, input.untrackedKwh);
  if (untracked > 0.05 || (deviceEntries.length === 0 && homeTotal > 0.05)) {
    const val = untracked > 0.05 ? untracked : homeTotal;
    nodes.push({
      id: 'dev_untracked',
      label: 'Untracked consumption',
      value: val,
      column: leafCol,
      color: '#475569'
    });
    links.push({
      id: 'lk_home_untracked',
      source: 'node_home',
      target: 'dev_untracked',
      value: val,
      sourceColor: '#f59e0b',
      targetColor: '#475569'
    });
  }

  // Place surplus solar returns in the rightmost column below home destinations to prevent
  // mid-column label collisions on compact/mobile viewports.
  if (solarOut > 0.01) {
    if (input.solarToBatteryKwh > 0.01) {
      nodes.push({
        id: 'sink_battery',
        label: 'Battery charge',
        value: input.solarToBatteryKwh,
        column: leafCol,
        color: '#a855f7'
      });
      links.push({
        id: 'lk_srcsolar_sinkbat',
        source: 'src_solar',
        target: 'sink_battery',
        value: input.solarToBatteryKwh,
        sourceColor: '#f59e0b',
        targetColor: '#a855f7'
      });
    }
    if (input.solarToGridKwh > 0.01) {
      nodes.push({
        id: 'sink_grid',
        label: 'Grid export',
        value: input.solarToGridKwh,
        column: leafCol,
        color: '#6366f1'
      });
      links.push({
        id: 'lk_srcsolar_sinkgrid',
        source: 'src_solar',
        target: 'sink_grid',
        value: input.solarToGridKwh,
        sourceColor: '#f59e0b',
        targetColor: '#6366f1'
      });
    }
  }

  return { nodes, links };
}
