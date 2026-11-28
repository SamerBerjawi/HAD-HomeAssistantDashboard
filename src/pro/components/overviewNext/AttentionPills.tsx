/**
 * Attention pills (Phase 4): only what needs attention (an open door, a leak, the alarm going
 * off or arming, a jammed lock, a vacuum stuck or low), worst first. A pill opens that widget's
 * details, or its tab when the widget has no details sheet. Nothing to show = no row at all.
 */
import { Tag, TagGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ShellPill } from '../../lib/overviewShell';
import type { EngineWidget } from './WidgetCard';

const TONE = {
  danger: 'bg-[hsl(0_100%_96%)] text-[hsl(0_70%_38%)] ring-[hsl(0_80%_85%)] dark:bg-[hsl(0_60%_18%)] dark:text-[hsl(0_100%_85%)] dark:ring-[hsl(0_60%_30%)]',
  warning: 'bg-[hsl(42_100%_94%)] text-[hsl(30_80%_30%)] ring-[hsl(40_90%_80%)] dark:bg-[hsl(38_55%_18%)] dark:text-[hsl(42_100%_75%)] dark:ring-[hsl(38_50%_30%)]'
} as const;

export function AttentionPills({ pills, byId, onActivate }: { pills: readonly ShellPill[]; byId: ReadonlyMap<string, EngineWidget>; onActivate: (pill: ShellPill) => void }) {
  if (pills.length === 0) return null;
  return (
    <TagGroup
      aria-label="Needs attention"
      onAction={(key) => {
        const pill = pills.find((p) => p.widgetId === key);
        if (pill) onActivate(pill);
      }}
    >
      <TagGroup.List className="flex flex-wrap items-center gap-2">
        {pills.map((p) => {
          const widget = byId.get(p.widgetId);
          return (
            <Tag
              key={p.widgetId}
              id={p.widgetId}
              textValue={`${p.label}. ${widget?.Sheet ? 'Open details' : 'Show section'}`}
              className={cn('min-h-9 gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-[filter] hover:brightness-95', TONE[p.tone])}
            >
              <HugeiconsIcon icon={p.tone === 'danger' ? Alert02Icon : (widget?.icon ?? Alert02Icon)} size={15} className="shrink-0" />
              {p.label}
            </Tag>
          );
        })}
      </TagGroup.List>
    </TagGroup>
  );
}
