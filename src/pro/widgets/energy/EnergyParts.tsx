/** Shared bits of the Energy widgets: the empty state. */
import type { ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FlashIcon } from '@hugeicons/core-free-icons';
import { useEnergyStore } from './energyStore';

/** Shown instead of zeros while statistics load, or when the HA Energy dashboard isn't set up. */
export function useEnergyEmptyState(): ReactNode {
  const load = useEnergyStore((s) => s.load);
  if (load === 'ready') return null;
  const text = load === 'loading' ? 'Loading energy…' : load === 'unconfigured' ? 'Set up the Energy dashboard in Home Assistant' : 'Energy data unavailable';
  return (
    <p className="flex h-full items-end gap-2 text-sm text-muted">
      <HugeiconsIcon icon={FlashIcon} size={16} className="shrink-0" />
      {text}
    </p>
  );
}
