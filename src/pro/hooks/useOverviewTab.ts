/**
 * The Overview tab lives in the URL (`?tab=lights`, Phase 4) so a reload or a shared link keeps
 * it. Switching tabs replaces the entry (no Back step per tab); Back still closes sheets.
 */
import { useCallback, useEffect, useState } from 'react';

const read = () => new URLSearchParams(window.location.search).get('tab');

export function useOverviewTab(): [string | null, (tab: string) => void] {
  const [tab, setTab] = useState<string | null>(read);
  useEffect(() => {
    const sync = () => setTab(read());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const select = useCallback((next: string) => {
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('tab');
    else url.searchParams.set('tab', next);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    setTab(next === 'all' ? null : next);
  }, []);
  return [tab, select];
}
