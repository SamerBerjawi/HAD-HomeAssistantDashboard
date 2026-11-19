import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { OVERVIEW_SECTION_LABELS, type OverviewSectionId } from '../../lib/overviewSections';

interface OverviewSectionProps {
  id: OverviewSectionId;
  count: number;
  /** Outer grid columns this section spans. */
  span: number;
  isEditing: boolean;
  isCollapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleCollapsed: () => void;
  onMove: (dir: -1 | 1) => void;
  children: ReactNode;
}

/** A section (= a tab): title with collapse, and up/down to reorder sections in edit mode. */
export function OverviewSection({ id, count, span, isEditing, isCollapsed, isFirst, isLast, onToggleCollapsed, onMove, children }: OverviewSectionProps) {
  const label = OVERVIEW_SECTION_LABELS[id];
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
        {isEditing ? (
          <span className="ml-auto flex items-center gap-1">
            <Button isIconOnly size="sm" variant="ghost" className="pro-touch-44" aria-label={`Move ${label} section up`} isDisabled={isFirst} onPress={() => onMove(-1)}>
              <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="ghost" className="pro-touch-44" aria-label={`Move ${label} section down`} isDisabled={isLast} onPress={() => onMove(1)}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
            </Button>
          </span>
        ) : null}
      </header>
      {!isCollapsed ? children : null}
    </section>
  );
}
