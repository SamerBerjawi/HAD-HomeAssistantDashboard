/**
 * Overview page shell (rebuild, Phase 4), around the layout engine:
 *
 * - Attention pills: only what needs attention, from each widget's `attention()`; tap = details.
 *   With nothing to show, one quiet "Nothing needs attention" line instead.
 * - Tabs: "All" plus one per section on the page, with counts from each widget's `count()`; a
 *   tab shows only its section, full width; the choice is in the URL (`?tab=`). Editing is
 *   always on "All" (sections are reordered there).
 * - Empty state: a page with no widgets says so and offers Add widgets / Restore the default.
 * - Demo mode: a quiet note that changes stay on this screen (actions work through the demo
 *   simulator in `useServiceCall`).
 */
import { useCallback, useMemo, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DashboardSquareAddIcon, PlusSignIcon, RotateLeft01Icon } from '@hugeicons/core-free-icons';
import { haWebSocketService } from '@/services/haWebSocket';
import type { OverviewLayoutApi } from '../../hooks/useOverviewLayout';
import { useOverviewTab } from '../../hooks/useOverviewTab';
import { useOpenSheet } from '../../hooks/useSheetParam';
import { visibleSections } from '../../lib/overviewLayout';
import type { OverviewSectionId } from '../../lib/overviewSections';
import { resolveShellTabId, sectionShowsCards, type ShellPill, type ShellTabId } from '../../lib/overviewShell';
import { OverviewEngine } from './OverviewEngine';
import { ShellStatusBar } from './ShellStatusBar';
import type { EngineWidget } from './WidgetCard';
import { WidgetProbes } from './WidgetProbes';

interface OverviewShellProps {
  widgets: readonly EngineWidget[];
  api: OverviewLayoutApi;
  cols: number;
  onAddWidgets: () => void;
  /** Customize, beside the tabs (view mode). */
  toolbar?: ReactNode;
}

function EmptyOverview({ isEditing, onAdd, onRestore }: { isEditing: boolean; onAdd: () => void; onRestore: () => void }) {
  return (
    <section aria-label="No widgets" className="pro-surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="pro-soft grid size-12 place-items-center rounded-2xl">
        <HugeiconsIcon icon={DashboardSquareAddIcon} size={24} />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Nothing on your Overview</h2>
        <p className="max-w-sm text-sm text-muted">{isEditing ? 'Add the widgets you want here, then Save.' : 'Every widget is hidden. Add some back, or start again from the default layout.'}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="primary" onPress={onAdd}>
          <HugeiconsIcon icon={PlusSignIcon} size={15} />
          Add widgets
        </Button>
        {isEditing ? null : (
          <Button size="sm" variant="tertiary" onPress={onRestore}>
            <HugeiconsIcon icon={RotateLeft01Icon} size={15} />
            Restore default layout
          </Button>
        )}
      </div>
    </section>
  );
}

export function OverviewShell({ widgets, api, cols, onAddWidgets, toolbar }: OverviewShellProps) {
  const open = useOpenSheet();
  const [askedTab, selectTab] = useOverviewTab();
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const isDemo = haWebSocketService.isDemo();

  const sections = useMemo(
    () =>
      visibleSections(api.layout)
        .map((s) => ({ ...s, items: s.items.filter((p) => byId.has(p.i)) }))
        .filter((s) => s.items.length > 0),
    [api.layout, byId]
  );
  const onPage = useMemo(() => sections.flatMap((s) => s.items.map((p) => byId.get(p.i)!)), [sections, byId]);
  // The tab depends on which sections exist, not on their counts: the status lives in ShellStatusBar.
  const tab: ShellTabId = api.isEditing ? 'all' : resolveShellTabId(askedTab, sections);
  const watches = onPage.some((w) => w.attention);
  // Cards on screen report their own status; probes cover the rest (other tabs, collapsed sections).
  const collapsed = api.layout.collapsed;
  const offScreen = useMemo(
    () => sections.filter((s) => !sectionShowsCards(s.section, tab, collapsed)).flatMap((s) => s.items.map((p) => byId.get(p.i)!)),
    [sections, tab, collapsed, byId]
  );

  const activate = useCallback(
    (pill: ShellPill) => {
      if (byId.get(pill.widgetId)?.Sheet) open(pill.widgetId);
      else selectTab(pill.section);
    },
    [byId, open, selectTab]
  );
  const addWidgets = () => {
    if (!api.isEditing) api.begin();
    onAddWidgets();
  };
  const restore = () => {
    api.begin();
    api.resetToDefault();
  };

  return (
    <div className="flex flex-col gap-4">
      <WidgetProbes widgets={offScreen} />
      <ShellStatusBar
        sections={sections}
        byId={byId}
        isEditing={api.isEditing}
        isDemo={isDemo}
        watches={watches}
        toolbar={toolbar}
        tab={tab}
        onSelectTab={selectTab}
        onActivate={activate}
      />

      {sections.length === 0 ? (
        <EmptyOverview isEditing={api.isEditing} onAdd={addWidgets} onRestore={restore} />
      ) : (
        <OverviewEngine widgets={widgets} api={api} cols={cols} onlySection={tab === 'all' ? undefined : (tab as OverviewSectionId)} onOpenSection={selectTab} />
      )}
    </div>
  );
}
