/** Pieces the three weather styles share: the empty state and data checks for real stations. */
import { HugeiconsIcon } from '@hugeicons/react';
import { CloudSlowWindIcon } from '@hugeicons/core-free-icons';
import type { ProOverviewWeatherModel } from '../../../lib/overviewWeather';
import { DetailsButton, WidgetSurface } from '../../shared/WidgetSurface';

export const deg = (t: number) => `${Math.round(t)}°`;

/** No station and no forecast: nothing to draw. */
export const isWeatherEmpty = (m: ProOverviewWeatherModel) => !m.hasEntity && m.daily.length === 0;

/** Enough hourly points for an hourly view (some stations only give a daily forecast). */
export const hasHours = (m: ProOverviewWeatherModel, min = 3) => m.hourly.length >= min;

export function WeatherEmpty({ onOpenDetails }: { onOpenDetails?: () => void }) {
  return (
    <WidgetSurface label="Weather" className="bg-[var(--surface)]">
      <DetailsButton title="Weather" onPress={onOpenDetails} />
      <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-muted">
        <HugeiconsIcon icon={CloudSlowWindIcon} size={22} />
        <p className="text-sm font-medium">No weather station</p>
      </div>
    </WidgetSurface>
  );
}
