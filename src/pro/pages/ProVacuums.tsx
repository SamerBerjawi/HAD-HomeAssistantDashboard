/**
 * Pro Vacuums page (docs/pro-ui/VACUUM_TILES.md, picks of 2026-11-28): every robot and stick
 * vacuum Home Assistant knows, through the cleaner adapters (`useVacuumsHome`), on the Room page's
 * tiles. Loading, no cleaners and "HA unreachable" page states, as Mobility's.
 */
import { Alert, Button, Skeleton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Link04Icon, Refresh01Icon, Robot01Icon } from '@hugeicons/core-free-icons';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useVacuumsHome } from '../hooks/useVacuumsHome';
import { useBoxSize } from '../widgets/shared/useBoxSize';
import { clockText } from './vacuums/tiles/cleanerTileKit';
import VacuumPage from './vacuums/page/VacuumPage';

function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading cleaners" className="flex gap-6">
      <Skeleton className="hidden h-72 w-[248px] shrink-0 rounded-[22px] md:block" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-[308px] rounded-[26px]" />
        <Skeleton className="h-[148px] rounded-[26px]" />
      </div>
    </div>
  );
}

function NotSetUp({ haUrl }: { haUrl?: string | null }) {
  return (
    <section aria-label="No cleaners" className="pro-surface flex flex-col items-center gap-4 rounded-[32px] px-6 py-14 text-center">
      <span className="pro-soft grid size-16 place-items-center rounded-[22px]">
        <HugeiconsIcon icon={Robot01Icon} size={30} />
      </span>
      <div className="max-w-md">
        <h2 className="text-[26px] font-light tracking-tight">No vacuums yet</h2>
        <p className="mt-2 text-[15px] text-muted">Add your robot or stick vacuum’s integration in Home Assistant. Dreame robots show everything here: the run, rooms, station, parts and history.</p>
        <p className="mt-2 text-sm text-muted">Any other robot appears from its vacuum entity; Samsung sticks from SmartThings.</p>
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

export default function ProVacuums() {
  const { cleaners, now, act, loading, notSetUp, offline, lastSeen } = useVacuumsHome();
  const box = useBoxSize<HTMLDivElement>({ width: 375, height: 0 });
  const haUrl = useAutoLayoutStore((s) => s.serverUrl);
  const retry = () => {
    const url = haWebSocketService.getCurrentUrl();
    const token = haWebSocketService.getCurrentToken();
    if (url && token) haWebSocketService.connect(url, token, true);
  };
  const page = <VacuumPage cleaners={cleaners} now={now} width={box.width} act={act} />;
  return (
    <div ref={box.ref} className="min-w-0">
      {loading ? (
        <Loading />
      ) : offline ? (
        <div className="flex flex-col gap-4">
          <Alert status="danger" className="items-center rounded-[22px]">
            <Alert.Indicator>
              <HugeiconsIcon icon={Alert02Icon} size={18} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>Can’t reach Home Assistant</Alert.Title>
              <Alert.Description>{lastSeen ? `Showing what your cleaners last reported, at ${clockText(lastSeen)}.` : 'Your cleaners will appear once it’s back.'} The controls are paused until then.</Alert.Description>
            </Alert.Content>
            <Button size="sm" variant="danger" className="shrink-0 gap-1.5 rounded-full" onPress={retry}>
              <HugeiconsIcon icon={Refresh01Icon} size={15} />
              Retry
            </Button>
          </Alert>
          {cleaners.length ? (
            <div aria-disabled="true" inert className="pointer-events-none opacity-55 grayscale-[35%]">
              {page}
            </div>
          ) : null}
        </div>
      ) : notSetUp ? (
        <NotSetUp haUrl={haUrl} />
      ) : (
        page
      )}
    </div>
  );
}
