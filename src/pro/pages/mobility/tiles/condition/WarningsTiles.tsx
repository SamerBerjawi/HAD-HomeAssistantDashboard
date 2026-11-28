/**
 * Vehicle tiles · batch 5 · Warnings (docs/pro-ui/VEHICLE_TILES.md): what the car itself says is
 * wrong: its dashboard warning lights (FordPass: indicators) and messages. Read only.
 * A · List: "No warnings" with a check, or each one as an amber row.
 * B · Count: the number big in amber, the first warning under it.
 * C · Quiet: a small "No warnings" while all is well; the tile turns amber with the warnings when
 *   there are any (as Alarm C).
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { IconChip, OK, WARN, wash, type VehicleTileProps } from '../vehicleTileKit';

const none = (size: VehicleTileProps['size']) => (
  <TileFrame label="Warnings" className="pro-surface">
    <div className={cn('flex h-full', size === 'xs' ? 'items-center gap-2.5 px-3' : 'flex-col p-3.5')}>
      <IconChip icon={CheckmarkCircle02Icon} hue={OK} px={32} />
      <div className={cn('min-w-0', size !== 'xs' && 'mt-auto')}>
        <TileName>No warnings</TileName>
        <TileState className={cn(size === 'xs' && 'text-[12px]')}>Nothing from the car</TileState>
      </div>
    </div>
  </TileFrame>
);

// ---------------------------------------------------------------------------------------------
// A · List
// ---------------------------------------------------------------------------------------------

export function WarningsList({ v, size }: VehicleTileProps) {
  const w = v.condition.warnings;
  if (!w.length) return none(size);
  if (size === 'xs')
    return (
      <TileFrame label="Warnings" className="pro-surface" style={wash(WARN)}>
        <div className="flex h-full items-center gap-2.5 px-3">
          <IconChip icon={Alert02Icon} hue={WARN} px={32} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold" style={{ color: WARN }}>
              {w[0]}
            </p>
            <TileState className="text-[12px]">{w.length > 1 ? `+${w.length - 1} more` : 'Warning'}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  const shown = size === 's' ? w.slice(0, 3) : size === 'w' ? w.slice(0, 4) : w;
  return (
    <TileFrame label="Warnings" className="pro-surface" style={wash(WARN)}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <TileName>Warnings</TileName>
        <ul className={cn('mt-auto grid gap-x-4 gap-y-1', size === 'w' && 'grid-cols-2')}>
          {shown.map((x) => (
            <li key={x} className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium">
              <HugeiconsIcon icon={Alert02Icon} size={14} style={{ color: WARN }} className="shrink-0" />
              <span className="truncate">{x}</span>
            </li>
          ))}
        </ul>
        {shown.length < w.length ? <p className="mt-1 text-[12px] opacity-60">+{w.length - shown.length} more</p> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Count
// ---------------------------------------------------------------------------------------------

export function WarningsCount({ v, size }: VehicleTileProps) {
  const w = v.condition.warnings;
  if (!w.length) return none(size);
  if (size === 'xs') return <WarningsList v={v} size="xs" act={() => {}} now={0} />;
  return (
    <TileFrame label="Warnings" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <TileName>Warnings</TileName>
        <p className={cn('mt-auto font-semibold leading-none tracking-[-0.03em] tabular-nums', size === 'l' ? 'text-[72px]' : 'text-[44px]')} style={{ color: WARN }}>
          {w.length}
        </p>
        <TileState className="mt-1">{w[0]}</TileState>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Quiet
// ---------------------------------------------------------------------------------------------

export function WarningsQuiet({ v, size }: VehicleTileProps) {
  const w = v.condition.warnings;
  if (!w.length)
    return (
      <TileFrame label="Warnings" className="pro-surface">
        <div className={cn('flex h-full items-center gap-1.5', size === 'xs' ? 'px-3' : 'items-end p-3.5')}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} style={{ color: OK }} />
          <span className="text-[13px] opacity-70">No warnings</span>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Warnings" className="text-[hsl(30_70%_14%)]" style={{ background: `linear-gradient(150deg, color-mix(in srgb, ${WARN} 80%, white), ${WARN})` }}>
      <div className={cn('flex h-full', size === 'xs' ? 'items-center gap-2 px-3' : 'flex-col p-4')}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/35">
          <HugeiconsIcon icon={Alert02Icon} size={18} />
        </span>
        <div className={cn('min-w-0', size === 'xs' ? 'flex-1' : 'mt-auto')}>
          <p className={cn('truncate font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[28px]' : size === 'xs' ? 'text-[15px]' : 'text-[19px]')}>{w.length === 1 ? w[0] : `${w.length} warnings`}</p>
          {size !== 'xs' && w.length > 1 ? <p className="truncate text-[13px] opacity-80">{w.join(' · ')}</p> : null}
        </div>
      </div>
    </TileFrame>
  );
}
