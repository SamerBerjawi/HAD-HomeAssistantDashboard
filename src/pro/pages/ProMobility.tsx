/**
 * Pro Mobility page, restarted in the Mobility Studio (docs/pro-ui/MOBILITY.md §0, picks of
 * 2026-11-26/27): B · Ready check with the vehicle pills, the compact Picture hero, Tidy Charging
 * (with the animated drive battery) and Climate, the day on the map, and the Top view Condition, on
 * live Home Assistant data through the vehicle adapters (`useMobilityHome`). Loading, no vehicles
 * and "HA unreachable" page states; asleep, stale and not-reporting vehicles are said in the hero.
 */
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useMobilityHome } from '../hooks/useMobilityHome';
import { useBoxSize } from '../widgets/shared/useBoxSize';
import VehiclePage from './mobility/page/VehiclePage';
import { VehiclePicturesContext } from './mobility/home/VehiclePicture';
import { MobilityLoading, MobilityNotSetUp, MobilityUnreachable } from './mobility/MobilityStates';

export default function ProMobility() {
  const { home, act, loading, notSetUp, offline, lastSeen, pictures } = useMobilityHome();
  const box = useBoxSize<HTMLDivElement>({ width: 375, height: 0 });
  const width = box.width;
  const haUrl = useAutoLayoutStore((s) => s.serverUrl);

  const retry = () => {
    const url = haWebSocketService.getCurrentUrl();
    const token = haWebSocketService.getCurrentToken();
    if (url && token) haWebSocketService.connect(url, token, true);
  };

  const page = (
    <VehiclePicturesContext.Provider value={pictures}>
      <VehiclePage home={home} width={width} act={act} />
    </VehiclePicturesContext.Provider>
  );
  return (
    <div ref={box.ref} className="min-w-0">
      <div>
        {loading ? (
          <MobilityLoading width={width} />
        ) : offline ? (
          <MobilityUnreachable lastSeen={lastSeen} onRetry={retry}>
            {home.vehicles.length ? page : <MobilityLoading width={width} />}
          </MobilityUnreachable>
        ) : notSetUp ? (
          <MobilityNotSetUp haUrl={haUrl} />
        ) : (
          page
        )}
      </div>
    </div>
  );
}
