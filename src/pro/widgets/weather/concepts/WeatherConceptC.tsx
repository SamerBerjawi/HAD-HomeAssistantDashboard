/**
 * Weather concept C — Innovative ("temperature as shape"). Temperature drives both the colour
 * (cold blue → warm amber → hot red) and the composition: a dial of today's range, a line over the
 * coming hours, bars down the hours, and a week ribbon. The surface is faintly tinted by it.
 * Small: dial (low → high, where "now" sits). Wide: now + 12-hour line. Tall: hour bars.
 * Large: 24-hour line with rain chance + 5-day ribbon. Conditions ride along the line as icons
 * (owner request: conditions more visible than in the first concept).
 * Rain, snow and storm move behind it, tinted for the card (owner, 2026-11-20: `WeatherFx`).
 */
import { useId } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DropletIcon } from '@hugeicons/core-free-icons';
import { weatherConditionIcon } from '../../../components/overview/WeatherWidgets';
import type { ProOverviewWeatherModel, ProWeatherHourlyItem } from '../../../lib/overviewWeather';
import { useBoxSize } from '../../shared/useBoxSize';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { tempColor, toCelsius } from '../sky';
import { WeatherFx } from '../WeatherFx';
import { deg, hasHours, isWeatherEmpty, WeatherEmpty } from './shared';

/** Smooth path through points (Catmull-Rom as cubic Béziers). */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Hours from now, with "now" pinned to the current reading. */
function series(m: ProOverviewWeatherModel, count: number): ProWeatherHourlyItem[] {
  const rest = m.hourly.slice(1, count);
  const now = { ...(m.hourly[0] ?? rest[0]), timeLabel: 'Now', temperature: m.currentTemp, condition: m.condition };
  return [now, ...rest];
}

/** Fills its box; drawn at the box's real size so labels never stretch. */
function TempLine({ m, count, showRain }: { m: ProOverviewWeatherModel; count: number; showRain?: boolean }) {
  const box = useBoxSize<HTMLDivElement>({ width: 240, height: 96 });
  return (
    <div ref={box.ref} className="relative h-full w-full">
      <TempLineSvg m={m} count={count} showRain={showRain} W={box.width} H={box.height} />
    </div>
  );
}

function TempLineSvg({ m, count, showRain, W, H }: { m: ProOverviewWeatherModel; count: number; showRain?: boolean; W: number; H: number }) {
  const id = useId();
  const items = series(m, count);
  const temps = items.map((h) => h.temperature);
  const min = Math.min(...temps) - 1;
  const max = Math.max(...temps) + 1;
  const top = 28; // room for the condition icons above the line
  const bottom = showRain ? H - 26 : H - 16;
  const x = (i: number) => 8 + (i * (W - 16)) / Math.max(1, items.length - 1);
  const y = (t: number) => top + ((max - t) / (max - min || 1)) * (bottom - top);
  const pts = items.map((h, i) => [x(i), y(h.temperature)] as [number, number]);
  const line = smoothPath(pts);
  const c = (t: number) => tempColor(toCelsius(t, m.tempUnit), 52);
  const labelEvery = Math.ceil(items.length / 4);

  return (
    <div className="absolute left-0 top-0" style={{ width: W, height: H }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block overflow-visible"
        role="img"
        aria-label={`Temperature over the next ${items.length * 2} hours, ${deg(Math.min(...temps))} to ${deg(Math.max(...temps))}`}
      >
        <defs>
          <linearGradient id={`${id}-stroke`} x1="0" x2="1" y1="0" y2="0">
            {items.map((h, i) => (
              <stop key={h.datetime + i} offset={`${(i / Math.max(1, items.length - 1)) * 100}%`} stopColor={c(h.temperature)} />
            ))}
          </linearGradient>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c(m.currentTemp)} stopOpacity="0.28" />
            <stop offset="100%" stopColor={c(m.currentTemp)} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showRain
          ? items.map((h, i) =>
              h.precipProb > 0 ? (
                <rect key={`r${i}`} x={x(i) - 4} y={H - 12 - (h.precipProb / 100) * 14} width={8} height={(h.precipProb / 100) * 14} rx={2} fill="hsl(210 80% 60%)" opacity={0.55} />
              ) : null
            )
          : null}
        <path d={`${line} L${pts[pts.length - 1][0]},${bottom} L${pts[0][0]},${bottom} Z`} fill={`url(#${id}-fill)`} />
        <path d={line} fill="none" stroke={`url(#${id}-stroke)`} strokeWidth={3} strokeLinecap="round" />
        <circle cx={pts[0][0]} cy={pts[0][1]} r={5} fill={c(m.currentTemp)} stroke="var(--surface)" strokeWidth={2} />
        {items.map((h, i) =>
          i % labelEvery === 0 ? (
            <text key={`t${i}`} x={x(i)} y={H - 1} textAnchor={i === 0 ? 'start' : 'middle'} className="fill-[var(--muted)] text-[10px]" style={{ fontSize: 10 }}>
              {h.timeLabel}
            </text>
          ) : null
        )}
      </svg>
      {items.map((h, i) =>
        i % labelEvery === 0 ? (
          <HugeiconsIcon
            key={`i${i}`}
            icon={weatherConditionIcon(h.condition, m.isNight)}
            size={16}
            aria-label={h.conditionLabel}
            className="absolute text-foreground/80"
            style={{ left: Math.min(W - 16, Math.max(0, x(i) - 8)), top: Math.max(0, pts[i][1] - 24) }}
          />
        ) : null
      )}
    </div>
  );
}

