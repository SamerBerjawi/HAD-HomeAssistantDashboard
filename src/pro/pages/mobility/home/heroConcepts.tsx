/**
 * Mobility round 2: the hero inside B · Ready check (docs/pro-ui/MOBILITY.md §0). Same answer
 * (`readiness`), same controls; what changes is what carries the answer: the charge ring, the
 * vehicle's picture, or status keys that are also the controls.
 */
import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Alert02Icon, ElectricPlugsIcon, FlashIcon, Location01Icon, Moon02Icon, Megaphone01Icon, Refresh01Icon, SnowIcon, SquareLock02Icon, SquareUnlock02Icon, TemperatureIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { clock, fmtDistance, freshness, has, readiness, type Readiness, type Tone, type Vehicle } from '../../../lib/mobilityHome';
import { EditableVehicleArt } from './VehiclePicture';
import { ActionDock, Answer, batteryFlow, ChargeRing, Checks, FxLayer, HUE, soft, subtitle, TONE, useLife, VehicleArt, type VehicleProps } from './parts';

export type HeroProps = Omit<VehicleProps, 'noRing'>;

/** B's surface: lit from the corner in the answer's tone. */
export const lit = (tone: string) =>
  `radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, ${tone} 26%, transparent), transparent 60%), radial-gradient(80% 120% at 100% 100%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%), var(--surface)`;

function Surface({ r, label, children, className }: { r: Readiness; label: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={label} className={cn('relative isolate flex flex-col gap-5 overflow-hidden rounded-[28px] p-5 sm:p-6', className)} style={{ background: lit(TONE[r.tone]) }}>
      {children}
    </section>
  );
}

const nameLine = (v: Vehicle) => [v.name, subtitle(v)].filter(Boolean).join(' · ');

