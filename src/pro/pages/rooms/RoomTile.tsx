/**
 * A room tile on the Rooms page: Design A, "Refined adaptive ambient" (docs/pro-ui/ROOMS.md §3,
 * owner 2026-11-22). Three compositions:
 * - compact: a short horizontal card (icon, name, reading or state, status dot); no controls;
 * - standard: icon and name, big reading, a facts line, lights and devices, up to two actions;
 * - expanded: the same with a larger reading, more facts and up to three actions.
 * Reading order is always identity → reading → facts → summary. On narrow tiles (container
 * query) the actions move into the top row and the facts line hides. Light comes from layered
 * radial gradients (`roomAmbient`): lights amber, media violet, fans teal; heating and cooling only
 * a soft glow from below; idle rooms neutral. The whole tile opens the room.
 */
import { memo } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon, DashboardSquare01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { RoomQuickActions } from './RoomQuickActions';
import { roomIcon } from './shared';
import { sameTile, tileFacts, type RoomTileProps } from './tileParts';

/** A soft flowing accent line (no fill, so it never splits the tile in two). */
const Curve = () => (
  <svg aria-hidden viewBox="0 0 400 240" preserveAspectRatio="none" className="pro-rt-curve">
    <path d="M 130 262 C 245 222, 255 55, 420 -25" vectorEffect="non-scaling-stroke" />
  </svg>
);

function RoomTileImpl({ r, size, prefs, actions, onOpen }: RoomTileProps) {
  const f = tileFacts(r, prefs, size);
  const compact = size === 'compact';
  const shown = actions.slice(0, compact ? 0 : size === 'expanded' ? 3 : 2);
  const star = r.isFavorite ? <HugeiconsIcon icon={StarIcon} size={12} className="pro-rt-star shrink-0 fill-current" aria-label="Favourite" /> : null;
  const dot = f.dot ? <span role="img" aria-label={f.dot.label} className="pro-rt-dot size-2 shrink-0 rounded-full" style={{ background: f.dot.color, color: f.dot.color }} /> : null;

  return (
    <div role="listitem" className="pro-rt h-full min-w-0" data-size={size} data-level={f.ambient.level} style={f.ambientStyle}>
      {compact ? null : <Curve />}
      <Button variant="ghost" onPress={() => onOpen(r.areaId)} aria-label={`Open ${r.name}${f.summary ? `: ${f.summary}` : ''}`} className="pro-rt-open absolute inset-0 z-0 h-full w-full min-w-0 rounded-[inherit] p-0" />

      {compact ? (
        <div className="pointer-events-none relative flex h-full min-w-0 items-center gap-3 px-3.5">
          <span className="pro-rt-chip grid size-9 shrink-0 place-items-center rounded-[11px]">
            <HugeiconsIcon icon={roomIcon(r)} size={18} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold leading-tight" title={r.name}>
              <span className="truncate">{r.name}</span>
              {star}
            </span>
            <span className="pro-rt-sub truncate text-[13px] leading-tight">
              <span className="pro-rt-reading font-medium tabular-nums">{f.big ?? f.word}</span>
              {f.devices ? ` · ${f.devices}` : null}
            </span>
          </span>
          {dot}
        </div>
      ) : (
        <div className="pro-rt-body pointer-events-none relative h-full">
          <div className="pro-rt-grid" data-size={size}>
            <span className="pro-rt-chip pro-rt-icon grid place-items-center">
              <HugeiconsIcon icon={roomIcon(r)} size={size === 'expanded' ? 21 : 19} />
            </span>
            <p className="pro-rt-name flex min-w-0 items-center gap-1.5 font-semibold leading-tight" title={r.name}>
              <span className="truncate">{r.name}</span>
              {star}
              {dot}
            </p>
            <RoomQuickActions r={r} actions={shown} useLightColor={prefs.lightColorGlow} className="pro-rt-acts" />
            <p className={cn('pro-rt-temp font-semibold leading-none tracking-tight tabular-nums', !f.big && 'pro-rt-word')}>{f.big ?? f.word}</p>
            {f.extras.length || f.mood ? (
              <p className="pro-rt-extra pro-rt-sub flex min-w-0 items-center gap-1.5 text-[13px]">
                {r.media?.playing && prefs.animations ? (
                  <span aria-hidden className="pro-eq shrink-0">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null}
                {f.mood ? (
                  <span className="pro-rt-mood shrink-0 font-medium" data-tone={f.mood.tone}>
                    {f.mood.label}
                    {f.extras.length ? ' ·' : ''}
                  </span>
                ) : null}
                <span className="truncate">{f.extras.join(' · ')}</span>
              </p>
            ) : null}
            <p className="pro-rt-foot pro-rt-sub flex min-w-0 items-center gap-2 text-[13px]">
              {f.lights ? (
                <span className="flex min-w-0 items-center gap-1">
                  <HugeiconsIcon icon={BulbIcon} size={14} className={cn('shrink-0', f.lit && 'pro-rt-lit')} />
                  <span className="truncate">{f.lights}</span>
                </span>
              ) : null}
              {f.devices ? (
                <span className={cn('pro-rt-devices flex shrink-0 items-center gap-1', f.lights && 'has-lights')}>
                  {f.lights ? <span aria-hidden>·</span> : null}
                  <HugeiconsIcon icon={DashboardSquare01Icon} size={13} className="shrink-0" />
                  {f.devices}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export const RoomTile = memo(RoomTileImpl, sameTile);
