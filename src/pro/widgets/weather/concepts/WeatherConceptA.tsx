/**
 * Weather concept A — Refined & minimal ("editorial"). A calm neutral surface, a large light-weight
 * temperature and typographic rows. The only colour is the condition icon, tinted by temperature.
 * Small: now. Wide: now + next 3 days. Tall: now + next hours. Large: now, details, hourly, 4 days.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { weatherConditionIcon } from '../../../components/overview/WeatherWidgets';
import type { ProOverviewWeatherModel } from '../../../lib/overviewWeather';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { tempColor, toCelsius } from '../sky';
import { deg, hasHours, isWeatherEmpty, WeatherEmpty } from './shared';

function Now({ m, big }: { m: ProOverviewWeatherModel; big?: boolean }) {
  const color = tempColor(toCelsius(m.currentTemp, m.tempUnit), 52);
  return (
    <div className="flex min-w-0 flex-col">
      <p className={cn('font-extralight leading-none tracking-tighter tabular-nums', big ? 'text-[68px]' : 'text-[54px]')}>{deg(m.currentTemp)}</p>
      <p className="mt-1.5 flex items-center gap-1.5 truncate text-sm font-medium">
        <HugeiconsIcon icon={weatherConditionIcon(m.condition, m.isNight)} size={16} style={{ color }} className="shrink-0" />
        {m.conditionLabel}
      </p>
      <p className="truncate text-xs text-muted tabular-nums">
        H {deg(m.high)} · L {deg(m.low)}
      </p>
    </div>
  );
}

function DayRows({ m, count, bars }: { m: ProOverviewWeatherModel; count: number; bars?: boolean }) {
  return (
    <ul aria-label="Next days" className="flex flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
      {m.daily.slice(1, count + 1).map((d) => (
        <li key={d.datetime} className="flex items-center gap-2 py-1 text-xs">
          <span className="w-8 shrink-0 font-medium">{d.dayShort}</span>
          <HugeiconsIcon icon={weatherConditionIcon(d.condition)} size={14} aria-label={d.conditionLabel} className="shrink-0 text-muted" />
          {bars ? (
            <span className="relative mx-1 h-1 flex-1 rounded-full bg-default">
              <span className="absolute inset-y-0 rounded-full bg-foreground/60" style={{ left: `${d.rangeStartPct}%`, width: `${Math.max(6, d.rangeWidthPct)}%` }} />
            </span>
          ) : (
            <span className="flex-1" />
          )}
          <span className="w-8 text-right tabular-nums text-muted">{deg(d.low)}</span>
          <span className="w-8 text-right font-medium tabular-nums">{deg(d.high)}</span>
        </li>
      ))}
    </ul>
  );
}

function HourColumns({ m, count }: { m: ProOverviewWeatherModel; count: number }) {
  return (
    <ul className="grid gap-1" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {m.hourly.slice(1, count + 1).map((h) => (
        <li key={h.datetime} className="flex flex-col items-center gap-1 text-xs">
          <span className="text-[11px] text-muted">{h.timeLabel}</span>
          <HugeiconsIcon icon={weatherConditionIcon(h.condition, m.isNight)} size={16} className="text-muted" />
          <span className="font-medium tabular-nums">{deg(h.temperature)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function WeatherConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewWeatherModel>) {
  if (isWeatherEmpty(m)) return <WeatherEmpty onOpenDetails={onOpenDetails} />;
  const hours = hasHours(m);
  const meta = [
    `Feels ${deg(m.apparentTemp)}`,
    `${Math.round(m.humidity)}% humidity`,
    m.windSpeed !== undefined ? `${Math.round(m.windSpeed)} ${m.windSpeedUnit} ${m.windCardinal ?? ''}`.trim() : null
  ].filter(Boolean);

  return (
    <WidgetSurface label="Weather" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Weather" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col p-3.5">
        {size === 's' ? <Now m={m} /> : null}

        {size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <Now m={m} />
            <div className="flex min-w-0 flex-1 flex-col justify-end">
              <DayRows m={m} count={3} />
            </div>
          </div>
        ) : null}

        {size === 't' ? (
          <div className="flex h-full min-h-0 flex-col gap-3">
            <Now m={m} />
            {!hours ? (
              <div className="mt-auto">
                <DayRows m={m} count={5} />
              </div>
            ) : null}
            {hours ? (
              <ul aria-label="Next hours" className="mt-auto flex flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
                {m.hourly.slice(1, 6).map((h) => (
                  <li key={h.datetime} className="flex items-center gap-2 py-1 text-xs">
                    <span className="w-11 shrink-0 text-muted">{h.timeLabel}</span>
                    <HugeiconsIcon icon={weatherConditionIcon(h.condition, m.isNight)} size={14} aria-label={h.conditionLabel} className="text-muted" />
                    <span className="ml-auto font-medium tabular-nums">{deg(h.temperature)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {size === 'l' ? (
          <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex items-end justify-between gap-3 pr-8">
              <Now m={m} big />
              <ul className="mb-1 flex flex-col items-end gap-0.5 text-right text-xs text-muted">
                {meta.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            {hours ? <HourColumns m={m} count={6} /> : null}
            <div className="mt-auto">
              <DayRows m={m} count={3} bars />
            </div>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
