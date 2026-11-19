/**
 * Pro Overview Weather & Hourly Forecast widget card bodies across 1x, 2x, and 2x2 sizes
 * (docs/pro-ui/DESIGN.md 7.6, Option 3).
 */
import { Badge } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  CloudAngledRainIcon,
  CloudAngledZapIcon,
  CloudIcon,
  CloudLittleRainIcon,
  CloudSnowIcon,
  DropletIcon,
  FastWindIcon,
  Location01Icon,
  Moon02Icon,
  Sun01Icon,
  SunCloud02Icon,
  ThermometerIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewWeatherModel } from '../../lib/overviewWeather';
import type { ProWidgetSize } from '../../lib/overviewWidgets';
import { AreaChart, type BklitAreaDatum } from '../../ui/bklit/AreaChart';

export function weatherConditionIcon(condition: string, isNight = false): IconSvgElement {
  const norm = condition.toLowerCase();
  if (norm.includes('lightning') || norm.includes('thunder')) return CloudAngledZapIcon;
  if (norm.includes('snow') || norm.includes('sleet') || norm.includes('hail')) return CloudSnowIcon;
  if (norm.includes('pouring')) return CloudAngledRainIcon;
  if (norm.includes('rain')) return CloudLittleRainIcon;
  if (norm.includes('wind')) return FastWindIcon;
  if (norm.includes('cloudy') && !norm.includes('partly')) return CloudIcon;
  if (norm.includes('fog')) return CloudIcon;
  if (norm.includes('partly') || norm.includes('cloud')) return SunCloud02Icon;
  if (norm.includes('clear-night') || (norm.includes('clear') && isNight)) return Moon02Icon;
  if (norm.includes('sunny') || norm.includes('clear')) return Sun01Icon;
  return isNight ? Moon02Icon : SunCloud02Icon;
}

const CONDITION_ICON_TONE = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
  accent: 'text-[var(--accent)]',
  default: 'text-muted'
} as const;

