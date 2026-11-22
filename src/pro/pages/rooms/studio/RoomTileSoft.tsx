/**
 * Rooms studio, Design B · "Soft atmospheric" (docs/pro-ui/ROOMS.md §5). Studio only until the
 * owner approves it. Diffused light rather than shapes: two large soft glows and a haze, no
 * borders, no curves, no icon tiles. The name is a quiet label at the top, the reading is a large
 * light-weight number at the bottom with one soft sentence under it, and the actions are a row of
 * borderless circles that only glow when on. Compact tiles are low, rounded strips with a small
 * glowing light.
 */
import { memo } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon } from '@hugeicons/core-free-icons';
import { RoomQuickActions } from '../RoomQuickActions';
import { roomIcon } from '../shared';
import { sameTile, tileFacts, type RoomTileProps } from '../tileParts';

function RoomTileSoftImpl({ r, size, prefs, actions, onOpen }: RoomTileProps) {
  const f = tileFacts(r, prefs, size);
  const compact = size === 'compact';
  const shown = actions.slice(0, compact ? 0 : size === 'expanded' ? 3 : 2);
  const sentence = [f.lights && f.lit ? f.lights : null, ...f.extras.slice(0, size === 'expanded' ? 3 : 1), size === 'expanded' ? f.devices : null].filter(Boolean).join(' · ') || (f.lights ?? f.devices ?? '');

  return (
    <div role="listitem" className="pro-rs h-full min-w-0" data-size={size} data-level={f.ambient.level} style={f.ambientStyle}>
      <span aria-hidden className="pro-rs-haze" />
      <Button variant="ghost" onPress={() => onOpen(r.areaId)} aria-label={`Open ${r.name}${f.summary ? `: ${f.summary}` : ''}`} className="pro-rs-open absolute inset-0 z-0 h-full w-full min-w-0 rounded-[inherit] p-0" />
      {compact ? (
        <div className="pointer-events-none relative flex h-full min-w-0 items-center gap-3 px-4">
          <span aria-hidden className="pro-rs-orb size-2.5 shrink-0 rounded-full" />
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium" title={r.name}>
            {r.name}
          </span>
          {f.dot ? <span role="img" aria-label={f.dot.label} className="size-1.5 shrink-0 rounded-full" style={{ background: f.dot.color }} /> : null}
          <span className="pro-rs-num shrink-0 text-xl tabular-nums">{f.big ?? <span className="pro-rs-sub text-sm">{f.word}</span>}</span>
        </div>
      ) : (
        <div className="pro-rs-body pointer-events-none relative h-full">
          <div className="pro-rs-grid" data-size={size}>
            <p className="pro-rs-name pro-rs-sub flex min-w-0 items-center gap-2 text-[14px] font-medium tracking-wide" title={r.name}>
              <HugeiconsIcon icon={roomIcon(r)} size={16} className="shrink-0 opacity-70" />
              <span className="truncate">{r.name}</span>
              {r.isFavorite ? <HugeiconsIcon icon={StarIcon} size={11} className="shrink-0 fill-current opacity-70" aria-label="Favourite" /> : null}
              {f.dot ? <span role="img" aria-label={f.dot.label} className="size-1.5 shrink-0 rounded-full" style={{ background: f.dot.color }} /> : null}
            </p>
            <RoomQuickActions r={r} actions={shown} useLightColor={prefs.lightColorGlow} look="b" className="pro-rs-acts gap-1" />
            <p className="pro-rs-temp pro-rs-num tabular-nums">{f.big ?? <span className="pro-rs-sub text-2xl">{f.word}</span>}</p>
            <p className="pro-rs-line pro-rs-sub truncate text-[13px]">{f.mood ? `${f.mood.label}${sentence ? ' · ' : ''}${sentence}` : sentence}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export const RoomTileSoft = memo(RoomTileSoftImpl, sameTile);