/** Today's range as a 240° dial; the dot is where "now" sits between low and high. */
function RangeDial({ m }: { m: ProOverviewWeatherModel }) {
  const id = useId();
  const R = 50;
  const cx = 60;
  const cy = 58;
  const start = 150; // degrees, clockwise from +x
  const sweep = 240;
  const pt = (a: number) => [cx + R * Math.cos((a * Math.PI) / 180), cy + R * Math.sin((a * Math.PI) / 180)];
  const [sx, sy] = pt(start);
  const [ex, ey] = pt(start + sweep);
  const span = Math.max(1, m.high - m.low);
  const pos = Math.min(1, Math.max(0, (m.currentTemp - m.low) / span));
  const [nx, ny] = pt(start + sweep * pos);
  const c = (t: number) => tempColor(toCelsius(t, m.tempUnit), 52);
  return (
    <svg viewBox="0 0 120 104" className="h-full w-full" role="img" aria-label={`Now ${deg(m.currentTemp)}, today ${deg(m.low)} to ${deg(m.high)}`}>
      <defs>
        <linearGradient id={`${id}-arc`} x1="0" x2="1" y1="1" y2="1">
          <stop offset="0%" stopColor={c(m.low)} />
          <stop offset="100%" stopColor={c(m.high)} />
        </linearGradient>
      </defs>
      <path d={`M${sx},${sy} A${R},${R} 0 1 1 ${ex},${ey}`} fill="none" stroke={`url(#${id}-arc)`} strokeWidth={7} strokeLinecap="round" />
      <circle cx={nx} cy={ny} r={7} fill="var(--surface)" stroke={c(m.currentTemp)} strokeWidth={3.5} />
      <text x={cx} y={cy + 6} textAnchor="middle" className="fill-[var(--foreground)]" style={{ fontSize: 28, fontWeight: 600 }}>
        {deg(m.currentTemp)}
      </text>
      <text x={sx + 2} y={102} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 10 }}>
        {deg(m.low)}
      </text>
      <text x={ex - 2} y={102} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: 10 }}>
        {deg(m.high)}
      </text>
    </svg>
  );
}

