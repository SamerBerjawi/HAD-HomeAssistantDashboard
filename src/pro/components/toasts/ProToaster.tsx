import { useEffect, useRef } from 'react';
import { Toast } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  BlindsIcon,
  CheckmarkCircle02Icon,
  Door01Icon,
  FireIcon,
  GarageIcon,
  InformationCircleIcon,
  Message01Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  WashingMachineIcon
} from '@hugeicons/core-free-icons';
import { useAlertStore } from '@/store/useAlertStore';
import type { ToastNotification } from '@/types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { fromAlertToast, fromShellToast, type ProToastIcon, type ProToastModel } from '../../lib/toastLogic';

const { toast } = Toast;

const ICON: Record<ProToastIcon, IconSvgElement> = {
  lock: SquareLock02Icon,
  unlock: SquareUnlock02Icon,
  door: Door01Icon,
  window: BlindsIcon,
  garage: GarageIcon,
  appliance: WashingMachineIcon,
  message: Message01Icon,
  alert: Alert02Icon,
  hazard: FireIcon,
  check: CheckmarkCircle02Icon,
  info: InformationCircleIcon
};

function show(model: ProToastModel, onClose: () => void, onAction?: () => void): string {
  return toast(model.title, {
    description: model.description,
    variant: model.variant,
    indicator: <HugeiconsIcon icon={ICON[model.icon]} size={18} />,
    timeout: model.timeout,
    onClose,
    actionProps: model.actionLabel && onAction ? { children: model.actionLabel, onPress: onAction, size: 'sm', variant: 'tertiary' } : undefined
  });
}

/**
 * Mirrors a list of source toasts (by id) into the HeroUI queue: new ids are shown, ids gone from
 * the source are closed, and a toast closed in the UI is removed from its source.
 */
function useToastBridge<T extends { id: string }>(items: readonly T[], toModel: (t: T) => ProToastModel, remove: (id: string) => void, action?: (t: T) => (() => void) | undefined) {
  const shown = useRef(new Map<string, string>());
  const removeRef = useRef(remove);
  removeRef.current = remove;
  useEffect(() => {
    const live = new Set(items.map((t) => t.id));
    for (const [id, key] of shown.current) {
      if (!live.has(id)) {
        shown.current.delete(id);
        toast.close(key);
      }
    }
    // Sources list newest first or last; show oldest first so the newest ends on top.
    const fresh = items.filter((t) => !shown.current.has(t.id)).sort((a, b) => Number(getTime(a)) - Number(getTime(b)));
    for (const t of fresh) {
      const key = show(
        toModel(t),
        () => {
          if (shown.current.delete(t.id)) removeRef.current(t.id);
        },
        action?.(t)
      );
      shown.current.set(t.id, key);
    }
  }, [items, toModel, action]);
}

function getTime(t: { id: string }): number {
  const ts = (t as { timestamp?: unknown }).timestamp;
  return typeof ts === 'number' ? ts : 0;
}

const alertAction = (t: { action?: { onClick: () => void } }) => t.action?.onClick;

interface ProToasterProps {
  /** Shell toasts from useShellOverlays (confirmations). */
  shellToasts: readonly ToastNotification[];
  onDismissShellToast: (id: string) => void;
  page: string;
}

/** Pro toasts (DESIGN.md 7.8): HeroUI Toast, stacked; top on phones, top-right from 768 px. */
export default function ProToaster({ shellToasts, onDismissShellToast, page }: ProToasterProps) {
  const desktop = useMediaQuery('(min-width: 768px)');
  const alertToasts = useAlertStore((s) => s.toasts);
  const removeAlertToast = useAlertStore((s) => s.removeToast);

  useToastBridge(alertToasts, fromAlertToast, removeAlertToast, alertAction);
  useToastBridge(shellToasts, fromShellToast, onDismissShellToast, alertAction);

  return (
    <Toast.Provider
      placement={desktop ? 'top end' : 'top'}
      maxVisibleToasts={3}
      width={desktop ? 380 : 'calc(100vw - 32px)'}
      className="pro z-[9999] pt-[env(safe-area-inset-top)]"
      // Below the page header row (and its bell) from 768 px.
      style={desktop ? { top: 72 } : undefined}
      data-page={page}
    />
  );
}
