/**
 * Vacuums sheet extras (owner review 2026-11-20, WIDGET_DESIGN.md §8 #12): the latest map and
 * cleaning chosen rooms. Rooms are Home Assistant areas (the vacuum's floor first) sent with
 * `vacuum.clean_area` (HA 2026.3+); HA needs the vacuum's segments mapped to areas in its entity
 * settings, and says so in an error toast when they are not.
 */
import { useMemo, useState } from 'react';
import { Button, ToggleButton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MapsIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { ProVacuumItem } from '../../lib/overviewAppliances';
import { SheetFilter, SheetSection } from '../shared/sheet/SheetKit';
import { useHaPicture } from '../shared/useHaPicture';

/** The latest map, with a choice when the vacuum has several (floors, saved maps). */
export function VacuumMap({ v }: { v: ProVacuumItem }) {
  const maps = (v.maps ?? []).filter((m) => m.picture);
  const [id, setId] = useState<string | null>(null);
  const map = maps.find((m) => m.id === id) ?? maps[0] ?? null;
  const src = useHaPicture(map?.picture ?? null);
  if (!map) return null;
  return (
    <SheetSection title="Map" aside={maps.length > 1 ? undefined : map.name} plain>
      {maps.length > 1 ? <SheetFilter label={`${v.name} map`} value={map.id} options={maps.map((m) => ({ id: m.id, label: m.name }))} onChange={setId} /> : null}
      <div className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl bg-default/40">
        {src ? <img src={src} alt={`${v.name}: ${map.name} map`} className="size-full object-contain" /> : <HugeiconsIcon icon={MapsIcon} size={28} className="text-muted" />}
      </div>
    </SheetSection>
  );
}

/** Pick rooms, then clean them in one run. */
export function CleanRooms({ v, onClean }: { v: ProVacuumItem; onClean: (areaIds: string[]) => void }) {
  const areas = useAutoLayoutStore((s) => s.areas);
  const [picked, setPicked] = useState<string[]>([]);
  const rooms = useMemo(() => {
    const home = areas.find((a) => a.name === v.roomName);
    const floor = home?.floor_id ?? null;
    const list = floor ? areas.filter((a) => a.floor_id === floor) : areas;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [areas, v.roomName]);
  if (rooms.length === 0) return null;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const go = () => {
    onClean(picked);
    setPicked([]);
  };
  return (
    <SheetSection title="Clean rooms" aside={picked.length ? `${picked.length} chosen` : 'Pick one or more'} plain>
      <div className="flex flex-wrap gap-1.5">
        {rooms.map((a) => {
          const on = picked.includes(a.area_id);
          return (
            <ToggleButton key={a.area_id} size="sm" isSelected={on} onChange={() => toggle(a.area_id)} className={cn('rounded-full px-3 text-xs', on && 'font-semibold')}>
              {a.name}
            </ToggleButton>
          );
        })}
      </div>
      <Button size="sm" variant="primary" isDisabled={picked.length === 0} onPress={go} className="mt-1 gap-1.5 self-start">
        <HugeiconsIcon icon={PlayIcon} size={14} />
        {picked.length > 1 ? `Clean ${picked.length} rooms` : 'Clean room'}
      </Button>
    </SheetSection>
  );
}
