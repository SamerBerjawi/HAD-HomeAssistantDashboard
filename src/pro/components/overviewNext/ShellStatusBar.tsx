/**
 * The attention pills and the section tabs (Overview shell, Phase 4). This is the one place that
 * subscribes to every widget's status, so a count changing ("Lights 8" → "Lights 7") redraws
 * these two rows only, not the widget grid below.
 */
import { memo, useMemo, type ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { useWidgetStatusStore } from '../../hooks/useWidgetStatus';
import { buildAttentionPills, buildShellTabs, type ShellPill, type ShellSection, type ShellTabId } from '../../lib/overviewShell';
import { AttentionPills } from './AttentionPills';
import { OverviewTabs } from './OverviewTabs';
import type { EngineWidget } from './WidgetCard';

interface ShellStatusBarProps {
  sections: readonly ShellSection[];
  byId: ReadonlyMap<string, EngineWidget>;
  isEditing: boolean;
  isDemo: boolean;
  /** Some widget on the page can raise a pill, so "Nothing needs attention" means something. */
  watches: boolean;
  /** Customize, beside the tabs (view mode). */
  toolbar?: ReactNode;
  tab: ShellTabId;
  onSelectTab: (tab: ShellTabId) => void;
  onActivate: (pill: ShellPill) => void;
}

export const ShellStatusBar = memo(function ShellStatusBar({ sections, byId, isEditing, isDemo, watches, toolbar, tab, onSelectTab, onActivate }: ShellStatusBarProps) {
  const status = useWidgetStatusStore((s) => s.byId);
  const tabs = useMemo(() => buildShellTabs(sections, status), [sections, status]);
  const pills = useMemo(() => buildAttentionPills(sections, status), [sections, status]);
  if (isEditing) return null;

  return (
    <>
      {pills.length > 0 || watches || isDemo ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <AttentionPills pills={pills} byId={byId} onActivate={onActivate} />
          {pills.length === 0 && watches ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} className="text-success" />
              Nothing needs attention
            </p>
          ) : null}
          {isDemo ? (
            <p className="flex items-center gap-1.5 text-xs text-muted sm:ml-auto">
              <HugeiconsIcon icon={InformationCircleIcon} size={14} />
              Demo home: changes stay on this screen
            </p>
          ) : null}
        </div>
      ) : null}

      {sections.length > 1 || toolbar ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{sections.length > 1 ? <OverviewTabs tabs={tabs} value={tab} onChange={onSelectTab} /> : null}</div>
          {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
        </div>
      ) : null}
    </>
  );
});