export function WeatherForecastWidgetBody({
  model,
  size
}: {
  model: ProOverviewWeatherModel;
  size: ProWidgetSize;
}) {
  const CurrentIcon = weatherConditionIcon(model.condition, model.isNight);

  if (size === '1x') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {Math.round(model.currentTemp)}
            {model.tempUnit}
          </span>
          <Badge
            size="sm"
            variant="soft"
            color={model.conditionTone}
            className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={CurrentIcon} size={12} className="shrink-0" />
            <Badge.Label>{model.conditionLabel}</Badge.Label>
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1 font-mono">
            <HugeiconsIcon icon={ThermometerIcon} size={13} className="shrink-0" />
            H {model.high}° · L {model.low}°
          </span>
          <span className="inline-flex items-center gap-1 font-mono">
            <HugeiconsIcon icon={DropletIcon} size={13} className="shrink-0" />
            {model.humidity}%
          </span>
        </div>
      </div>
    );
  }

  if (size === '2x') {
    const previewDays = model.daily.length > 3 ? model.daily.slice(1, 4) : model.daily.slice(0, 3);
    return (
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @md:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
              {Math.round(model.currentTemp)}
              {model.tempUnit}
            </span>
            <Badge
              size="sm"
              variant="soft"
              color={model.conditionTone}
              className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={CurrentIcon} size={12} className="shrink-0" />
              <Badge.Label>{model.conditionLabel}</Badge.Label>
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={Location01Icon} size={13} className="shrink-0" />
              {model.stationName}
            </span>
            <span className="font-mono">Feels {Math.round(model.apparentTemp)}°</span>
            <span className="font-mono">
              H {model.high}° · L {model.low}°
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {previewDays.map((day) => {
            const DayIcon = weatherConditionIcon(day.condition);
            return (
              <div
                key={day.datetime}
                className="flex flex-col items-center gap-1 rounded-xl bg-default/50 px-2 py-2 text-center"
              >
                <span className="text-[11px] font-medium text-muted">{day.dayShort}</span>
                <HugeiconsIcon
                  icon={DayIcon}
                  size={18}
                  className={cn(
                    'shrink-0',
                    day.precipProb >= 40 ? 'text-warning' : 'text-[var(--accent)]'
                  )}
                />
                <span className="font-mono text-xs font-semibold text-foreground">
                  {day.high}° <span className="font-normal text-muted">{day.low}°</span>
                </span>
                {day.precipProb >= 15 ? (
                  <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-[var(--accent)]">
                    <HugeiconsIcon icon={DropletIcon} size={10} />
                    {day.precipProb}%
                  </span>
                ) : (
                  <span className="text-[10px] text-muted">{day.conditionLabel}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2x2 Large layout
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
            {Math.round(model.currentTemp)}
            {model.tempUnit}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <HugeiconsIcon icon={Location01Icon} size={13} />
            {model.stationName}
          </span>
        </div>
        <Badge
          size="sm"
          variant="soft"
          color={model.conditionTone}
          className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5!"
        >
          <HugeiconsIcon icon={CurrentIcon} size={13} className="shrink-0" />
          <Badge.Label>{model.conditionLabel}</Badge.Label>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 @md:grid-cols-4">
        <div className="flex items-center gap-2 rounded-xl bg-default/50 px-2.5 py-2">
          <HugeiconsIcon icon={ThermometerIcon} size={15} className="shrink-0 text-[var(--accent)]" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Feels like</p>
            <p className="font-mono text-xs font-semibold text-foreground">
              {Math.round(model.apparentTemp)}
              {model.tempUnit}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-default/50 px-2.5 py-2">
          <HugeiconsIcon icon={DropletIcon} size={15} className="shrink-0 text-[var(--accent)]" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Humidity</p>
            <p className="font-mono text-xs font-semibold text-foreground">{model.humidity}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-default/50 px-2.5 py-2">
          <HugeiconsIcon icon={FastWindIcon} size={15} className="shrink-0 text-[var(--accent)]" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Wind</p>
            <p className="truncate font-mono text-xs font-semibold text-foreground">
              {model.windSpeed !== undefined ? `${Math.round(model.windSpeed)} ${model.windSpeedUnit}` : '—'}
              {model.windCardinal ? ` ${model.windCardinal}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-default/50 px-2.5 py-2">
          <HugeiconsIcon icon={Sun01Icon} size={15} className="shrink-0 text-warning" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted">UV Index</p>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs font-semibold text-foreground">
                {model.uvIndex !== undefined ? model.uvIndex : '—'}
              </span>
              {model.uvBadge ? (
                <Badge
                  size="sm"
                  variant="soft"
                  color={model.uvBadge.tone}
                  className="static transform-none! min-h-4 min-w-0 rounded-full border-0 px-1.5 py-0 text-[9px] font-semibold"
                >
                  <Badge.Label>{model.uvBadge.label}</Badge.Label>
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-2xl bg-default/40 p-3">
        {model.daily.slice(0, 5).map((day) => {
          const DayIcon = weatherConditionIcon(day.condition);
          return (
            <div key={day.datetime} className="grid grid-cols-[3.5rem_1.5rem_2.5rem_1fr_2.25rem] items-center gap-2 text-xs">
              <span className="truncate font-medium text-foreground">{day.dayShort}</span>
              <HugeiconsIcon
                icon={DayIcon}
                size={15}
                className={cn(
                  'shrink-0',
                  CONDITION_ICON_TONE[day.precipProb >= 50 ? 'warning' : 'accent']
                )}
              />
              <span className="text-right font-mono text-muted">{day.low}°</span>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-default">
                <div
                  className="absolute inset-y-0 rounded-full bg-[var(--accent)]"
                  style={{ left: `${day.rangeStartPct}%`, width: `${day.rangeWidthPct}%` }}
                />
              </div>
              <span className="text-right font-mono font-semibold text-foreground">{day.high}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HourlyForecastWidgetBody({
  model,
  size
}: {
  model: ProOverviewWeatherModel;
  size: ProWidgetSize;
}) {
  if (size === '1x') {
    const nextHours = model.hourly.slice(0, 3);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {Math.round(model.currentTemp)}
            {model.tempUnit}
          </span>
          <Badge
            size="sm"
            variant="soft"
            color="accent"
            className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={ThermometerIcon} size={12} className="shrink-0" />
            <Badge.Label className="font-mono">
              {model.hourlyTempMin}°–{model.hourlyTempMax}°
            </Badge.Label>
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {nextHours.map((slot) => {
            const SlotIcon = weatherConditionIcon(slot.condition);
            return (
              <div
                key={slot.datetime}
                className="flex flex-col items-center gap-0.5 rounded-xl bg-default/50 px-1.5 py-1.5 text-center"
              >
                <span className="text-[10px] text-muted">{slot.timeLabel}</span>
                <HugeiconsIcon icon={SlotIcon} size={14} className="text-[var(--accent)]" />
                <span className="font-mono text-xs font-semibold text-foreground">{slot.temperature}°</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (size === '2x') {
    const slots = model.hourly.slice(0, 5);
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold tracking-tight text-foreground">
              {Math.round(model.currentTemp)}
              {model.tempUnit}
            </span>
            <span className="text-xs text-muted">{model.conditionLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              size="sm"
              variant="soft"
              color="accent"
              className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
            >
              <Badge.Label className="font-mono">
                {model.hourlyTempMin}°–{model.hourlyTempMax}°
              </Badge.Label>
            </Badge>
            {model.hourlyPeakPrecipProb >= 20 ? (
              <Badge
                size="sm"
                variant="soft"
                color={model.hourlyPeakPrecipProb >= 50 ? 'warning' : 'accent'}
                className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
              >
                <HugeiconsIcon icon={DropletIcon} size={11} />
                <Badge.Label className="font-mono">{model.hourlyPeakPrecipProb}%</Badge.Label>
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {slots.map((slot) => {
            const SlotIcon = weatherConditionIcon(slot.condition);
            return (
              <div
                key={slot.datetime}
                className="flex flex-col items-center gap-1 rounded-xl bg-default/50 px-1.5 py-2 text-center"
              >
                <span className="text-[11px] font-medium text-muted">{slot.timeLabel}</span>
                <HugeiconsIcon
                  icon={SlotIcon}
                  size={17}
                  className={cn(slot.precipProb >= 40 ? 'text-warning' : 'text-[var(--accent)]')}
                />
                <span className="font-mono text-xs font-semibold text-foreground">{slot.temperature}°</span>
                <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-muted">
                  <HugeiconsIcon icon={DropletIcon} size={10} />
                  {slot.precipProb}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2x2 Large layout with bklit UI AreaChart
  const chartData: BklitAreaDatum[] = model.hourly.slice(0, 10).map((slot) => ({
    label: slot.timeLabel,
    value: slot.temperature,
    secondary: slot.precipProb > 0 ? `${slot.precipProb}% rain` : undefined
  }));
  const bottomSlots = model.hourly.slice(0, 6);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {Math.round(model.currentTemp)}
            {model.tempUnit}
          </span>
          <span className="text-xs text-muted">Next 24 hours</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            size="sm"
            variant="soft"
            color="accent"
            className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={ThermometerIcon} size={12} />
            <Badge.Label className="font-mono">
              H {model.hourlyTempMax}° · L {model.hourlyTempMin}°
            </Badge.Label>
          </Badge>
          <Badge
            size="sm"
            variant="soft"
            color={model.hourlyPeakPrecipProb >= 40 ? 'warning' : 'success'}
            className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={DropletIcon} size={12} />
            <Badge.Label className="font-mono">Peak rain {model.hourlyPeakPrecipProb}%</Badge.Label>
          </Badge>
        </div>
      </div>

      <div className="rounded-2xl bg-default/40 px-2 pt-3 pb-2">
        <AreaChart
          data={chartData}
          height={146}
          formatValue={(v) => `${Math.round(v)}°`}
          ariaLabel="24-hour temperature forecast curve"
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5 @sm:grid-cols-6">
        {bottomSlots.map((slot) => {
          const SlotIcon = weatherConditionIcon(slot.condition);
          return (
            <div
              key={slot.datetime}
              className="flex flex-col items-center gap-0.5 rounded-xl bg-default/50 px-1.5 py-1.5 text-center"
            >
              <span className="text-[10px] text-muted">{slot.timeLabel}</span>
              <HugeiconsIcon
                icon={SlotIcon}
                size={15}
                className={cn(slot.precipProb >= 40 ? 'text-warning' : 'text-[var(--accent)]')}
              />
              <span className="font-mono text-xs font-semibold text-foreground">{slot.temperature}°</span>
              <span className="font-mono text-[10px] text-muted">{slot.precipProb}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
