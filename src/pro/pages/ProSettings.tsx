/**
 * Pro Settings & Setup page (Phase 3.2):
 *  - Multi-user layout sharing & Shared/Personal scope control
 *  - Per-browser Screen Override (for wall tablets & kiosks)
 *  - Cross-device layout copy matrix (Phone / Tablet / Desktop)
 *  - Auto vs. Custom mode indicators & bulk reset back to Auto
 *  - NAS rolling snapshot rollback & JSON export/import
 */
import { useMemo, useState } from 'react';
import { Button, Modal, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, RotateLeft01Icon, Settings01Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import type { UserDashboardConfig } from '@/types/userConfig';
import { DEVICE_ICON, DEVICE_LABEL, LayoutScopeBar } from '../components/LayoutScopeControls';
import { useDeviceType } from '../hooks/useDeviceType';
import { useLayoutScope } from '../hooks/useLayoutScope';
import {
  copyDeviceLayout,
  DEVICE_TYPES,
  deviceLayoutPatch,
  getDeviceLayout,
  type DeviceType
} from '../lib/overviewLayout';
import { WIDGET_LAYOUT_INFO, LEGACY_WIDGET_IDS } from '../widgets/registry';
import { rawRoomsPrefs, readRoomsPrefs, roomsPrefsPatch } from './rooms/shared';
import { ConfigBackupsCard } from './settings/ConfigBackupsCard';

type CopyScope = 'overview' | 'rooms' | 'both';
type ResetTarget = 'overview' | 'rooms' | 'all_rooms';

export default function ProSettings() {
  const { config, driverName } = useUserConfig();
  const {
    scope,
    effectivePrefs,
    setAdminTarget,
    toggleShareEnabled,
    forkToPersonal,
    revertToShared,
    saveScopedPrefs
  } = useLayoutScope();
  const { device, detected, pinned, setPinned } = useDeviceType();

  const [copyFrom, setCopyFrom] = useState<DeviceType>('desktop');
  const [copyTo, setCopyTo] = useState<DeviceType>('phone');
  const [copyScope, setCopyScope] = useState<CopyScope>('both');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [busyCopy, setBusyCopy] = useState(false);

  const [pendingReset, setPendingReset] = useState<ResetTarget | null>(null);
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [busyReset, setBusyReset] = useState(false);

  const overviewMode = useMemo(() => {
    if (effectivePrefs.overviewMode === 'auto' || effectivePrefs.overviewMode === 'custom') {
      return effectivePrefs.overviewMode;
    }
    const stored = (effectivePrefs as Record<string, unknown>).proOverviewLayout;
    return stored && typeof stored === 'object' ? 'custom' : 'auto';
  }, [effectivePrefs]);

  const roomsMode = useMemo(() => {
    if (effectivePrefs.roomsMode === 'auto' || effectivePrefs.roomsMode === 'custom') {
      return effectivePrefs.roomsMode;
    }
    return Object.keys(rawRoomsPrefs(effectivePrefs)).length > 0 ? 'custom' : 'auto';
  }, [effectivePrefs]);

  const customRoomsCount = useMemo(() => {
    const modes = effectivePrefs.roomModes ?? {};
    const storedAreas = (effectivePrefs as Record<string, unknown>).proAreaLayouts;
    const ids = new Set<string>([
      ...Object.keys(modes),
      ...(storedAreas && typeof storedAreas === 'object' ? Object.keys(storedAreas).filter((k) => k !== 'version') : [])
    ]);
    let count = 0;
    for (const id of ids) {
      if (modes[id] === 'auto') continue;
      if (modes[id] === 'custom') {
        count++;
        continue;
      }
      if (storedAreas && typeof storedAreas === 'object' && (storedAreas as Record<string, unknown>)[id]) {
        count++;
      }
    }
    return count;
  }, [effectivePrefs]);

  const handleCopyLayouts = async () => {
    if (copyFrom === copyTo) return;
    setBusyCopy(true);
    setCopyStatus(null);
    try {
      const patch: Record<string, unknown> = {};
      if (copyScope === 'overview' || copyScope === 'both') {
        const scopedConfig = {
          ...config,
          preferences: effectivePrefs as UserDashboardConfig['preferences']
        };
        const sourceLayout = getDeviceLayout(scopedConfig, WIDGET_LAYOUT_INFO, copyFrom, LEGACY_WIDGET_IDS);
        const adapted = copyDeviceLayout(sourceLayout, WIDGET_LAYOUT_INFO, copyTo);
        patch.overviewMode = 'custom';
        patch.proOverviewLayout = deviceLayoutPatch(copyTo, adapted).preferences?.proOverviewLayout;
      }
      if (copyScope === 'rooms' || copyScope === 'both') {
        const srcRooms = readRoomsPrefs(effectivePrefs, copyFrom);
        patch.roomsMode = 'custom';
        patch.proRooms = roomsPrefsPatch(copyTo, srcRooms);
      }
      await saveScopedPrefs(patch, true);
      setCopyStatus(`Copied ${copyScope === 'both' ? 'Overview & Rooms' : copyScope} layout from ${DEVICE_LABEL[copyFrom]} to ${DEVICE_LABEL[copyTo]}.`);
    } finally {
      setBusyCopy(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!pendingReset) return;
    setBusyReset(true);
    setResetStatus(null);
    try {
      if (pendingReset === 'overview') {
        await saveScopedPrefs(
          {
            overviewMode: 'auto',
            proOverviewLayout: { phone: null, tablet: null, desktop: null }
          },
          true
        );
        setResetStatus('Overview reset to Auto for all device layouts in this scope.');
      } else if (pendingReset === 'rooms') {
        const existingKeys = Object.keys(rawRoomsPrefs(effectivePrefs));
        const nullMap = Object.fromEntries(existingKeys.map((k) => [k, null]));
        await saveScopedPrefs(
          {
            roomsMode: 'auto',
            ...(Object.keys(nullMap).length > 0 ? { proRooms: nullMap } : {}),
            areaOrder: [],
            floorOrder: [],
            hiddenAreas: [],
            hiddenFloors: []
          },
          true
        );
        setResetStatus('Rooms page reset to Auto defaults.');
      } else {
        const modeKeys = Object.keys(effectivePrefs.roomModes ?? {});
        const storedAreas = (effectivePrefs as Record<string, unknown>).proAreaLayouts;
        const areaKeys =
          storedAreas && typeof storedAreas === 'object'
            ? Object.keys(storedAreas).filter((k) => k !== 'version')
            : [];
        const allIds = new Set([...modeKeys, ...areaKeys]);
        const nextModes = Object.fromEntries([...allIds].map((id) => [id, 'auto']));
        const nullAreas = Object.fromEntries(areaKeys.map((id) => [id, null]));
        await saveScopedPrefs(
          {
            ...(Object.keys(nextModes).length > 0 ? { roomModes: nextModes } : {}),
            ...(Object.keys(nullAreas).length > 0 ? { proAreaLayouts: nullAreas } : {})
          },
          true
        );
        setResetStatus('All individual rooms reset to Auto defaults.');
      }
      setPendingReset(null);
    } finally {
      setBusyReset(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Settings &amp; Setup</h1>
          <p className="text-sm text-muted">Manage layout sharing, per-device customization, Auto defaults, and backups.</p>
        </div>
        <span className="rounded-full bg-default/60 px-3 py-1 text-xs font-medium text-muted">
          Storage: {driverName}
        </span>
      </header>

      {/* Section 1: Layouts & Multi-User Sharing */}
      <section aria-label="Layouts and multi-user sharing" className="pro-surface flex flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="pro-soft grid size-9 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={Shield01Icon} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-tight">Layouts &amp; Multi-User Sharing</h2>
            <p className="mt-0.5 text-xs text-muted">
              {scope.isAdmin
                ? scope.shareEnabled
                  ? 'Sharing is enabled: non-admin users follow the Shared layout unless they fork their own personal copy.'
                  : 'Sharing is disabled: each user manages their own independent layout starting in Auto mode.'
                : scope.activeTarget === 'personal'
                ? 'You are using your own personal layout. You can revert to the admin Shared layout anytime.'
                : scope.shareEnabled
                ? 'You are following the Shared home layout. Click "Customize my own" to fork your own layout.'
                : 'Layout sharing is disabled by your admin. Changes you make are saved to your personal layout.'}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-default/35 px-3.5 py-2.5">
          <LayoutScopeBar
            scope={scope}
            onAdminTargetChange={setAdminTarget}
            onToggleShare={(enabled) => void toggleShareEnabled(enabled)}
            onForkToPersonal={() => void forkToPersonal()}
            onRevertToShared={() => void revertToShared()}
          />
        </div>
      </section>

      {/* Section 2: Screen Override (Wall Tablets & Kiosks) */}
      <section aria-label="Screen layout override" className="pro-surface flex flex-col gap-3 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="pro-soft grid size-9 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={Settings01Icon} size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold leading-tight">This Screen Override</h2>
            <p className="mt-0.5 text-xs text-muted">
              Lock this specific browser or wall tablet to a device layout class (currently <span className="font-medium text-foreground">{DEVICE_LABEL[device]}</span>, detected {DEVICE_LABEL[detected]}).
            </p>
          </div>
        </div>
        <ToggleButtonGroup
          aria-label="Pin this screen to device layout"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([pinned ?? 'auto'])}
          onSelectionChange={(keys) => {
            const k = String([...keys][0] ?? 'auto');
            setPinned(k === 'auto' ? null : (k as DeviceType));
          }}
        >
          <ToggleButton id="auto" className="text-xs">
            Auto ({DEVICE_LABEL[detected]})
          </ToggleButton>
          {DEVICE_TYPES.map((d) => (
            <ToggleButton key={d} id={d} className="gap-1.5 text-xs">
              <HugeiconsIcon icon={DEVICE_ICON[d]} size={14} />
              {DEVICE_LABEL[d]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </section>

      {/* Section 3: Copy Layouts Between Devices */}
      <section aria-label="Copy layouts between devices" className="pro-surface flex flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="pro-soft grid size-9 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={Copy01Icon} size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold leading-tight">Copy Layouts Between Devices</h2>
            <p className="mt-0.5 text-xs text-muted">
              Reuse a carefully arranged layout across Phone, Tablet, and Desktop instead of starting from scratch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Source device</span>
            <ToggleButtonGroup
              aria-label="Source device layout"
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([copyFrom])}
              onSelectionChange={(keys) => {
                const next = [...keys][0] as DeviceType | undefined;
                if (next) setCopyFrom(next);
              }}
            >
              {DEVICE_TYPES.map((d) => (
                <ToggleButton key={d} id={d} className="gap-1 text-xs">
                  <HugeiconsIcon icon={DEVICE_ICON[d]} size={14} />
                  {DEVICE_LABEL[d]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Target device</span>
            <ToggleButtonGroup
              aria-label="Target device layout"
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([copyTo])}
              onSelectionChange={(keys) => {
                const next = [...keys][0] as DeviceType | undefined;
                if (next) setCopyTo(next);
              }}
            >
              {DEVICE_TYPES.map((d) => (
                <ToggleButton key={d} id={d} className="gap-1 text-xs">
                  <HugeiconsIcon icon={DEVICE_ICON[d]} size={14} />
                  {DEVICE_LABEL[d]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Pages to copy</span>
            <ToggleButtonGroup
              aria-label="Pages to copy"
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([copyScope])}
              onSelectionChange={(keys) => {
                const next = [...keys][0] as CopyScope | undefined;
                if (next) setCopyScope(next);
              }}
            >
              <ToggleButton id="both" className="text-xs">Both</ToggleButton>
              <ToggleButton id="overview" className="text-xs">Overview</ToggleButton>
              <ToggleButton id="rooms" className="text-xs">Rooms</ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            isDisabled={copyFrom === copyTo || busyCopy}
            onPress={() => void handleCopyLayouts()}
            className="gap-1.5 text-xs"
          >
            <HugeiconsIcon icon={Copy01Icon} size={14} />
            {busyCopy ? 'Copying…' : `Copy ${DEVICE_LABEL[copyFrom]} → ${DEVICE_LABEL[copyTo]}`}
          </Button>
          {copyFrom === copyTo ? <span className="text-xs text-muted">Select two different devices.</span> : null}
          {copyStatus ? <span className="text-xs text-[var(--accent)]">{copyStatus}</span> : null}
        </div>
      </section>

      {/* Section 4: Auto / Custom Bulk Reset */}
      <section aria-label="Auto mode and bulk resets" className="pro-surface flex flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="pro-soft grid size-9 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={RotateLeft01Icon} size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold leading-tight">Auto Mode &amp; Bulk Reset</h2>
            <p className="mt-0.5 text-xs text-muted">
              Return customized pages to dynamic Auto defaults (new Home Assistant entities and areas populate automatically).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-default/40 px-3.5 py-2.5 text-xs">
            <div>
              <p className="font-semibold">Overview</p>
              <p className="text-muted">Mode: {overviewMode === 'auto' ? 'Auto' : 'Custom'}</p>
            </div>
            <Button size="sm" variant="secondary" isDisabled={overviewMode === 'auto'} onPress={() => setPendingReset('overview')} className="h-7 text-xs">
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl bg-default/40 px-3.5 py-2.5 text-xs">
            <div>
              <p className="font-semibold">Rooms Explorer</p>
              <p className="text-muted">Mode: {roomsMode === 'auto' ? 'Auto' : 'Custom'}</p>
            </div>
            <Button size="sm" variant="secondary" isDisabled={roomsMode === 'auto'} onPress={() => setPendingReset('rooms')} className="h-7 text-xs">
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl bg-default/40 px-3.5 py-2.5 text-xs">
            <div>
              <p className="font-semibold">Individual Rooms</p>
              <p className="text-muted">{customRoomsCount === 0 ? 'All Auto' : `${customRoomsCount} custom`}</p>
            </div>
            <Button size="sm" variant="secondary" isDisabled={customRoomsCount === 0} onPress={() => setPendingReset('all_rooms')} className="h-7 text-xs">
              Reset all
            </Button>
          </div>
        </div>

        {resetStatus ? <p className="text-xs text-[var(--accent)]">{resetStatus}</p> : null}
      </section>

      {/* Section 5: Backups & NAS Snapshot Rollback */}
      <ConfigBackupsCard />

      <Modal.Backdrop isOpen={Boolean(pendingReset)} onOpenChange={(open) => !open && !busyReset && setPendingReset(null)}>
        <Modal.Container size="sm">
          <Modal.Dialog aria-label="Confirm Auto reset" className="pro" data-page="settings">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Reset to Auto?</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 pb-4">
              <p className="text-sm text-muted">
                {pendingReset === 'overview'
                  ? 'Reset Overview back to Auto defaults across Phone, Tablet, and Desktop in the current scope?'
                  : pendingReset === 'rooms'
                  ? 'Reset Rooms order, hidden rooms/floors, and per-device tile sizes back to Auto?'
                  : 'Reset all customized individual Room pages back to Auto defaults?'}
              </p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" isDisabled={busyReset} onPress={() => setPendingReset(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" isDisabled={busyReset} onPress={() => void handleConfirmReset()}>
                  {busyReset ? 'Resetting…' : 'Reset to Auto'}
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
