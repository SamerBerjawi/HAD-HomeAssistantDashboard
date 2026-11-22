/**
 * Areas concept B — Expressive & immersive ("room photo"). The area's own picture fills the card
 * (a soft colour from its icon when it has none); favourites are glass pills, "All areas" a glass
 * button. Small: photo, name, temperature. Wide: + favourite pills. Tall/Large: pills on top,
 * the area's status chips and a lights button below.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon, DropletIcon, Home01Icon, Motion01Icon, MusicNote03Icon, StairsIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProAreaItem, ProAreasModel } from '../../../lib/overviewAreas';
import { useHaPicture } from '../../shared/useHaPicture';
import { WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { AreaMenu, areaIcon, tempText, useAreaActions, useAreaSelection } from './shared';

/** A steady hue per area (no picture): from its name. */
const hueOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

function Chip({ icon, text }: { icon: Parameters<typeof HugeiconsIcon>[0]['icon']; text: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-medium backdrop-blur-md">
      <HugeiconsIcon icon={icon} size={12} className="shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  );
}

export default function AreasConceptB({ model: m, size }: DesignedWidgetProps<ProAreasModel>) {
  const { area, select } = useAreaSelection(m);
  const actions = useAreaActions();
  const picture = useHaPicture(area?.picture ?? null);

  if (!area) {
    return (
      <WidgetSurface label="Areas" ink="light" style={{ background: 'linear-gradient(150deg, hsl(220 14% 38%), hsl(225 16% 22%))' }}>
        <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-white/75">
          <HugeiconsIcon icon={Home01Icon} size={22} />
          <p className="text-sm font-medium">No areas yet</p>
        </div>
      </WidgetSurface>
    );
  }

  const hue = hueOf(area.name);
  const pill = (a: ProAreaItem) => (
    <Button
      key={a.areaId}
      size="sm"
      variant="ghost"
      onPress={() => select(a.areaId)}
      aria-pressed={a.areaId === area.areaId}
      className={cn(
        'h-8 min-w-0 max-w-full shrink justify-start gap-1.5 rounded-full px-2.5 text-xs font-semibold text-white ring-1 backdrop-blur-md',
        a.areaId === area.areaId ? 'bg-white/90 text-black ring-white' : 'bg-black/25 ring-white/25 hover:bg-black/35'
      )}
    >
      <HugeiconsIcon icon={areaIcon(a)} size={14} className="shrink-0" />
      <span className="truncate">{a.name}</span>
    </Button>
  );
  const menu = (
    <AreaMenu model={m} current={area.areaId} onSelect={select} iconOnly={size === 's' || size === 't'} className="bg-black/25 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-black/35" />
  );
  const lightsOn = area.lightsOn > 0;

  return (
    <WidgetSurface label="Areas" ink="light" style={{ background: `linear-gradient(150deg, hsl(${hue} 30% 46%), hsl(${(hue + 40) % 360} 28% 24%))` }}>
      {picture ? <img src={picture} alt="" aria-hidden className="absolute inset-0 -z-10 size-full object-cover" /> : null}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/5 to-black/60" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
            <p className="truncate text-sm font-semibold">{area.name}</p>
            <p className="text-3xl font-semibold leading-none tabular-nums">{tempText(area.temperature)}</p>
          </div>
          {menu}
        </div>

        {size === 'w' ? <div className="mt-auto flex min-w-0 gap-1.5 overflow-hidden">{m.favorites.slice(0, 3).map(pill)}</div> : null}

        {size === 't' || size === 'l' ? (
          <>
            <div className="flex min-w-0 flex-wrap gap-1">
              {area.humidity !== null ? <Chip icon={DropletIcon} text={`${Math.round(area.humidity)}%`} /> : null}
              {area.mediaPlaying > 0 ? <Chip icon={MusicNote03Icon} text="Playing" /> : null}
              {area.motion ? <Chip icon={Motion01Icon} text="Motion" /> : null}
              {area.openContacts > 0 ? <Chip icon={StairsIcon} text={`${area.openContacts} open`} /> : null}
            </div>
            <div className="mt-auto flex flex-col gap-2">
              {area.totalLights > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => actions.setLights(area, !lightsOn)}
                  aria-label={`${area.name} lights ${lightsOn ? 'off' : 'on'}`}
                  className={cn(
                    'h-9 w-full justify-start gap-2 rounded-xl px-3 text-xs font-semibold ring-1 backdrop-blur-md',
                    lightsOn ? 'bg-[hsl(42_95%_62%/0.9)] text-black ring-[hsl(42_95%_70%)]' : 'bg-black/25 text-white ring-white/25'
                  )}
                >
                  <HugeiconsIcon icon={BulbIcon} size={15} />
                  {lightsOn ? `${area.lightsOn} of ${area.totalLights} lights on` : 'Lights off'}
                </Button>
              ) : null}
              <div className={cn('grid gap-1.5 [&>*]:w-full', size === 'l' ? 'grid-cols-3' : 'grid-cols-2')}>{m.favorites.slice(0, size === 'l' ? 6 : 2).map(pill)}</div>
            </div>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
