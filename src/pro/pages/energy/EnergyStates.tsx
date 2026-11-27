/**
 * Edge states for the restarted Energy page (docs/pro-ui/ENERGY.md §0, round 6), the same family
 * as the Security page's: loading (skeletons in the page's own shapes), not set up (Energy is not
 * configured in Home Assistant), and HA unreachable (the last known page, dimmed and read-only,
 * under one alert with Retry). Homes with only part of Energy set up (no solar, no battery, no
 * prices) are not an edge state: the page leaves those parts out.
 */
import type { ReactNode } from 'react';
import { Alert, Button, Skeleton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, FlashIcon, Link04Icon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { clock } from '../../lib/energyHome';

export function EnergyLoading({ width }: { width: number }) {
  const phone = width < 640;
  const desk = width >= 1000;
  return (
    <div aria-busy="true" aria-label="Loading energy" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 px-1">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-9 w-full max-w-md rounded-xl" />
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${phone ? 2 : 4}, minmax(0, 1fr))` }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="rounded-[26px]" style={{ height: phone ? 420 : 500 }} />
      {phone ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5 overflow-hidden">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[92px] w-[136px] shrink-0 rounded-[22px]" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-[26px]" />
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${desk ? 3 : 2}, minmax(0, 1fr))` }}>
          {Array.from({ length: desk ? 6 : 4 }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-[26px]" />
          ))}
        </div>
      )}
    </div>
  );
}

/** Energy is not configured in Home Assistant: say what appears once it is, and where to set it up. */
export function EnergyNotSetUp({ haUrl }: { haUrl?: string | null }) {
  return (
    <section aria-label="Energy not set up" className="pro-surface flex flex-col items-center gap-4 rounded-[32px] px-6 py-14 text-center">
      <span className="pro-soft grid size-16 place-items-center rounded-[22px]">
        <HugeiconsIcon icon={FlashIcon} size={30} />
      </span>
      <div className="max-w-md">
        <h2 className="text-[26px] font-light tracking-tight">Energy isn’t set up yet</h2>
        <p className="mt-2 text-[15px] text-muted">
          Add your grid meter in Home Assistant’s Energy dashboard, and solar, a battery, devices, gas or water if you have them. Live power, today’s timeline, costs and history then appear here.
        </p>
        <p className="mt-2 text-sm text-muted">Prices (Nordpool, Tibber), grid carbon (Electricity Maps) and a solar forecast add more when they are installed.</p>
      </div>
      {haUrl ? (
        <Button variant="secondary" className="gap-1.5 rounded-full" onPress={() => window.open(`${haUrl.replace(/\/$/, '')}/config/energy`, '_blank', 'noopener,noreferrer')}>
          <HugeiconsIcon icon={Link04Icon} size={16} />
          Set up Energy in Home Assistant
        </Button>
      ) : null}
    </section>
  );
}

/** HA unreachable: the last known page, dimmed and read-only, under one alert. */
export function EnergyUnreachable({ lastSeen, onRetry, children }: { lastSeen: number; onRetry?: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert status="danger" className="items-center rounded-[22px]">
        <Alert.Indicator>
          <HugeiconsIcon icon={Alert02Icon} size={18} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Can’t reach Home Assistant</Alert.Title>
          <Alert.Description>Showing the last known numbers from {clock(lastSeen)}. Live power is paused until it’s back.</Alert.Description>
        </Alert.Content>
        <Button size="sm" variant="danger" className="shrink-0 gap-1.5 rounded-full" onPress={onRetry}>
          <HugeiconsIcon icon={Refresh01Icon} size={15} />
          Retry
        </Button>
      </Alert>
      <div aria-disabled="true" inert className="pointer-events-none opacity-55 grayscale-[35%]">
        {children}
      </div>
    </div>
  );
}
