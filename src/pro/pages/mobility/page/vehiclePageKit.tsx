/**
 * The vehicle page's shared pieces (docs/pro-ui/VEHICLE_TILES.md), used by the live page
 * (`VehiclePage.tsx`) and the studio's page preview: the rail's facts, the readiness card, the
 * picture, and which tiles are on or need a look (the Moment order puts their sections first).
 */
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BatteryFullIcon, ElectricPlugsIcon, Route01Icon, SquareLock02Icon, SquareUnlock02Icon, TemperatureIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { lowTyres, type readiness, type Vehicle } from '../../../lib/mobilityHome';
import { TONE, toneIcon, VehicleArt } from '../home/parts';
import { chargingWords, healthReadings, OK, rangeText } from '../tiles/vehicleTileKit';

export function Fact({ icon, text, hue }: { icon: IconSvgElement; text: string; hue?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[15px]">
      <HugeiconsIcon icon={icon} size={17} style={hue ? { color: hue } : undefined} className={hue ? undefined : 'opacity-60'} />
      {text}
    </span>
  );
}

export function facts(v: Vehicle) {
  const out: { icon: IconSvgElement; text: string; hue?: string }[] = [];
  if (v.level !== null) out.push({ icon: BatteryFullIcon, text: `${v.level}%`, hue: TONE.good });
  const r = rangeText(v);
  if (r) out.push({ icon: Route01Icon, text: r });
  if (v.security.locked !== null) out.push({ icon: v.security.locked ? SquareLock02Icon : SquareUnlock02Icon, text: v.security.locked ? 'Locked' : 'Unlocked', hue: v.security.locked ? undefined : TONE.warn });
  if (v.charging?.plugged) out.push({ icon: ElectricPlugsIcon, text: chargingWords(v).word, hue: v.charging.state === 'charging' ? TONE.good : undefined });
  if (v.climate?.cabin != null) out.push({ icon: TemperatureIcon, text: `${v.climate.cabin}° inside`, hue: v.climate.running ? 'hsl(22 95% 58%)' : undefined });
  return out;
}

export function FactRow({ v }: { v: Vehicle }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {facts(v).map((f) => (
        <Fact key={f.text} {...f} />
      ))}
    </div>
  );
}

/** The vehicle on a soft stage, 4:3. */
export function VehicleStage({ v, px }: { v: Vehicle; px: number }) {
  return (
    <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[26px]" style={{ background: 'radial-gradient(120% 90% at 50% 100%, color-mix(in oklab, var(--foreground) 10%, transparent), transparent 60%), linear-gradient(180deg, color-mix(in oklab, var(--foreground) 4%, var(--surface)), var(--surface))' }}>
      <span aria-hidden className="absolute bottom-[18%] left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-[50%]" style={{ background: 'radial-gradient(closest-side, color-mix(in oklab, var(--foreground) 22%, transparent), transparent)' }} />
      <VehicleArt v={v} size={px} stage />
    </div>
  );
}

/** "Ready to go?" in the readiness tone. */
export function ReadyCard({ r, compact }: { r: ReturnType<typeof readiness>; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-[22px]', compact ? 'p-2.5' : 'p-3.5')} style={{ background: `linear-gradient(150deg, color-mix(in srgb, ${TONE[r.tone]} 16%, var(--surface)), var(--surface) 80%)` }}>
      <span className={cn('grid shrink-0 place-items-center rounded-full', compact ? 'size-8' : 'size-10')} style={{ background: `color-mix(in srgb, ${TONE[r.tone]} 18%, transparent)`, color: TONE[r.tone] }}>
        <HugeiconsIcon icon={toneIcon(r.tone)} size={compact ? 15 : 18} />
      </span>
      <div className="min-w-0">
        <p className={cn('truncate font-semibold', compact ? 'text-[15px]' : 'text-[17px]')} style={{ color: TONE[r.tone] }}>
          {r.title}
        </p>
        <p className="truncate text-[13px] opacity-70">{r.detail}</p>
      </div>
    </div>
  );
}

/** The tiles that are on or need a look: what the Now view shows. */
export function nowIds(v: Vehicle): Set<string> {
  const ids = new Set<string>();
  const c = v.charging;
  if (c?.state === 'charging' || c?.state === 'stopped') ids.add('charging');
  if (v.climate?.running) ids.add('climate');
  if (v.security.locked === false) ids.add('doors');
  if (v.security.open.length) ids.add('openings');
  if (v.security.alarm === 'triggered' || v.security.stolen || v.security.crashed) ids.add('alarm');
  if (v.motion?.moving) ids.add('location');
  if (lowTyres(v.condition.tyres).length) ids.add('tyres');
  if (healthReadings(v).some((x) => x.hue !== OK && x.id !== 'temp')) ids.add('health');
  if (v.condition.software && v.condition.software.stage !== 'idle') ids.add('software');
  if (v.condition.warnings.length) ids.add('warnings');
  if ((v.level ?? 100) < 20) ids.add('battery');
  return ids;
}

/** Moment order: the sections that need a look, then what the car is doing, each with why. */
export function momentWhy(v: Vehicle): Record<string, string> {
  const why: Record<string, string> = {};
  const n = nowIds(v);
  if (n.has('doors') || n.has('openings') || n.has('alarm')) why.security = 'needs a look';
  if (n.has('tyres') || n.has('health') || n.has('warnings')) why.condition = 'needs a look';
  if (v.motion?.moving) why.where = 'driving';
  if (v.charging?.state === 'charging') why.energy = 'charging';
  if (v.climate?.running) why.cabin = 'running';
  return why;
}
