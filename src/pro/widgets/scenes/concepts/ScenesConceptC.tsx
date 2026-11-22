/**
 * Scenes concept C — Innovative ("palette"). The card is tinted by the active scene's mood and
 * names it; the other scenes are round colour swatches, like a painter's palette. Tap a swatch
 * to switch. Small: name + three swatches. Wide: name | swatch row. Tall: swatch grid with names.
 * Large: grid with names and when each was last used.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBoardIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProSceneItem, ProScenesModel } from '../../../lib/overviewScenes';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { MOOD_COLORS, moodGradient, since, useSceneActions } from './shared';

function Swatch({ s, active, label, detail, size = 36 }: { s: ProSceneItem; active: boolean; label?: boolean; detail?: string; size?: number }) {
  const { activate } = useSceneActions();
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <Button
        isIconOnly
        variant="ghost"
        onPress={() => activate(s)}
        aria-label={`${s.name}${active ? ', active' : ''}. Activate`}
        className={cn('min-w-0 rounded-full p-0 shadow-sm', active && 'ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--surface)]')}
        style={{ width: size, height: size, background: moodGradient(s.mood) }}
      />
      {label ? <span className="line-clamp-2 w-full break-words text-center text-[11px] leading-tight">{s.shortName || s.name}</span> : null}
      {detail ? <span className="w-full truncate text-center text-[10px] text-muted">{detail}</span> : null}
    </div>
  );
}

export default function ScenesConceptC({ model, size, onOpenDetails }: DesignedWidgetProps<ProScenesModel>) {
  const cur = model.current;
  const tint = cur ? `radial-gradient(110% 90% at 0% 0%, color-mix(in oklab, ${MOOD_COLORS[cur.mood][0]} 30%, transparent), transparent 70%)` : undefined;
  const title = (
    <div className="min-w-0 pr-8">
      <p className="text-xs text-muted">{cur ? `Since ${since(cur.lastActivated).toLowerCase()}` : 'No scene active'}</p>
      <p className="line-clamp-2 text-lg font-semibold leading-tight">{cur ? cur.name : 'Pick a scene'}</p>
    </div>
  );
  const others = model.items;

  return (
    <WidgetSurface label="Scenes" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]" style={{ backgroundImage: tint }}>
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
            {title}
            <ul aria-label="Scenes" className="mt-auto flex gap-2">
              {others.slice(0, 3).map((s) => (
                <li key={s.entityId}>
                  <Swatch s={s} active={s.entityId === cur?.entityId} size={32} />
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {model.totalCount > 0 && size === 'w' ? (
          <>
            {title}
            <ul aria-label="Scenes" className="mt-auto grid grid-cols-5 gap-1.5">
              {others.slice(0, 5).map((s) => (
                <li key={s.entityId} className="min-w-0">
                  <Swatch s={s} active={s.entityId === cur?.entityId} size={32} label />
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {model.totalCount > 0 && (size === 't' || size === 'l') ? (
          <>
            {title}
            <ul aria-label="Scenes" className={cn('mt-auto grid gap-x-2 gap-y-2.5', size === 'l' ? 'grid-cols-4' : 'grid-cols-2')}>
              {others.slice(0, size === 'l' ? 8 : 6).map((s) => (
                <li key={s.entityId} className="min-w-0">
                  <Swatch s={s} active={s.entityId === cur?.entityId} label size={size === 'l' ? 40 : 34} detail={size === 'l' ? since(s.lastActivated) : undefined} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
