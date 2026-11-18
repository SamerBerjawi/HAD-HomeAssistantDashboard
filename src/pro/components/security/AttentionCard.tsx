import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, SecurityCheckIcon, SquareLock02Icon } from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { errorMessageField } from '@/lib/errors';
import type { ResolvedEntity } from '@/types';
import { deviceItem, kindRank, type DeviceItem } from '../../lib/securityLogic';
import { DeviceRow } from './DeviceRow';

interface AttentionCardProps {
  hazards: ResolvedEntity[];
  openDoors: ResolvedEntity[];
  openWindows: ResolvedEntity[];
  unlockedLocks: ResolvedEntity[];
  onError: (m: string | null) => void;
}

/** "Needs attention" (DESIGN.md 7.5): hazards first, then openings and unlocked locks; Lock all
 * from two unlocked locks; a calm "All secure" state otherwise. */
export function AttentionCard({ hazards, openDoors, openWindows, unlockedLocks, onError }: AttentionCardProps) {
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const [busy, setBusy] = useState(false);

  const items: DeviceItem[] = [
    ...hazards.map((e) => deviceItem(e, e.attributes?.device_class === 'smoke' ? 'smoke' : 'leak')),
    ...unlockedLocks.map((e) => deviceItem(e, 'lock')),
    ...openDoors.map((e) => deviceItem(e, 'door')),
    ...openWindows.map((e) => deviceItem(e, 'window'))
  ].sort((a, b) => kindRank(a.kind) - kindRank(b.kind));

  const lockAll = async () => {
    setBusy(true);
    onError(null);
    try {
      await callHAService('lock', 'lock', {}, { entity_id: unlockedLocks.map((l) => l.entity_id) });
    } catch (e) {
      onError(errorMessageField(e) || 'Could not lock everything');
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    // Owner 2026-11-18: a slim row on phones and tablets; the full centred card only on desktop,
    // where it fills the slot beside the alarm hero.
    return (
      <section
        aria-label="Needs attention"
        className="pro-surface flex items-center gap-3 px-4 py-3 lg:flex-col lg:justify-center lg:gap-2 lg:p-6 lg:text-center"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success/15 text-success lg:size-12 lg:rounded-2xl">
          <HugeiconsIcon icon={SecurityCheckIcon} size={20} className="lg:size-6" />
        </span>
        <span className="flex min-w-0 flex-col lg:items-center lg:gap-1">
          <h2 className="text-sm font-semibold lg:text-base">All secure</h2>
          <p className="truncate text-xs text-muted lg:max-w-64 lg:whitespace-normal lg:text-sm">
            Doors and windows closed, locks locked, no hazards.
          </p>
        </span>
      </section>
    );
  }

  return (
    <section aria-label="Needs attention" className="pro-surface @container flex min-w-0 flex-col gap-4 p-5">
      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <HugeiconsIcon icon={Alert02Icon} size={18} className={hazards.length ? 'text-danger' : 'text-warning'} />
          Needs attention
          <span className="text-sm font-normal text-muted">· {items.length}</span>
        </h2>
        {unlockedLocks.length >= 2 && (
          <Button size="sm" variant="primary" isPending={busy} onPress={lockAll}>
            <HugeiconsIcon icon={SquareLock02Icon} size={16} />
            Lock all
          </Button>
        )}
      </header>
      <ul className="-my-2.5 flex flex-col divide-y divide-separator">
        {items.map((item) => (
          <DeviceRow key={item.entity.entity_id} item={item} secondary="area" onError={onError} />
        ))}
      </ul>
    </section>
  );
}
