/**
 * Pro Energy page, restarted in the Energy Studio (docs/pro-ui/ENERGY.md §0, approved by the owner
 * 2026-11-26): the home's power right now as one answer plus numbers, today hour by hour (power,
 * sun, price, carbon), then the cards (Bento on tablets and desktop, Tiles + detail on phones), on
 * live Home Assistant data from `useEnergyHome`. Loading, not set up and "HA unreachable" states as
 * reviewed in the studio's round 6.
 */
import { useMemo, useRef } from 'react';
import { RefreshIcon } from '@hugeicons/core-free-icons';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useProPageHeader } from '../components/pageHeaderContext';
import { useEnergyHome } from '../hooks/useEnergyHome';
import { useBoxSize } from '../widgets/shared/useBoxSize';
import EnergyPage from './energy/home/EnergyPage';
import { EnergyLoading, EnergyNotSetUp, EnergyUnreachable } from './energy/EnergyStates';

export default function ProEnergy() {
  const { home, loading, notSetUp, offline, failed, lastSeen, refresh } = useEnergyHome();
  const box = useBoxSize<HTMLDivElement>({ width: 375, height: 0 });
  const width = box.width;
  const haUrl = useAutoLayoutStore((s) => s.serverUrl);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const menu = useMemo(() => [{ id: 'refresh', label: 'Refresh statistics', icon: RefreshIcon, onAction: () => refreshRef.current() }], []);
  useProPageHeader({ menu });

  const retry = () => {
    const url = haWebSocketService.getCurrentUrl();
    const token = haWebSocketService.getCurrentToken();
    if (url && token) haWebSocketService.connect(url, token, true);
    refresh();
  };

  return (
    <div ref={box.ref} className="min-w-0">
      {loading ? (
        <EnergyLoading width={width} />
      ) : notSetUp ? (
        <EnergyNotSetUp haUrl={haUrl} />
      ) : failed ? (
        <EnergyUnreachable lastSeen={lastSeen} onRetry={retry}>
          <EnergyLoading width={width} />
        </EnergyUnreachable>
      ) : offline ? (
        <EnergyUnreachable lastSeen={lastSeen} onRetry={retry}>
          <EnergyPage home={home} width={width} />
        </EnergyUnreachable>
      ) : (
        <EnergyPage home={home} width={width} />
      )}
    </div>
  );
}
