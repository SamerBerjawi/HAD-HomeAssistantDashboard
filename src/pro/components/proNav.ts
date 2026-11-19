import { useMemo } from 'react';
import {
  Car01Icon,
  CpuIcon,
  DashboardSquare01Icon,
  FlashIcon,
  HeartCheckIcon,
  MusicNote01Icon,
  PuzzleIcon,
  Robot01Icon,
  Router01Icon,
  Settings01Icon,
  Shield01Icon,
  Sofa01Icon,
  WorkflowSquare01Icon
} from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import type { SidebarNavGroup, SidebarNavItem } from '../ui/untitledui/SidebarSectionDividers';

/** Pages that can never be hidden (same rule as the classic sidebar). */
const MANDATORY = new Set(['overview', 'settings']);

/** Pro navigation (docs/pro-ui/DESIGN.md 7.2). The first group is also the phone tab bar (7.3). */
export const PRO_NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: 'Home',
    items: [
      { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon },
      { id: 'rooms', label: 'Rooms', icon: Sofa01Icon },
      { id: 'energy', label: 'Energy', icon: FlashIcon },
      { id: 'security', label: 'Security', icon: Shield01Icon }
    ]
  },
  {
    label: 'Life',
    items: [
      { id: 'media', label: 'Media', icon: MusicNote01Icon },
      { id: 'mobility', label: 'Mobility', icon: Car01Icon },
      { id: 'health', label: 'Health', icon: HeartCheckIcon },
      { id: 'vacuums', label: 'Vacuums', icon: Robot01Icon }
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'system', label: 'System', icon: CpuIcon },
      { id: 'network', label: 'Network', icon: Router01Icon },
      { id: 'automations', label: 'Automations', icon: WorkflowSquare01Icon },
      { id: 'integrations', label: 'Integrations', icon: PuzzleIcon }
    ]
  }
];

export const PRO_SETTINGS_ITEM: SidebarNavItem = { id: 'settings', label: 'Settings', icon: Settings01Icon };

/** Nav groups minus the pages hidden in Settings; empty groups are dropped. */
export function useVisibleNavGroups(): SidebarNavGroup[] {
  const { config } = useUserConfig();
  const hidden = config?.navigation?.hiddenPages;
  return useMemo(() => {
    const hiddenSet = new Set(hidden ?? []);
    return PRO_NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => MANDATORY.has(i.id) || !hiddenSet.has(i.id)) })).filter(
      (g) => g.items.length > 0
    );
  }, [hidden]);
}

/**
 * Classic long page titles (src/config/pageThemes.ts), used by the page header from 768 px up;
 * phones use the short nav label (docs/pro-ui/DESIGN.md 7.4).
 */
export const PRO_PAGE_LONG_TITLES: Record<string, string> = {
  overview: 'Overview',
  rooms: 'Rooms & Areas',
  energy: 'Energy & Power',
  security: 'Security & Safety',
  media: 'Media & Audio',
  mobility: 'Mobility & Vehicles',
  health: 'Health & Vitals',
  vacuums: 'Vacuums & Cleaning',
  system: 'System & Diagnostics',
  network: 'Network & Connectivity',
  automations: 'Automations & Scenes',
  integrations: 'Integrations & Add-ons',
  settings: 'Settings & Setup'
};
