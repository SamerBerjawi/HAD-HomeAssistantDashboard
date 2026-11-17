/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * One notification card. Memoized: it re-renders only when its own item object, unread flag or
 * pending action changes, never because a sibling or an unrelated Home Assistant entity changed.
 */

import React, { memo } from 'react';
import {
  ArrowsClockwise,
  CheckCircle,
  Info,
  Warning,
  WarningOctagon,
  Bell,
  X
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { glass } from '@/lib/glass';
import PersonAvatar from '../ui/PersonAvatar';

export type NotificationCenterStatus = 'neutral' | 'information' | 'success' | 'warning' | 'error';
export type NotificationCenterActionVariant = 'primary' | 'secondary' | 'danger';

export interface NotificationCenterAction {
  id: string;
  label: string;
  variant?: NotificationCenterActionVariant;
  icon?: React.ReactNode;
}

export interface NotificationCenterItem {
  id: string;
  /** Tab this item belongs to (other than "all"). */
  category: string;
  /** Timeline heading, e.g. "Today" / "Earlier". */
  group: string;
  title: string;
  description?: string;
  /** Display string, e.g. "5m ago". */
  timestamp: string;
  /** Extra line under the title, e.g. "by HACS · Kitchen". */
  meta?: string;
  unread?: boolean;
  status?: NotificationCenterStatus;
  /** Custom visual (brand icon, image). Takes precedence over avatar and status icon. */
  icon?: React.ReactNode;
  avatar?: { name: string; src?: string | null };
  /** Glyph inside the status-coloured well (defaults to the status icon). */
  statusIcon?: React.ReactNode;
  actions?: NotificationCenterAction[];
  actionsDisabled?: boolean;
  dismissible?: boolean;
  /** Rich body rendered under the description (changelog, progress, images). */
  details?: React.ReactNode;
}

const STATUS_STYLES: Record<NotificationCenterStatus, { well: string; Icon: typeof Info }> = {
  neutral: { well: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20', Icon: Bell },
  information: { well: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20', Icon: Info },
  success: { well: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20', Icon: CheckCircle },
  warning: { well: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20', Icon: Warning },
  error: { well: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20', Icon: WarningOctagon }
};

const ACTION_STYLES: Record<NotificationCenterActionVariant, string> = {
  primary: 'bg-sky-500 hover:bg-sky-400 text-white border-transparent shadow-xs',
  secondary:
    'bg-white/60 hover:bg-white/90 text-slate-700 border-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:text-slate-200 dark:border-white/10',
  danger:
    'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border-rose-500/30 dark:text-rose-300'
};

function Visual({ item }: { item: NotificationCenterItem }) {
  if (item.icon) return <div className="shrink-0">{item.icon}</div>;
  if (item.avatar) {
    return <PersonAvatar name={item.avatar.name} entity_picture={item.avatar.src} size="md" className="shrink-0" />;
  }
  const { well, Icon } = STATUS_STYLES[item.status ?? 'neutral'];
  return (
    <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', well)} aria-hidden="true">
      {item.statusIcon ?? <Icon size={18} weight="duotone" />}
    </div>
  );
}

interface NotificationCenterCardProps {
  item: NotificationCenterItem;
  /** Action currently running for this card, if any. */
  pendingActionId?: string;
  onAction?: (notificationId: string, actionId: string) => void;
  onDismiss?: (notificationId: string) => void;
}

function NotificationCenterCardImpl({ item, pendingActionId, onAction, onDismiss }: NotificationCenterCardProps) {
  const unread = Boolean(item.unread);
  const busy = pendingActionId !== undefined;

  return (
    <article
      aria-label={`${item.title}${unread ? ' (unread)' : ''}`}
      className={cn(
        glass.tile,
        'relative rounded-2xl p-3 sm:p-3.5 flex gap-3',
        // Off-screen cards skip layout and paint entirely
        '[content-visibility:auto] [contain-intrinsic-size:auto_96px]',
        // Enter: opacity + transform only, no layout animation
        'transition-[opacity,transform,background-color] duration-300 ease-out starting:opacity-0 starting:translate-y-1',
        unread && 'bg-sky-500/[0.06] dark:bg-sky-400/[0.06]'
      )}
    >
      <Visual item={item} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h4
              className={cn(
                'text-[13px] leading-snug text-slate-900 dark:text-white truncate',
                unread ? 'font-bold' : 'font-semibold'
              )}
            >
              {item.title}
            </h4>
            {item.meta && (
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{item.meta}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <time className="text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">{item.timestamp}</time>
            {unread && <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.15)]" aria-hidden="true" />}
            {item.dismissible && onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(item.id)}
                aria-label={`Dismiss ${item.title}`}
                className="-mr-1 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={12} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {item.description && (
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">{item.description}</p>
        )}

        {item.details && <div className="mt-2 text-[11px]">{item.details}</div>}

        {item.actions && item.actions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {item.actions.map((action) => {
              const isPending = pendingActionId === action.id;
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={busy || item.actionsDisabled}
                  onClick={() => onAction?.(item.id, action.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-[background-color,transform] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                    ACTION_STYLES[action.variant ?? 'secondary']
                  )}
                >
                  {isPending ? <ArrowsClockwise size={11} className="animate-spin" /> : action.icon}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

export const NotificationCenterCard = memo(NotificationCenterCardImpl);
export default NotificationCenterCard;
