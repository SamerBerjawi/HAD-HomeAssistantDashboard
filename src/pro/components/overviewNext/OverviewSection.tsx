import type { CSSProperties, ReactNode } from 'react';
import { Button, Dropdown, Label } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  Tick02Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { AnyOverviewSectionId, SectionTabVisibility } from '../../lib/overviewLayout';
import { OVERVIEW_SECTION_LABELS, type OverviewSectionId } from '../../lib/overviewSections';

interface OverviewSectionProps {
  id: AnyOverviewSectionId;
  title?: string;
  count: number;
  /** Outer grid columns this section spans. */
  span: number;
  isEditing: boolean;
  isCollapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  visibility?: SectionTabVisibility;
  isCustom?: boolean;
  hasVisibilityRules?: boolean;
  onToggleCollapsed: () => void;
  onMove: (dir: -1 | 1) => void;
  onSetVisibility?: (v: SectionTabVisibility) => void;
  onEditVisibility?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  /** View mode on "All": the button that opens this section's tab (Phase 4). */
  onOpenTab?: () => void;
  children: ReactNode;
}

const VIS_BADGE: Record<SectionTabVisibility, string | null> = {
  all_and_tab: null,
  tab_only: 'Tab only',
  hidden: 'Hidden'
};

/**
 * A section (= a tab): title with collapse, optional custom/visibility menu & up/down controls in Edit Mode.
 */
export function OverviewSection({
  id,
  title,
  count,
  span,
  isEditing,
  isCollapsed,
  isFirst,
  isLast,
  visibility = 'all_and_tab',
  isCustom = false,
  hasVisibilityRules = false,
  onToggleCollapsed,
  onMove,
  onSetVisibility,
  onEditVisibility,
  onRename,
  onDelete,
  onOpenTab,
  children
}: OverviewSectionProps) {
  const label = title ?? OVERVIEW_SECTION_LABELS[id as OverviewSectionId] ?? String(id);
  const visBadge = VIS_BADGE[visibility];
  const style: CSSProperties = { gridColumn: `span ${span} / span ${span}` };

  return (
    <section aria-label={`${label} section`} className="flex min-w-0 flex-col gap-2" style={style}>
      <header className="flex min-h-9 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-1.5 text-sm font-semibold"
          aria-expanded={!isCollapsed}
          aria-label={`${label} section, ${count} ${count === 1 ? 'widget' : 'widgets'}. ${isCollapsed ? 'Expand' : 'Collapse'}`}
          onPress={onToggleCollapsed}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={cn('transition-transform motion-reduce:transition-none', isCollapsed && '-rotate-90')} />
          {label}
        </Button>
        {isEditing && visBadge ? (
          <span className="rounded-full bg-default/60 px-2 py-0.5 text-[10px] font-medium text-muted">{visBadge}</span>
        ) : null}
        {isEditing && hasVisibilityRules ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">Conditional</span>
        ) : null}
        {isEditing ? (
          <span className="ml-auto flex items-center gap-1">
            {onSetVisibility || onEditVisibility || isCustom ? (
              <Dropdown>
                <Button isIconOnly size="sm" variant="ghost" aria-label={`${label} section options`} className="size-8 min-w-0">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu
                    aria-label={`${label} options`}
                    onAction={(key) => {
                      const k = String(key);
                      if (k === 'vis:all_and_tab') onSetVisibility?.('all_and_tab');
                      else if (k === 'vis:tab_only') onSetVisibility?.('tab_only');
                      else if (k === 'vis:hidden') onSetVisibility?.('hidden');
                      else if (k === 'rules') onEditVisibility?.();
                      else if (k === 'rename') onRename?.();
                      else if (k === 'delete') onDelete?.();
                    }}
                  >
                    {onEditVisibility ? (
                      <Dropdown.Section>
                        <Dropdown.Item id="rules" textValue="Visibility rules">
                          <HugeiconsIcon icon={EyeIcon} size={15} className={hasVisibilityRules ? 'shrink-0 text-[var(--accent)]' : 'shrink-0'} />
                          <Label>Visibility rules…</Label>
                        </Dropdown.Item>
                      </Dropdown.Section>
                    ) : null}
                    {onSetVisibility ? (
                      <Dropdown.Section>
                        <Dropdown.Item id="vis:all_and_tab" textValue="Overview and Tab">
                          <HugeiconsIcon icon={Tick02Icon} size={15} className={visibility === 'all_and_tab' ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} />
                          <Label>Show on Overview &amp; Tab</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="vis:tab_only" textValue="Tab only">
                          <HugeiconsIcon icon={Tick02Icon} size={15} className={visibility === 'tab_only' ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} />
                          <Label>Tab only</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="vis:hidden" textValue="Hidden">
                          <HugeiconsIcon icon={Tick02Icon} size={15} className={visibility === 'hidden' ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} />
                          <Label>Hide section</Label>
                        </Dropdown.Item>
                      </Dropdown.Section>
                    ) : null}
                    {isCustom ? (
                      <Dropdown.Section>
                        {onRename ? (
                          <Dropdown.Item id="rename" textValue="Rename section">
                            <HugeiconsIcon icon={PencilEdit01Icon} size={15} className="shrink-0" />
                            <Label>Rename section…</Label>
                          </Dropdown.Item>
                        ) : null}
                        {onDelete ? (
                          <Dropdown.Item id="delete" textValue="Delete section">
                            <HugeiconsIcon icon={Delete02Icon} size={15} className="shrink-0 text-danger" />
                            <Label>Delete section</Label>
                          </Dropdown.Item>
                        ) : null}
                      </Dropdown.Section>
                    ) : null}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : null}
            <Button isIconOnly size="sm" variant="ghost" className="pro-touch-44" aria-label={`Move ${label} section up`} isDisabled={isFirst} onPress={() => onMove(-1)}>
              <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="ghost" className="pro-touch-44" aria-label={`Move ${label} section down`} isDisabled={isLast} onPress={() => onMove(1)}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
            </Button>
          </span>
        ) : onOpenTab ? (
          <Button isIconOnly size="sm" variant="ghost" className="ml-auto size-8 min-w-0 text-muted" aria-label={`Show only ${label}`} onPress={onOpenTab}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
          </Button>
        ) : null}
      </header>
      {!isCollapsed ? children : null}
    </section>
  );
}
