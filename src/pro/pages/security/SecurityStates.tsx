/**
 * Edge states for the settled Security page (docs/pro-ui/SECURITY.md §8): loading (skeletons in
 * the page's own shapes), empty (no security devices in HA), and error (HA unreachable: the
 * last known page, dimmed and read-only, under one alert with Retry).
 */
import type { ReactNode } from 'react';
import { Alert, Button, Skeleton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Refresh01Icon, Shield01Icon, Link04Icon } from '@hugeicons/core-free-icons';
import { clock } from './parts';

export function SecurityLoading({ width }: { width: number }) {
  const cols = width < 600 ? 2 : width < 1000 ? 4 : 6;
  const thumbs = width >= 900 ? 5 : 3;
  return (
    <div aria-busy="true" aria-label="Loading security" className="flex flex-col gap-6">
      <Skeleton className="h-44 rounded-[32px]" />
      <div className="flex flex-col gap-3">
        <Skeleton className="aspect-video w-full rounded-[26px]" />
        <Skeleton className="h-5 w-40 rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: thumbs }, (_, i) => (
            <Skeleton key={i} className="aspect-video flex-1 rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-full" />
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-[148px] rounded-[26px]" />
        ))}
      </div>
    </div>
  );
}

export function SecurityEmpty({ haUrl }: { haUrl?: string | null }) {
  return (
    <section aria-label="No security devices" className="pro-surface flex flex-col items-center gap-4 rounded-[32px] px-6 py-14 text-center">
      <span className="pro-soft grid size-16 place-items-center rounded-[22px]">
        <HugeiconsIcon icon={Shield01Icon} size={30} />
      </span>
      <div className="max-w-sm">
        <h2 className="text-[26px] font-light tracking-tight">No security devices yet</h2>
        <p className="mt-2 text-[15px] text-muted">Locks, door and window sensors, cameras, sirens and alarm panels you add in Home Assistant appear here.</p>
      </div>
      {haUrl ? (
        <Button variant="secondary" className="gap-1.5 rounded-full" onPress={() => window.open(haUrl, '_blank', 'noopener,noreferrer')}>
          <HugeiconsIcon icon={Link04Icon} size={16} />
          Open Home Assistant
        </Button>
      ) : null}
    </section>
  );
}

/** HA unreachable: the last known page, dimmed and read-only, under one alert. */
export function SecurityError({ lastSeen, onRetry, children }: { lastSeen: number; onRetry?: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert status="danger" className="items-center rounded-[22px]">
        <Alert.Indicator>
          <HugeiconsIcon icon={Alert02Icon} size={18} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Can’t reach Home Assistant</Alert.Title>
          <Alert.Description>Showing the last known state from {clock(lastSeen)}. Controls are paused until it’s back.</Alert.Description>
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
