/**
 * Widget -> page navigation. Widgets don't get the app's `setActiveTab`, so they move the URL and
 * send a `popstate`, which `useActiveTab` already listens to (the same path as Back/Forward).
 */
import { buildRoomPath } from '@/services/appShell';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';

export function openTab(tab: string) {
  const path = `/${tab}`;
  if (window.location.pathname !== path) window.history.pushState({ tab }, '', path);
  window.dispatchEvent(new PopStateEvent('popstate', { state: { tab } }));
}

/** Open the Rooms page on one area via `/rooms/:areaId` deep-link + popstate. */
export function openArea(areaId: string) {
  const path = buildRoomPath(areaId);
  if (window.location.pathname !== path) {
    window.history.pushState({ tab: 'rooms', areaId }, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate', { state: { tab: 'rooms', areaId } }));
  useAutoLayoutStore.getState().setSelectedAreaId(areaId);
}
