/**
 * Weather concept B — Expressive & immersive ("sky"). The widget is the sky: a gradient that
 * follows the condition and the time of day, with a light ambient layer (sun glow, stars, clouds,
 * rain or snow). White type, big semibold temperature, forecasts on soft translucent strips.
 * Small: now. Wide: now + next 4 hours. Tall: now + 4 days. Large: now, hourly strip, 3-day chips.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Location01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { weatherConditionIcon } from '../../../components/overview/WeatherWidgets';
import type { ProOverviewWeatherModel } from '../../../lib/overviewWeather';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { anyRain } from '../RainChance';
import { skyGradient, skyKind } from '../sky';
import { deg, hasHours, isWeatherEmpty, WeatherEmpty } from './shared';

// Fixed star positions (percent), so the night sky doesn't jump between renders.
const STARS = [
  [8, 14],
  [22, 8],
  [35, 22],
  [48, 6],
  [61, 18],
  [74, 9],
  [88, 26],
  [14, 38],
  [42, 34],
  [67, 40],
  [92, 52],
  [28, 55],
  [55, 60],
  [80, 70],
  [6, 72]
];

/**
 * The sky's moving parts (revised 2026-11-20, owner: snow, partly cloudy and storm looked off):
 * sun or moon glow, soft hazy clouds that drift, rain or snow in two layers, and for storms a dark
 * sky, heavier rain and an occasional lightning flicker. Motion stops with reduced motion.
 */
