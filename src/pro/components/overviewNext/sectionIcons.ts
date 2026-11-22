import type { IconSvgElement } from '@hugeicons/react';
import { DashboardSquare01Icon, Home01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { sectionTab, type OverviewSectionId } from '../../lib/overviewSections';
import type { ShellTabId } from '../../lib/overviewShell';
import { TAB_ICON } from '../overview/OverviewTabsBar';

/** An icon per Overview tab: the section's own for Rooms and People, else the old tab icon. */
export function shellTabIcon(id: ShellTabId): IconSvgElement {
  if (id === 'all') return DashboardSquare01Icon;
  if (id === 'rooms') return Home01Icon;
  if (id === 'people') return UserGroupIcon;
  return TAB_ICON[sectionTab(id as OverviewSectionId)];
}
