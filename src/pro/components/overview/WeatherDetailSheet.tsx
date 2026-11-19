/**
 * Weather Detail Sheet for pro Overview (docs/pro-ui/DESIGN.md 7.6, Option A): ProSheet
 * (Drawer on phones, Modal lg on desktop) with HeroUI Select station picker, current summary,
 * horizontal ScrollShadow 24-hour strip, atmospheric conditions grid, and 7-day forecast.
 */
import { useEffect } from 'react';
import { Badge, ListBox, ScrollShadow, Select } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Calendar03Icon,
  Clock01Icon,
  CloudIcon,
  DashboardSpeed01Icon,
  DropletIcon,
  FastWindIcon,
  Location01Icon,
  Sun01Icon,
  ThermometerIcon,
  ViewIcon
} from '@hugeicons/core-free-icons';
import { haWebSocketService } from '@/services/haWebSocket';
import type { ProOverviewWeatherModel } from '../../lib/overviewWeather';
import { ProSheet } from '../ProSheet';
import { weatherConditionIcon } from './WeatherWidgets';

interface WeatherDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  model: ProOverviewWeatherModel;
  onSelectStation: (entityId: string) => void;
}

interface MetricCardProps {
  icon: IconSvgElement;
  label: string;
  value: string;
  subtitle?: string;
  badge?: { label: string; tone: 'success' | 'warning' | 'danger' };
}