function HourBars({ m, count }: { m: ProOverviewWeatherModel; count: number }) {
  const items = series(m, count);
  const temps = items.map((h) => h.temperature);
  const min = Math.min(...temps) - 2;
  const max = Math.max(...temps);
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Next hours">
      {items.map((h, i) => (
        <li key={h.datetime + i} className="flex items-center gap-2 text-xs">
          <span className="w-9 shrink-0 text-muted">{h.timeLabel}</span>
          <HugeiconsIcon icon={weatherConditionIcon(h.condition, m.isNight)} size={14} aria-label={h.conditionLabel} className="shrink-0 text-foreground/80" />
          <span className="relative h-2 flex-1 rounded-full bg-default/60">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${Math.max(8, ((h.temperature - min) / (max - min || 1)) * 100)}%`, background: tempColor(toCelsius(h.temperature, m.tempUnit), 55) }}
            />
          </span>
          <span className="w-7 text-right font-medium tabular-nums">{deg(h.temperature)}</span>
        </li>
      ))}
    </ul>
  );
}

function WeekRibbon({ m, count }: { m: ProOverviewWeatherModel; count: number }) {
  const days = m.daily.slice(0, count);
  if (days.length === 0) return null;
  const lo = Math.min(...days.map((d) => d.low));
  const hi = Math.max(...days.map((d) => d.high));
  const pct = (t: number) => ((t - lo) / (hi - lo || 1)) * 100;
  const c = (t: number) => tempColor(toCelsius(t, m.tempUnit), 55);
  return (
    <ul className="flex flex-col gap-1" aria-label="Next days">
      {days.map((d) => (
        <li key={d.datetime} className="flex items-center gap-2 text-xs">
          <span className="w-10 shrink-0 font-medium">{d.dayShort}</span>
          <HugeiconsIcon icon={weatherConditionIcon(d.condition)} size={14} aria-label={d.conditionLabel} className="shrink-0 text-foreground/80" />
          <span className="w-6 text-right tabular-nums text-muted">{deg(d.low)}</span>
          <span className="relative h-1.5 flex-1 rounded-full bg-default/60">
            <span
              className="absolute inset-y-0 rounded-full"
              style={{ left: `${pct(d.low)}%`, width: `${Math.max(4, pct(d.high) - pct(d.low))}%`, background: `linear-gradient(90deg, ${c(d.low)}, ${c(d.high)})` }}
            />
          </span>
          <span className="w-6 tabular-nums font-medium">{deg(d.high)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function WeatherConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewWeatherModel>) {
  if (isWeatherEmpty(m)) return <WeatherEmpty onOpenDetails={onOpenDetails} />;
  const hours = hasHours(m);
  const tint = tempColor(toCelsius(m.currentTemp, m.tempUnit), 55);
  const rain = Math.max(...m.hourly.slice(0, 6).map((h) => h.precipProb), 0);
  const Icon = weatherConditionIcon(m.condition, m.isNight);
  const headline = (
    <div className="flex min-w-0 items-center gap-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${tint} 22%, transparent)`, color: tint }}>
        <HugeiconsIcon icon={Icon} size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none tabular-nums">{deg(m.currentTemp)}</p>
        <p className="mt-0.5 truncate text-xs font-medium">{m.conditionLabel}</p>
      </div>
    </div>
  );

  return (
    <WidgetSurface label="Weather" className="bg-[var(--surface)]" style={{ backgroundImage: `linear-gradient(160deg, color-mix(in oklab, ${tint} 16%, transparent), transparent 70%)` }}>
      {/* Rain, snow and storm behind the content (owner, 2026-11-20). */}
      <WeatherFx condition={m.condition} />
      <DetailsButton title="Weather" onPress={onOpenDetails} />
      <div className="relative flex h-full min-h-0 flex-col gap-2 p-3.5">
        {size === 's' ? (
          <>
            <div className="min-h-0 flex-1 px-1">
              <RangeDial m={m} />
            </div>
            <p className="flex items-center justify-center gap-1.5 truncate text-sm font-medium">
              <HugeiconsIcon icon={Icon} size={18} style={{ color: tint }} className="shrink-0" />
              <span className="truncate">{m.conditionLabel}</span>
            </p>
          </>
        ) : null}

        {size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="flex w-[5.5rem] shrink-0 flex-col justify-between">
              {/* Stacked here: side by side, a 5.5 rem column would cut the condition off. */}
              <div className="flex min-w-0 flex-col gap-1">
                <span className="grid size-8 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${tint} 22%, transparent)`, color: tint }}>
                  <HugeiconsIcon icon={Icon} size={18} />
                </span>
                <p className="text-2xl font-semibold leading-none tabular-nums">{deg(m.currentTemp)}</p>
                <p className="line-clamp-2 text-xs font-medium leading-tight">{m.conditionLabel}</p>
              </div>
              {rain >= 30 ? (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <HugeiconsIcon icon={DropletIcon} size={12} className="text-[hsl(210_80%_60%)]" />
                  {rain}% rain
                </p>
              ) : (
                <p className="text-xs text-muted tabular-nums">
                  {deg(m.low)}–{deg(m.high)}
                </p>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-5">{hours ? <TempLine m={m} count={7} /> : <WeekRibbon m={m} count={3} />}</div>
          </div>
        ) : null}

        {size === 't' ? (
          <>
            {headline}
            <div className="mt-auto">{hours ? <HourBars m={m} count={7} /> : <WeekRibbon m={m} count={5} />}</div>
          </>
        ) : null}

        {size === 'l' ? (
          <>
            <div className="flex items-center justify-between pr-8">
              {headline}
              {rain >= 30 ? (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <HugeiconsIcon icon={DropletIcon} size={12} className="text-[hsl(210_80%_60%)]" />
                  {rain}% rain
                </span>
              ) : null}
            </div>
            {hours ? (
              <div className="min-h-0 flex-1">
                <TempLine m={m} count={12} showRain />
              </div>
            ) : (
              <span className="flex-1" />
            )}
            <WeekRibbon m={m} count={4} />
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
