/**
 * C · Rooms (Spotify Connect / AirPlay, room first). Every room is a card tinted by what it plays,
 * grouped rooms as one card; idle rooms stay as quiet cards you can pick. The picked room is where
 * the library below plays ("Start something in the Kitchen"), and the mini player bar follows it;
 * tapping a card opens Now Playing as a sheet. The speaker picker is on every playing card.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { groupName, groupsOf, homeLine, isActive, leadPlayer } from '../../../../lib/mediaHome';
import { MiniBar, NowPlayingSheet, RoomCard, ShelfRow, useTicking, type DesignProps } from '../../home/parts';

export default function DesignC({ home, width, dark, act }: DesignProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const lead = leadPlayer(home, chosen);
  const now = useTicking(home.now, home.players.some((p) => p.state === 'playing'));
  const phone = width < 640;
  const groups = groupsOf(home.players.filter((p) => p.state !== 'unavailable'));
  // Playing first, then paused, then the rest; TVs after speakers among the idle.
  const order = (g: typeof groups[number]) => (g[0].state === 'playing' ? 0 : g[0].state === 'paused' ? 1 : g[0].kind === 'tv' ? 3 : 2);
  const sorted = [...groups].sort((a, b) => order(a) - order(b));
  const leadGroup = lead ? groups.find((g) => g.some((p) => p.id === lead.id)) ?? [lead] : [];
  return (
    <div className="relative flex flex-col gap-7 pb-2">
      <header className="flex flex-col gap-1">
        <h2 className={cn('font-semibold tracking-tight', phone ? 'text-[26px]' : 'text-[32px]')}>{homeLine(home)}</h2>
        <p className="text-[14px] text-muted">Tap a room to play there; open it for Now Playing and its speakers.</p>
      </header>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${phone ? 260 : 300}px, 1fr))` }}>
        {sorted.map((g) => {
          const picked = lead && g.some((p) => p.id === lead.id);
          return (
            <div key={g[0].id} className={cn('rounded-[26px] transition-shadow', picked && 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]')}>
              <RoomCard
                home={home}
                members={g}
                act={act}
                now={now}
                dark={dark}
                big={isActive(g[0]) && !phone && sorted.filter((x) => isActive(x[0])).length === 1}
                onOpen={() => {
                  setChosen(g[0].id);
                  if (isActive(g[0])) setSheet(true);
                }}
              />
            </div>
          );
        })}
      </div>
      {lead ? (
        <>
          <h3 className="-mb-4 text-[13px] font-medium uppercase tracking-wide text-muted">Start something in {groupName(leadGroup)}</h3>
          {home.shelves.map((s) => (
            <ShelfRow key={s.id} shelf={s} target={lead} act={act} tile={phone ? 128 : 150} />
          ))}
        </>
      ) : null}
      {lead && isActive(lead) ? (
        <div className="sticky bottom-3 z-10">
          <MiniBar home={home} p={lead} act={act} now={now} onOpen={() => setSheet(true)} />
        </div>
      ) : null}
      <NowPlayingSheet home={home} p={lead} act={act} now={now} dark={dark} isOpen={sheet} onOpenChange={setSheet} />
    </div>
  );
}