function AtmosphericMetricCard({ icon, label, value, subtitle, badge }: MetricCardProps) {
  return (
    <div className="pro-surface flex flex-col gap-1.5 p-3.5">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="pro-soft grid size-6 shrink-0 place-items-center rounded-lg">
          <HugeiconsIcon icon={icon} size={14} />
        </span>
        <span className="truncate font-medium">{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-base font-bold text-foreground">{value}</span>
        {badge ? (
          <Badge
            size="sm"
            variant="soft"
            color={badge.tone}
            className="static transform-none! min-h-4.5 min-w-0 rounded-full border-0 px-2 py-0 text-[10px] font-semibold"
          >
            <Badge.Label>{badge.label}</Badge.Label>
          </Badge>
        ) : null}
      </div>
      {subtitle ? <p className="truncate text-[11px] text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function WeatherDetailSheet({
  isOpen,
  onOpenChange,
  model,
  onSelectStation
}: WeatherDetailSheetProps) {
  const CurrentIcon = weatherConditionIcon(model.condition, model.isNight);

  useEffect(() => {
    if (isOpen && model.entityId) {
      haWebSocketService.fetchWeatherForecast(model.entityId);
    }
  }, [isOpen, model.entityId]);

  const windDetail =
    model.windSpeed !== undefined
      ? `Direction ${model.windCardinal || '—'}${model.windBearing !== undefined ? ` (${Math.round(model.windBearing)}°)` : ''}`
      : 'No wind sensor';
  const activeStation = model.stations.find((s) => s.id === model.entityId);

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Weather & Forecast"
      subtitle={model.stationName}
      icon={CurrentIcon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-4 pb-2">
        {model.stations.length > 1 && model.entityId ? (
          <div className="pro-surface flex flex-col gap-1.5 p-3.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-muted">
                <HugeiconsIcon icon={Location01Icon} size={14} className="text-[var(--accent)]" />
                Weather station
              </span>
              <span className="font-mono text-[11px] text-muted">{model.stations.length} sources</span>
            </div>
            <Select
              aria-label="Weather station"
              selectedKey={model.entityId}
              onSelectionChange={(key) => {
                if (key) onSelectStation(String(key));
              }}
              className="w-full"
            >
              <Select.Trigger className="h-10 min-h-10 gap-2 px-3 text-sm">
                <HugeiconsIcon icon={Location01Icon} size={15} className="shrink-0 text-muted" />
                <Select.Value className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-6">
                  {({ selectedText }) => (
                    <>
                      <span className="truncate font-medium text-foreground">
                        {selectedText || model.stationName}
                      </span>
                      {activeStation ? (
                        <span className="shrink-0 font-mono text-xs text-muted">{activeStation.tempText}</span>
                      ) : null}
                    </>
                  )}
                </Select.Value>
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="pro" data-page="overview">
                <ListBox>
                  {model.stations.map((station) => (
                    <ListBox.Item key={station.id} id={station.id} textValue={station.label}>
                      <HugeiconsIcon icon={Location01Icon} size={15} className="shrink-0 text-[var(--accent)]" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{station.label}</span>
                        <span className="text-xs text-muted">
                          {station.conditionLabel} · {station.tempText}
                        </span>
                      </span>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        ) : null}

        <section aria-label="Current conditions" className="pro-surface flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3.5">
            <span className="pro-soft grid size-14 shrink-0 place-items-center rounded-2xl">
              <HugeiconsIcon icon={CurrentIcon} size={28} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {model.currentTemp}
                  {model.tempUnit}
                </span>
                <Badge
                  size="sm"
                  variant="soft"
                  color={model.conditionTone}
                  className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
                >
                  <HugeiconsIcon icon={CurrentIcon} size={12} />
                  <Badge.Label>{model.conditionLabel}</Badge.Label>
                </Badge>
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                <span className="inline-flex items-center gap-1 font-mono">
                  <HugeiconsIcon icon={ThermometerIcon} size={13} />
                  Feels {model.apparentTemp}
                  {model.tempUnit}
                </span>
                <span className="font-mono">
                  H {model.high}° · L {model.low}°
                </span>
              </p>
            </div>
          </div>
        </section>

        {model.hourly.length > 0 ? (
          <section aria-label="24-hour forecast" className="pro-surface flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <HugeiconsIcon icon={Clock01Icon} size={16} className="text-[var(--accent)]" />
                24-hour forecast
              </span>
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
            </div>

            <ScrollShadow orientation="horizontal" hideScrollBar className="flex gap-2 overflow-x-auto pb-1">
              {model.hourly.map((slot) => {
                const SlotIcon = weatherConditionIcon(slot.condition);
                return (
                  <div
                    key={slot.datetime}
                    className="flex min-w-18 shrink-0 flex-col items-center gap-1 rounded-xl bg-default/50 px-2.5 py-2 text-center"
                  >
                    <span className="text-[11px] font-medium text-muted">{slot.timeLabel}</span>
                    <HugeiconsIcon
                      icon={SlotIcon}
                      size={18}
                      className={slot.precipProb >= 40 ? 'text-warning' : 'text-[var(--accent)]'}
                    />
                    <span className="font-mono text-xs font-semibold text-foreground">{slot.temperature}°</span>
                    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-muted">
                      <HugeiconsIcon icon={DropletIcon} size={10} />
                      {slot.precipProb}%
                    </span>
                  </div>
                );
              })}
            </ScrollShadow>
          </section>
        ) : null}

        <section aria-label="Atmospheric conditions" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <AtmosphericMetricCard
            icon={DropletIcon}
            label="Humidity"
            value={`${model.humidity}%`}
            subtitle={model.dewPoint !== undefined ? `Dew point ${model.dewPoint}${model.tempUnit}` : undefined}
          />
          <AtmosphericMetricCard
            icon={FastWindIcon}
            label="Wind"
            value={model.windSpeed !== undefined ? `${model.windSpeed} ${model.windSpeedUnit}` : '—'}
            subtitle={windDetail}
          />
          <AtmosphericMetricCard
            icon={DashboardSpeed01Icon}
            label="Pressure"
            value={model.pressure !== undefined ? `${model.pressure} ${model.pressureUnit}` : '—'}
            subtitle="Sea level barometric"
          />
          <AtmosphericMetricCard
            icon={Sun01Icon}
            label="UV Index"
            value={model.uvIndex !== undefined ? `${model.uvIndex}` : '—'}
            badge={model.uvBadge ?? undefined}
          />
          <AtmosphericMetricCard
            icon={CloudIcon}
            label="Cloud cover"
            value={model.cloudCoverage !== undefined ? `${model.cloudCoverage}%` : '—'}
            subtitle="Sky coverage"
          />
          <AtmosphericMetricCard
            icon={ViewIcon}
            label="Visibility"
            value={model.visibility !== undefined ? `${model.visibility} ${model.visibilityUnit}` : '—'}
            subtitle="Atmospheric range"
          />
        </section>

        {model.daily.length > 0 ? (
          <section aria-label="7-day forecast" className="pro-surface flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-[var(--accent)]" />
                7-day forecast
              </span>
              <span className="font-mono text-xs text-muted">{model.daily.length} days</span>
            </div>

            <div className="flex min-w-0 flex-col divide-y divide-separator">
              {model.daily.map((day) => {
                const DayIcon = weatherConditionIcon(day.condition);
                return (
                  <div
                    key={day.datetime}
                    className="grid grid-cols-[minmax(0,1fr)_1.125rem_2.875rem_1.75rem_2.125rem_1.75rem] items-center gap-1.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(6rem,1.2fr)_1.5rem_3.5rem_2.25rem_minmax(4rem,1fr)_2.25rem] sm:gap-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{day.dayFull}</p>
                      <p className="truncate text-[11px] text-muted">{day.conditionLabel}</p>
                    </div>
                    <HugeiconsIcon
                      icon={DayIcon}
                      size={17}
                      className={day.precipProb >= 40 ? 'text-warning' : 'text-[var(--accent)]'}
                    />
                    <div className="flex justify-end">
                      {day.precipProb > 0 ? (
                        <Badge
                          size="sm"
                          variant="soft"
                          color={day.precipProb >= 50 ? 'warning' : 'accent'}
                          className="static transform-none! min-h-4.5 min-w-0 gap-0.5 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold [&_svg]:size-2.5!"
                        >
                          <HugeiconsIcon icon={DropletIcon} size={10} />
                          <Badge.Label className="font-mono">{day.precipProb}%</Badge.Label>
                        </Badge>
                      ) : (
                        <span aria-hidden="true" />
                      )}
                    </div>
                    <span className="text-right font-mono text-xs text-muted">{day.low}°</span>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-default">
                      <div
                        className="absolute inset-y-0 rounded-full bg-[var(--accent)]"
                        style={{ left: `${day.rangeStartPct}%`, width: `${day.rangeWidthPct}%` }}
                      />
                    </div>
                    <span className="text-right font-mono text-xs font-semibold text-foreground">{day.high}°</span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </ProSheet>
  );
}
