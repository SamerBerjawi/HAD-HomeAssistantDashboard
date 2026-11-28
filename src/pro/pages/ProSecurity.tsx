/**
 * Pro Security page, redesigned in the Security Studio (docs/pro-ui/SECURITY.md, approved by the
 * owner 2026-11-26): the one clear answer first (Slide hero with the Summary line), cameras right
 * below (Stage + filmstrip, live over WebRTC), then the devices that want a look and everything
 * else in tabs (Today is a tab). The same layout on phone and desktop. Loading, empty and
 * "HA unreachable" states as reviewed in the studio's round 6.
 */
import { createContext, useContext, useEffect, useRef } from 'react';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { ResolvedEntity } from '@/types';
import { ProCameraPlayer } from '../components/security/ProCameraPlayer';
import { useSecurityHome } from '../hooks/useSecurityHome';
import { useBoxSize } from '../widgets/shared/useBoxSize';
import { cn } from '@/lib/utils';
import SecurityHero from './security/SecurityHero';
import { CamerasStage, StillView, type CameraViewProps } from './security/CameraStage';
import { DevicesTabs } from './security/SecurityDevices';
import { SecurityEmpty, SecurityError, SecurityLoading } from './security/SecurityStates';

const CameraEntities = createContext<Record<string, ResolvedEntity>>({});
const SNAPSHOT_REFRESH_MS = 25_000;

/** A camera on the page: the live WebRTC player for the big view, HA snapshots for thumbnails. */
function LiveView({ c, live, radius, className }: CameraViewProps) {
  const entity = useContext(CameraEntities)[c.entityId];
  if (!entity) return <StillView c={c} live={live} radius={radius} className={className} />;
  return <ProCameraPlayer camera={entity} live={live && c.available} refreshIntervalMs={live ? undefined : SNAPSHOT_REFRESH_MS} className={cn('aspect-video w-full', radius, className)} />;
}

export default function ProSecurity() {
  const { home, act, camerasById, isLoading, isEmpty, offline } = useSecurityHome();
  const box = useBoxSize<HTMLDivElement>({ width: 375, height: 0 });
  const width = box.width;
  const haUrl = useAutoLayoutStore((s) => s.serverUrl);
  // When HA was last reachable, for "showing the last known state from 12:04".
  const lastSeen = useRef(Date.now());
  useEffect(() => {
    if (!offline) lastSeen.current = Date.now();
  });
  const retry = () => {
    const url = haWebSocketService.getCurrentUrl();
    const token = haWebSocketService.getCurrentToken();
    if (url && token) haWebSocketService.connect(url, token, true);
  };

  const page = (
    <div className="flex flex-col gap-6">
      <SecurityHero home={home} width={width} act={act} />
      {home.cameras.length ? <CamerasStage home={home} width={width} View={LiveView} /> : null}
      {home.devices.length ? <DevicesTabs home={home} width={width} act={act} /> : null}
    </div>
  );

  return (
    <CameraEntities.Provider value={camerasById}>
      <div ref={box.ref} className="min-w-0">
        {isLoading ? <SecurityLoading width={width} /> : isEmpty ? <SecurityEmpty haUrl={haUrl} /> : offline ? <SecurityError lastSeen={lastSeen.current} onRetry={retry}>{page}</SecurityError> : page}
      </div>
    </CameraEntities.Provider>
  );
}
