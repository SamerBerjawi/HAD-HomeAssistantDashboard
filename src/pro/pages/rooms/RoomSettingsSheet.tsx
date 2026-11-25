/**
 * Per-room customization sheet (Phase 1.3): overrides display name, icon, colour, background
 * picture, primary metric, primary temp/humidity sensors, and up to 3 card quick actions.
 * Writes granularly to `rooms.areaOverrides[areaId]` (null resets a field to Automatic).
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, InputGroup, Label, Switch, TextField } from '@heroui/react';
import { FileTrigger } from 'react-aria-components';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Home01Icon,
  ImageUploadIcon,
  PaintBoardIcon,
  Settings01Icon,
  Tick02Icon
} from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { AreaPrimaryMetric, UserDashboardConfig } from '@/types/userConfig';
import { ProSheet } from '../../components/ProSheet';
import { useLayoutScope } from '../../hooks/useLayoutScope';
import { QUICK_ACTIONS, type QuickAction } from '../../lib/roomTiles';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';
import { ROOM_COLORS, ROOM_ICONS, roomIcon } from './shared';

const METRIC_OPTIONS: { id: AreaPrimaryMetric; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'temperature', label: 'Temp' },
  { id: 'humidity', label: 'Humidity' },
  { id: 'power', label: 'Power' },
  { id: 'air_quality', label: 'Air' },
  { id: 'none', label: 'None' }
];

const QUICK_ACTION_LABELS: Record<QuickAction, string> = {
  lights: 'Lights',
  climate: 'Climate',
  media: 'Media',
  fan: 'Fans',
  cover: 'Covers & blinds',
  scenes: 'Scenes'
};

interface RoomSettingsSheetProps {
  areaId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomSettingsSheet({ areaId, isOpen, onOpenChange }: RoomSettingsSheetProps) {
  const { config, updateConfig, uploadVehicleAsset } = useUserConfig();
  const { effectivePrefs, saveScopedPrefs } = useLayoutScope();
  const area = useAutoLayoutStore((s) => (areaId ? s.resolvedAreas.find((a) => a.area_id === areaId) ?? null : null));
  const override = areaId ? config.rooms?.areaOverrides?.[areaId] : undefined;

  const [nameInput, setNameInput] = useState('');
  const [busyPhoto, setBusyPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setNameInput(override?.customName || override?.name || '');
    setPhotoError(null);
  }, [isOpen, areaId, override?.customName, override?.name]);

  const { tempSensors, humiditySensors } = useMemo(() => {
    const entities = area?.entities ?? [];
    const temps = entities.filter((e) => {
      const dc = String(e.attributes?.device_class ?? '').toLowerCase();
      const unit = String(e.attributes?.unit_of_measurement ?? '');
      return e.domain === 'sensor' && (dc === 'temperature' || unit === '°C' || unit === '°F');
    });
    const hums = entities.filter((e) => {
      const dc = String(e.attributes?.device_class ?? '').toLowerCase();
      return e.domain === 'sensor' && dc === 'humidity';
    });
    return { tempSensors: temps, humiditySensors: hums };
  }, [area]);

  if (!areaId || !area) return null;

  const saveOverride = (patch: Record<string, unknown>) => {
    void updateConfig({ rooms: { areaOverrides: { [areaId]: patch } } } as unknown as Partial<UserDashboardConfig>);
  };

  const displayName = override?.customName || override?.name || area.name;
  const activeColor = override?.customColor || override?.color || null;
  const activeIconId = (override?.customIcon || override?.icon || '').trim().toLowerCase();
  const activeMetric: AreaPrimaryMetric = override?.primaryMetric ?? 'auto';
  const tempEntityId = override?.primaryTempEntityId ?? null;
  const humidityEntityId = override?.primaryHumidityEntityId ?? null;
  const hasPhotoOverride = override?.backgroundImageUrl !== undefined || override?.picture !== undefined;
  const rawPhoto = override?.backgroundImageUrl ?? override?.picture;
  const photoMode: 'ha' | 'upload' | 'none' = !hasPhotoOverride ? 'ha' : rawPhoto === '' ? 'none' : 'upload';

  const customActions = Array.isArray(override?.quickActions)
    ? override.quickActions.filter((a): a is QuickAction => QUICK_ACTIONS.includes(a as QuickAction)).slice(0, 3)
    : null;
  const effectiveQuickList: QuickAction[] = customActions ?? ['lights', 'climate'];

  const handleUploadPhoto = async (file: File) => {
    setBusyPhoto(true);
    setPhotoError(null);
    try {
      const slug = `room_${areaId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'area'}`;
      const url = await uploadVehicleAsset(file, slug);
      saveOverride({ backgroundImageUrl: url, picture: url });
    } catch {
      setPhotoError('Could not upload photo (PNG, JPEG or WebP up to 5 MB; requires admin).');
    } finally {
      setBusyPhoto(false);
    }
  };

  const commitName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === area.name) {
      saveOverride({ customName: null, name: null });
    } else {
      saveOverride({ customName: trimmed, name: trimmed });
    }
  };

  const toggleCustomQuickAction = (action: QuickAction) => {
    const base = customActions ?? effectiveQuickList;
    const next = base.includes(action)
      ? base.filter((a) => a !== action)
      : base.length < 3
      ? [...base, action]
      : [...base.slice(0, 2), action];
    saveOverride({ quickActions: next });
  };

  const moveCustomQuickAction = (index: number, dir: -1 | 1) => {
    const base = [...(customActions ?? effectiveQuickList)];
    const target = index + dir;
    if (target < 0 || target >= base.length) return;
    [base[index], base[target]] = [base[target], base[index]];
    saveOverride({ quickActions: base });
  };

  const currentIcon = roomIcon({ icon: activeIconId || area.icon || '', name: displayName });

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`${displayName} settings`}
      subtitle={`Area ID: ${areaId}`}
      icon={Settings01Icon}
      page="rooms"
      size="lg"
    >
      <div className="flex flex-col gap-5">
        {/* Display Name */}
        <section aria-label="Display name" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted">Display name</h3>
            {override?.customName || override?.name ? (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setNameInput('');
                  saveOverride({ customName: null, name: null });
                }}
                className="h-6 px-2 text-xs"
              >
                Use HA name ({area.name})
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <TextField aria-label="Custom room name" value={nameInput} onChange={setNameInput} className="min-w-0 flex-1">
              <InputGroup fullWidth variant="secondary">
                <InputGroup.Input
                  placeholder={area.name}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitName();
                  }}
                />
              </InputGroup>
            </TextField>
            <Button size="sm" variant="secondary" onPress={commitName} className="h-10 px-3 text-xs">
              Apply
            </Button>
          </div>
        </section>

        {/* Icon Picker */}
        <section aria-label="Room icon" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted">Icon</h3>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <HugeiconsIcon icon={currentIcon} size={14} />
              {activeIconId ? 'Custom' : 'Automatic'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={activeIconId ? 'ghost' : 'secondary'}
              onPress={() => saveOverride({ customIcon: null, icon: null })}
              className="h-9 rounded-xl px-2.5 text-xs"
            >
              Auto
            </Button>
            {ROOM_ICONS.map((item) => {
              const selected = activeIconId === item.id;
              return (
                <Button
                  key={item.id}
                  isIconOnly
                  size="sm"
                  variant={selected ? 'primary' : 'ghost'}
                  aria-label={item.label}
                  aria-pressed={selected}
                  onPress={() => saveOverride({ customIcon: item.id, icon: item.id })}
                  className="size-9 min-w-0 rounded-xl"
                >
                  <HugeiconsIcon icon={item.icon} size={16} />
                </Button>
              );
            })}
          </div>
        </section>

        {/* Colour */}
        <section aria-label="Room colour" className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <HugeiconsIcon icon={PaintBoardIcon} size={13} />
            Accent colour
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant={activeColor ? 'ghost' : 'secondary'}
              onPress={() => saveOverride({ customColor: null, color: null })}
              className="h-8 rounded-full px-3 text-xs"
            >
              Automatic
            </Button>
            {ROOM_COLORS.map((c) => {
              const on = activeColor?.toLowerCase() === c.hex;
              return (
                <Button
                  key={c.hex}
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => saveOverride({ customColor: c.hex, color: c.hex })}
                  aria-label={c.name}
                  aria-pressed={on}
                  className={cn('size-8 min-w-0 rounded-full text-white', on && 'ring-2 ring-offset-2 ring-[var(--foreground)] ring-offset-[var(--background)]')}
                  style={{ background: c.hex }}
                >
                  {on ? <HugeiconsIcon icon={Tick02Icon} size={14} /> : null}
                </Button>
              );
            })}
          </div>
        </section>

        {/* Room Photo */}
        <section aria-label="Room photo" className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-muted">Room picture</h3>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={photoMode === 'ha' ? 'primary' : 'secondary'}
              isDisabled={busyPhoto}
              onPress={() => saveOverride({ backgroundImageUrl: null, picture: null })}
              className="gap-1.5 text-xs"
            >
              <HugeiconsIcon icon={Home01Icon} size={14} />
              From Home Assistant
            </Button>
            <FileTrigger acceptedFileTypes={['image/png', 'image/jpeg', 'image/webp']} onSelect={(files) => files?.[0] && void handleUploadPhoto(files[0])}>
              <Button size="sm" variant={photoMode === 'upload' ? 'primary' : 'secondary'} isDisabled={busyPhoto} className="gap-1.5 text-xs">
                <HugeiconsIcon icon={ImageUploadIcon} size={14} />
                {busyPhoto ? 'Uploading…' : 'Upload photo…'}
              </Button>
            </FileTrigger>
            <Button
              size="sm"
              variant={photoMode === 'none' ? 'primary' : 'secondary'}
              isDisabled={busyPhoto}
              onPress={() => saveOverride({ backgroundImageUrl: '', picture: '' })}
              className="gap-1.5 text-xs"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
              None
            </Button>
          </div>
          {photoError ? <p className="text-xs text-[hsl(4_82%_54%)]">{photoError}</p> : null}
        </section>

        {/* Primary Card Metric & Primary Sensors */}
        <section aria-label="Hero reading and sensors" className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-muted">Hero metric &amp; primary sensors</h3>
          <SheetFilter
            label="Primary metric on room card"
            value={activeMetric}
            onChange={(m) => saveOverride({ primaryMetric: m === 'auto' ? null : m })}
            options={METRIC_OPTIONS}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Default Room view</span>
            <SheetFilter
              label="Default view when opening room"
              value={effectivePrefs.roomDefaultViews?.[areaId] ?? 'auto'}
              onChange={(v) =>
                void saveScopedPrefs({
                  roomDefaultViews: { [areaId]: v === 'auto' ? null : (v as 'all' | 'now') }
                } as never)
              }
              options={[
                { id: 'auto', label: 'Auto (remember)' },
                { id: 'all', label: 'All' },
                { id: 'now', label: 'Now' }
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">Temperature sensor</span>
            <Dropdown>
              <Button size="sm" variant="secondary" className="max-w-[230px] gap-1.5 text-xs">
                <span className="truncate">
                  {tempEntityId
                    ? tempSensors.find((e) => e.entity_id === tempEntityId)?.name || tempEntityId
                    : 'Automatic (average)'}
                </span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={13} className="shrink-0" />
              </Button>
              <Dropdown.Popover placement="bottom end" className="max-h-[50dvh] min-w-56 overflow-y-auto">
                <Dropdown.Menu
                  aria-label="Primary temperature sensor"
                  onAction={(key) => {
                    const id = String(key);
                    saveOverride({ primaryTempEntityId: id === '__auto' ? null : id });
                  }}
                >
                  <Dropdown.Item id="__auto" textValue="Automatic (average)">
                    <HugeiconsIcon icon={Tick02Icon} size={14} className={!tempEntityId ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} />
                    <Label>Automatic (average)</Label>
                  </Dropdown.Item>
                  {tempSensors.map((e) => (
                    <Dropdown.Item key={e.entity_id} id={e.entity_id} textValue={e.name || e.entity_id}>
                      <HugeiconsIcon icon={Tick02Icon} size={14} className={tempEntityId === e.entity_id ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} />
                      <Label className="truncate">{e.name || e.entity_id}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">Humidity sensor</span>
            <Dropdown>
              <Button size="sm" variant="secondary" className="max-w-[230px] gap-1.5 text-xs">
                <span className="truncate">
                  {humidityEntityId
                    ? humiditySensors.find((e) => e.entity_id === humidityEntityId)?.name || humidityEntityId
                    : 'Automatic (average)'}
                </span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={13} className="shrink-0" />
              </Button>
              <Dropdown.Popover placement="bottom end" className="max-h-[50dvh] min-w-56 overflow-y-auto">
                <Dropdown.Menu
                  aria-label="Primary humidity sensor"
                  onAction={(key) => {
                    const id = String(key);
                    saveOverride({ primaryHumidityEntityId: id === '__auto' ? null : id });
                  }}
                >
                  <Dropdown.Item id="__auto" textValue="Automatic (average)">
                    <HugeiconsIcon icon={Tick02Icon} size={14} className={!humidityEntityId ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} />
                    <Label>Automatic (average)</Label>
                  </Dropdown.Item>
                  {humiditySensors.map((e) => (
                    <Dropdown.Item key={e.entity_id} id={e.entity_id} textValue={e.name || e.entity_id}>
                      <HugeiconsIcon icon={Tick02Icon} size={14} className={humidityEntityId === e.entity_id ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} />
                      <Label className="truncate">{e.name || e.entity_id}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </section>

        {/* Per-Room Quick Actions */}
        <section aria-label="Card quick actions" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold text-muted">Quick actions on card</h3>
              <span className="text-xs text-muted">Override page defaults with up to 3 room actions</span>
            </div>
            <Switch
              size="sm"
              isSelected={customActions !== null}
              onChange={() => saveOverride({ quickActions: customActions !== null ? null : effectiveQuickList })}
              aria-label="Custom quick actions for this room"
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>

          {customActions !== null ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-default/40 p-3">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((a) => {
                  const selected = customActions.includes(a);
                  return (
                    <Button
                      key={a}
                      size="sm"
                      variant={selected ? 'primary' : 'secondary'}
                      onPress={() => toggleCustomQuickAction(a)}
                      className="h-8 rounded-full px-3 text-xs"
                    >
                      {QUICK_ACTION_LABELS[a]}
                    </Button>
                  );
                })}
              </div>
              {customActions.length > 1 ? (
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-[11px] font-medium text-muted">Priority order (first shows on compact/standard)</span>
                  {customActions.map((a, idx) => (
                    <div key={a} className="flex items-center gap-2 rounded-xl bg-default/40 px-2.5 py-1.5 text-xs">
                      <span className="flex-1 font-medium">{QUICK_ACTION_LABELS[a]}</span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        isDisabled={idx === 0}
                        onPress={() => moveCustomQuickAction(idx, -1)}
                        aria-label={`Move ${QUICK_ACTION_LABELS[a]} up`}
                        className="size-7 min-w-0"
                      >
                        <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        isDisabled={idx === customActions.length - 1}
                        onPress={() => moveCustomQuickAction(idx, 1)}
                        aria-label={`Move ${QUICK_ACTION_LABELS[a]} down`}
                        className="size-7 min-w-0"
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </ProSheet>
  );
}
