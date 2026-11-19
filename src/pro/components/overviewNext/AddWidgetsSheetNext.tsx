import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { ProSheet } from '../ProSheet';
import { DEFAULT_OVERVIEW_SECTION_ORDER, OVERVIEW_SECTION_LABELS } from '../../lib/overviewSections';
import type { EngineWidget } from './WidgetCard';

interface AddWidgetsSheetNextProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: readonly EngineWidget[];
  hidden: readonly string[];
  onAdd: (widget: EngineWidget) => void;
}

/** Add widgets (rebuild, Phase 2): every widget from the registry, by section; hidden ones can be added back. */
export function AddWidgetsSheetNext({ isOpen, onOpenChange, widgets, hidden, onAdd }: AddWidgetsSheetNextProps) {
  const groups = DEFAULT_OVERVIEW_SECTION_ORDER.map((section) => ({ section, items: widgets.filter((w) => w.section === section) })).filter((g) => g.items.length > 0);
  return (
    <ProSheet isOpen={isOpen} onOpenChange={onOpenChange} title="Add widgets" subtitle={`${hidden.length} hidden`} icon={PlusSignIcon} page="overview">
      <div className="flex flex-col gap-4">
        {groups.map(({ section, items }) => (
          <section key={section} aria-label={OVERVIEW_SECTION_LABELS[section]} className="flex flex-col gap-1.5">
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{OVERVIEW_SECTION_LABELS[section]}</h3>
            <ul className="flex flex-col gap-1.5">
              {items.map((w) => {
                const isHidden = hidden.includes(w.id);
                return (
                  <li key={w.id} className="flex items-center gap-3 rounded-xl bg-default/40 px-3 py-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                      <HugeiconsIcon icon={w.icon} size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{w.title}</span>
                    {isHidden ? (
                      <Button size="sm" variant="tertiary" className="pro-touch-44" aria-label={`Add ${w.title}`} onPress={() => onAdd(w)}>
                        <HugeiconsIcon icon={PlusSignIcon} size={14} />
                        Add
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-success" />
                        On the page
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </ProSheet>
  );
}
