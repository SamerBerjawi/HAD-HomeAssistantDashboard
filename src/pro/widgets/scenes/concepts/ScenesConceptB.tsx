/**
 * Scenes concept B — Expressive & immersive ("mood tiles"). Each scene is a tile painted in its
 * mood (cinema violet, dinner amber, night navy…); the active one glows. Small: the active
 * scene's mood fills the card. Wide: a 3 × 2 wall of tiles. Tall: 2 × 3. Large: 3 × 3 with a header.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBoardIcon, SparklesIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProSceneItem, ProScenesModel } from '../../../lib/overviewScenes';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { MOOD_COLORS, moodGradient, useSceneActions } from './shared';

function Tile({ s, active }: { s: ProSceneItem; active: boolean }) {
  const { activate } = useSceneActions();
  return (
    <Button
      variant="ghost"
      onPress={() => activate(s)}
      aria-label={`${s.name}${active ? ', active' : ''}. Activate`}
      className={cn('h-full min-h-0 w-full min-w-0 flex-col items-start justify-end gap-0 whitespace-normal rounded-2xl p-2 text-left text-white', active ? 'ring-2 ring-white' : 'opacity-85')}
      style={{ background: moodGradient(s.mood), boxShadow: active ? `0 0 16px ${MOOD_COLORS[s.mood][0]}` : undefined }}
    >
      {active ? <HugeiconsIcon icon={SparklesIcon} size={12} className="mb-auto" /> : null}
      <span className="line-clamp-2 w-full text-xs font-semibold leading-tight drop-shadow-sm">{s.name}</span>
    </Button>
  );
}

export default function ScenesConceptB({ model, size, onOpenDetails }: DesignedWidgetProps<ProScenesModel>) {
  const cur = model.current;
  if (model.totalCount === 0) {
    return (
      <WidgetSurface label="Scenes" className="bg-[var(--surface)]">
        <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-muted">
          <HugeiconsIcon icon={PaintBoardIcon} size={22} />
          <p className="text-sm font-medium">No scenes</p>
        </div>
      </WidgetSurface>
    );
  }

  if (size === 's') {
    const s = cur ?? model.items[0];
    return (
      <WidgetSurface label="Scenes" ink="light" style={{ background: cur ? moodGradient(cur.mood) : 'linear-gradient(140deg, hsl(225 15% 34%), hsl(230 18% 18%))' }}>
        <DetailsButton title="Scenes" onPress={onOpenDetails} ink="light" />
        <div className="flex h-full flex-col justify-end gap-0.5 p-3.5">
          <p className="text-xs text-white/80">{cur ? 'Now' : 'No scene active'}</p>
          <p className="line-clamp-2 text-lg font-semibold leading-tight">{cur ? cur.name : `${model.totalCount} scenes`}</p>
          {!cur && s ? <p className="text-xs text-white/70">Tap for all</p> : null}
        </div>
      </WidgetSurface>
    );
  }

  const count = size === 'w' ? 6 : size === 't' ? 6 : 9;
  return (
    <WidgetSurface label="Scenes" className="bg-[#16151c] text-white" ink="light">
      <DetailsButton title="Scenes" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-2.5">
        {size !== 'w' ? <p className="truncate px-1 pr-9 pt-1 text-sm font-semibold">{cur ? cur.name : 'Scenes'}</p> : null}
        <ul
          aria-label="Scenes"
          className={cn('grid min-h-0 flex-1 gap-1.5', size === 't' ? 'grid-cols-2 grid-rows-3' : 'grid-cols-3', size === 'w' ? 'grid-rows-2 pr-9' : size === 'l' ? 'grid-rows-3' : '')}
        >
          {model.items.slice(0, count).map((s) => (
            <li key={s.entityId} className="min-h-0 min-w-0">
              <Tile s={s} active={s.entityId === cur?.entityId} />
            </li>
          ))}
        </ul>
      </div>
    </WidgetSurface>
  );
}
