/** Pieces the Family presence styles share: a pressable avatar that opens that person. */
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { PersonAvatarBadge } from '../../../components/overview/PresenceWidget';
import { useOpenSheet } from '../../../hooks/useSheetParam';
import type { ProOverviewPresenceModel, ProPersonPresenceItem } from '../../../lib/overviewPresence';

export function PersonButton({ m, className, avatarClass, dim }: { m: ProPersonPresenceItem; className?: string; avatarClass?: string; dim?: boolean }) {
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const open = useOpenSheet();
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={`${m.name}: ${m.statusLabel}. Open details`}
      onPress={() => open('users', m.entityId)}
      className={cn('h-auto w-auto min-w-0 rounded-full p-0', dim && 'opacity-60 grayscale', className)}
    >
      <PersonAvatarBadge member={m} serverUrl={serverUrl} size="md" className={avatarClass} />
    </Button>
  );
}

export const homeOf = (model: ProOverviewPresenceModel) => model.members.filter((m) => m.isHome);
export const awayOf = (model: ProOverviewPresenceModel) => model.members.filter((m) => !m.isHome);

/** Where someone is, in two words. */
export const placeOf = (m: ProPersonPresenceItem) => (m.isHome ? 'Home' : m.isInKnownZone ? m.statusLabel : 'Away');
