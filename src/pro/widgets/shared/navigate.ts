/**
 * Widget → page navigation. Widgets don't get the app's `setActiveTab`, so they move the URL and
 * send a `popstate`, which `useActiveTab` already listens to (the same path as Back/Forward).
 */
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';

export function openTab(tab: string) {
  const path = `/${tab}`;
  if (window.location.pathname !== path) window.history.pushState({ tab }, '', path);
  window.dispatchEvent(new PopStateEvent('popstate', { state: { tab } }));
}

/** Open the Rooms page on one area. The tab change clears the selected area, so select it after. */
export function openArea(areaId: string) {
  openTab('rooms');
  useAutoLayoutStore.getState().setSelectedAreaId(areaId);
}
