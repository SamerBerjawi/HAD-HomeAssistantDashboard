/**
 * Weather details (sheet kit, WIDGET_DESIGN.md §8). Hero on the card's sky: temperature and
 * condition, feels like, high and low, the condition icon. A station choice when there are
 * several. Then the next hours (a strip), the next days (rows with a low–high bar), and today's
 * readings as small tiles.
 */
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { CloudIcon, CompassIcon, DropletIcon, EyeIcon, Sun03Icon, ThermometerIcon, UmbrellaIcon, WindPowerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { ProOverviewWeatherModel } from '../../lib/overviewWeather';
import { weatherConditionIcon } from '../../components/overview/WeatherWidgets';
import { DetailSheet, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSection, SheetTile } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { deg } from './concepts/shared';
import { anyRain, RainChance, type RainSlot } from './RainChance';
import { skyGradient } from './sky';

export default function WeatherSheet({ model: m, onClose }: WidgetSheetProps<ProOverviewWeatherModel>) {
  const setStation = useAutoLayoutStore((s) => s.setSelectedWeatherEntityId);
  const empty = !m.hasEntity && m.daily.length === 0;
  // Rain chance: the next 12 hours, or the next days for daily-only stations.
  const hourlyRain = m.hourly.length >= 3;
  const rain: RainSlot[] = hourlyRain
    ? m.hourly.slice(0, 12).map((h) => ({ key: h.datetime, label: h.timeLabel, pct: h.precipProb }))
    : m.daily.slice(0, 7).map((d) => ({ key: d.datetime, label: d.dayShort, pct: d.precipProb }));
  const tiles: { icon: IconSvgElement; label: string; value: string; note?: string }[] = [
    { icon: DropletIcon, label: 'Humidity', value: `${Math.round(m.humidity)}%`, note: m.dewPoint !== undefined ? `Dew point ${deg(m.dewPoint)}` : undefined },
    ...(m.windSpeed !== undefined
      ? [{ icon: WindPowerIcon, label: 'Wind', value: `${Math.round(m.windSpeed)} ${m.windSpeedUnit}`, note: m.windCardinal ? `From the ${m.windCardinal}` : undefined }]
      : []),
    ...(m.uvIndex !== undefined ? [{ icon: Sun03Icon, label: 'UV index', value: String(Math.round(m.uvIndex)), note: m.uvBadge?.label }] : []),
    ...(m.pressure !== undefined ? [{ icon: CompassIcon, label: 'Pressure', value: `${Math.round(m.pressure)} ${m.pressureUnit}` }] : []),
    ...(m.visibility !== undefined ? [{ icon: EyeIcon, label: 'Visibility', value: `${Math.round(m.visibility)} ${m.visibilityUnit}` }] : []),
    ...(m.cloudCoverage !== undefined ? [{ icon: CloudIcon, label: 'Clouds', value: `${Math.round(m.cloudCoverage)}%` }] : [])
  ];
  return (
    <DetailSheet
      title="Weather details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={ThermometerIcon}
          eyebrow={m.stationName || 'Weather'}
          background={skyGradient(m.condition, m.isNight)}
          headline={empty ? 'No weather yet' : `${deg(m.currentTemp)} ${m.conditionLabel}`}
          sub={empty ? undefined : `Feels like ${deg(m.apparentTemp)} · H ${deg(m.high)} · L ${deg(m.low)}`}
          aside={empty ? null : <HugeiconsIcon icon={weatherConditionIcon(m.condition, m.isNight)} size={56} className="text-white/90" />}
          onClose={onClose}
        />
      }
      toolbar={
        m.stations.length > 1 && m.entityId ? (
          <SheetFilter label="Weather station" value={m.entityId} onChange={(id) => setStation(id)} options={m.stations.map((s) => ({ id: s.id, label: `${s.label} · ${s.tempText}` }))} />
        ) : null
      }
    >
      {empty ? (
        <SheetEmpty icon={CloudIcon} title="No weather station" text="Add a weather integration in Home Assistant to see the forecast here." />
      ) : (
        <>
          {m.hourly.length > 0 ? (
            <SheetSection title="Next hours" aside={m.hourlyPeakPrecipProb > 0 ? `Rain up to ${m.hourlyPeakPrecipProb}%` : undefined} plain>
              <ol aria-label="Hourly forecast" className="pro-surface -mx-0 flex gap-1 overflow-x-auto rounded-[18px] p-2 [scrollbar-width:thin]">
                {m.hourly.slice(0, 24).map((h) => (
                  <li key={h.datetime} className="flex w-14 shrink-0 flex-col items-center gap-1.5 rounded-xl py-2 text-xs">
                    <span className="text-muted">{h.timeLabel}</span>
                    <HugeiconsIcon icon={weatherConditionIcon(h.condition)} size={20} aria-label={h.conditionLabel} />
                    <span className="font-semibold tabular-nums">{deg(h.temperature)}</span>
                    <span className={cn('tabular-nums', h.precipProb >= 30 ? 'text-[hsl(210_80%_45%)] dark:text-[hsl(205_90%_70%)]' : 'text-transparent')}>{h.precipProb}%</span>
                  </li>
                ))}
              </ol>
            </SheetSection>
          ) : null}
          {rain.length > 0 ? (
            <SheetSection title="Chance of rain" aside={hourlyRain ? 'Next 12 hours' : 'Next days'} plain>
              {anyRain(rain) ? (
                <div className="pro-surface rounded-[18px] px-3 py-3">
                  <RainChance slots={rain} height={64} />
                </div>
              ) : (
                <p className="pro-surface flex items-center justify-center gap-1.5 rounded-[18px] py-3 text-xs text-muted">
                  <HugeiconsIcon icon={UmbrellaIcon} size={14} />
                  {hourlyRain ? 'No rain expected in the next 12 hours' : 'No rain expected in the next days'}
                </p>
              )}
            </SheetSection>
          ) : null}
          {m.daily.length > 0 ? (
            <SheetSection title="Next days">
              {m.daily.map((d, idx) => (
                <SheetRow
                  key={d.datetime}
                  icon={weatherConditionIcon(d.condition)}
                  title={idx === 0 ? 'Today' : d.dayFull}
                  subtitle={[d.conditionLabel, d.precipProb >= 20 ? `${d.precipProb}% rain` : null].filter(Boolean).join(' · ')}
                  trailing={
                    <span className="flex items-center gap-2 text-xs tabular-nums">
                      <span className="w-8 text-right text-muted">{deg(d.low)}</span>
                      <span className="relative h-1.5 w-16 rounded-full bg-default sm:w-24">
                        <span
                          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[hsl(200_80%_60%)] to-[hsl(35_95%_55%)]"
                          style={{ left: `${d.rangeStartPct}%`, width: `${Math.max(6, d.rangeWidthPct)}%` }}
                        />
                      </span>
                      <span className="w-8 font-semibold">{deg(d.high)}</span>
                    </span>
                  }
                />
              ))}
            </SheetSection>
          ) : null}
          {tiles.length > 0 ? (
            <SheetSection title="Now" plain>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tiles.map((t) => (
                  <SheetTile key={t.label} {...t} />
                ))}
              </ul>
            </SheetSection>
          ) : null}
        </>
      )}
    </DetailSheet>
  );
}
