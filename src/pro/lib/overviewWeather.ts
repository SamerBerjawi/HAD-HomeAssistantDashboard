/**
 * Pure weather view-model builder for the pro Overview weather widgets and detail sheet
 * (docs/pro-ui/DESIGN.md 7.6). No React, no store.
 */
import {
  generateFallbackDailyForecast,
  generateFallbackHourlyForecast,
  getDailyForecast,
  getHourlyForecast,
  type DailyForecastItem,
  type HourlyForecastItem
} from '@/lib/weatherForecast';
import {
  deriveWeatherHighLow,
  deriveWeatherReadings,
  resolveActiveWeather
} from '@/services/overview/headerSummary';
import type { ResolvedEntity } from '@/types';
import type { PillTone } from './overviewPills';

export interface ProWeatherStationOption {
  id: string;
  label: string;
  conditionLabel: string;
  tempText: string;
}

export interface ProWeatherDailyItem {
  datetime: string;
  dayShort: string;
  dayFull: string;
  condition: string;
  conditionLabel: string;
  high: number;
  low: number;
  precipProb: number;
  rangeStartPct: number;
  rangeWidthPct: number;
}

export interface ProWeatherHourlyItem {
  datetime: string;
  date: Date;
  timeLabel: string;
  condition: string;
  conditionLabel: string;
  temperature: number;
  precipProb: number;
  windSpeed?: number;
}

export interface ProWeatherUvBadge {
  label: 'Low' | 'Moderate' | 'High' | 'Very High';
  tone: 'success' | 'warning' | 'danger';
}

export interface ProOverviewWeatherModel {
  entityId: string | undefined;
  stationName: string;
  hasEntity: boolean;
  stations: ProWeatherStationOption[];
  condition: string;
  conditionLabel: string;
  conditionTone: PillTone;
  isNight: boolean;
  currentTemp: number;
  tempUnit: string;
  apparentTemp: number;
  high: number;
  low: number;
  humidity: number;
  dewPoint?: number;
  windSpeed?: number;
  windSpeedUnit: string;
  windBearing?: number;
  windCardinal?: string;
  pressure?: number;
  pressureUnit: string;
  visibility?: number;
  visibilityUnit: string;
  uvIndex?: number;
  uvBadge: ProWeatherUvBadge | null;
  cloudCoverage?: number;
  daily: ProWeatherDailyItem[];
  hourly: ProWeatherHourlyItem[];
  hourlyTempMin: number;
  hourlyTempMax: number;
  hourlyPeakPrecipProb: number;
}

