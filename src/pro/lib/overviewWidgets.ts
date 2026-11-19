/**
 * Pure widget catalog, size helpers, visibility-mode helpers, and grid filtering for the pro
 * Overview widget grid and Add Widgets sheet (docs/pro-ui/DESIGN.md 7.6). No React, no store.
 */
import type { ResolvedEntity } from '@/types';
import {
  DEFAULT_OVERVIEW_TILE_ORDER,
  type OverviewTileVisibilityMode,
  type UserDashboardConfig
} from '@/types/userConfig';
import {
  buildCurrentTileOrder,
  buildOverviewTabTileMap,
  filterDisplayTiles
} from '@/services/overview/tileLayout';
import type { PillTone } from './overviewPills';
import type { OverviewTabId } from './overviewTabs';

export type ProWidgetSize = '1x' | '2x' | '2x2';
export type ProWidgetCategory = 'all' | 'weather' | 'controls' | 'security' | 'energy' | 'media';

export interface ProWidgetCatalogItem {
  id: string;
  title: string;
  description: string;
  category: Exclude<ProWidgetCategory, 'all'>;
  tabs: OverviewTabId[];
  defaultSize: ProWidgetSize;
}

export interface ProWidgetLiveSummary {
  headline: string;
  subtitle: string;
  detail?: string;
  badgeText?: string;
  badgeTone?: PillTone;
}

export const PRO_STANDARD_WIDGETS: ProWidgetCatalogItem[] = [
  {
    id: 'weather',
    title: 'Weather & 3-day forecast',
    description: 'Current ambient conditions, high/low range, and 3-day outlook.',
    category: 'weather',
    tabs: ['climate'],
    defaultSize: '2x'
  },
  {
    id: 'weather_hourly',
    title: 'Hourly forecast',
    description: 'Upcoming hours with temperature and rain probability.',
    category: 'weather',
    tabs: ['climate'],
    defaultSize: '2x'
  },
  {
    id: 'users',
    title: 'Family presence',
    description: 'Household members, Home/zone status, and phone battery levels.',
    category: 'security',
    tabs: ['security'],
    defaultSize: '1x'
  },
  {
    id: 'lights',
    title: 'Lighting',
    description: 'Active lights count, average brightness, and quick toggle.',
    category: 'controls',
    tabs: ['lights'],
    defaultSize: '1x'
  },
  {
    id: 'switches',
    title: 'Switches',
    description: 'Connected smart plugs, relays, and appliances.',
    category: 'controls',
    tabs: ['switches'],
    defaultSize: '1x'
  },
  {
    id: 'vacuums',
    title: 'Vacuums',
    description: 'Robot vacuum cleaning status, active room, and battery.',
    category: 'controls',
    tabs: ['vacuums'],
    defaultSize: '1x'
  },
  {
    id: 'fans',
    title: 'Fans & airflow',
    description: 'Running fans and ventilation quick controls.',
    category: 'controls',
    tabs: ['climate'],
    defaultSize: '1x'
  },
  {
    id: 'media',
    title: 'Media player',
    description: 'Active speakers, now playing track, and transport controls.',
    category: 'media',
    tabs: ['media'],
    defaultSize: '1x'
  },
  {
    id: 'alarm',
    title: 'Security alarm',
    description: 'Arm/disarm mode control and panel status.',
    category: 'security',
    tabs: ['security'],
    defaultSize: '1x'
  },
  {
    id: 'cameras',
    title: 'Cameras',
    description: 'Configured surveillance cameras and motion activity.',
    category: 'security',
    tabs: ['security', 'cameras'],
    defaultSize: '1x'
  },
  {
    id: 'power_flow',
    title: 'Power flow',
    description: 'Real-time solar, grid import/export, battery, and home load.',
    category: 'energy',
    tabs: ['energy'],
    defaultSize: '1x'
  },
  {
    id: 'power_flow_chart',
    title: 'Power flow (12h)',
    description: 'Last 12 hours of home, solar, grid, and battery power flow.',
    category: 'energy',
    tabs: ['energy'],
    defaultSize: '2x'
  },
  {
    id: 'energy_usage',
    title: 'Energy usage',
    description: 'Today’s consumption, grid return, and solar offset.',
    category: 'energy',
    tabs: ['energy'],
    defaultSize: '1x'
  },
  {
    id: 'energy_usage_chart',
    title: 'Energy usage (hourly)',
    description: 'Hourly home consumption and grid return breakdown.',
    category: 'energy',
    tabs: ['energy'],
    defaultSize: '2x'
  },
  {
    id: 'solar_production',
    title: 'Solar production',
    description: 'Live PV output, today’s yield, and daily forecast target.',
    category: 'energy',
    tabs: ['energy'],
    defaultSize: '1x'
  },
  {
    id: 'solar_production_chart',
    title: 'Solar forecast (chart)',
    description: 'Full-day solar generation bars and forecast curve.',
    category: 'energy',
    tabs: ['energy'],
    defaultSize: '2x'
  },
  {
    id: 'energy_gauges',
    title: 'Grid balance & gauges',
    description: 'Grid energy balance bar and self-sufficiency arc gauges.',
    category: 'energy',
    tabs: ['energy'],
    defaultSize: '2x'
  },
  {
    id: 'energy_flow',
    title: 'Energy flow',
    description: 'Sankey breakdown from sources through home areas to devices.',
    category: 'energy',
    tabs: ['energy'],
    defaultSize: '2x'
  },
  {
    id: 'doors',
    title: 'Entry doors',
    description: 'Open or closed status for door contact sensors.',
    category: 'security',
    tabs: ['security', 'openings'],
    defaultSize: '1x'
  },
  {
    id: 'windows',
    title: 'Windows',
    description: 'Open or closed status for window contact sensors.',
    category: 'security',
    tabs: ['security', 'openings'],
    defaultSize: '1x'
  },
  {
    id: 'motion',
    title: 'Motion zones',
    description: 'Active motion and occupancy sensors.',
    category: 'security',
    tabs: ['security'],
    defaultSize: '1x'
  },
  {
    id: 'leak',
    title: 'Water leaks',
    description: 'Moisture and flood sensor monitoring.',
    category: 'security',
    tabs: ['security'],
    defaultSize: '1x'
  },
  {
    id: 'smoke',
    title: 'Smoke & fire',
    description: 'Smoke alarm and fire safety detectors.',
    category: 'security',
    tabs: ['security'],
    defaultSize: '1x'
  }
];

