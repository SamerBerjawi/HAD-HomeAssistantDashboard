/**
 * Edge states for the Media page (docs/pro-ui/MEDIA.md §0), the same family as Mobility's: loading
 * (skeletons in the page's shapes), no media players found, and HA unreachable (the last known page,
 * dimmed and read-only, under one alert with Retry).
 */
import type { ReactNode } from 'react';
import { Alert, Button, Skeleton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Link04Icon, MusicNote01Icon, Refresh01Icon } from '@hugeicons/core-free-icons';

export function MediaLoading({ width }: { width: number }) {
  const cols = width < 520 ? 2 : width < 900 ? 3 : 4;
  return (
    <div aria-busy="true" aria-label="Loading media" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-56 rounded-xl" />
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols * 2 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-36 rounded-[22px]" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="size-36 shrink-0 rounded-[12px]" />
        ))}
      </div>
    </div>
  );
}

/** No media player in Home Assistant: say what the page reads and where to add one. */
export function MediaNotSetUp({ haUrl }: { haUrl?: string | null }) {
  return (
    <section aria-label="No media players" className="pro-surface flex flex-col items-center gap-4 rounded-[32px] px-6 py-14 text-center">
      <span className="pro-soft grid size-16 place-items-center rounded-[22px]">
        <HugeiconsIcon icon={MusicNote01Icon} size={30} />
      </span>
      <div className="max-w-md">
        <h2 className="text-[26px] font-light tracking-tight">No speakers or TVs yet</h2>
        <p className="mt-2 text-[15px] text-muted">Add your speakers and TVs to Home Assistant: Apple TV and HomePods, Music Assistant, Spotify, Sonos, Google Cast or your TV’s integration. Each media player shows here with what it plays.</p>
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
export function MediaUnreachable({ onRetry, children }: { onRetry?: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert status="danger" className="items-center rounded-[22px]">
        <Alert.Indicator>
          <HugeiconsIcon icon={Alert02Icon} size={18} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Can’t reach Home Assistant</Alert.Title>
          <Alert.Description>Showing what your speakers and TVs last reported. The controls are paused until it’s back.</Alert.Description>
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
