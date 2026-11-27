/**
 * B · Home (Spotify), the owner's page direction since 2026-11-27 (it replaced A · Now Playing; the
 * sections decided on A stay: docs/pro-ui/MEDIA.md §0). The page is a library home: a greeting,
 * "Start something" (quick picks of what you played lately), "Playing in your home" as the quiet
 * List, then the shelves. Tapping a room in the list opens the Immersive player as a sheet (no mini
 * player bar: the owner removed it on 2026-11-27). On desktop the Immersive player stays
 * open on the right, as in Spotify's desktop app. "Playing on …" opens the AirPlay sheet. With
 * nothing playing, the Room bar sits where the mini player goes (round 6).
 */
import { useEffect, useState, type ComponentType } from 'react';
import { Modal } from '@heroui/react';
import { cn } from '@/lib/utils';
import { greeting, homeLine, isActive, leadPlayer, type Player } from '../../../lib/mediaHome';
import { MediaDarkContext, PickerContext, QuickGrid, ShelfRow, useTicking, type DesignProps, type PickerProps } from './parts';
import { IdleBar, type IdleConcept } from './idleConcepts';
import { ElsewhereList } from './elsewhereConcepts';
import { HeroImmersive, type HeroProps } from './heroConcepts';
import { PlaysIn, shelvesFor } from './libraryConcepts';
import { PickerAirPlay } from './pickerConcepts';

/** The Immersive player in a sheet (phones and tablets: the mini bar and the list open it). */
function PlayerSheet({ Hero, home, p, act, now, dark, width, isOpen, onOpenChange }: Omit<HeroProps, 'p'> & { Hero: ComponentType<HeroProps>; p: Player | null; isOpen: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Modal.Backdrop isOpen={isOpen && !!p} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="auto">
        <Modal.Dialog aria-label="Now playing" className={cn('pro bg-transparent p-0 shadow-none', dark && 'dark')} data-page="media">
          <Modal.CloseTrigger className="z-10 text-white" />
          {p ? <Hero home={home} p={p} act={act} now={now} dark={dark} width={Math.min(width, 520)} /> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

const SIDE = 380;

export interface MediaPageProps extends DesignProps {
  Hero?: ComponentType<HeroProps>;
  Picker?: ComponentType<PickerProps>;
  Idle?: IdleConcept;
  /** Told which player a tap plays on, so the live page can load that player's library. */
  onTarget?: (id: string | null) => void;
}

export default function MediaPage({ home, width, dark, act, Hero = HeroImmersive, Picker = PickerAirPlay, Idle = IdleBar, onTarget }: MediaPageProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const lead = leadPlayer(home, chosen);
  const now = useTicking(home.now, home.players.some((p) => p.state === 'playing'));
  const phone = width < 640;
  const playing = !!lead && isActive(lead);
  // The player beside the list once the list keeps three columns of quick picks.
  const side = width >= 940 && playing;
  const main = side ? width - SIDE - 20 : width;
  const shelves = shelvesFor(home, lead);
  // Quick picks: what you played lately, else the first shelf the player offers (TV apps stay a row).
  const recent = shelves.find((s) => s.kind === 'recent') ?? shelves.find((s) => s.kind !== 'apps');
  const leadId = lead?.id ?? null;
  useEffect(() => onTarget?.(leadId), [leadId, onTarget]);
  const open = (id: string) => {
    setChosen(id);
    if (!side) setSheet(true);
  };
  return (
    <MediaDarkContext.Provider value={dark}>
      <PickerContext.Provider value={Picker}>
        <div className={cn('flex gap-5', side ? 'items-start' : 'flex-col')}>
          <div className="relative flex min-w-0 flex-1 flex-col gap-7 pb-2">
            <header className="flex flex-col gap-1">
              <h2 className={cn('font-bold tracking-tight', phone ? 'text-[26px]' : 'text-[32px]')}>{greeting(home.now)}</h2>
              <p className="text-[14px] text-muted">{homeLine(home)}</p>
            </header>
            {!playing ? <Idle.Top home={home} target={lead} act={act} width={main} dark={dark} onPick={setChosen} /> : null}
            {recent ? (
              <section aria-label="Start something" className="flex flex-col gap-2.5">
                <h3 className="text-[19px] font-semibold tracking-tight">Start something</h3>
                <PlaysIn target={lead} />
                <QuickGrid items={recent.items.slice(0, phone ? 6 : 8)} target={lead} act={act} cols={main < 640 ? 2 : main < 1000 ? 3 : 4} />
              </section>
            ) : null}
            <ElsewhereList home={home} except={null} act={act} now={now} dark={dark} width={main} onOpen={open} title="Playing in your home" />
            {shelves
              .filter((s) => s !== recent)
              .map((s) => (
                <ShelfRow key={s.id} shelf={s} target={lead} act={act} tile={phone ? 128 : 150} />
              ))}
            {!playing && Idle.Bar ? (
              <div className="sticky bottom-3 z-10">
                <Idle.Bar home={home} target={lead} act={act} width={main} dark={dark} onPick={setChosen} />
              </div>
            ) : null}
          </div>
          {side && lead ? (
            <aside aria-label="Now playing view" className="sticky top-4 shrink-0" style={{ width: SIDE }}>
              <Hero home={home} p={lead} act={act} now={now} dark={dark} width={SIDE} />
            </aside>
          ) : null}
          <PlayerSheet Hero={Hero} home={home} p={lead} act={act} now={now} dark={dark} width={width} isOpen={sheet && !side} onOpenChange={setSheet} />
        </div>
      </PickerContext.Provider>
    </MediaDarkContext.Provider>
  );
}

