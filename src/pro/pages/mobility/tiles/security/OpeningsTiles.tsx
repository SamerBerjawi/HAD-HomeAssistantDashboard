/**
 * Vehicle tiles · batch 3 · Openings (docs/pro-ui/VEHICLE_TILES.md): is anything open (doors,
 * windows, boot, bonnet, charge port), and where. Read-only.
 * A · List: "All closed" with a check, or the open ones named in amber.
 * B · Car plan: the car from above (as your Extras pick), the open door, window, boot or bonnet
 *   drawn amber where it is.
 * C · Checklist: every kind (Doors, Windows, Boot, Bonnet) with a check or what is open.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, DoorOpenIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { SAFE, WATCH } from '../../../../areas/tiles/security/securityParts';
import type { Vehicle } from '../../../../lib/mobilityHome';
import { IconChip, openLabel, wash, type VehicleTileProps } from '../vehicleTileKit';

type Item = Vehicle['security']['open'][number];

function Unavailable() {
  return (
    <TileFrame label="Openings" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={DoorOpenIcon} on={false} />
        <TileName className="mt-auto">Doors & windows</TileName>
        <TileState>Not on a bike</TileState>
      </div>
    </TileFrame>
  );
}

const summary = (open: Item[]) => (open.length === 0 ? 'All closed' : open.length === 1 ? `${openLabel(open[0])} open` : `${open.length} open`);

// ---------------------------------------------------------------------------------------------
// A · List
// ---------------------------------------------------------------------------------------------

export function OpeningsList({ v, size }: VehicleTileProps) {
  if (v.kind !== 'car') return <Unavailable />;
  const open = v.security.open;
  const ok = open.length === 0;
  const hue = ok ? SAFE : WATCH;
  const icon = ok ? CheckmarkCircle02Icon : Alert02Icon;
  if (size === 'xs')
    return (
      <TileFrame label="Openings" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <IconChip icon={icon} hue={hue} px={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold" style={ok ? undefined : { color: hue }}>
              {summary(open)}
            </p>
            <TileState className="text-[12px]">Doors & windows</TileState>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Openings" className="pro-surface" style={ok ? undefined : wash(WATCH)}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <IconChip icon={icon} hue={hue} px={size === 'l' ? 40 : 32} />
        <div className="mt-auto">
          <TileName className="opacity-70">Doors & windows</TileName>
          {ok || size === 's' ? (
            <p className={cn('font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[30px]' : 'text-[20px]')} style={ok ? undefined : { color: hue }}>
              {summary(open)}
            </p>
          ) : (
            <ul className="mt-1 flex flex-col gap-0.5">
              {open.map((o, i) => (
                <li key={i} className={cn('font-semibold', size === 'l' ? 'text-[20px]' : 'text-[16px]')} style={{ color: hue }}>
                  {openLabel(o)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Car plan
// ---------------------------------------------------------------------------------------------

/** Which side and end of the car an opening is on, from its words ("rear left", "driver"…). */
function placeOf(o: Item): { part: 'door' | 'window' | 'boot' | 'bonnet' | 'port'; front: boolean; left: boolean } | null {
  if (o.what === 'boot') return { part: 'boot', front: false, left: true };
  if (o.what === 'bonnet') return { part: 'bonnet', front: true, left: true };
  if (o.what === 'charge-port') return { part: 'port', front: true, left: true };
  const w = o.where.toLowerCase();
  const left = /left|driver/.test(w);
  const right = /right|passenger/.test(w);
  if (!left && !right) return null;
  return { part: o.what === 'window' ? 'window' : 'door', front: !/rear|back/.test(w), left };
}