export function buildProWidgetCatalog(surveillanceCameras: ResolvedEntity[]): ProWidgetCatalogItem[] {
  const cameraItems: ProWidgetCatalogItem[] = surveillanceCameras.map((cam) => {
    const friendly = typeof cam.attributes?.friendly_name === 'string' ? cam.attributes.friendly_name : '';
    const title = cam.name || friendly || cam.entity_id.replace('camera.', '');
    return {
      id: `camera:${cam.entity_id}`,
      title,
      description: `Live stream and snapshot for ${title}.`,
      category: 'security',
      tabs: ['security', 'cameras'],
      defaultSize: '1x'
    };
  });
  return [...PRO_STANDARD_WIDGETS, ...cameraItems];
}

export function getProWidgetSize(
  tileSizes: Record<string, string> | undefined,
  widgetId: string,
  catalog: ProWidgetCatalogItem[] = PRO_STANDARD_WIDGETS
): ProWidgetSize {
  const saved = tileSizes?.[widgetId];
  if (saved === '1x' || saved === '2x' || saved === '2x2') return saved;
  return catalog.find((item) => item.id === widgetId)?.defaultSize ?? '1x';
}

export function nextProWidgetSize(size: ProWidgetSize): ProWidgetSize {
  if (size === '1x') return '2x';
  if (size === '2x') return '2x2';
  return '1x';
}

export function proWidgetSizeLabel(size: ProWidgetSize): string {
  if (size === '2x2') return '2×2';
  if (size === '2x') return '2×';
  return '1×';
}

export function proWidgetColSpanClass(size: ProWidgetSize): string {
  return size === '1x' ? 'col-span-1' : 'col-span-1 md:col-span-2';
}

