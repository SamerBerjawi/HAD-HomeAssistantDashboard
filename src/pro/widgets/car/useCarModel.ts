/** Car model for the widget: the store selector from `lib/carModelSelector`, one per card. */
import { useRef } from 'react';
import { haWebSocketService } from '@/services/haWebSocket';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { createCarModelSelector, type CarSettings } from '../../lib/carModelSelector';
import type { ProCarModel } from '../../lib/overviewCar';

export function useCarModel(): ProCarModel {
  const { config } = useUserConfig();
  const car = config.mobility?.car;
  const select = useRef<ReturnType<typeof createCarModelSelector> | null>(null);
  if (!select.current) select.current = createCarModelSelector();
  const settings: CarSettings = {
    isDemo: haWebSocketService.isDemo(),
    targetSocDefault: car?.targetSocDefault,
    brandLogoUrl: car?.brandLogoUrl,
    vehicleImageUrl: car?.vehicleImageUrl
  };
  const run = select.current;
  return useAutoLayoutStore((s) => run(s, settings));
}
