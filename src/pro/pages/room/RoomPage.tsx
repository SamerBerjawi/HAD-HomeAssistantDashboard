/**
 * One room's page (docs/pro-ui/AREA_TILES.md + Phase 0 + Phase 1 + Phase 2):
 * Rail frame with All / Now views, custom & auto sections, editable Scenes/Readings rail,
 * entity picker, per-tile editor, tap safety confirmation, and pattern copy across rooms.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, InputGroup, Label, Modal, TextField } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Copy01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { resolveHAImageUrl } from '@/services/haImageService';
import type { UserDashboardConfig } from '@/types/userConfig';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { TileAction, TileModel, TileSize } from '../../areas/tileTypes';
import { areaTileName, buildAreaTiles, type AreaTile } from '../../areas/ha/haRoomTiles';
import { applyCarPicture, carDeviceId, NO_PICTURE, readCarPictures, withCarPicture } from '../../areas/ha/carPictures';
import { CarPictureControl } from '../../areas/page/CarPictureControl';
import { useTileActions } from '../../areas/ha/useTileActions';
import { ChosenTile } from '../../areas/tiles/chosenTiles';
import { useAreaLayout } from '../../areas/page/useAreaLayout';
import {
  copyLayoutPatternToRoom,
  createRoomSection,
  renameRoomSection,
  roomSectionTitle,
  type AreaDevice,
  type SectionId
} from '../../areas/page/roomLayout';
import { foldAll } from '../../areas/page/PageNow';
import PageRail from '../../areas/page/PageRail';
import type { PageItem, PageRoom } from '../../areas/page/pageKit';
import { ProEditBar } from '../../components/ProEditBar';
import { VisibilityEditorSheet } from '../../components/VisibilityEditorSheet';
import { withUpdatedRule } from '../../lib/visibilityRules';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useLayoutScope } from '../../hooks/useLayoutScope';
import { useProEditChrome } from '../../store/useProEditChrome';
import { useHaPicture } from '../../widgets/shared/useHaPicture';
import type { RoomItem } from '../../lib/roomsPage';
import { RoomSettingsSheet } from '../rooms/RoomSettingsSheet';
import { RoomEntitiesSheet } from './RoomEntitiesSheet';
import { TileEditSheet } from './TileEditSheet';
import { useRoomView } from './useRoomView';

interface RoomPageProps {
  areaId: string;
  /** Rooms in the Rooms page's order, for previous / next. */
  rooms: readonly RoomItem[];
  onBack: () => void;
  onOpenRoom: (areaId: string) => void;
}

type Patches = Record<string, Partial<TileModel>>;

const DEVICE_MAX_WIDTH: Record<AreaDevice, number | undefined> = { phone: 430, tablet: 1024, desktop: undefined };
const GUARDED_ACTIONS = new Set<TileAction['type']>(['toggle', 'activate', 'lock', 'cover']);