export function withProWidgetSize(
  prev: UserDashboardConfig,
  widgetId: string,
  size: ProWidgetSize
): UserDashboardConfig {
  const nextSizes: Record<string, ProWidgetSize> = {
    ...(prev.overview?.tileSizes || {}),
    [widgetId]: size
  };
  return {
    ...prev,
    overview: {
      ...(prev.overview || {}),
      tileSizes: nextSizes as unknown as Record<string, '1x' | '2x'>
    }
  };
}

/**
 * Resets overview tile order, visibility, badges, and all customized sizes back to defaults.
 * Writes explicit default sizes for every previously customized or catalog widget so `mergeConfig`'s
 * object spread overwrites any `2x`/`2x2` customizations.
 */
export function withProResetLayout(
  prev: UserDashboardConfig,
  catalog: ProWidgetCatalogItem[] = PRO_STANDARD_WIDGETS
): UserDashboardConfig {
  const resetSizes: Record<string, ProWidgetSize> = {};
  for (const id of Object.keys(prev.overview?.tileSizes || {})) {
    resetSizes[id] = catalog.find((item) => item.id === id)?.defaultSize ?? '1x';
  }
  for (const item of catalog) {
    resetSizes[item.id] = item.defaultSize;
  }
  return {
    ...prev,
    preferences: {
      ...(prev.preferences || {}),
      proOverviewGroupBySections: false,
      proOverviewSectionOrder: []
    } as UserDashboardConfig['preferences'],
    overview: {
      tileOrder: PRO_STANDARD_WIDGETS.map((w) => w.id),
      hiddenTiles: [],
      hiddenFromAllTiles: [],
      hideBadges: false,
      tileSizes: resetSizes as unknown as Record<string, '1x' | '2x'>
    }
  };
}

export function getProWidgetVisibilityMode(
  widgetId: string,
  hiddenTilesSet: Set<string>,
  hiddenFromAllSet: Set<string>
): OverviewTileVisibilityMode {
  if (hiddenTilesSet.has(widgetId)) return 'all_off';
  if (hiddenFromAllSet.has(widgetId)) return 'tab_only';
  return 'all_on';
}

export interface FilterProDisplayWidgetsInput {
  savedTileOrder: string[] | undefined;
  switchEntities: ResolvedEntity[];
  vacuumEntities: ResolvedEntity[];
  surveillanceCameras: ResolvedEntity[];
  isEditMode: boolean;
  hiddenTilesSet: Set<string>;
  hiddenFromAllSet: Set<string>;
  activeOverviewTab: OverviewTabId;
}

const PRO_EXTRA_ENERGY_IDS = ['energy_gauges', 'energy_flow'] as const;

export function filterProDisplayWidgets(input: FilterProDisplayWidgetsInput) {
  const baseOrder = buildCurrentTileOrder(input.savedTileOrder, input.surveillanceCameras);
  const currentTileOrder = [...baseOrder];
  let insertAt = currentTileOrder.indexOf('solar_production_chart');
  if (insertAt === -1) insertAt = currentTileOrder.length - 1;
  for (const extraId of PRO_EXTRA_ENERGY_IDS) {
    if (!currentTileOrder.includes(extraId)) {
      insertAt += 1;
      currentTileOrder.splice(insertAt, 0, extraId);
    }
  }
  const rawTabTileMap = buildOverviewTabTileMap(input.surveillanceCameras);
  const tabTileMap = {
    ...rawTabTileMap,
    energy: [...(rawTabTileMap.energy || []), ...PRO_EXTRA_ENERGY_IDS]
  };
  const displayWidgetIds = filterDisplayTiles({
    currentTileOrder,
    switchEntities: input.switchEntities,
    vacuumEntities: input.vacuumEntities,
    surveillanceCameras: input.surveillanceCameras,
    isEditMode: input.isEditMode,
    hiddenTilesSet: input.hiddenTilesSet,
    hiddenFromAllSet: input.hiddenFromAllSet,
    activeOverviewTab: input.activeOverviewTab,
    OVERVIEW_TAB_TILE_MAP: tabTileMap
  });
  return { currentTileOrder, displayWidgetIds };
}