/** 1 · Ring: round 1's hero. The charge ring with the range and the charge limit, the answer and its checks beside it, the controls under. */
export function HeroRing({ v, home, width, act }: HeroProps) {
  const r = readiness(v, home.now);
  const phone = width < 640;
  return (
    <Surface r={r} label={`${v.name}: ready to go?`}>
      <div className={cn('flex gap-5', phone ? 'flex-col' : 'items-center')}>
        <div className={cn('flex items-center gap-4', phone && 'justify-between')}>
          <ChargeRing v={v} size={phone ? 112 : 150} stroke={phone ? 9 : 12} />
          {phone ? (
            <div className="min-w-0 text-right">
              <p className="truncate text-lg font-light">{v.name}</p>
              <p className="truncate text-xs text-muted">{subtitle(v)}</p>
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {!phone ? <p className="text-sm text-muted">{nameLine(v)}</p> : null}
          <Answer r={r} width={width} />
          <Checks r={r} />
        </div>
      </div>
      <ActionDock v={v} act={act} compact={phone} />
    </Surface>
  );
}

/** One line: the level and range, a slim bar with the charge limit as a tick, and what the limit means. */
/** How fresh the numbers are: asleep, not heard from in a while, or the integration not reporting. */
function Freshness({ v, now }: { v: Vehicle; now: number }) {
  const f = freshness(v, now);
  if (!f) return null;
  return (
    <p role="status" className="flex items-start gap-2.5 rounded-2xl px-3 py-2.5 text-sm" style={{ background: `color-mix(in oklab, ${TONE[f.tone]} 14%, transparent)` }}>
      <HugeiconsIcon icon={f.tone === 'warn' ? Alert02Icon : Moon02Icon} size={16} className="mt-0.5 shrink-0" style={{ color: TONE[f.tone] }} />
      {f.text}
    </p>
  );
}

/** The sky at an hour: night, dawn, day or dusk. */
function sky(hour: number): { top: string; bottom: string; ground: string; night: boolean } {
  if (hour >= 21 || hour < 5) return { top: '#0b1430', bottom: '#27345f', ground: '#141c38', night: true };
  if (hour < 8) return { top: '#8fb4e6', bottom: '#f5c6a0', ground: '#b9a58f', night: false };
  if (hour < 17) return { top: '#79b4ee', bottom: '#d7ebfb', ground: '#b9cdb0', night: false };
  return { top: '#5a5fa3', bottom: '#f0a27b', ground: '#8c7a8e', night: false };
}

const STARS = [
  [8, 18], [17, 40], [26, 14], [37, 30], [48, 10], [57, 36], [66, 18], [79, 12], [88, 32], [94, 20]
];

/** Round 6 · 3: the vehicle in a little scene at the top of the hero (sky for the hour, ground, the charger and its cable). */
function HeroScene({ v, now, phone }: { v: Vehicle; now: number; phone: boolean }) {
  const sk = sky(new Date(now).getHours());
  const charging = v.charging?.state === 'charging';
  const plugged = !!v.charging?.plugged;
  const moving = !!v.motion?.moving;
  const climate = v.climate?.running ? ((v.climate.target ?? 21) >= (v.climate.cabin ?? 15) ? HUE.heat : HUE.cool) : null;
  const body = 'color-mix(in oklab, white 88%, var(--accent))';
  return (
    // Pinned to the card's top edge; a spacer keeps the text below it.
    <>
    <div aria-hidden className={cn('shrink-0', phone ? 'h-[104px]' : 'h-[100px]')} />
    <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[124px] overflow-hidden rounded-t-[28px] dark:opacity-90" style={{ background: `linear-gradient(180deg, ${sk.top}, ${sk.bottom})` }}>
      {sk.night ? STARS.map(([x, y], i) => <span key={i} className="pro-mob-twinkle absolute size-[3px] rounded-full bg-white/80" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.37}s` }} />) : null}
      <span className="absolute size-7 rounded-full" style={{ left: '12%', top: 16, background: sk.night ? '#e9ecf7' : '#fff3c4', boxShadow: `0 0 24px 6px ${sk.night ? 'rgba(233,236,247,.35)' : 'rgba(255,236,170,.6)'}` }} />
      <div className="absolute inset-x-0 bottom-0 h-[30px]" style={{ background: sk.ground }} />
      {moving ? (
        <div className="absolute inset-x-0 bottom-[13px] h-[3px] text-white/70">
          <div className="pro-mob-road h-full w-full" />
        </div>
      ) : null}
      <svg viewBox="0 0 400 124" className={cn('absolute bottom-0 h-[124px] w-[400px]', phone ? 'right-0' : 'right-[4%]')}>
        {climate ? <ellipse cx={210} cy={80} rx={74} ry={30} fill={climate} opacity={0.35} className="pro-mob-twinkle" /> : null}
        {v.kind === 'bike' ? (
          <g stroke={body} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" className={cn(moving && 'had-nudge')}>
            <circle cx={176} cy={92} r={16} />
            <circle cx={240} cy={92} r={16} />
            <path d="M176 92 L200 66 L226 66 L240 92 M200 66 L208 92 L226 66 M196 58 L206 58 M226 66 L222 54 L234 52" />
          </g>
        ) : (
          <g>
            <path d="M146 96 L148 80 Q156 71 176 69 L196 56 Q205 51 222 51 L238 51 Q249 51 257 63 L265 69 Q275 71 275 83 L275 96 Z" fill={body} />
            <path d="M200 60 Q207 56 220 56 L236 56 Q243 56 248 64 L252 69 L194 69 Z" fill={sk.night ? '#3a4a7a' : '#9cc3e6'} opacity={0.9} />
            <circle cx={174} cy={98} r={11} fill="#2a2f3a" />
            <circle cx={174} cy={98} r={4.5} fill="#9aa3b5" />
            <circle cx={250} cy={98} r={11} fill="#2a2f3a" />
            <circle cx={250} cy={98} r={4.5} fill="#9aa3b5" />
            {v.asleep ? null : <circle cx={272} cy={78} r={3} fill="#ffe9a8" />}
          </g>
        )}
        {plugged && v.kind === 'car' ? (
          <g>
            <rect x={326} y={54} width={18} height={46} rx={5} fill={body} />
            <rect x={330} y={60} width={10} height={8} rx={2} fill={charging ? HUE.power : '#9aa3b5'} />
            <path d="M275 82 C 296 104, 312 104, 328 84" fill="none" stroke="#2a2f3a" strokeWidth={3.5} strokeLinecap="round" />
            {charging ? <path d="M275 82 C 296 104, 312 104, 328 84" fill="none" stroke={HUE.power} strokeWidth={2} strokeDasharray="4 6" strokeLinecap="round" className="pro-mob-cable" /> : null}
          </g>
        ) : null}
        {v.asleep ? (
          <text x={262} y={46} fill="white" fontSize={14} fontWeight={300} className="pro-mob-twinkle">z z</text>
        ) : null}
      </svg>
    </div>
    </>
  );
}

/** Round 6 · 2: what is happening, moving behind the hero (charge flowing in, the road passing, stars while asleep). */
function HeroFx({ v }: { v: Vehicle }) {
  const flow = batteryFlow(v).flow;
  if (v.motion?.moving) return <FxLayer fx="road" hue={HUE.cool} />;
  if (flow === 'in') return <FxLayer fx="flow-in" hue={HUE.power} />;
  if (v.climate?.running) return <FxLayer fx="air" hue={(v.climate.target ?? 21) >= (v.climate.cabin ?? 15) ? HUE.heat : HUE.cool} />;
  if (v.asleep)
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {STARS.slice(0, 6).map(([x, y], i) => (
          <span key={i} className="pro-mob-twinkle absolute size-[3px] rounded-full bg-current opacity-40" style={{ left: `${40 + x / 2}%`, top: `${y}%`, animationDelay: `${i * 0.5}s` }} />
        ))}
      </div>
    );
  return null;
}

function ChargeBar({ v, phone }: { v: Vehicle; phone: boolean }) {
  const pct = Math.max(0, Math.min(100, v.level ?? 0));
  const target = v.kind === 'car' ? (v.charging?.target ?? null) : null;
  const charging = v.charging?.state === 'charging';
  const life = useLife();
  const hue = pct < 20 ? TONE.warn : life === 'plain' ? 'var(--accent)' : HUE.power;
  // With life, the charge glows in the power green, fading in from the left like the room tiles' bars.
  const fill = life === 'plain' ? { background: hue } : { background: `linear-gradient(90deg, color-mix(in srgb, ${hue} 40%, transparent), ${hue})`, boxShadow: `0 0 14px -2px color-mix(in srgb, ${hue} 80%, transparent)` };
  return (
    <div className="flex items-center gap-3">
      <p className="shrink-0 font-light tabular-nums tracking-tight">
        <span className={phone ? 'text-[22px]' : 'text-[26px]'}>{v.level ?? '—'}</span>
        <span className="text-sm text-muted">%</span>
        {v.range !== null ? <span className="ml-2 text-sm text-muted">{fmtDistance(v.range, v.unit)}</span> : null}
      </p>
      <div className="relative h-2 min-w-12 flex-1 rounded-full" style={{ background: life === 'plain' ? soft(10) : `color-mix(in oklab, ${hue} 14%, transparent)` }} role="img" aria-label={`${pct}% charge${target !== null ? `, charge limit ${target}%` : ''}`}>
        <div className={cn('absolute inset-y-0 left-0 rounded-full', charging && 'motion-safe:animate-pulse')} style={{ width: `${pct}%`, ...fill }} />
        {target !== null ? <span className="absolute -inset-y-1 w-0.5 rounded-full bg-[var(--foreground)]" style={{ left: `calc(${target}% - 1px)` }} /> : null}
      </div>
      {target !== null ? <p className="shrink-0 text-xs text-muted tabular-nums">{charging && v.charging?.readyAt && !phone ? `${target}% by ${clock(v.charging.readyAt)}` : `${target}%`}</p> : null}
    </div>
  );
}

/**
 * 2 · Picture (owner pick, round 2, made compact on 2026-11-26): the vehicle's picture (yours, or a
 * silhouette) beside its name and the answer in one block; one line for the charge (level, range,
 * a slim bar with the charge limit); the checks and the controls share the last row.
 */
export function HeroPicture({ v, home, width, act }: HeroProps) {
  const r = readiness(v, home.now);
  const phone = width < 640;
  const life = useLife();
  // The range is on the charge line, so the line under the answer says only where it is.
  const where = r.detail.split(' · ').filter((x) => !/range$/.test(x)).join(' · ');
  return (
    <Surface r={r} label={`${v.name}: ready to go?`} className={phone ? 'gap-3.5 p-4' : 'gap-4 p-5 sm:p-5'}>
      {life === 'scene' ? <HeroScene v={v} now={home.now} phone={phone} /> : null}
      {life === 'motion' && !v.offline ? (
        // Kept to the right, away from the answer, and fainter than in the cards.
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-70" style={{ maskImage: 'linear-gradient(90deg, transparent 40%, black 85%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 40%, black 85%)' }}>
          <HeroFx v={v} />
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted">{phone ? v.name : nameLine(v)}</p>
          <h2 className={cn('mt-0.5 flex items-center gap-2 font-light tracking-tight', phone ? 'text-[22px] leading-7' : 'text-[28px] leading-9')}>
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: TONE[r.tone] }} />
            <span className="min-w-0">{r.title}</span>
          </h2>
          {where ? <p className="mt-0.5 truncate text-[13px] text-muted">{where}</p> : null}
        </div>
        {life === 'scene' ? null : (
          <span className="shrink-0 rounded-[32%]" style={life !== 'plain' ? { boxShadow: `0 0 34px -4px color-mix(in oklab, ${TONE[r.tone]} 60%, transparent)` } : undefined}>
            <EditableVehicleArt v={v} size={phone ? 64 : 92} className="rounded-[32%]" />
          </span>
        )}
      </div>
      <Freshness v={v} now={home.now} />
      {v.level !== null || v.range !== null ? <ChargeBar v={v} phone={phone} /> : null}
      <div className={cn('flex gap-3', phone ? 'flex-col' : 'flex-wrap items-center justify-between')}>
        <Checks r={r} />
        {/* Only what no card below has: Charge / Pause is on Charging, Climate on Climate (owner, 2026-11-27). */}
        <ActionDock v={v} act={act} compact skip={[...(v.kind === 'car' && v.charging ? ['charge'] : []), ...(v.climate ? ['climate'] : [])]} />
      </div>
    </Surface>
  );
}

interface Key {
  id: string;
  icon: IconSvgElement;
  label: string;
  value: string;
  sub: string;
  tone?: Tone;
  /** Something running (charging, climate): ringed in the accent. */
  on?: boolean;
  press?: () => void;
}

function keysFor(v: Vehicle, act: HeroProps['act']): Key[] {
  const keys: (Key | null)[] = [];
  const c = v.charging;
  keys.push({
    id: 'charge',
    icon: FlashIcon,
    label: v.kind === 'bike' ? 'Battery' : 'Charge',
    value: v.level !== null ? `${v.level}%` : '—',
    sub: v.range !== null ? fmtDistance(v.range, v.unit) : '',
    tone: v.level !== null && v.level < 20 ? 'warn' : undefined
  });
  if (c) {
    const charging = c.state === 'charging';
    const can = c.plugged && c.state !== 'complete' && (has(v, 'charge-start') || has(v, 'charge-pause'));
    keys.push({
      id: 'plug',
      icon: ElectricPlugsIcon,
      label: 'Plug',
      value: charging ? 'Charging' : c.plugged ? (c.state === 'complete' ? 'Charged' : 'Plugged in') : 'Unplugged',
      sub: charging ? `${c.power?.toFixed(1) ?? '—'} kW${can ? ' · tap to pause' : ''}` : can ? 'Tap to charge' : c.target !== null ? `stops at ${c.target}%` : '',
      tone: charging ? 'info' : c.state === 'stopped' ? 'warn' : undefined,
      on: charging,
      press: can ? () => act(v.id, { type: 'charge', on: !charging }) : undefined
    });
  }
  if (v.security.locked !== null) {
    const locked = v.security.locked;
    keys.push({
      id: 'lock',
      icon: locked ? SquareLock02Icon : SquareUnlock02Icon,
      label: 'Doors',
      value: locked ? 'Locked' : 'Unlocked',
      sub: v.security.open.length ? `${v.security.open[0].where} ${v.security.open[0].what} open` : has(v, 'lock') ? (locked ? 'Tap to unlock' : 'Tap to lock') : '',
      tone: locked ? undefined : 'warn',
      press: has(v, 'lock') || has(v, 'unlock') ? () => act(v.id, { type: locked ? 'unlock' : 'lock' }) : undefined
    });
  }
  if (v.climate) {
    const k = v.climate;
    keys.push({
      id: 'climate',
      icon: k.running ? SnowIcon : TemperatureIcon,
      label: 'Climate',
      value: k.running ? `On, ${k.target ?? '—'}°` : k.cabin !== null ? `${k.cabin}° inside` : 'Off',
      sub: k.running ? (k.minutesLeft !== null ? `${k.minutesLeft} min left` : '') : has(v, 'climate') ? `Tap to warm to ${k.target ?? 21}°` : '',
      tone: k.running ? 'info' : undefined,
      on: k.running,
      press: has(v, 'climate') ? () => act(v.id, { type: 'climate', on: !k.running }) : undefined
    });
  }
  if (v.place && keys.length < 4) keys.push({ id: 'where', icon: Location01Icon, label: 'Where', value: v.motion?.moving ? 'Moving' : v.place.zone ?? 'Away', sub: v.place.address ?? '' });
  return keys.filter((k): k is Key => k !== null);
}

function KeyTile({ k, phone }: { k: Key; phone: boolean }) {
  const body = (
    <>
      <span className="flex w-full items-center gap-1.5 text-xs text-muted">
        <HugeiconsIcon icon={k.icon} size={15} style={k.tone ? { color: TONE[k.tone] } : undefined} />
        {k.label}
      </span>
      <span className={cn('w-full truncate font-light tabular-nums tracking-tight', phone ? 'text-lg' : 'text-[22px]')} style={k.tone === 'warn' ? { color: TONE.warn } : undefined}>
        {k.value}
      </span>
      <span className="w-full truncate text-xs font-normal text-muted">{k.sub || ' '}</span>
    </>
  );
  const cls = cn('flex h-auto min-w-0 flex-col items-start gap-1 rounded-[20px] p-3.5 text-left', phone ? '' : 'p-4');
  if (!k.press) return <div className={cn(cls, 'bg-[color-mix(in_oklab,var(--surface)_70%,transparent)]')}>{body}</div>;
  return (
    <Button variant="ghost" aria-pressed={k.on} onPress={k.press} className={cn(cls, 'w-full bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] data-[hovered=true]:bg-[var(--surface)]')} style={k.on ? { boxShadow: '0 0 0 2px var(--accent)' } : undefined}>
      {body}
    </Button>
  );
}

/**
 * 3 · Status keys: the answer on top, then one key per thing you check before leaving (charge,
 * plug, doors, climate), each showing its state and doing its job when tapped, so the checks and
 * the controls are the same thing. Anything else that needs a look stays as a pill; Flash and
 * Refresh sit small in the corner.
 */
export function HeroKeys({ v, home, width, act }: HeroProps) {
  const r = readiness(v, home.now);
  const phone = width < 640;
  const keys = keysFor(v, act);
  const covered = new Set(['lock', 'charge', 'climate', 'level']);
  const rest = { ...r, checks: r.checks.filter((c) => c.tone !== 'good' && c.tone !== 'info' && !covered.has(c.id) && !c.id.startsWith('open-')) };
  const small = [has(v, 'honk') ? { id: 'honk', icon: Megaphone01Icon, label: 'Flash the lights', run: () => act(v.id, { type: 'honk' }) } : null, has(v, 'refresh') ? { id: 'refresh', icon: Refresh01Icon, label: 'Refresh', run: () => act(v.id, { type: 'refresh' }) } : null].filter((x) => x !== null);
  return (
    <Surface r={r} label={`${v.name}: ready to go?`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 truncate text-sm text-muted">{nameLine(v)}</p>
          <Answer r={r} width={width} />
        </div>
        {small.length ? (
          <div className="flex shrink-0 gap-1.5">
            {small.map((s) => (
              <Button key={s.id} isIconOnly variant="ghost" aria-label={s.label} onPress={s.run} className="size-9 min-w-0 rounded-full bg-[color-mix(in_oklab,var(--surface)_70%,transparent)]">
                <HugeiconsIcon icon={s.icon} size={16} />
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${phone ? 2 : keys.length}, minmax(0, 1fr))` }}>
        {keys.map((k) => (
          <KeyTile key={k.id} k={k} phone={phone} />
        ))}
      </div>
      <Checks r={rest} />
    </Surface>
  );
}
