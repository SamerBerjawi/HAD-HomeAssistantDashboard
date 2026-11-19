import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { LayoutPlacement } from '../../lib/overviewLayout';
import { OVERVIEW_SECTION_LABELS, type OverviewSectionId } from '../../lib/overviewSections';
import { SpikeSectionGrid, type SpikeCompaction } from './SpikeSectionGrid';

interface SpikeSectionProps {
  id: OverviewSectionId;
  placements: LayoutPlacement[];
  cols: number;
  /** Outer columns this section spans (view mode, side by side). */
  span: number;
  isEditing: boolean;
  compaction: SpikeCompaction;
  isCollapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleCollapsed: () => void;
  onMove: (dir: -1 | 1) => void;
  onChange: (next: LayoutPlacement[]) => void;
  renderCard: (placement: LayoutPlacement) => ReactNode;
}

/** A section: header (title, collapse, reorder in edit mode) over its own grid. */
export function SpikeSection({ id, placements, cols, span, isEditing, compaction, isCollapsed, isFirst, isLast, onToggleCollapsed, onMove, onChange, renderCard }: SpikeSectionProps) {
  const label = OVERVIEW_SECTION_LABELS[id];
  const style: CSSProperties = { gridColumn: `span ${span} / span ${span}` };
  return (
    <section aria-label={`${label} section`} className="flex min-w-0 flex-col gap-2" style={style}>
      <header className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-1.5 text-sm font-semibold"
          aria-expanded={!isCollapsed}
          aria-label={`${label}, ${isCollapsed ? 'expand' : 'collapse'} section`}
          onPress={onToggleCollapsed}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={cn('transition-transform', isCollapsed && '-rotate-90')} />
          {label}
          <span className="text-xs font-normal text-muted">{placements.length}</span>
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
      {!isCollapsed ? <SpikeSectionGrid placements={placements} cols={cols} isEditing={isEditing} compaction={compaction} onChange={onChange} renderCard={renderCard} /> : null}
    </section>
  );
}
