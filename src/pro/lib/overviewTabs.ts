/**
 * Pure builder for the pro Overview category filter tabs and their live status badges
 * (docs/pro-ui/DESIGN.md 7.6). No React, no store.
 */
import type { PillTone } from './overviewPills';

export type OverviewTabId =
  | 'all'
  | 'lights'
  | 'switches'
  | 'energy'
  | 'security'
  | 'cameras'
  | 'climate'
  | 'openings'
  | 'media'
  | 'vacuums';

export interface OverviewTabItem {
  id: OverviewTabId;
  label: string;
  badge?: string;
  badgeTone?: PillTone;
}

export interface BuildOverviewTabsInput {
  onLightsCount: number;
  onSwitchesCount: number;
  switchesTotalCount: number;
  openDoorsCount: number;
  openWindowsCount: number;
  activeMotionCount: number;
  activeLeaksCount: number;
  activeSmokeCount: number;
  unlockedLocksCount: number;
  solarSelfSufficiencyPct?: number | null;
  activeFansCount: number;
  playingMediaCount: number;
  vacuumsTotalCount: number;
  activeVacuumsCount: number;
  camerasCount: number;
  isEditMode: boolean;
}

export function buildProOverviewTabs(input: BuildOverviewTabsInput): OverviewTabItem[] {
  const {
    onLightsCount,
    onSwitchesCount,
    switchesTotalCount,
    openDoorsCount,
    openWindowsCount,
    activeMotionCount,
    activeLeaksCount,
    activeSmokeCount,
    unlockedLocksCount,
    solarSelfSufficiencyPct,
    activeFansCount,
    playingMediaCount,
    vacuumsTotalCount,
    activeVacuumsCount,
    camerasCount,
    isEditMode
  } = input;

  const tabs: OverviewTabItem[] = [
    { id: 'all', label: 'All' },
    {
      id: 'lights',
      label: 'Lights',
      badge: onLightsCount > 0 ? `${onLightsCount} on` : undefined,
      badgeTone: onLightsCount > 0 ? 'warning' : undefined
    }
  ];

  if (switchesTotalCount > 0 || isEditMode) {
    tabs.push({
      id: 'switches',
      label: 'Switches',
      badge: onSwitchesCount > 0 ? `${onSwitchesCount} on` : undefined,
      badgeTone: onSwitchesCount > 0 ? 'default' : undefined
    });
  }

  const hasSolarPct = typeof solarSelfSufficiencyPct === 'number' && solarSelfSufficiencyPct > 0;
  tabs.push({
    id: 'energy',
    label: 'Energy',
    badge: hasSolarPct ? `${Math.min(100, Math.round(solarSelfSufficiencyPct))}%` : undefined,
    badgeTone: hasSolarPct ? 'success' : undefined
  });

  const hazards = activeLeaksCount + activeSmokeCount;
  const securityAlerts = openDoorsCount + openWindowsCount + activeMotionCount + hazards + unlockedLocksCount;
  tabs.push({
    id: 'security',
    label: 'Security',
    badge: securityAlerts > 0 ? String(securityAlerts) : undefined,
    badgeTone: securityAlerts > 0 ? (hazards > 0 ? 'danger' : 'warning') : undefined
  });

  if (camerasCount > 0) {
    tabs.push({
      id: 'cameras',
      label: 'Cameras',
      badge: String(camerasCount),
      badgeTone: 'default'
    });
  }

  tabs.push({
    id: 'climate',
    label: 'Climate',
    badge: activeFansCount > 0 ? `${activeFansCount} on` : undefined,
    badgeTone: activeFansCount > 0 ? 'accent' : undefined
  });

  const openings = openDoorsCount + openWindowsCount;
  tabs.push({
    id: 'openings',
    label: 'Doors & windows',
    badge: openings > 0 ? `${openings} open` : undefined,
    badgeTone: openings > 0 ? 'warning' : undefined
  });

  tabs.push({
    id: 'media',
    label: 'Media',
    badge: playingMediaCount > 0 ? `${playingMediaCount} playing` : undefined,
    badgeTone: playingMediaCount > 0 ? 'accent' : undefined
  });

  if (vacuumsTotalCount > 0) {
    tabs.push({
      id: 'vacuums',
      label: 'Vacuums',
      badge: activeVacuumsCount > 0 ? `${activeVacuumsCount} cleaning` : undefined,
      badgeTone: activeVacuumsCount > 0 ? 'accent' : undefined
    });
  }

  return tabs;
}
