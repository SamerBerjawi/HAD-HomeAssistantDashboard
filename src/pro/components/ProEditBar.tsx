/**
 * Unified sticky bottom floating Edit Bar across Pro Overview, Rooms, and Individual Room pages.
 * Keeps Save / Cancel / Undo / Redo / Primary Action + expandable Device/Scope controls inside
 * the phone thumb zone while `ProMobileNav` yields the bottom edge during editing.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowTurnBackwardIcon, ArrowTurnForwardIcon, ArrowUp01Icon, RotateLeft01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { LayoutEditTarget, LayoutScopeState } from '@/services/layoutScope';
import type { LayoutMode } from '@/types/userConfig';
import type { DeviceType } from '../lib/overviewLayout';
import { DEVICE_ICON, DEVICE_LABEL, DeviceSwitcherBar, LayoutScopeBar } from './LayoutScopeControls';

export interface ProEditBarPrimaryAction {
  label: string;
  icon: IconSvgElement;
  badge?: string | number;
  onPress: () => void;
}

export interface ProEditBarProps {
  pageLabel: string;
  editingDevice: DeviceType;
  detectedDevice: DeviceType;
  pinnedDevice: DeviceType | null;
  scope: LayoutScopeState;
  mode: LayoutMode;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onSave: () => void;
  onReset?: () => void;
  onSelectEditingDevice: (device: DeviceType) => void;
  onSetPinnedDevice?: (device: DeviceType | null) => void;
  onCopyFrom?: (sourceDevice: DeviceType) => void;
  onAdminTargetChange: (target: LayoutEditTarget) => void;
  onToggleShare: (enabled: boolean) => void;
  onForkToPersonal: () => void;
  onRevertToShared: () => void;
  onResetToAuto?: () => void;
  primaryAction?: ProEditBarPrimaryAction;
  extraActions?: ReactNode;
  statusNote?: string;
}

export function ProEditBar({
  pageLabel,
  editingDevice,
  detectedDevice,
  pinnedDevice,
  scope,
  mode,
  isDirty,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCancel,
  onSave,
  onReset,
  onSelectEditingDevice,
  onSetPinnedDevice,
  onCopyFrom,
  onAdminTargetChange,
  onToggleShare,
  onForkToPersonal,
  onRevertToShared,
  onResetToAuto,
  primaryAction,
  extraActions,
  statusNote
}: ProEditBarProps) {
  const [trayOpen, setTrayOpen] = useState(false);

  // Desktop keyboard shortcuts: Cmd/Ctrl+Z (Undo) and Cmd/Ctrl+Shift+Z / Ctrl+Y (Redo).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        if (canUndo) {
          e.preventDefault();
          onUndo();
        }
      } else if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) {
        if (canRedo) {
          e.preventDefault();
          onRedo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  const scopeBadge = scope.shareEnabled
    ? scope.activeTarget === 'shared'
      ? 'Shared'
      : 'My layout'
    : 'Personal';

  return (
    <div
      role="region"
      aria-label={`Customize ${pageLabel}`}
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 mx-auto max-w-4xl"
    >
      <div className="pro-surface flex flex-col gap-2.5 rounded-[24px] p-2.5 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.4)] ring-1 ring-black/10 backdrop-blur-xl dark:ring-white/15">
        {trayOpen ? (
          <div className="flex flex-col gap-2.5 border-b border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] px-1 pb-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-semibold">Customize {pageLabel}</span>
                <span className="text-[11px] text-muted">
                  {statusNote || `Editing ${DEVICE_LABEL[editingDevice]} layout${pinnedDevice ? ` · Screen pinned (${DEVICE_LABEL[pinnedDevice]})` : ''}. Nothing is saved until Save.`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {extraActions}
                {onReset ? (
                  <Button size="sm" variant="ghost" onPress={onReset} className="h-7 gap-1 text-xs">
                    <HugeiconsIcon icon={RotateLeft01Icon} size={13} />
                    Reset
                  </Button>
                ) : null}
              </div>
            </div>

            <DeviceSwitcherBar
              editingDevice={editingDevice}
              detectedDevice={detectedDevice}
              pinnedDevice={pinnedDevice}
              onSelectEditingDevice={onSelectEditingDevice}
              onSetPinnedDevice={onSetPinnedDevice}
              onCopyFrom={onCopyFrom}
            />

            <LayoutScopeBar
              scope={scope}
              mode={mode}
              onAdminTargetChange={onAdminTargetChange}
              onToggleShare={onToggleShare}
              onForkToPersonal={onForkToPersonal}
              onRevertToShared={onRevertToShared}
              onResetToAuto={onResetToAuto}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          {primaryAction ? (
            <Button size="sm" variant="tertiary" onPress={primaryAction.onPress} className="h-9 shrink-0 gap-1.5 rounded-full px-3 text-xs font-semibold">
              <HugeiconsIcon icon={primaryAction.icon} size={15} />
              <span>
                {primaryAction.label}
                {primaryAction.badge !== undefined && primaryAction.badge !== '' && primaryAction.badge !== 0 ? ` (${primaryAction.badge})` : ''}
              </span>
            </Button>
          ) : null}

          <div className="flex items-center gap-0.5">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              isDisabled={!canUndo}
              onPress={onUndo}
              aria-label="Undo last edit"
              className="size-9 min-w-0 rounded-full"
            >
              <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              isDisabled={!canRedo}
              onPress={onRedo}
              aria-label="Redo last edit"
              className="size-9 min-w-0 rounded-full"
            >
              <HugeiconsIcon icon={ArrowTurnForwardIcon} size={16} />
            </Button>
          </div>

          <Button
            size="sm"
            variant={trayOpen ? 'secondary' : 'ghost'}
            onPress={() => setTrayOpen((v) => !v)}
            aria-expanded={trayOpen}
            aria-label="Device, sharing and reset options"
            className={cn('h-9 min-w-0 gap-1.5 rounded-full px-2.5 text-xs', trayOpen && 'text-[var(--accent)]')}
          >
            <HugeiconsIcon icon={DEVICE_ICON[editingDevice]} size={15} />
            <span className="hidden sm:inline">{DEVICE_LABEL[editingDevice]}</span>
            <span className="hidden md:inline text-muted">· {mode === 'auto' ? 'Auto' : 'Custom'} · {scopeBadge}</span>
            <HugeiconsIcon icon={trayOpen ? ArrowUp01Icon : ArrowDown01Icon} size={13} className="text-muted" />
          </Button>

          <div className="ml-auto flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onPress={onCancel} className="h-9 rounded-full px-3 text-xs">
              Cancel
            </Button>
            <Button size="sm" variant="primary" onPress={onSave} isDisabled={!isDirty} className="h-9 rounded-full px-3.5 text-xs font-semibold">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
