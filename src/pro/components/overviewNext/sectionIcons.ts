import type { IconSvgElement } from '@hugeicons/react';
import { DashboardSquare01Icon, Home01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { sectionTab, type OverviewSectionId } from '../../lib/overviewSections';
import type { ShellTabId } from '../../lib/overviewShell';
import { TAB_ICON } from '../overview/OverviewTabsBar';

/** An icon per Overview tab: built-in tabs use their icon, custom sections use DashboardSquare01Icon. */
export function shellTabIcon(id: ShellTabId): IconSvgElement {
  if (id === 'all') return DashboardSquare01Icon;
  if (id === 'rooms') return Home01Icon;
  if (id === 'people') return UserGroupIcon;
  const tabKey = sectionTab(id as OverviewSectionId) as string;
  return (TAB_ICON as Record<string, IconSvgElement>)[tabKey] ?? DashboardSquare01Icon;
}
