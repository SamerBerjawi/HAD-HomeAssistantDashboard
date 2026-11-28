/**
 * Sends a tile's actions to Home Assistant (Area page build, phase 2): maps them with
 * `tileActionCalls`, shows the expected state at once (optimistic), then calls HA through the
 * widgets' `useServiceCall` (errors become toasts there; demo mode answers like HA would). Changes
 * HA does not keep go back to the page through `onLocal`.
 */
import { useCallback, useRef } from 'react';
import type { TileAction, TileModel } from '../tileTypes';
import { useServiceCall } from '../../widgets/shared/useServiceCall';
import { tileActionCalls, type ActionOptions } from './haTileActions';
import type { AreaTile } from './haRoomTiles';

export function useTileActions(onLocal: (key: string, patch: Partial<TileModel>) => void, opts: ActionOptions = {}) {
  const { call, setOptimistic } = useServiceCall();
  // The latest callbacks without making the returned function change on every render.
  const latest = useRef({ onLocal, opts });
  latest.current = { onLocal, opts };
  return useCallback(
    (tile: Pick<AreaTile, 'key' | 'model' | 'targets'>, a: TileAction) => {
      const r = tileActionCalls(tile.model, a, tile.targets, latest.current.opts);
      if (r.local) latest.current.onLocal(tile.key, r.local);
      for (const c of r.calls) {
        if (c.optimistic) setOptimistic(c.entityId, c.optimistic.state, c.optimistic.attributes);
        void call(c.domain, c.service, c.data, c.entityId);
      }
    },
    [call, setOptimistic]
  );
}
