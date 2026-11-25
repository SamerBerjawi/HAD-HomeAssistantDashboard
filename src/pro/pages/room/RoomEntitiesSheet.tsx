/**
 * Room Entity Picker Sheet (Phase 2.4):
 * Surfaces auto-filtered entities in this room (diagnostics, scripts, buttons, owned readings)
 * as well as searchable entities from other rooms so users can include/remove them cleanly.
 * Saves granularly to `rooms.areaOverrides[areaId].extraEntityIds`.
 */
import { useMemo, useState } from 'react';
import { Button, InputGroup, TextField } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Layers01Icon, PlusSignIcon, Search01Icon, ViewOffSlashIcon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { UserDashboardConfig } from '@/types/userConfig';
import { ProSheet } from '../../components/ProSheet';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';

interface RoomEntitiesSheetProps {
  areaId: string;
  areaName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Entity keys already shown automatically in this room. */
  autoTileEntityIds: ReadonlySet<string>;
}

const SUPPORTED_DOMAINS = new Set([
  'light',
  'switch',
  'input_boolean',
  'climate',
  'fan',
  'cover',
  'media_player',
  'scene',
  'script',
  'button',
  'camera',
  'lock',
  'vacuum',
  'sensor',
  'binary_sensor'
]);

export function RoomEntitiesSheet({
  areaId,
  areaName,
  isOpen,
  onOpenChange,
  autoTileEntityIds
}: RoomEntitiesSheetProps) {
  const { config, updateConfig } = useUserConfig();
  const resolvedEntities = useAutoLayoutStore((s) => s.resolvedEntities);
  const resolvedAreas = useAutoLayoutStore((s) => s.resolvedAreas);

  const [tab, setTab] = useState<'room' | 'other'>('room');
  const [query, setQuery] = useState('');

  const extraIds = config.rooms?.areaOverrides?.[areaId]?.extraEntityIds ?? [];
  const extraSet = useMemo(() => new Set(extraIds), [extraIds]);

  const areaNameById = useMemo(
    () => new Map(resolvedAreas.map((a) => [a.area_id, a.name])),
    [resolvedAreas]
  );

  const area = resolvedAreas.find((a) => a.area_id === areaId);
  const q = query.trim().toLowerCase();

  const roomFilteredList = useMemo(() => {
    const list = (area?.entities ?? []).filter(
      (e) =>
        SUPPORTED_DOMAINS.has(e.domain) &&
        (!autoTileEntityIds.has(e.entity_id) || extraSet.has(e.entity_id))
    );
    const matches = q
      ? list.filter((e) => `${e.name} ${e.entity_id}`.toLowerCase().includes(q))
      : list;
    return matches.sort((a, b) => a.name.localeCompare(b.name));
  }, [area, autoTileEntityIds, extraSet, q]);

  const otherRoomsList = useMemo(() => {
    const list = Object.values(resolvedEntities).filter(
      (e) =>
        SUPPORTED_DOMAINS.has(e.domain) &&
        e.area_id !== areaId &&
        (!autoTileEntityIds.has(e.entity_id) || extraSet.has(e.entity_id))
    );
    const matches = q
      ? list.filter((e) => `${e.name} ${e.entity_id}`.toLowerCase().includes(q))
      : list;
    return matches.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
  }, [resolvedEntities, areaId, autoTileEntityIds, extraSet, q]);

  const toggleExtra = (entityId: string) => {
    const next = extraSet.has(entityId)
      ? extraIds.filter((id) => id !== entityId)
      : [...extraIds, entityId];
    void updateConfig({
      rooms: {
        areaOverrides: {
          [areaId]: {
            extraEntityIds: next.length > 0 ? next : null
          }
        }
      }
    } as unknown as Partial<UserDashboardConfig>);
  };

  const rows = tab === 'room' ? roomFilteredList : otherRoomsList;

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Add / manage entities"
      subtitle={`${areaName} · ${extraIds.length} custom added`}
      icon={Layers01Icon}
      page="rooms"
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <SheetFilter
          label="Source"
          value={tab}
          onChange={setTab}
          options={[
            { id: 'room', label: `This room (${roomFilteredList.length})` },
            { id: 'other', label: 'Other rooms & all HA' }
          ]}
        />

        <TextField aria-label="Filter entities" value={query} onChange={setQuery}>
          <InputGroup fullWidth variant="secondary">
            <InputGroup.Prefix>
              <HugeiconsIcon icon={Search01Icon} size={15} className="text-muted" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="Filter by name or entity ID…" />
          </InputGroup>
        </TextField>

        <ul className="flex flex-col gap-1.5">
          {rows.map((e) => {
            const added = extraSet.has(e.entity_id);
            const origin = e.area_id ? areaNameById.get(e.area_id) : null;
            return (
              <li key={e.entity_id} className="flex items-center gap-3 rounded-xl bg-default/40 px-3 py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{e.name || e.entity_id}</span>
                  <span className="truncate text-[11px] text-muted">
                    {e.entity_id}
                    {origin && tab === 'other' ? ` · ${origin}` : ''}
                    {e.isDiagnostic ? ' · diagnostic' : e.entity_category === 'config' ? ' · config' : ''}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant={added ? 'ghost' : 'tertiary'}
                  onPress={() => toggleExtra(e.entity_id)}
                  className="pro-touch-44 shrink-0 gap-1 text-xs"
                >
                  <HugeiconsIcon icon={added ? ViewOffSlashIcon : PlusSignIcon} size={14} />
                  {added ? 'Remove' : 'Include'}
                </Button>
              </li>
            );
          })}
          {rows.length === 0 ? (
            <li className="py-6 text-center text-xs text-muted">
              {tab === 'room'
                ? 'No hidden diagnostic, script, or helper entities left in this room.'
                : 'No matching entities found.'}
            </li>
          ) : null}
        </ul>
      </div>
    </ProSheet>
  );
}
