import { useMemo } from 'react';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { buildOverviewWeatherModel, type ProOverviewWeatherModel } from '../../lib/overviewWeather';
import { useDomainEntities } from '../shared/entities';

/** Weather from the `weather` domain, the chosen station and the sun (day/night icons). */
export function useWeatherModel(): ProOverviewWeatherModel {
  const stations = useDomainEntities('weather');
  const selected = useAutoLayoutStore((s) => s.selectedWeatherEntityId);
  const sunState = useAutoLayoutStore((s) => s.states?.['sun.sun']?.state);
  const isDemo = haWebSocketService.isDemo();
  return useMemo(
    () => buildOverviewWeatherModel({ weatherEntities: stations, selectedWeatherEntityId: selected, sunState, isDemo }),
    [stations, selected, sunState, isDemo]
  );
}
