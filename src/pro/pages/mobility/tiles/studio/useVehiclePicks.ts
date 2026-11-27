import { useCallback, useState } from 'react';
import type { VehicleConceptId, VehicleTileType } from './vehicleCatalog';

export interface VehiclePick {
  concept: VehicleConceptId | 'mix' | 'none';
  notes: string;
}

const KEY = 'had.pro.vehicleStudio.picks';
const EMPTY: VehiclePick = { concept: 'none', notes: '' };

export function readVehiclePicks(): Record<string, VehiclePick> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, VehiclePick>) : {};
  } catch {
    return {};
  }
}

/** The owner's pick for one vehicle tile, kept in this browser, plus "copy for the chat" (as the Area studio). */
export function useVehiclePicks(type: VehicleTileType) {
  const [pick, setState] = useState<VehiclePick>(() => ({ ...EMPTY, ...readVehiclePicks()[type.id] }));
  const [copied, setCopied] = useState(false);
  const setPick = useCallback(
    (next: VehiclePick) => {
      setState(next);
      setCopied(false);
      try {
        window.localStorage.setItem(KEY, JSON.stringify({ ...readVehiclePicks(), [type.id]: next }));
      } catch {
        /* blocked storage: works for this visit */
      }
    },
    [type.id]
  );
  const copy = useCallback(async () => {
    const name = type.concepts.find((c) => c.id === pick.concept)?.name;
    const choice = pick.concept === 'mix' ? 'a mix' : `Concept ${pick.concept}${name ? ` (${name})` : ''}`;
    try {
      await navigator.clipboard.writeText(`Vehicle tiles · ${type.title}: ${choice}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [type, pick]);
  return { pick, setPick, copy, copied };
}
