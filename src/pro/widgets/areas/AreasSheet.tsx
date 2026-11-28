/**
 * Rooms details (sheet kit, WIDGET_DESIGN.md §8; new). Hero: the room's picture (or a calm
 * gradient) with its name, temperature and what is going on, Lights on/off and Open room. A quick
 * choice of the favourite rooms. Then the room's readings, its lights to switch, and every room by
 * floor, each with a star to make it a favourite (saved with the Rooms settings). `?sheet=areas&id=`
 * opens on that room.
 */
import { useMemo, useState } from 'react';
import { Button, ToggleButton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon, BulbIcon, DoorIcon, DropletIcon, FavouriteIcon, FlashIcon, Motion01Icon, MusicNote03Icon, ThermometerIcon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { useLayoutScope } from '../../hooks/useLayoutScope';
import { areaSummaryLine, findArea, toggleFavorite, type ProAreaItem, type ProAreasModel } from '../../lib/overviewAreas';
import { ToggleSwitch } from '../controls/ControlParts';
import { useDomainEntities } from '../shared/entities';
import { useOpenArea } from '../shared/navigate';
import { DetailSheet, HERO, HeroButton, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSection, SheetTile, SheetTiles } from '../shared/sheet/SheetKit';
import { useHaPicture } from '../shared/useHaPicture';
import { useServiceCall } from '../shared/useServiceCall';
import type { WidgetSheetProps } from '../types';
import { areaIcon, tempText, useAreaActions } from './concepts/shared';

const EMPTY: string[] = [];

export default function AreasSheet({ model: m, itemId, onClose }: WidgetSheetProps<ProAreasModel>) {
  const openArea = useOpenArea();
  const { updateConfig } = useUserConfig();
  const { scope, effectiveFavorites } = useLayoutScope();
  const favorites = effectiveFavorites;
  const [picked, setPicked] = useState<string | null>(itemId ?? null);
  const area: ProAreaItem | null = findArea(m, picked) ?? m.favorites[0] ?? m.floors[0]?.areas[0] ?? null;
  const picture = useHaPicture(area?.picture ?? null);
  const actions = useAreaActions();
  const { call, setOptimistic } = useServiceCall();
  const lightEntities = useDomainEntities('light');
  const lights = useMemo(() => (area ? lightEntities.filter((e) => area.lightIds.includes(e.entity_id)) : []), [area, lightEntities]);
  const setFavorite = (id: string) => {
    const nextFavs = toggleFavorite(favorites, id);
    if ((scope.activeTarget === 'personal' || !scope.canEditShared) && scope.userId) {
      void updateConfig({
        userLayouts: { [scope.userId]: { ...(scope.shareEnabled ? { useSharedLayout: false } : {}), favoriteAreas: nextFavs } }
      });
      return;
    }
    void updateConfig((prev) => ({ rooms: { favoriteAreas: nextFavs } } as Partial<typeof prev>));
  };
  const quick = area && !m.favorites.some((f) => f.areaId === area.areaId) ? [...m.favorites, area] : m.favorites;
  const lightsOn = (area?.lightsOn ?? 0) > 0;

  return (
    <DetailSheet
      title="Rooms details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={area ? areaIcon(area) : FavouriteIcon}
          eyebrow={area?.floorName ?? 'Rooms'}
          background={picture ? `linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.6)), url("${picture}") center / cover` : lightsOn ? HERO.amber : HERO.teal}
          headline={area ? area.name : 'No rooms'}
          sub={area ? areaSummaryLine(area) : undefined}
          aside={area && area.temperature !== null ? <span className="text-5xl font-extralight leading-none tracking-tighter tabular-nums">{tempText(area.temperature)}</span> : null}
          onClose={onClose}
          actions={
            area ? (
              <>
                {area.totalLights > 0 ? (
                  <HeroButton icon={BulbIcon} solid={!lightsOn} onPress={() => actions.setLights(area, !lightsOn)}>
                    {lightsOn ? 'Lights off' : 'Lights on'}
                  </HeroButton>
                ) : null}
                <HeroButton icon={ArrowUpRight01Icon} onPress={() => openArea(area.areaId)}>
                  Open room
                </HeroButton>
              </>
            ) : null
          }
        />
      }
      toolbar={quick.length > 1 && area ? <SheetFilter label="Room" value={area.areaId} onChange={setPicked} options={quick.map((a) => ({ id: a.areaId, label: a.name, icon: areaIcon(a) }))} /> : null}
    >
      {!area ? (
        <SheetEmpty icon={FavouriteIcon} title="No rooms yet" text="Areas from Home Assistant show up here." />
      ) : (
        <>
          <SheetTiles>
            <SheetTile icon={ThermometerIcon} label="Temperature" value={tempText(area.temperature)} />
            <SheetTile icon={DropletIcon} label="Humidity" value={area.humidity === null ? '–' : `${Math.round(area.humidity)}%`} />
            <SheetTile icon={BulbIcon} tone={lightsOn ? 'warning' : 'default'} label="Lights" value={area.totalLights > 0 ? `${area.lightsOn}/${area.totalLights}` : '–'} />
            <SheetTile icon={FlashIcon} label="Power" value={area.powerWatts > 0 ? `${area.powerWatts} W` : '–'} />
          </SheetTiles>
          {area.mediaPlaying > 0 || area.motion || area.openContacts > 0 ? (
            <SheetSection title="Going on">
              {area.mediaPlaying > 0 ? <SheetRow icon={MusicNote03Icon} tone="active" title="Playing" subtitle={`${area.mediaPlaying} player${area.mediaPlaying === 1 ? '' : 's'}`} /> : null}
              {area.motion ? <SheetRow icon={Motion01Icon} tone="active" title="Motion" /> : null}
              {area.openContacts > 0 ? <SheetRow icon={DoorIcon} tone="warning" title={`${area.openContacts} open`} subtitle="Doors or windows" /> : null}
            </SheetSection>
          ) : null}
          {lights.length > 0 ? (
            <SheetSection title="Lights" aside={`${lights.filter((l) => l.state === 'on').length} of ${lights.length} on`}>
              {lights.map((l) => {
                const on = l.state === 'on';
                const name = String(l.attributes?.friendly_name ?? l.entity_id);
                return (
                  <SheetRow
                    key={l.entity_id}
                    icon={BulbIcon}
                    tone={on ? 'warning' : 'default'}
                    title={name.replace(new RegExp(`^${area.name}\\s+`, 'i'), '')}
                    subtitle={on ? 'On' : 'Off'}
                    trailing={
                      <ToggleSwitch
                        isSelected={on}
                        tone="warning"
                        label={`${name} ${on ? 'on' : 'off'}`}
                        onChange={() => {
                          setOptimistic(l.entity_id, on ? 'off' : 'on');
                          void call('light', on ? 'turn_off' : 'turn_on', {}, l.entity_id);
                        }}
                      />
                    }
                  />
                );
              })}
            </SheetSection>
          ) : null}
          {m.floors.map((f) => (
            <SheetSection key={f.floorId ?? 'none'} title={f.name}>
              {f.areas.map((a) => {
                const fav = favorites.includes(a.areaId);
                return (
                  <SheetRow
                    key={a.areaId}
                    icon={areaIcon(a)}
                    tone={a.areaId === area.areaId ? 'active' : 'default'}
                    title={a.name}
                    subtitle={areaSummaryLine(a)}
                    trailing={
                      <>
                        {a.areaId !== area.areaId ? (
                          <Button size="sm" variant="ghost" onPress={() => setPicked(a.areaId)} className="h-8 rounded-full px-2.5 text-xs">
                            Show
                          </Button>
                        ) : null}
                        <ToggleButton
                          isIconOnly
                          size="sm"
                          isSelected={fav}
                          onChange={() => setFavorite(a.areaId)}
                          aria-label={`${a.name} favourite`}
                          className={cn('size-8 min-w-0 rounded-full', fav && 'text-[hsl(42_95%_45%)]')}
                        >
                          <HugeiconsIcon icon={FavouriteIcon} size={16} />
                        </ToggleButton>
                      </>
                    }
                  />
                );
              })}
            </SheetSection>
          ))}
        </>
      )}
    </DetailSheet>
  );
}
