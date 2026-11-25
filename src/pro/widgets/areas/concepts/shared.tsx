/** Areas pieces the concepts share: the area icon, the selection, the floor menu and lights. */
import { useMemo, useState } from 'react';
import { Button, Dropdown, Header } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  BathtubIcon,
  BedIcon,
  CarParking01Icon,
  ChildIcon,
  Dumbbell01Icon,
  FavouriteIcon,
  InformationCircleIcon,
  GarageIcon,
  Home01Icon,
  KitchenUtensilsIcon,
  LaptopIcon,
  Plant01Icon,
  Sofa01Icon,
  StairsIcon,
  Tick02Icon,
  Tv01Icon,
  WashingMachineIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { findArea, type ProAreaItem, type ProAreasModel } from '../../../lib/overviewAreas';
import { useServiceCall } from '../../shared/useServiceCall';

const ICON_WORDS: [RegExp, IconSvgElement][] = [
  [/bed|sleep|guest/, BedIcon],
  [/kid|child|nursery|baby/, ChildIcon],
  [/kitchen|dining|utensil|food/, KitchenUtensilsIcon],
  [/bath|shower|toilet|wc/, BathtubIcon],
  [/office|studio|desk|laptop|study/, LaptopIcon],
  [/tv|media|cinema|theater|theatre/, Tv01Icon],
  [/living|lounge|sofa|family/, Sofa01Icon],
  [/garage/, GarageIcon],
  [/drive|parking|car/, CarParking01Icon],
  [/garden|yard|patio|outdoor|balcony|terrace|tree|plant/, Plant01Icon],
  [/laundry|wash|utility/, WashingMachineIcon],
  [/gym|fitness/, Dumbbell01Icon],
  [/hall|entry|stair|landing|door/, StairsIcon]
];

export const ROOM_ICONS: readonly { id: string; label: string; icon: IconSvgElement }[] = [
  { id: 'home', label: 'Room', icon: Home01Icon },
  { id: 'sofa', label: 'Living', icon: Sofa01Icon },
  { id: 'bed', label: 'Bedroom', icon: BedIcon },
  { id: 'child', label: 'Kids', icon: ChildIcon },
  { id: 'kitchen', label: 'Kitchen', icon: KitchenUtensilsIcon },
  { id: 'bath', label: 'Bathroom', icon: BathtubIcon },
  { id: 'office', label: 'Office', icon: LaptopIcon },
  { id: 'tv', label: 'Media', icon: Tv01Icon },
  { id: 'garage', label: 'Garage', icon: GarageIcon },
  { id: 'parking', label: 'Driveway', icon: CarParking01Icon },
  { id: 'garden', label: 'Garden', icon: Plant01Icon },
  { id: 'laundry', label: 'Laundry', icon: WashingMachineIcon },
  { id: 'gym', label: 'Gym', icon: Dumbbell01Icon },
  { id: 'stairs', label: 'Hallway', icon: StairsIcon }
];

const ROOM_ICON_BY_ID = new Map<string, IconSvgElement>(ROOM_ICONS.map((r) => [r.id, r.icon]));

/** An icon for an area from its custom/registry icon id or name. */
export function areaIcon(a: Pick<ProAreaItem, 'icon' | 'name'>): IconSvgElement {
  const exact = ROOM_ICON_BY_ID.get(a.icon.trim().toLowerCase());
  if (exact) return exact;
  const text = `${a.icon} ${a.name}`.toLowerCase();
  return ICON_WORDS.find(([re]) => re.test(text))?.[1] ?? Home01Icon;
}

/** The area the widget shows: the first favourite until the user picks another. */
export function useAreaSelection(model: ProAreasModel) {
  const [picked, setPicked] = useState<string | null>(null);
  const area = findArea(model, picked) ?? model.favorites[0] ?? model.floors[0]?.areas[0] ?? null;
  return { area, select: setPicked };
}