function Plan({ open }: { open: Item[] }) {
  const places = open.map(placeOf);
  const is = (part: string, front?: boolean, left?: boolean) => places.some((p) => p && p.part === part && (front === undefined || p.front === front) && (left === undefined || p.left === left));
  const line = 'color-mix(in srgb, currentColor 30%, transparent)';
  const amber = { stroke: WATCH, strokeWidth: 4, style: { filter: `drop-shadow(0 0 4px ${WATCH})` } };
  // The car faces right; the driver's side (left) is the top edge.
  const door = (x: number, front: boolean, left: boolean) => {
    const y = left ? 8 : 82;
    const opened = is('door', front, left);
    return opened ? <path d={`M ${x} ${y} L ${x + 34} ${y + (left ? -14 : 14)}`} fill="none" strokeLinecap="round" {...amber} /> : <path d={`M ${x} ${y} H ${x + 36}`} stroke={line} strokeWidth={2} />;
  };
  const win = (x: number, front: boolean, left: boolean) => (is('window', front, left) ? <path d={`M ${x + 4} ${left ? 18 : 72} H ${x + 32}`} strokeLinecap="round" {...amber} /> : null);
  return (
    <svg aria-hidden viewBox="-4 -12 208 114" className="w-full overflow-visible">
      <rect x={6} y={8} width={188} height={74} rx={30} fill="color-mix(in srgb, currentColor 5%, transparent)" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1.5} />
      <rect x={46} y={18} width={86} height={54} rx={10} fill="none" stroke="currentColor" strokeOpacity={0.15} />
      {door(60, false, true)}
      {door(98, true, true)}
      {door(60, false, false)}
      {door(98, true, false)}
      {win(60, false, true)}
      {win(98, true, true)}
      {win(60, false, false)}
      {win(98, true, false)}
      {is('boot') ? <path d="M 10 22 Q 2 45 10 68" fill="none" strokeLinecap="round" {...amber} /> : null}
      {is('bonnet') ? <path d="M 152 14 Q 196 45 152 76" fill="none" strokeLinecap="round" {...amber} /> : <path d="M 152 14 Q 160 45 152 76" fill="none" stroke={line} strokeWidth={1.5} />}
      {is('port') ? <circle cx={160} cy={10} r={5} fill={WATCH} style={{ filter: `drop-shadow(0 0 4px ${WATCH})` }} /> : null}
    </svg>
  );
}

export function OpeningsPlan({ v, size }: VehicleTileProps) {
  if (v.kind !== 'car') return <Unavailable />;
  const open = v.security.open;
  const ok = open.length === 0;
  if (size === 'xs') return <OpeningsList v={v} size="xs" act={() => {}} now={0} />;
  return (
    <TileFrame label="Openings" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>Doors & windows</TileName>
          {size !== 's' ? (
            <span className="shrink-0 text-[13px] font-semibold" style={{ color: ok ? SAFE : WATCH }}>
              {summary(open)}
            </span>
          ) : null}
        </div>
        <div className={cn('my-auto', size === 'w' && 'mx-auto w-[56%]')}>
          <Plan open={open} />
        </div>
        {size === 's' ? (
          <TileState className={cn(!ok && 'font-semibold opacity-100')}>
            <span style={ok ? undefined : { color: WATCH }}>{summary(open)}</span>
          </TileState>
        ) : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Checklist
// ---------------------------------------------------------------------------------------------

const KINDS: { id: Item['what']; name: string }[] = [
  { id: 'door', name: 'Doors' },
  { id: 'window', name: 'Windows' },
  { id: 'boot', name: 'Boot' },
  { id: 'bonnet', name: 'Bonnet' }
];

export function OpeningsChecklist({ v, size }: VehicleTileProps) {
  if (v.kind !== 'car') return <Unavailable />;
  const open = v.security.open;
  if (size === 'xs' || size === 's') {
    // Too small for four rows: one check per kind as dots, named on Small.
    return (
      <TileFrame label="Openings" className="pro-surface">
        <div className={cn('flex h-full', size === 'xs' ? 'items-center gap-2 px-3' : 'flex-col p-3.5')}>
          <div className={cn('min-w-0', size === 'xs' && 'flex-1')}>
            <p className="truncate text-[15px] font-semibold" style={open.length ? { color: WATCH } : undefined}>
              {summary(open)}
            </p>
            {size === 's' ? <TileState>Doors & windows</TileState> : null}
          </div>
          <div className={cn('flex gap-1', size === 's' && 'mt-auto justify-between')}>
            {KINDS.map((k) => {
              const bad = open.some((o) => o.what === k.id);
              return (
                <span key={k.id} className="flex flex-col items-center gap-0.5">
                  <HugeiconsIcon icon={bad ? Alert02Icon : CheckmarkCircle02Icon} size={size === 'xs' ? 16 : 20} style={{ color: bad ? WATCH : SAFE }} aria-label={`${k.name} ${bad ? 'open' : 'closed'}`} />
                  {size === 's' ? <span className="text-[10px] opacity-60">{k.name}</span> : null}
                </span>
              );
            })}
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label="Openings" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <TileName>Doors & windows</TileName>
        <ul className={cn('mt-auto grid gap-x-4 gap-y-1.5', size === 'w' && 'grid-cols-2')}>
          {KINDS.map((k) => {
            const these = open.filter((o) => o.what === k.id);
            const bad = these.length > 0;
            return (
              <li key={k.id} className="flex min-w-0 items-center gap-2 text-[14px]">
                <HugeiconsIcon icon={bad ? Alert02Icon : CheckmarkCircle02Icon} size={17} style={{ color: bad ? WATCH : SAFE }} />
                <span className="font-medium">{k.name}</span>
                <span className="min-w-0 truncate opacity-60" style={bad ? { color: WATCH, opacity: 1 } : undefined}>
                  {bad ? these.map((o) => o.where || 'open').join(', ') : 'Closed'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </TileFrame>
  );
}
