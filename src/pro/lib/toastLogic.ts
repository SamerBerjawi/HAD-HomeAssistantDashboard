/**
 * Maps the app's two toast sources onto pro toasts (DESIGN.md 7.8). Pure, no React.
 *  - alert toasts from useAlertStore (alertService: locks, doors, appliances, HA messages, errors)
 *  - shell toasts from useShellOverlays.addToast (confirmations such as "Dashboard refreshed")
 */
import type { AlertToast } from '@/store/useAlertStore';
import type { ToastNotification } from '@/types';

export type ProToastVariant = 'default' | 'success' | 'warning' | 'danger';
export type ProToastIcon = 'lock' | 'unlock' | 'door' | 'window' | 'garage' | 'appliance' | 'message' | 'alert' | 'hazard' | 'check' | 'info';

export interface ProToastModel {
  title: string;
  description?: string;
  variant: ProToastVariant;
  icon: ProToastIcon;
  /** ms; 0 keeps it until closed. */
  timeout: number;
  actionLabel?: string;
}

const EMOJI = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}]/gu;

/** Drops emoji; "SMOKE DETECTED" → "Smoke detected". */
export function cleanTitle(title: string): string {
  const t = title.replace(EMOJI, '').replace(/\s+/g, ' ').trim();
  if (t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t)) return t.charAt(0) + t.slice(1).toLowerCase();
  return t;
}

function alertIcon(t: Pick<AlertToast, 'iconType' | 'category' | 'severity'>): ProToastIcon {
  switch (t.iconType) {
    case 'lock':
      return 'lock';
    case 'lock_open':
      return 'unlock';
    case 'door':
    case 'window':
    case 'garage':
    case 'appliance':
      return t.iconType;
  }
  if (t.severity === 'critical' || t.category === 'hazard') return 'hazard';
  if (t.category === 'persistent_notification') return 'message';
  if (t.category === 'appliance') return 'appliance';
  if (t.category === 'system' || t.severity === 'warning') return 'alert';
  return 'info';
}

export function fromAlertToast(t: AlertToast): ProToastModel {
  const icon = alertIcon(t);
  // Green/orange/red rule (7.5): red critical, orange warning, green "secured", neutral otherwise.
  const variant: ProToastVariant = t.severity === 'critical' ? 'danger' : t.severity === 'warning' ? 'warning' : icon === 'lock' ? 'success' : 'default';
  return {
    title: cleanTitle(t.title),
    description: t.message?.trim() || undefined,
    variant,
    icon,
    timeout: t.durationMs ?? 5000,
    actionLabel: t.action?.label
  };
}

export function fromShellToast(t: Omit<ToastNotification, 'id'>): ProToastModel {
  const variant: ProToastVariant = t.type === 'success' ? 'success' : t.type === 'warning' ? 'warning' : 'default';
  const icon: ProToastIcon = t.type === 'success' ? 'check' : t.type === 'warning' ? 'alert' : t.type === 'lock' ? 'lock' : t.type === 'security' ? 'alert' : 'info';
  return {
    title: cleanTitle(t.title),
    description: t.message?.trim() || undefined,
    variant,
    icon,
    timeout: t.duration ?? 4000,
    actionLabel: t.action?.label
  };
}
