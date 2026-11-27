import { useEffect, useState } from 'react';
import { extractHAState, extractHATimestamp } from '@/services/haHistoryService';
import type { TileHistory } from '../../../src/pro/areas/ha/haTileModels';
import type { Hass } from './runtime';

const DAY = 86_400_000;

export function useOpeningHistory(hass: Hass, entityId?: string) {
  const [result, setResult] = useState<{entityId: string; history: TileHistory}>();
  useEffect(() => {
    if (!entityId) return;
    let active = true;
    const refresh = async () => {
      const start = Date.now() - DAY;
      try {
        const histories = await hass.callWS<Record<string, Record<string, unknown>[]>>({
          type: 'history/history_during_period',
          start_time: new Date(start).toISOString(),
          entity_ids: [entityId],
          minimal_response: true,
          no_attributes: true,
        });
        const spells: [number, number | null][] = [];
        let opened: number | null = null;
        const rows = histories[entityId] ?? [];
        for (const row of rows) {
          const at = Math.max(start, extractHATimestamp(row, start));
          const state = extractHAState(row);
          if (state === 'on') opened ??= at;
          else if (opened !== null) {
            spells.push([opened, at]);
            opened = null;
          }
        }
        if (opened !== null) spells.push([opened, null]);
        if (active) setResult(rows.length ? {entityId, history: {spells: {[entityId]: spells}}} : undefined);
      } catch {
        if (active) setResult(undefined);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [entityId, hass.connection]);
  return result?.entityId === entityId ? result?.history : undefined;
}
