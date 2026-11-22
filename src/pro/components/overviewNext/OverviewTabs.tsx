/**
 * Overview tabs (Phase 4): "All", then one tab per section on the page, each with its count
 * ("Lights 8"). The count is warning or danger coloured when something in the section needs
 * attention. Kokonut SmoothTab, as on the current Overview.
 */
import { useMemo } from 'react';
import type { ShellTab, ShellTabId } from '../../lib/overviewShell';
import { SmoothTab, type SwipeTabItem } from '../../ui/kokonutui/SmoothTab';
import { shellTabIcon } from './sectionIcons';

export function OverviewTabs({ tabs, value, onChange }: { tabs: readonly ShellTab[]; value: ShellTabId; onChange: (id: ShellTabId) => void }) {
  const items = useMemo<SwipeTabItem[]>(
    () =>
      tabs.map((t) => ({
        id: t.id,
        title: t.label,
        icon: shellTabIcon(t.id),
        // A tab with something wrong but nothing to count still gets a dot of colour.
        badge: t.count > 0 ? String(t.count) : t.tone ? '!' : undefined,
        badgeTone: t.tone ?? 'default',
        ariaLabel: [t.label, t.count > 0 ? String(t.count) : null, t.tone === 'danger' ? 'needs attention now' : t.tone === 'warning' ? 'needs attention' : null].filter(Boolean).join(', ')
      })),
    [tabs]
  );
  return <SmoothTab items={items} value={value} onChange={(id) => onChange(id as ShellTabId)} label="Overview sections" mobileIconOnlyInactive badges="always" className="w-full" />;
}
