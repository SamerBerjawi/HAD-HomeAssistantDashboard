/**
 * A room tile on the Rooms page: Design D · "Soft blend" (docs/pro-ui/ROOMS.md §3 and §5, owner
 * approved 2026-11-22, in production). The owner's mix:
 * - from B: the soft atmospheric surface (diffused glows, haze, no border, no curve), the quiet
 *   title label at the top and the borderless round toggles that glow only when on;
 * - from A: the information: big reading, the facts line (status word, climate, what is playing,
 *   humidity…) and the lights · devices summary;
 * - from C: the room icon tinted in the room's light.
 * Every size carries the lights toggle when the room has lights (compact: lights only). Devices
 * use the flow-connection icon. With "Area pictures" on, the area's HA picture sits behind the
 * tile under a scrim (text turns light), with the room's light still glowing over it.
 */
import { memo } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon, FlowConnectionIcon, StarIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { RoomQuickActions } from './RoomQuickActions';
import { roomIcon } from './shared';
import { sameTile, tileFacts, type RoomTileProps } from './tileParts';
import { useHaPicture } from '../../widgets/shared/useHaPicture';

type BlendProps = RoomTileProps & {showStates?: boolean; showReading?: boolean; showCounts?: boolean};

function RoomTileBlendImpl({ r, size, prefs, actions, onOpen, showStates = true, showReading = true, showCounts = true }: BlendProps) {
  const f = tileFacts(r, prefs, size);
  const picture = useHaPicture(prefs.showPictures ? r.picture : null);
  const compact = size === 'compact';
  // Lights always first (`roomActions` order); compact tiles get the lights toggle only.
  const shown = compact ? actions.filter((a) => a === 'lights') : actions.slice(0, size === 'expanded' ? 3 : 2);
  const dot = showStates && f.dot ? <span role="img" aria-label={f.dot.label} className="size-1.5 shrink-0 rounded-full" style={{ background: f.dot.color }} /> : null;
  const icon = <HugeiconsIcon icon={roomIcon(r)} size={compact ? 18 : 17} className="pro-rb-ico shrink-0" />;

  return (
    <div role="listitem" className="pro-rs pro-rb h-full min-w-0" data-size={size} data-level={f.ambient.level} data-picture={picture ? '' : undefined} style={f.ambientStyle}>
      {picture ? <img src={picture} alt="" loading="lazy" decoding="async" className="pro-rb-pic" /> : null}
      <span aria-hidden className="pro-rs-haze" />
      <Button variant="ghost" onPress={() => onOpen(r.areaId)} aria-label={`Open ${r.name}${f.summary ? `: ${f.summary}` : ''}`} className="pro-rs-open absolute inset-0 z-0 h-full w-full min-w-0 rounded-[inherit] p-0" />
      {compact ? (
        <div className="pointer-events-none relative flex h-full min-w-0 items-center gap-3 pl-4 pr-2.5">
          {icon}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-center gap-1.5 text-[15px] font-medium" title={r.name}>
              <span className="truncate">{r.name}</span>
              {r.isFavorite ? <HugeiconsIcon icon={StarIcon} size={11} className="shrink-0 fill-current opacity-60" aria-label="Favourite" /> : null}
              {dot}
            </span>
            <span className="pro-rs-sub truncate text-[12px]">
              {showReading && <span className="font-semibold tabular-nums text-[var(--rs-fg)]">{f.big ?? f.word}</span>}
              {showCounts && f.devices ? (showReading ? ' · ' : '') + f.devices : null}
            </span>
          </span>
          <RoomQuickActions r={r} actions={shown} useLightColor={prefs.lightColorGlow} look="b" />
        </div>
      ) : (
        <div className="pro-rs-body pointer-events-none relative h-full">
          <div className="pro-rb-grid" data-size={size}>
            <p className="pro-rb-name pro-rs-sub flex min-w-0 items-center gap-2 text-[14px] font-medium tracking-wide" title={r.name}>
              {icon}
              <span className="truncate">{r.name}</span>
              {r.isFavorite ? <HugeiconsIcon icon={StarIcon} size={11} className="shrink-0 fill-current opacity-70" aria-label="Favourite" /> : null}
              {dot}
            </p>
            <RoomQuickActions r={r} actions={shown} useLightColor={prefs.lightColorGlow} look="b" className="pro-rb-acts gap-1" />
            {showReading && <p className={cn('pro-rb-temp font-semibold leading-none tracking-tight tabular-nums', !f.big && 'pro-rb-word')}>{f.big ?? f.word}</p>}
            {showStates && (f.extras.length || f.mood) ? (
              <p className="pro-rb-extra pro-rs-sub flex min-w-0 items-center gap-1.5 text-[13px]">
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
            {showCounts && <p className="pro-rb-foot pro-rs-sub flex min-w-0 items-center gap-2 text-[13px]">
              {f.lights ? (
                <span className="flex min-w-0 items-center gap-1">
                  <HugeiconsIcon icon={BulbIcon} size={14} className={cn('shrink-0', f.lit && 'pro-rt-lit')} />
                  <span className="truncate">{f.lights}</span>
                </span>
              ) : null}
              {f.devices ? (
                <span className={cn('pro-rb-devices flex shrink-0 items-center gap-1', f.lights && 'has-lights')}>
                  {f.lights ? <span aria-hidden>·</span> : null}
                  <HugeiconsIcon icon={FlowConnectionIcon} size={13} className="shrink-0" />
                  {f.devices}
                </span>
              ) : null}
            </p>}
          </div>
        </div>
      )}
    </div>
  );
}

export const RoomTileBlend = memo(RoomTileBlendImpl, (a, b) => a.showStates === b.showStates && a.showReading === b.showReading && a.showCounts === b.showCounts && sameTile(a, b));