const CARDINAL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export function formatWeatherConditionLabel(condition?: string): string {
  const norm = (condition || 'partlycloudy').toLowerCase().trim();
  switch (norm) {
    case 'clear-night':
      return 'Clear night';
    case 'sunny':
      return 'Sunny';
    case 'partlycloudy':
    case 'partlycloudy-night':
      return 'Partly cloudy';
    case 'cloudy':
      return 'Cloudy';
    case 'rainy':
      return 'Rainy';
    case 'pouring':
      return 'Heavy rain';
    case 'lightning':
    case 'lightning-rainy':
      return 'Thunderstorm';
    case 'snowy':
      return 'Snowy';
    case 'snowy-rainy':
      return 'Sleet';
    case 'hail':
      return 'Hail';
    case 'windy':
    case 'windy-variant':
      return 'Windy';
    case 'fog':
      return 'Foggy';
    case 'exceptional':
      return 'Alert';
    default:
      return norm.replace(/[-_]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
}

export function getWeatherConditionTone(condition?: string): PillTone {
  const norm = (condition || '').toLowerCase();
  if (
    norm.includes('lightning') ||
    norm.includes('thunder') ||
    norm.includes('hail') ||
    norm.includes('exceptional')
  ) {
    return 'danger';
  }
  if (
    norm.includes('rain') ||
    norm.includes('pouring') ||
    norm.includes('snow') ||
    norm.includes('wind') ||
    norm.includes('fog')
  ) {
    return 'warning';
  }
  if (norm.includes('sunny') || norm.includes('clear')) {
    return 'success';
  }
  return 'accent';
}

export function getUvBadgeInfo(uvIndex?: number): ProWeatherUvBadge | null {
  if (typeof uvIndex !== 'number' || Number.isNaN(uvIndex)) return null;
  if (uvIndex <= 2) return { label: 'Low', tone: 'success' };
  if (uvIndex <= 5) return { label: 'Moderate', tone: 'warning' };
  if (uvIndex <= 7) return { label: 'High', tone: 'warning' };
  return { label: 'Very High', tone: 'danger' };
}

export function formatWindCardinal(bearing?: number): string {
  if (typeof bearing !== 'number' || Number.isNaN(bearing)) return '—';
  const normalized = ((bearing % 360) + 360) % 360;
  return CARDINAL_DIRECTIONS[Math.round(normalized / 45) % 8];
}

function formatDayShort(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return `Day ${index + 1}`;
  return parsed.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatDayFull(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return `Day ${index + 1}`;
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatHourLabel(date: Date, index: number): string {
  if (index === 0) return 'Now';
  if (Number.isNaN(date.getTime())) return `+${index * 2}h`;
  return date.toLocaleTimeString(undefined, { hour: 'numeric' });
}

function computeDailyRangeBars(items: DailyForecastItem[]): ProWeatherDailyItem[] {
  if (items.length === 0) return [];
  const lows = items.map((d) => Math.round(d.templow));
  const highs = items.map((d) => Math.round(d.temperature));
  const weekMin = Math.min(...lows);
  const weekMax = Math.max(...highs);
  const span = weekMax - weekMin;

  return items.slice(0, 7).map((item, idx) => {
    const low = Math.round(item.templow);
    const high = Math.round(item.temperature);
    let rangeStartPct = 0;
    let rangeWidthPct = 100;

    if (span > 0) {
      rangeStartPct = Math.max(0, Math.round(((low - weekMin) / span) * 100));
      rangeWidthPct = Math.max(12, Math.round(((high - low) / span) * 100));
      if (rangeStartPct + rangeWidthPct > 100) {
        rangeStartPct = Math.max(0, 100 - rangeWidthPct);
      }
    }

    return {
      datetime: item.datetime,
      dayShort: formatDayShort(item.datetime, idx),
      dayFull: formatDayFull(item.datetime, idx),
      condition: item.condition,
      conditionLabel: formatWeatherConditionLabel(item.condition),
      high,
      low,
      precipProb: Math.round(item.precipitation_probability ?? 0),
      rangeStartPct,
      rangeWidthPct
    };
  });
}

function readOptionalNumber(value: unknown, demoFallback?: number, isDemo?: boolean): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return isDemo ? demoFallback : undefined;
}

export interface BuildOverviewWeatherInput {
  weatherEntities: ResolvedEntity[];
  selectedWeatherEntityId?: string | null;
  sunState?: string;
  isDemo?: boolean;
}

export function buildOverviewWeatherModel({
  weatherEntities,
  selectedWeatherEntityId,
  sunState,
  isDemo = false
}: BuildOverviewWeatherInput): ProOverviewWeatherModel {
  const active = resolveActiveWeather(weatherEntities, selectedWeatherEntityId);
  const { weatherCondition, isNight, currentTemp, tempUnit, humidity } = deriveWeatherReadings(active, sunState);

  const rawDaily = getDailyForecast(active);
  const dailySource: DailyForecastItem[] =
    rawDaily.length > 0 ? rawDaily : isDemo ? generateFallbackDailyForecast(currentTemp, weatherCondition) : [];

  const { weatherHigh, weatherLow } = deriveWeatherHighLow(dailySource[0], active, currentTemp);

  const rawHourly = getHourlyForecast(active);
  const hourlySource: HourlyForecastItem[] =
    rawHourly.length > 0 ? rawHourly : isDemo ? generateFallbackHourlyForecast(currentTemp, weatherCondition) : [];

  const attr = (active?.attributes || {}) as Record<string, unknown>;
  const apparentTemp = readOptionalNumber(attr.apparent_temperature, currentTemp, true) ?? currentTemp;
  const dewPoint = readOptionalNumber(attr.dew_point, Math.round((currentTemp - 8) * 10) / 10, isDemo);
  const windSpeed = readOptionalNumber(attr.wind_speed, 14.2, isDemo);
  const windSpeedUnit = typeof attr.wind_speed_unit === 'string' ? attr.wind_speed_unit : 'km/h';
  const windBearing = readOptionalNumber(attr.wind_bearing, 235, isDemo);
  const pressure = readOptionalNumber(attr.pressure, 1014.2, isDemo);
  const pressureUnit = typeof attr.pressure_unit === 'string' ? attr.pressure_unit : 'hPa';
  const visibility = readOptionalNumber(attr.visibility, 10, isDemo);
  const visibilityUnit = typeof attr.visibility_unit === 'string' ? attr.visibility_unit : 'km';
  const uvIndex = readOptionalNumber(attr.uv_index, 5.4, isDemo);
  const cloudCoverage = readOptionalNumber(attr.cloud_coverage, 42, isDemo);

  const daily = computeDailyRangeBars(dailySource);
  const hourly: ProWeatherHourlyItem[] = hourlySource.slice(0, 12).map((item, idx) => {
    const parsed = new Date(item.datetime);
    const validDate = Number.isNaN(parsed.getTime()) ? new Date(Date.now() + idx * 2 * 3600 * 1000) : parsed;
    return {
      datetime: item.datetime,
      date: validDate,
      timeLabel: formatHourLabel(validDate, idx),
      condition: item.condition,
      conditionLabel: formatWeatherConditionLabel(item.condition),
      temperature: Math.round(item.temperature),
      precipProb: Math.round(item.precipitation_probability ?? 0),
      windSpeed: typeof item.wind_speed === 'number' ? Math.round(item.wind_speed) : undefined
    };
  });

  const hourlyTemps = hourly.length > 0 ? hourly.map((h) => h.temperature) : [Math.round(currentTemp)];
  const hourlyTempMin = Math.min(...hourlyTemps);
  const hourlyTempMax = Math.max(...hourlyTemps);
  const hourlyPeakPrecipProb = hourly.length > 0 ? Math.max(...hourly.map((h) => h.precipProb)) : 0;

  const stations: ProWeatherStationOption[] = weatherEntities
    .filter((w) => !w.hidden && !w.disabled_by)
    .map((w) => {
      const wTemp = typeof w.attributes?.temperature === 'number' ? Math.round(w.attributes.temperature) : null;
      const wUnit = typeof w.attributes?.temperature_unit === 'string' ? w.attributes.temperature_unit : tempUnit;
      const friendly =
        w.name || (typeof w.attributes?.friendly_name === 'string' ? w.attributes.friendly_name : '') || w.entity_id;
      return {
        id: w.entity_id,
        label: friendly,
        conditionLabel: formatWeatherConditionLabel(w.state),
        tempText: wTemp !== null ? `${wTemp}${wUnit}` : '—'
      };
    });

  const stationName =
    active?.name ||
    (typeof attr.friendly_name === 'string' ? attr.friendly_name : '') ||
    (isDemo ? 'Home Weather' : 'Local Weather');

  return {
    entityId: active?.entity_id,
    stationName,
    hasEntity: Boolean(active),
    stations,
    condition: weatherCondition,
    conditionLabel: formatWeatherConditionLabel(weatherCondition),
    conditionTone: getWeatherConditionTone(weatherCondition),
    isNight,
    currentTemp: Math.round(currentTemp * 10) / 10,
    tempUnit,
    apparentTemp: Math.round(apparentTemp * 10) / 10,
    high: Math.round(weatherHigh),
    low: Math.round(weatherLow),
    humidity: Math.round(typeof humidity === 'number' ? humidity : 55),
    dewPoint,
    windSpeed: windSpeed !== undefined ? Math.round(windSpeed * 10) / 10 : undefined,
    windSpeedUnit,
    windBearing,
    windCardinal: windBearing !== undefined ? formatWindCardinal(windBearing) : undefined,
    pressure: pressure !== undefined ? Math.round(pressure * 10) / 10 : undefined,
    pressureUnit,
    visibility,
    visibilityUnit,
    uvIndex: uvIndex !== undefined ? Math.round(uvIndex * 10) / 10 : undefined,
    uvBadge: getUvBadgeInfo(uvIndex),
    cloudCoverage: cloudCoverage !== undefined ? Math.round(cloudCoverage) : undefined,
    daily,
    hourly,
    hourlyTempMin,
    hourlyTempMax,
    hourlyPeakPrecipProb
  };
}
