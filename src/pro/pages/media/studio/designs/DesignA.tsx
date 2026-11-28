/**
 * A · Now Playing (Apple Music). The page opens on what plays: big artwork on a backdrop blurred
 * from it, the title, the scrubber, the transport, the volume and the speaker ("Playing on Living
 * room", the AirPlay picker to add rooms). Up next sits beside it on desktop and under it on
 * phones. Other rooms that play follow as cards; the library shelves close the page. With nothing
 * playing, the page opens on the shelves with the room to play on.
 */
import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AirplayLineIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { homeLine, isActive, leadPlayer, type MediaHome, type Player } from '../../../../lib/mediaHome';
import type { ComponentType } from 'react';
import { MediaDarkContext, PickerContext, TargetPills, useTicking, type DesignProps, type PickerProps } from '../../home/parts';
import { LibraryQuick, type LibraryProps } from '../../home/libraryConcepts';
import { ElsewhereList, type ElsewhereProps } from '../../home/elsewhereConcepts';
import { HeroImmersive, type HeroProps } from '../../home/heroConcepts';
import { PickerAirPlay } from '../../home/pickerConcepts';

export default function DesignA({ home, width, dark, act, Hero = HeroImmersive, Elsewhere = ElsewhereList, Library = LibraryQuick, Picker = PickerAirPlay }: DesignProps & { Hero?: ComponentType<HeroProps>; Elsewhere?: ComponentType<ElsewhereProps>; Library?: ComponentType<LibraryProps>; Picker?: ComponentType<PickerProps> }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const lead = leadPlayer(home, chosen);
  const now = useTicking(home.now, home.players.some((p) => p.state === 'playing'));
  const phone = width < 640;
  const playing = lead && isActive(lead);
  return (
    <MediaDarkContext.Provider value={dark}>
    <PickerContext.Provider value={Picker}>
    <div className="flex flex-col gap-7">
      {playing ? (
        <Hero home={home} p={lead} act={act} now={now} dark={dark} width={width} />
      ) : (
        <header className="flex flex-col gap-3">
          <h2 className={cn('font-semibold tracking-tight', phone ? 'text-[28px]' : 'text-[34px]')}>{homeLine(home)}</h2>
          <p className="text-[15px] text-muted">Pick a room, then something to play.</p>
          <TargetPills home={home} target={lead} onPick={setChosen} />
        </header>
      )}
      <Elsewhere home={home} except={lead?.id ?? null} act={act} now={now} dark={dark} width={width} onOpen={setChosen} />
      <Library key={lead?.id ?? 'none'} home={home} target={lead} act={act} width={width} />
    </div>
    </PickerContext.Provider>
    </MediaDarkContext.Provider>
  );
}

