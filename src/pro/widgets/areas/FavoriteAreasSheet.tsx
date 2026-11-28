/**
 * Choose favourite rooms (owner, 2026-11-20): every area by floor as a toggle. The list is the
 * user's Rooms setting (`rooms.favoriteAreas`, shared with the classic Rooms page and every
 * screen); new favourites go to the end, so the order is the order they were picked.
 */
import { Button, ToggleButton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FavouriteIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { ProSheet } from '../../components/ProSheet';
import { toggleFavorite, type ProAreasModel } from '../../lib/overviewAreas';
import { areaIcon } from './concepts/shared';

const EMPTY: string[] = [];

export function FavoriteAreasSheet({ model, isOpen, onOpenChange }: { model: ProAreasModel; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { config, updateConfig } = useUserConfig();
  const favorites = config.rooms?.favoriteAreas ?? EMPTY;
  const set = (next: string[]) => updateConfig((prev) => ({ ...prev, rooms: { ...prev.rooms, favoriteAreas: next } }));

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Favourite rooms"
      subtitle={favorites.length ? `${favorites.length} chosen · shown first on the widget` : 'None chosen · the first rooms stand in'}
      icon={FavouriteIcon}
      page="overview"
    >
      <div className="flex flex-col gap-4">
        {model.floors.map((f) => (
          <section key={f.floorId ?? 'none'} aria-label={f.name} className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold text-muted">{f.name}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {f.areas.map((a) => {
                const on = favorites.includes(a.areaId);
                const rank = favorites.indexOf(a.areaId) + 1;
                return (
                  <ToggleButton
                    key={a.areaId}
                    isSelected={on}
                    onChange={() => set(toggleFavorite(favorites, a.areaId))}
                    aria-label={on ? `${a.name}, favourite ${rank}` : a.name}
                    className={cn('h-10 w-full min-w-0 justify-start gap-2 rounded-xl px-3 text-sm', on && 'font-semibold')}
                  >
                    <HugeiconsIcon icon={areaIcon(a)} size={16} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-left">{a.name}</span>
                    {on ? (
                      <span className="flex shrink-0 items-center gap-0.5 text-[11px] tabular-nums">
                        <HugeiconsIcon icon={Tick02Icon} size={13} />
                        {rank}
                      </span>
                    ) : null}
                  </ToggleButton>
                );
              })}
            </div>
          </section>
        ))}
        {favorites.length ? (
          <Button size="sm" variant="ghost" onPress={() => set([])} className="self-start text-xs">
            Clear favourites
          </Button>
        ) : null}
      </div>
    </ProSheet>
  );
}
