import { useEffect, useState } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  AlertDiamondIcon,
  BatteryLowIcon,
  Download04Icon,
  DropletIcon,
  FireIcon,
  Message01Icon,
  Refresh01Icon,
  Shield01Icon,
  SparklesIcon,
  Wrench01Icon
} from '@hugeicons/core-free-icons';
import { normalizeIntegrationDomain } from '@/components/notifications/IntegrationIcon';
import { cn } from '@/lib/utils';
import type { HANotificationItem } from '@/types/notifications';
import { notificationTone, type NotificationTone, type StackKind } from '../../lib/notificationLogic';

export const TONE_TILE: Record<NotificationTone, string> = {
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  default: 'bg-default text-foreground/70'
};

export const STACK_ICON: Record<StackKind, IconSvgElement> = {
  alerts: Alert02Icon,
  repairs: Wrench01Icon,
  batteries: BatteryLowIcon,
  updates: Download04Icon
};

export function categoryIcon(item: Pick<HANotificationItem, 'category' | 'sensorType' | 'severity'>): IconSvgElement {
  switch (item.category) {
    case 'update':
      return Download04Icon;
    case 'restart':
      return Refresh01Icon;
    case 'hazard':
      return item.sensorType === 'leak' ? DropletIcon : item.sensorType === 'smoke' ? FireIcon : AlertDiamondIcon;
    case 'battery':
      return BatteryLowIcon;
    case 'security':
      return Shield01Icon;
    case 'appliance':
      return SparklesIcon;
    case 'repair':
      return Wrench01Icon;
    case 'alert':
      return Alert02Icon;
    default:
      return Message01Icon;
  }
}

function imageUrl(item: HANotificationItem, serverUrl?: string): string | null {
  const pic = item.image;
  if (pic) {
    if (/^(https?:|data:|blob:)/.test(pic)) return pic;
    if (pic.startsWith('/') && serverUrl) return `${serverUrl.replace(/\/+$/, '')}${pic}`;
  }
  // Brand icons only where they say something: updates and repairs come from an integration.
  if (item.category === 'update' || item.category === 'repair') {
    const d = normalizeIntegrationDomain(item.domain, undefined, item.title);
    if (d) return `https://brands.home-assistant.io/${d}/icon.png`;
  }
  return null;
}

/** Integration brand icon when known, else a Hugeicons category icon in a tone tile. */
export function NotificationIcon({ item, serverUrl, className }: { item: HANotificationItem; serverUrl?: string; className?: string }) {
  const url = imageUrl(item, serverUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const tone = notificationTone(item);
  // Red and orange keep the tone tile even with a brand: the colour is the message.
  if (url && !failed && tone === 'default') {
    return (
      <span className={cn('grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-default p-1.5', className)}>
        <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} className="size-full object-contain" />
      </span>
    );
  }
  return (
    <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', TONE_TILE[tone], className)}>
      <HugeiconsIcon icon={categoryIcon(item)} size={18} />
    </span>
  );
}
