/**
 * Edge states for the Mobility page (docs/pro-ui/MOBILITY.md §0), the same family as Security's and
 * Energy's: loading (skeletons in the page's own shapes), no vehicles found (what the page reads and
 * where to add an integration), and HA unreachable (the last known page, dimmed and read-only, under
 * one alert with Retry). A vehicle that is asleep, not heard from in a while, or whose integration is
 * down is not a page state: its hero says so (`freshness` in `mobilityHome.ts`).
 */
import type { ReactNode } from 'react';
import { Alert, Button, Skeleton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Car01Icon, Link04Icon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { clock } from '../../lib/mobilityHome';

export function MobilityLoading({ width }: { width: number }) {
  const phone = width < 640;
  const desk = width >= 1000;
  return (
    <div aria-busy="true" aria-label="Loading vehicles" className="flex flex-col gap-5">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <Skeleton className="rounded-[28px]" style={{ height: phone ? 260 : 220 }} />
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${desk ? 3 : phone ? 1 : 2}, minmax(0, 1fr))` }}>
        {Array.from({ length: desk ? 3 : 2 }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-[26px]" />
        ))}
      </div>
      <Skeleton className="rounded-[26px]" style={{ height: phone ? 480 : 340 }} />
    </div>
  );
}

/** No vehicle found in Home Assistant: say what the page reads and where to add one. */
export function MobilityNotSetUp({ haUrl }: { haUrl?: string | null }) {
  return (
    <section aria-label="No vehicles" className="pro-surface flex flex-col items-center gap-4 rounded-[32px] px-6 py-14 text-center">
      <span className="pro-soft grid size-16 place-items-center rounded-[22px]">
        <HugeiconsIcon icon={Car01Icon} size={30} />
      </span>
      <div className="max-w-md">
        <h2 className="text-[26px] font-light tracking-tight">No vehicles yet</h2>
        <p className="mt-2 text-[15px] text-muted">
          Add your car or e-bike’s integration in Home Assistant. FordPass and Cowboy show everything here: charge, controls, where it is, trips and condition.
        </p>
        <p className="mt-2 text-sm text-muted">Other makes appear too when their integration reports a battery level and a range; their own controls come with their adapter.</p>
      </div>
      {haUrl ? (
        <Button variant="secondary" className="gap-1.5 rounded-full" onPress={() => window.open(`${haUrl.replace(/\/$/, '')}/config/integrations/dashboard`, '_blank', 'noopener,noreferrer')}>
          <HugeiconsIcon icon={Link04Icon} size={16} />
          Add an integration in Home Assistant
        </Button>
      ) : null}
    </section>
  );
}

/** HA unreachable: the last known page, dimmed and read-only, under one alert. */
export function MobilityUnreachable({ lastSeen, onRetry, children }: { lastSeen: number | null; onRetry?: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert status="danger" className="items-center rounded-[22px]">
        <Alert.Indicator>
          <HugeiconsIcon icon={Alert02Icon} size={18} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Can’t reach Home Assistant</Alert.Title>
          <Alert.Description>{lastSeen ? `Showing what your vehicles last reported, at ${clock(lastSeen)}.` : 'Your vehicles will appear once it’s back.'} The controls are paused until then.</Alert.Description>
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