export function useAreaActions() {
  const { call, setOptimistic } = useServiceCall();
  return useMemo(
    () => ({
      setLights: (a: ProAreaItem, on: boolean) => {
        if (a.lightIds.length === 0) return;
        for (const id of a.lightIds) setOptimistic(id, on ? 'on' : 'off');
        void call('light', on ? 'turn_on' : 'turn_off', {}, a.lightIds);
      }
    }),
    [call, setOptimistic]
  );
}

const OPEN_KEY = '__open';
const FAVS_KEY = '__favourites';
const DETAILS_KEY = '__details';

/**
 * "All areas" menu: every area, grouped by floor, the current one ticked. When the card passes
 * them, it ends with "Open {area}" (the Rooms page) and "Choose favourites…".
 */
export function AreaMenu({
  model,
  current,
  onSelect,
  onOpen,
  onChooseFavorites,
  onDetails,
  className,
  label = 'All areas',
  iconOnly = false
}: {
  model: ProAreasModel;
  current: string | null;
  onSelect: (areaId: string) => void;
  onOpen?: (areaId: string) => void;
  onChooseFavorites?: () => void;
  /** The room's details sheet. */
  onDetails?: () => void;
  className?: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const currentName = model.floors.flatMap((f) => f.areas).find((a) => a.areaId === current)?.name;
  const act = (key: string) => {
    if (key === OPEN_KEY) {
      if (current) onOpen?.(current);
    } else if (key === FAVS_KEY) onChooseFavorites?.();
    else if (key === DETAILS_KEY) onDetails?.();
    else onSelect(key);
  };
  return (
    <Dropdown>
      <Button
        size="sm"
        variant="ghost"
        isIconOnly={iconOnly}
        aria-label={`${label}: choose an area`}
        className={cn('h-8 shrink-0 gap-1 rounded-full px-3 text-xs font-semibold', iconOnly && 'w-8 min-w-0 px-0', className)}
      >
        {iconOnly ? null : label}
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
      </Button>
      <Dropdown.Popover placement="bottom end" className="max-h-[60dvh] min-w-56 overflow-y-auto">
        <Dropdown.Menu aria-label="Areas by floor" onAction={(key) => act(String(key))}>
          {model.floors.map((f) => (
            <Dropdown.Section key={f.floorId ?? 'none'}>
              <Header>{f.name}</Header>
              {f.areas.map((a) => (
                <Dropdown.Item key={a.areaId} id={a.areaId} textValue={a.areaId === current ? `${a.name}, shown` : a.name}>
                  <span className="flex w-full items-center gap-2">
                    <HugeiconsIcon icon={areaIcon(a)} size={16} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    {a.areaId === current ? <HugeiconsIcon icon={Tick02Icon} size={14} className="shrink-0" /> : null}
                  </span>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          ))}
          {onOpen || onChooseFavorites || onDetails ? (
            <Dropdown.Section key="actions">
              {onOpen && current && currentName ? (
                <Dropdown.Item key={OPEN_KEY} id={OPEN_KEY} textValue={`Open ${currentName}`}>
                  <span className="flex w-full items-center gap-2">
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate">Open {currentName}</span>
                  </span>
                </Dropdown.Item>
              ) : null}
              {onDetails && currentName ? (
                <Dropdown.Item key={DETAILS_KEY} id={DETAILS_KEY} textValue={`${currentName} details`}>
                  <span className="flex w-full items-center gap-2">
                    <HugeiconsIcon icon={InformationCircleIcon} size={16} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate">{currentName} details</span>
                  </span>
                </Dropdown.Item>
              ) : null}
              {onChooseFavorites ? (
                <Dropdown.Item key={FAVS_KEY} id={FAVS_KEY} textValue="Choose favourites">
                  <span className="flex w-full items-center gap-2">
                    <HugeiconsIcon icon={FavouriteIcon} size={16} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate">Choose favourites…</span>
                  </span>
                </Dropdown.Item>
              ) : null}
            </Dropdown.Section>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export const tempText = (t: number | null) => (t === null ? '–' : `${Number(t.toFixed(1))}°`);
