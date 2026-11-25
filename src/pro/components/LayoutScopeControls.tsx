/**
 * Shared Edit Mode controls for:
 *  - Non-destructive Device Switcher (Phone / Tablet / Desktop) + optional "Pin this screen"
 *  - Copy layout from another device class
 *  - Auto vs. Custom mode indicator & 1-tap Reset to Auto
 *  - Admin "Share layout with all users" checkbox + Shared/Personal target switcher
 *  - Non-admin "Customize my own" fork / "Revert to shared"
 */
import { Button, Dropdown, Label, Switch, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ComputerIcon, Copy01Icon, RotateLeft01Icon, SmartPhone01Icon, Tablet01Icon } from '@hugeicons/core-free-icons';
import { DEVICE_TYPES, type DeviceType } from '../lib/overviewLayout';
import type { LayoutEditTarget, LayoutScopeState } from '@/services/layoutScope';
import type { LayoutMode } from '@/types/userConfig';

export const DEVICE_ICON = { phone: SmartPhone01Icon, tablet: Tablet01Icon, desktop: ComputerIcon } as const;
export const DEVICE_LABEL: Record<DeviceType, string> = { phone: 'Phone', tablet: 'Tablet', desktop: 'Desktop' };

interface DeviceSwitcherProps {
  editingDevice: DeviceType;
  detectedDevice: DeviceType;
  pinnedDevice: DeviceType | null;
  onSelectEditingDevice: (device: DeviceType) => void;
  onSetPinnedDevice?: (device: DeviceType | null) => void;
  onCopyFrom?: (sourceDevice: DeviceType) => void;
}

export function DeviceSwitcherBar({
  editingDevice,
  detectedDevice,
  pinnedDevice,
  onSelectEditingDevice,
  onSetPinnedDevice,
  onCopyFrom
}: DeviceSwitcherProps) {
  const otherDevices = DEVICE_TYPES.filter((d) => d !== editingDevice);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleButtonGroup
        aria-label="Device layout to edit"
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={new Set([editingDevice])}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as DeviceType | undefined;
          if (next) onSelectEditingDevice(next);
        }}
      >
        {DEVICE_TYPES.map((d) => (
          <ToggleButton key={d} id={d} aria-label={`Edit ${DEVICE_LABEL[d]} layout`}>
            <HugeiconsIcon icon={DEVICE_ICON[d]} size={15} />
            <span className="max-sm:hidden">{DEVICE_LABEL[d]}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {onCopyFrom ? (
        <Dropdown>
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
            <HugeiconsIcon icon={Copy01Icon} size={14} />
            Copy from…
          </Button>
          <Dropdown.Popover placement="bottom start">
            <Dropdown.Menu
              aria-label="Copy layout from another device"
              onAction={(key) => onCopyFrom(String(key) as DeviceType)}
            >
              {otherDevices.map((d) => (
                <Dropdown.Item key={d} id={d} textValue={`Copy from ${DEVICE_LABEL[d]}`}>
                  <HugeiconsIcon icon={DEVICE_ICON[d]} size={15} className="shrink-0" />
                  <Label>Copy from {DEVICE_LABEL[d]}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      ) : null}

      {onSetPinnedDevice ? (
        <Dropdown>
          <Button size="sm" variant="ghost" className="text-xs text-muted">
            Screen: {pinnedDevice ? `Pinned (${DEVICE_LABEL[pinnedDevice]})` : `Auto (${DEVICE_LABEL[detectedDevice]})`}
          </Button>
          <Dropdown.Popover placement="bottom start">
            <Dropdown.Menu
              aria-label="Pin this screen to a device layout"
              onAction={(key) => {
                const k = String(key);
                onSetPinnedDevice(k === 'auto' ? null : (k as DeviceType));
              }}
            >
              <Dropdown.Item id="auto" textValue={`Automatic (${DEVICE_LABEL[detectedDevice]})`}>
                <Label>Automatic ({DEVICE_LABEL[detectedDevice]})</Label>
              </Dropdown.Item>
              {DEVICE_TYPES.map((d) => (
                <Dropdown.Item key={d} id={d} textValue={`Pin to ${DEVICE_LABEL[d]}`}>
                  <HugeiconsIcon icon={DEVICE_ICON[d]} size={15} className="shrink-0" />
                  <Label>Pin to {DEVICE_LABEL[d]}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      ) : null}
    </div>
  );
}

interface LayoutScopeBarProps {
  scope: LayoutScopeState;
  mode?: LayoutMode;
  onAdminTargetChange: (target: LayoutEditTarget) => void;
  onToggleShare: (enabled: boolean) => void;
  onForkToPersonal: () => void;
  onRevertToShared: () => void;
  onResetToAuto?: () => void;
}

export function LayoutScopeBar({
  scope,
  mode,
  onAdminTargetChange,
  onToggleShare,
  onForkToPersonal,
  onRevertToShared,
  onResetToAuto
}: LayoutScopeBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
      {mode ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-default/60 px-2.5 py-1 font-medium">
          <span>Mode: {mode === 'auto' ? 'Auto' : 'Custom'}</span>
          {mode === 'custom' && onResetToAuto ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={onResetToAuto}
              className="h-auto min-w-0 gap-1 px-1 py-0 text-xs text-[var(--accent)] hover:underline"
            >
              <HugeiconsIcon icon={RotateLeft01Icon} size={12} />
              <span>Use Auto</span>
            </Button>
          ) : null}
        </span>
      ) : null}

      {scope.isAdmin ? (
        <>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Switch
              size="sm"
              isSelected={scope.shareEnabled}
              onChange={() => onToggleShare(!scope.shareEnabled)}
              aria-label="Share layout with all users"
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
            <span className="font-medium">Share layout with all users</span>
          </label>

          {scope.shareEnabled && scope.userId ? (
            <ToggleButtonGroup
              aria-label="Layout target"
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([scope.activeTarget])}
              onSelectionChange={(keys) => {
                const next = [...keys][0] as LayoutEditTarget | undefined;
                if (next) onAdminTargetChange(next);
              }}
            >
              <ToggleButton id="shared">Shared</ToggleButton>
              <ToggleButton id="personal">My layout</ToggleButton>
            </ToggleButtonGroup>
          ) : null}
        </>
      ) : scope.userId ? (
        scope.shareEnabled ? (
          scope.usingPersonalFork ? (
            <span className="inline-flex items-center gap-2">
              <span className="rounded-full bg-default/60 px-2.5 py-1 font-medium">My layout</span>
              <Button size="sm" variant="ghost" onPress={onRevertToShared} className="h-7 text-xs">
                Revert to shared
              </Button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="rounded-full bg-default/60 px-2.5 py-1 font-medium">Shared layout</span>
              <Button size="sm" variant="tertiary" onPress={onForkToPersonal} className="h-7 text-xs">
                Customize my own
              </Button>
            </span>
          )
        ) : (
          <span className="rounded-full bg-default/60 px-2.5 py-1 font-medium">My personal layout</span>
        )
      ) : null}
    </div>
  );
}
