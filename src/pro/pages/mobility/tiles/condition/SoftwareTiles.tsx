/**
 * Vehicle tiles · batch 5 · Software (docs/pro-ui/VEHICLE_TILES.md): where an update stands
 * (FordPass: firmwareupgstatus, otaschedule, otareadiness, lastfirmwareupdate). Read only.
 * A · Status: the stage as a word (Up to date, Downloading, Installs Tue 02:00, Waiting: 12 V low).
 * B · Steps: Ready → Download → Install → Done, the current step lit.
 * C · Timeline: the last update to the next install window as a line (your Timeline picks' line).
 *   What blocks a waiting update is in its stage line ("Waiting: 12 V battery low").
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, SoftwareIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { dayClock, softwareLine, type Software, type Vehicle } from '../../../../lib/mobilityHome';
import { IconChip, NOT_ON_CAR, OK, VHUE, WARN, type VehicleTileProps } from '../vehicleTileKit';

const TONE = { good: OK, info: VHUE.info, warn: WARN, bad: 'hsl(4 82% 54%)' } as const;
const what = (v: Vehicle) => (v.kind === 'bike' ? 'Firmware' : 'Software');
const date = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function Unavailable({ v }: { v: Vehicle }) {
  return (
    <TileFrame label={what(v)} className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={SoftwareIcon} on={false} />
        <TileName className="mt-auto">{what(v)}</TileName>
        <TileState>{NOT_ON_CAR}</TileState>
      </div>
    </TileFrame>
  );
}

function line(v: Vehicle, s: Software, now: number) {
  const l = softwareLine(s, v.kind, now);
  return { ...l, hue: TONE[l.tone as keyof typeof TONE] ?? VHUE.idle, idle: s.stage === 'idle' };
}

function Row({ v, s, now }: { v: Vehicle; s: Software; now: number }) {
  const l = line(v, s, now);
  return (
    <TileFrame label={what(v)} className="pro-surface">
      <div className="flex h-full items-center gap-2.5 px-3">
        <IconChip icon={l.tone === 'warn' ? Alert02Icon : l.idle ? CheckmarkCircle02Icon : SoftwareIcon} hue={l.hue} on={!l.idle || true} px={32} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold" style={l.idle ? undefined : { color: l.hue }}>
            {l.idle ? 'Up to date' : l.value}
          </p>
          <TileState className="text-[12px]">{s.installed ? `${what(v)} ${s.installed}` : what(v)}</TileState>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Status
// ---------------------------------------------------------------------------------------------

export function SoftwareStatus({ v, size, now }: VehicleTileProps) {
  const s = v.condition.software;
  if (!s) return <Unavailable v={v} />;
  if (size === 'xs') return <Row v={v} s={s} now={now} />;
  const l = line(v, s, now);
  return (
    <TileFrame label={what(v)} className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <IconChip icon={l.tone === 'warn' ? Alert02Icon : l.idle ? CheckmarkCircle02Icon : SoftwareIcon} hue={l.hue} px={size === 'l' ? 40 : 32} />
        <div className="mt-auto min-w-0">
          <TileName className="opacity-70">{what(v)}</TileName>
          <p className={cn('font-semibold leading-tight tracking-[-0.02em]', size === 'l' ? 'text-[26px]' : 'text-[17px]', size === 's' ? 'line-clamp-2' : 'truncate')} style={l.idle ? undefined : { color: l.hue }}>
            {l.idle ? 'Up to date' : l.value}
          </p>
          {size !== 's' ? <TileState>{[s.installed ? `Version ${s.installed}` : null, s.lastUpdate ? `updated ${date(s.lastUpdate)}` : null, s.auto !== null ? (s.auto ? 'automatic' : 'manual') : null].filter(Boolean).join(' · ')}</TileState> : null}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Steps
// ---------------------------------------------------------------------------------------------

const STEPS = [
  { id: 'available', name: 'Ready' },
  { id: 'downloading', name: 'Download' },
  { id: 'queued', name: 'Waiting' },
  { id: 'installing', name: 'Install' }
] as const;

export function SoftwareSteps({ v, size, now }: VehicleTileProps) {
  const s = v.condition.software;
  if (!s) return <Unavailable v={v} />;
  if (size === 'xs' || s.stage === 'idle') return size === 'xs' ? <Row v={v} s={s} now={now} /> : <SoftwareStatus v={v} size={size} act={() => {}} now={now} />;
  const l = line(v, s, now);
  const at = s.stage === 'failed' ? 3 : STEPS.findIndex((x) => x.id === s.stage);
  return (
    <TileFrame label={what(v)} className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <TileName>{what(v)} update</TileName>
        <TileState className={cn(size === 's' && 'line-clamp-2 whitespace-normal')}>
          <span style={{ color: l.hue }}>{l.value}</span>
        </TileState>
        <ol className="mt-auto flex items-center gap-1">
          {STEPS.map((x, i) => (
            <li key={x.id} className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="h-1.5 rounded-full" style={{ background: i < at ? `color-mix(in srgb, ${l.hue} 45%, transparent)` : i === at ? l.hue : 'color-mix(in srgb, currentColor 10%, transparent)', boxShadow: i === at ? `0 0 8px -1px ${l.hue}` : undefined }} />
              {size !== 's' ? (
                <span className={cn('truncate text-[11px]', i === at ? 'font-semibold' : 'opacity-50')} style={i === at ? { color: l.hue } : undefined}>
                  {s.stage === 'failed' && i === at ? 'Failed' : x.name}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Timeline
// ---------------------------------------------------------------------------------------------

export function SoftwareTimeline({ v, size, now }: VehicleTileProps) {
  const s = v.condition.software;
  if (!s) return <Unavailable v={v} />;
  if (size === 'xs') return <Row v={v} s={s} now={now} />;
  const l = line(v, s, now);
  return (
    <TileFrame label={what(v)} className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>{what(v)}</TileName>
          {s.installed && size !== 's' ? <span className="shrink-0 text-[12px] tabular-nums opacity-60">{s.installed}</span> : null}
        </div>
        <p className={cn('font-semibold leading-tight tracking-[-0.02em]', size === 'l' ? 'text-[24px]' : 'text-[16px]', size === 's' && 'line-clamp-2')} style={l.idle ? undefined : { color: l.hue }}>
          {l.idle ? 'Up to date' : l.value}
        </p>
        <div className="mt-auto">
          <div className="relative h-8">
            <span className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 rounded-full" style={{ background: s.nextWindow ? `linear-gradient(90deg, color-mix(in srgb, currentColor 25%, transparent), ${l.hue})` : 'color-mix(in srgb, currentColor 18%, transparent)' }} />
            <span className="absolute left-0 top-1/2 size-3.5 -translate-y-1/2 rounded-full border-[3px] border-[var(--surface)]" style={{ background: 'color-mix(in srgb, currentColor 50%, transparent)' }} />
            <span className="absolute right-0 top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2" style={{ borderColor: l.idle ? 'color-mix(in srgb, currentColor 35%, transparent)' : l.hue, background: s.nextWindow ? l.hue : 'var(--surface)' }} />
          </div>
          <div className="mt-1 flex justify-between text-[12px] tabular-nums">
            <span className="opacity-70">{s.lastUpdate ? (size === 's' ? date(s.lastUpdate) : `Updated ${date(s.lastUpdate)}`) : size === 's' ? '' : 'Last update —'}</span>
            <span className="text-right" style={s.nextWindow ? { color: l.hue } : { opacity: 0.6 }}>
              {s.nextWindow ? (size === 's' ? dayClock(s.nextWindow, now) : `Next ${dayClock(s.nextWindow, now)}`) : l.idle ? 'Nothing waiting' : 'Not scheduled'}
            </span>
          </div>
        </div>
      </div>
    </TileFrame>
  );
}