export default function RoomPage({ areaId, rooms, onBack, onOpenRoom }: RoomPageProps) {
  const area = useAutoLayoutStore((s) => s.resolvedAreas.find((a) => a.area_id === areaId) ?? null);
  const resolvedAreas = useAutoLayoutStore((s) => s.resolvedAreas);
  const resolvedEntities = useAutoLayoutStore((s) => s.resolvedEntities);
  const areaNames = useAutoLayoutStore((s) => s.resolvedAreas.map((a) => `${a.area_id}\u0000${a.name}`).join('\u0001'));
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);

  const { device: viewDevice, detected, pinned, setPinned } = useDeviceType();
  const [editingDevice, setEditingDevice] = useState<AreaDevice | null>(null);
  const activeDevice: AreaDevice = editingDevice ?? viewDevice;
  const viewKey = activeDevice === 'phone' ? 'phone' : 'wide';

  const { scope, effectivePrefs, setAdminTarget, toggleShareEnabled, forkToPersonal, revertToShared, saveScopedPrefs } = useLayoutScope();
  const defaultRoomView = effectivePrefs.roomDefaultViews?.[areaId] ?? null;
  const [view, setView] = useRoomView(viewKey, areaId, defaultRoomView);

  const { config, currentUser } = useUserConfig();
  const roomOverride = config.rooms?.areaOverrides?.[areaId];
  const roomItem = rooms.find((r) => r.areaId === areaId);
  const rawPhoto =
    roomOverride?.backgroundImageUrl !== undefined
      ? roomOverride.backgroundImageUrl
      : roomOverride?.picture !== undefined
      ? roomOverride.picture
      : roomItem?.picture ?? area?.picture ?? null;
  const photo = useHaPicture(rawPhoto || null);

  const extraEntityIds = roomOverride?.extraEntityIds ?? [];
  const extraEntities = useMemo(
    () =>
      extraEntityIds
        .map((id) => resolvedEntities[id])
        .filter((e): e is NonNullable<typeof e> => Boolean(e)),
    [extraEntityIds, resolvedEntities]
  );

  const entityCustomizations = config.entities?.customizations;

  const autoTileEntityIds = useMemo(() => {
    if (!area) return new Set<string>();
    const autoTiles = buildAreaTiles(area, { picture: (p) => resolveHAImageUrl(p, serverUrl) || null });
    return new Set(autoTiles.map((t) => t.entityId));
  }, [area, serverUrl]);

  const tiles = useMemo(
    () =>
      area
        ? buildAreaTiles(area, {
            picture: (p) => resolveHAImageUrl(p, serverUrl) || null,
            extraEntities,
            entityCustomizations
          })
        : [],
    [area, serverUrl, extraEntities, entityCustomizations]
  );

  const byKey = useMemo(() => new Map(tiles.map((t) => [t.key, t])), [tiles]);
  const itemsKey = tiles.map((t) => `${t.key}:${t.section}:${t.model.name}:${t.size.phone}${t.size.wide}:${t.focus ?? ''}`).join('|');
  const items = useMemo<PageItem[]>(() => tiles.map(({ key, section, size, focus }) => ({ key, section, size, focus })), [itemsKey]);

  const editor = useAreaLayout(areaId, items, activeDevice, foldAll);
  const setEditingPage = useProEditChrome((s) => s.setEditingPage);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(false);
  const [editTileKey, setEditTileKey] = useState<string | null>(null);
  const [sectionDialog, setSectionDialog] = useState<{ mode: 'create' } | { mode: 'rename'; id: SectionId } | null>(null);
  const [sectionNameInput, setSectionNameInput] = useState('');
  const [ruleTarget, setRuleTarget] = useState<{ scope: 'section' | 'card'; id: string; label: string } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ key: string; name: string; action: TileAction } | null>(null);

  const carPictures = useMemo(() => readCarPictures(config.preferences), [config.preferences]);

  useEffect(() => {
    setEditingPage(editor.editing ? 'room' : null);
  }, [editor.editing, setEditingPage]);

  useEffect(() => () => setEditingPage(null), [setEditingPage]);

  useEffect(() => {
    if (!editor.editing && editingDevice !== null) {
      setEditingDevice(null);
    }
  }, [editor.editing, editingDevice]);

  const [patches, setPatches] = useState<Patches>({});
  useEffect(() => setPatches({}), [areaId]);

  const model = useCallback(
    (key: string): TileModel => {
      const t = byKey.get(key);
      if (!t) return MISSING;
      const m = { ...t.model, ...patches[key] } as TileModel;
      if (m.kind !== 'car') return m;
      const car = applyCarPicture(m, carPictures[carDeviceId(m.entityId)], (url) => resolveAssetUrl(url) ?? null);
      return t.focus ? { ...car, focus: t.focus } : car;
    },
    [byKey, patches, carPictures]
  );

  const name = useCallback((key: string) => (byKey.get(key) ? areaTileName(byKey.get(key)!) : key), [byKey]);

  const onLocal = useCallback(
    (key: string, patch: Partial<TileModel>) =>
      setPatches((all) => {
        const next: Patches = { ...all, [key]: { ...all[key], ...patch } as Partial<TileModel> };
        if (byKey.get(key)?.model.kind === 'scene' && patch.isOn) {
          for (const t of tiles) if (t.key !== key && t.model.kind === 'scene') next[t.key] = { ...next[t.key], isOn: false } as Partial<TileModel>;
        }
        return next;
      }),
    [byKey, tiles]
  );

  const areaIdOf = useMemo(() => {
    const ids = new Map(areaNames.split('\u0001').map((pair) => pair.split('\u0000')).map(([id, n]) => [(n ?? '').toLowerCase(), id]));
    return (room: string) => ids.get(room.toLowerCase()) ?? null;
  }, [areaNames]);

  const send = useTileActions(onLocal, { areaIdOf });

  const actOn = useCallback(
    (key: string, a: TileAction) => {
      const t = byKey.get(key);
      if (!t) return;
      const needsConfirm = Boolean(entityCustomizations?.[t.entityId]?.confirmAction) && GUARDED_ACTIONS.has(a.type);
      if (needsConfirm) {
        setPendingConfirm({ key, name: areaTileName(t), action: a });
        return;
      }
      send({ key, model: model(key), targets: t.targets }, a);
    },
    [byKey, entityCustomizations, model, send]
  );

  const renderTile = useCallback((key: string, size: TileSize) => <ChosenTile e={model(key)} size={size} act={(a) => actOn(key, a)} />, [model, actOn]);

  const copyPatternTo = useCallback(
    async (targetAreaId: string) => {
      const targetArea = resolvedAreas.find((a) => a.area_id === targetAreaId);
      if (!targetArea) return;
      const targetTiles = buildAreaTiles(targetArea, {
        picture: (p) => resolveHAImageUrl(p, serverUrl) || null,
        entityCustomizations
      });
      const nextLayout = copyLayoutPatternToRoom(
        editor.layout,
        targetTiles.map(({ key, section, size, focus }) => ({ key, section, size, focus })),
        activeDevice
      );
      await saveScopedPrefs(
        {
          roomModes: { [targetAreaId]: 'custom' },
          proAreaLayouts: { version: 1, [targetAreaId]: { [activeDevice]: nextLayout } }
        },
        true
      );
    },
    [resolvedAreas, serverUrl, entityCustomizations, editor.layout, activeDevice, saveScopedPrefs]
  );

  if (!area) {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" onPress={onBack} className="gap-1.5">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            All rooms
          </Button>
        </div>
        <div className="pro-surface rounded-[22px] px-6 py-12 text-center text-sm text-muted">This room is no longer in Home Assistant.</div>
      </div>
    );
  }

  const haBase = serverUrl ? resolveHAImageUrl('/', serverUrl).replace(/\/$/, '') : '';
  const room: PageRoom = {
    id: areaId,
    name: roomOverride?.customName || roomOverride?.name || roomItem?.name || area.name,
    photo: photo ? `url(${JSON.stringify(photo)})` : null,
    items,
    haUrl: haBase ? `${haBase}/config/areas/area/${encodeURIComponent(areaId)}` : null
  };

  const otherRooms = rooms.filter((r) => r.areaId !== areaId);
  const editTileEntityId = editTileKey ? byKey.get(editTileKey)?.entityId ?? null : null;

  const submitSectionDialog = () => {
    const clean = sectionNameInput.trim();
    if (!clean || !sectionDialog) return;
    if (sectionDialog.mode === 'create') {
      editor.update((l) => createRoomSection(l, clean).layout);
    } else {
      editor.update((l) => renameRoomSection(l, sectionDialog.id, clean));
    }
    setSectionDialog(null);
    setSectionNameInput('');
  };

  return (
    <div className={cn('mx-auto w-full', editor.editing && 'pb-24')} style={{ maxWidth: editor.editing ? DEVICE_MAX_WIDTH[activeDevice] : undefined }}>
      <PageRail
        views
        inset={false}
        editor={editor}
        hideEditBar={editor.editing}
        view={view}
        onView={setView}
        room={room}
        rooms={rooms.map((r) => ({ id: r.areaId, name: r.name }))}
        onRoom={onOpenRoom}
        onBack={onBack}
        model={model}
        name={name}
        onEditTile={(k) => {
          const t = byKey.get(k);
          if (t && !t.focus) setEditTileKey(k);
        }}
        onOpenEntities={() => setEntitiesOpen(true)}
        onAddSection={() => {
          setSectionNameInput('');
          setSectionDialog({ mode: 'create' });
        }}
        onRenameSection={(id) => {
          setSectionNameInput(roomSectionTitle(editor.layout, id));
          setSectionDialog({ mode: 'rename', id });
        }}
        onEditSectionVisibility={(id) =>
          setRuleTarget({ scope: 'section', id, label: `${roomSectionTitle(editor.layout, id)} section` })
        }
        onEditTileVisibility={(k) => setRuleTarget({ scope: 'card', id: k, label: name(k) })}
        visibilityCtx={{
          entities: resolvedEntities,
          device: activeDevice,
          user: currentUser ? { id: currentUser.id, isAdmin: currentUser.isAdmin } : null
        }}
        editExtras={<CarPictures cars={tiles.filter((t) => t.model.kind === 'car' && !t.focus)} chosen={carPictures} />}
        renderTile={renderTile}
        actOn={actOn}
        device={activeDevice}
      />

      {editor.editing ? (
        <ProEditBar
          pageLabel={room.name}
          editingDevice={activeDevice}
          detectedDevice={detected}
          pinnedDevice={pinned}
          scope={scope}
          mode={editor.mode}
          isDirty={editor.dirty}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onCancel={editor.cancel}
          onSave={editor.save}
          onReset={editor.reset}
          onSelectEditingDevice={(next) => setEditingDevice(next)}
          onSetPinnedDevice={setPinned}
          onCopyFrom={(src) => editor.copyFromDevice(src)}
          onAdminTargetChange={(target) => {
            editor.cancel();
            setAdminTarget(target);
          }}
          onToggleShare={(enabled) => void toggleShareEnabled(enabled)}
          onForkToPersonal={() => {
            editor.cancel();
            void forkToPersonal();
          }}
          onRevertToShared={() => {
            editor.cancel();
            void revertToShared();
          }}
          onResetToAuto={() => void editor.resetToAuto()}
          primaryAction={{
            label: 'Room',
            icon: Settings01Icon,
            onPress: () => setSettingsOpen(true)
          }}
          extraActions={
            otherRooms.length > 0 ? (
              <Dropdown>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                  <HugeiconsIcon icon={Copy01Icon} size={13} />
                  Copy layout to…
                </Button>
                <Dropdown.Popover placement="top start" className="max-h-[50dvh] min-w-48 overflow-y-auto">
                  <Dropdown.Menu aria-label="Copy room layout pattern to another room" onAction={(key) => void copyPatternTo(String(key))}>
                    {otherRooms.map((r) => (
                      <Dropdown.Item key={r.areaId} id={r.areaId} textValue={r.name}>
                        <Label>{r.name}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : undefined
          }
        />
      ) : null}

      <RoomSettingsSheet areaId={areaId} isOpen={settingsOpen} onOpenChange={setSettingsOpen} />
      <RoomEntitiesSheet
        areaId={areaId}
        areaName={room.name}
        isOpen={entitiesOpen}
        onOpenChange={setEntitiesOpen}
        autoTileEntityIds={autoTileEntityIds}
      />
      <TileEditSheet
        entityId={editTileEntityId}
        isOpen={Boolean(editTileEntityId)}
        onOpenChange={(open) => {
          if (!open) setEditTileKey(null);
        }}
      />
      <VisibilityEditorSheet
        isOpen={Boolean(ruleTarget)}
        onOpenChange={(openSheet) => !openSheet && setRuleTarget(null)}
        page="rooms"
        targetLabel={ruleTarget?.label ?? ''}
        rules={
          ruleTarget?.scope === 'section'
            ? editor.layout.sectionRules?.[ruleTarget.id] ?? []
            : ruleTarget?.scope === 'card'
            ? editor.layout.cardRules?.[ruleTarget.id] ?? []
            : []
        }
        onSave={(nextRules) => {
          if (!ruleTarget) return;
          if (ruleTarget.scope === 'section') {
            editor.update((l) => ({ ...l, sectionRules: withUpdatedRule(l.sectionRules, ruleTarget.id, nextRules) }));
          } else {
            editor.update((l) => ({ ...l, cardRules: withUpdatedRule(l.cardRules, ruleTarget.id, nextRules) }));
          }
        }}
      />

      {/* Section create / rename modal */}
      <Modal.Backdrop isOpen={Boolean(sectionDialog)} onOpenChange={(open) => !open && setSectionDialog(null)}>
        <Modal.Container size="sm">
          <Modal.Dialog aria-label={sectionDialog?.mode === 'rename' ? 'Rename section' : 'New section'} className="pro" data-page="rooms">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{sectionDialog?.mode === 'rename' ? 'Rename section' : 'New section'}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3 pb-4">
              <TextField aria-label="Section title" value={sectionNameInput} onChange={setSectionNameInput} autoFocus>
                <InputGroup fullWidth variant="secondary">
                  <InputGroup.Input
                    placeholder="e.g. Desk, Bedside, Entertainment…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitSectionDialog();
                    }}
                  />
                </InputGroup>
              </TextField>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={() => setSectionDialog(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" isDisabled={!sectionNameInput.trim()} onPress={submitSectionDialog}>
                  {sectionDialog?.mode === 'rename' ? 'Save name' : 'Create'}
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Tap safety guard confirmation modal */}
      <Modal.Backdrop isOpen={Boolean(pendingConfirm)} onOpenChange={(open) => !open && setPendingConfirm(null)}>
        <Modal.Container size="sm">
          <Modal.Dialog aria-label="Confirm action" className="pro" data-page="rooms">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Confirm action</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 pb-4">
              <p className="text-sm text-muted">
                Proceed with action on <span className="font-semibold text-foreground">{pendingConfirm?.name}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={() => setPendingConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => {
                    if (!pendingConfirm) return;
                    const t = byKey.get(pendingConfirm.key);
                    if (t) send({ key: pendingConfirm.key, model: model(pendingConfirm.key), targets: t.targets }, pendingConfirm.action);
                    setPendingConfirm(null);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

/** While customizing: each car's picture (saved at once; it is the car's, not this layout's). */
function CarPictures({ cars, chosen }: { cars: AreaTile[]; chosen: Record<string, string> }) {
  const { updateConfig, uploadVehicleAsset } = useUserConfig();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  if (!cars.length) return null;
  const save = (deviceId: string, choice: string | null) =>
    updateConfig((prev: UserDashboardConfig) => ({ ...prev, preferences: withCarPicture(prev.preferences as Record<string, unknown> | undefined, deviceId, choice) as UserDashboardConfig['preferences'] }));
  return (
    <section aria-label="Car pictures" className="flex flex-col gap-3 rounded-2xl bg-[color-mix(in_srgb,currentColor_4%,transparent)] p-3">
      {cars.map((t) => {
        const id = carDeviceId(t.entityId);
        const c = chosen[id];
        const upload = async (file: File) => {
          setBusy(id);
          setError((e) => ({ ...e, [id]: '' }));
          try {
            const url = await uploadVehicleAsset(file, `car_${id}`.slice(0, 30));
            await save(id, url);
          } catch {
            setError((e) => ({ ...e, [id]: 'Could not upload the picture. PNG, JPEG or WebP up to 5 MB; uploading needs an admin.' }));
          } finally {
            setBusy(null);
          }
        };
        return (
          <CarPictureControl
            key={t.key}
            label={`${t.model.name} picture`}
            source={c === NO_PICTURE ? 'none' : c ? 'upload' : 'entity'}
            onSource={(s) => void save(id, s === 'none' ? NO_PICTURE : null)}
            onUpload={(f) => void upload(f)}
            busy={busy === id}
            error={error[id]}
          />
        );
      })}
    </section>
  );
}

const MISSING = { kind: 'switch', entityId: '', name: '', available: false, isOn: false } as unknown as TileModel;
