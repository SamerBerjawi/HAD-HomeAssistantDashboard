/**
 * Scenes concept A — Refined & minimal. What is on now as a quiet headline; scenes as text
 * buttons, the current one ticked. Small: current + count. Wide: 2 × 2 buttons. Tall: a list.
 * Large: two columns with when each was last used.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBoardIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProSceneItem, ProScenesModel } from '../../../lib/overviewScenes';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { since, useSceneActions } from './shared';

function SceneButton({ s, current, detail }: { s: ProSceneItem; current: boolean; detail?: string }) {
  const { activate } = useSceneActions();
  return (
    <Button
      variant="ghost"
      onPress={() => activate(s)}
      aria-label={`${s.name}${current ? ', active' : ''}. Activate`}
      className={cn('h-auto w-full min-w-0 justify-start gap-2 rounded-xl px-2.5 py-1.5 text-left', current ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-default/50')}
    >
      <HugeiconsIcon icon={Tick02Icon} size={14} className={cn('shrink-0', !current && 'invisible')} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{s.name}</span>
        {detail ? <span className="truncate text-xs font-normal text-muted">{detail}</span> : null}
      </span>
    </Button>
  );
}

export default function ScenesConceptA({ model, size, onOpenDetails }: DesignedWidgetProps<ProScenesModel>) {
  const cur = model.current;
  const headline = (
    <div className="min-w-0 pr-8">
      <p className="text-xs text-muted">{cur ? 'Active scene' : 'Scenes'}</p>
      <p className="truncate text-2xl font-light leading-tight tracking-tight">{cur ? cur.name : 'None active'}</p>
    </div>
  );
  return (
    <WidgetSurface label="Scenes" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Scenes" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {model.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={PaintBoardIcon} size={22} />
            <p className="text-sm font-medium">No scenes</p>
          </div>
        ) : null}

        {model.totalCount > 0 && size === 's' ? (
          <>
            {headline}
            <p className="mt-auto text-xs text-muted">{model.totalCount} scenes</p>
          </>
        ) : null}

        {model.totalCount > 0 && size !== 's' ? (
          <>
            {size !== 'w' ? headline : null}
            <ul aria-label="Scenes" className={cn('mt-auto grid gap-1.5', size === 'w' || size === 'l' ? 'grid-cols-2' : 'grid-cols-1')}>
              {model.items.slice(0, size === 'w' ? 4 : size === 't' ? 4 : 6).map((s) => (
                <li key={s.entityId} className="min-w-0">
                  <SceneButton s={s} current={s.entityId === cur?.entityId} detail={size === 'l' ? since(s.lastActivated) : undefined} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