function Ambience({ condition, isNight }: { condition: string; isNight: boolean }) {
  const kind = skyKind(condition);
  const sunny = kind === 'clear' || kind === 'partly';
  // Clouds are soft blurred light, not shapes (owner, 2026-11-20: drawn clouds looked ugly):
  // white haze for partly cloudy and overcast, grey for rain and snow.
  const haze =
    kind === 'partly'
      ? isNight
        ? 'bg-white/10'
        : 'bg-white/35'
      : kind === 'cloudy' || kind === 'fog'
        ? isNight
          ? 'bg-white/12'
          : 'bg-white/30'
        : kind === 'rain' || kind === 'snow'
          ? isNight
            ? 'bg-white/8'
            : 'bg-white/20'
          : null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {!isNight && sunny ? (
        <div
          className={cn(
            'absolute -right-10 -top-12 rounded-full bg-[radial-gradient(circle,rgba(255,236,170,0.95)_0%,rgba(255,214,120,0.4)_38%,transparent_70%)]',
            kind === 'partly' ? 'size-48' : 'size-44'
          )}
        />
      ) : null}
      {isNight && sunny ? (
        <>
          {STARS.map(([x, y], i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: `${x}%`, top: `${y}%`, width: i % 3 === 0 ? 2 : 1.5, height: i % 3 === 0 ? 2 : 1.5, opacity: 0.45 + (i % 4) * 0.12 }}
            />
          ))}
          <div className="absolute -right-6 -top-6 size-28 rounded-full bg-[radial-gradient(circle,rgba(230,236,255,0.55)_0%,transparent_65%)]" />
        </>
      ) : null}
      {kind === 'storm' ? <div className="pro-sky-flash absolute inset-0" /> : null}
      {haze ? (
        <>
          <div className={cn('pro-sky-cloud absolute -left-10 top-4 h-20 w-56 rounded-full blur-2xl', haze)} style={{ ['--drift' as string]: '40s' }} />
          {kind !== 'partly' ? <div className={cn('pro-sky-cloud absolute -right-8 top-14 h-16 w-48 rounded-full blur-2xl', haze)} style={{ ['--drift' as string]: '52s' }} /> : null}
        </>
      ) : null}
      {/* Storm: a dark sky pressing down from the top. */}
      {kind === 'storm' ? <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/45 to-transparent" /> : null}
      {kind === 'rain' || kind === 'storm' ? <div className={cn('pro-sky-rain absolute inset-0', kind === 'storm' ? 'is-heavy opacity-90' : 'opacity-70')} /> : null}
      {kind === 'snow' ? <div className="pro-sky-snow absolute inset-0" /> : null}
      {kind === 'fog' ? <div className="absolute inset-x-0 bottom-1/3 h-1/3 bg-gradient-to-t from-white/0 via-white/15 to-white/0 blur-md" /> : null}
      {/* Keeps white text readable on the lightest skies. */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}

function Hero({ m, size }: { m: ProOverviewWeatherModel; size: DesignedWidgetProps<ProOverviewWeatherModel>['size'] }) {
  const big = size === 'l' || size === 't';
  return (
    <div className="flex min-w-0 flex-col">
      <p className="flex items-center gap-1 truncate text-xs font-medium text-white/85">
        <HugeiconsIcon icon={Location01Icon} size={12} />
        {m.stationName}
      </p>
      <p className={cn('mt-0.5 font-semibold leading-none tracking-tight tabular-nums drop-shadow-sm', big ? 'text-[60px]' : 'text-5xl')}>{deg(m.currentTemp)}</p>
      <p className="mt-1 flex items-center gap-1.5 truncate text-sm font-medium">
        <HugeiconsIcon icon={weatherConditionIcon(m.condition, m.isNight)} size={16} />
        {m.conditionLabel}
      </p>
      {size !== 's' ? (
        <p className="truncate text-xs text-white/80 tabular-nums">
          H {deg(m.high)} · L {deg(m.low)}
        </p>
      ) : null}
    </div>
  );
}

const strip = 'rounded-2xl bg-white/14 ring-1 ring-white/15';

function HourStrip({ m, count, className, showRain = false }: { m: ProOverviewWeatherModel; count: number; className?: string; showRain?: boolean }) {
  // Daily-only stations: the same strip shows the next days instead.
  if (!hasHours(m)) {
    const days = m.daily.slice(1, count + 1);
    return (
      <ul aria-label="Next days" className={cn(strip, 'grid px-1 py-2', className)} style={{ gridTemplateColumns: `repeat(${Math.max(1, days.length)}, minmax(0, 1fr))` }}>
        {days.map((d) => (
          <li key={d.datetime} className="flex flex-col items-center gap-1 text-xs">
            <span className="text-[11px] text-white/80">{d.dayShort}</span>
            <HugeiconsIcon icon={weatherConditionIcon(d.condition)} size={16} aria-label={d.conditionLabel} />
            <span className="font-semibold tabular-nums">{deg(d.high)}</span>
          </li>
        ))}
      </ul>
    );
  }
  const hours = m.hourly.slice(1, count + 1);
  // Rain chart (owner review 2026-11-20): a thin meter under each hour, filled by the chance of
  // rain, when any rain is likely; compact so Large keeps its day tiles.
  const rain = showRain && anyRain(hours.map((h) => ({ key: h.datetime, label: h.timeLabel, pct: h.precipProb })));
  return (
    <ul aria-label="Next hours" className={cn(strip, 'grid px-1 py-2', className)} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {hours.map((h) => (
        <li key={h.datetime} className="flex flex-col items-center gap-1 text-xs">
          <span className="text-[11px] text-white/80">{h.timeLabel}</span>
          <HugeiconsIcon icon={weatherConditionIcon(h.condition, m.isNight)} size={16} aria-label={h.conditionLabel} />
          <span className="font-semibold tabular-nums">{deg(h.temperature)}</span>
          {rain ? (
            <span
              role="meter"
              aria-label={`${h.precipProb}% chance of rain`}
              aria-valuenow={h.precipProb}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative h-1 w-3/5 overflow-hidden rounded-full bg-white/20"
            >
              <span className="absolute inset-y-0 left-0 rounded-full bg-[hsl(200_90%_82%)]" style={{ width: `${h.precipProb}%` }} />
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function WeatherConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewWeatherModel>) {
  if (isWeatherEmpty(m)) return <WeatherEmpty onOpenDetails={onOpenDetails} />;
  return (
    <WidgetSurface label="Weather" ink="light" style={{ background: skyGradient(m.condition, m.isNight) }}>
      <Ambience condition={m.condition} isNight={m.isNight} />
      <DetailsButton title="Weather" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2.5 p-3.5">
        {size === 's' ? (
          <div className="flex h-full flex-col justify-end">
            <Hero m={m} size={size} />
          </div>
        ) : null}

        {size === 'w' ? (
          <div className="flex h-full min-w-0 items-end gap-3">
            <Hero m={m} size={size} />
            <HourStrip m={m} count={4} className="min-w-0 flex-1" showRain />
          </div>
        ) : null}

        {size === 't' ? (
          <>
            <Hero m={m} size={size} />
            {m.daily.length > 1 ? (
              <ul aria-label="Next days" className={cn(strip, 'mt-auto flex flex-col px-2.5 py-1.5')}>
                {m.daily.slice(1, 5).map((d) => (
                  <li key={d.datetime} className="flex items-center gap-2 py-0.5 text-xs">
                    <span className="w-8 font-medium">{d.dayShort}</span>
                    <HugeiconsIcon icon={weatherConditionIcon(d.condition)} size={14} />
                    <span className="ml-auto tabular-nums text-white/75">{deg(d.low)}</span>
                    <span className="w-7 text-right font-semibold tabular-nums">{deg(d.high)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}

        {size === 'l' ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <Hero m={m} size={size} />
              <HugeiconsIcon icon={weatherConditionIcon(m.condition, m.isNight)} size={56} className="mr-6 mt-6 shrink-0 opacity-90 drop-shadow" />
            </div>
            <HourStrip m={m} count={6} className="mt-auto" showRain />
            <ul className="grid grid-cols-3 gap-1.5">
              {m.daily.slice(1, 4).map((d) => (
                <li key={d.datetime} className={cn(strip, 'flex items-center justify-between gap-1 px-2.5 py-1.5 text-xs')}>
                  <span className="font-medium">{d.dayShort}</span>
                  <HugeiconsIcon icon={weatherConditionIcon(d.condition)} size={14} />
                  <span className="font-semibold tabular-nums">
                    {deg(d.high)}
                    <span className="font-normal text-white/70"> {deg(d.low)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
