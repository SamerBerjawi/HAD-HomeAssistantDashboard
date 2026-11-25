/**
 * Page Options sheet for Pro Rooms (Phase 1.2 + 1.3):
 * Compact drawer/modal triggered from `ProEditBar`'s "Options" button while editing Rooms.
 * Edits apply to the active device's draft (`phone` | `tablet` | `desktop`) — nothing is saved
 * until the user taps Save on `ProEditBar`.
 */
import { Button, Switch } from '@heroui/react';
import { SlidersHorizontalIcon } from '@hugeicons/core-free-icons';
import { DEVICE_LABEL } from '../../components/LayoutScopeControls';
import { ProSheet } from '../../components/ProSheet';
import type { DeviceType } from '../../lib/overviewLayout';
import type { RoomsPageModel } from '../../lib/roomsPage';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';
import { ROOMS_TOGGLES, type RoomsPagePrefs } from './shared';

const GROUP_TITLE = { page: 'Page', cards: 'Tiles', actions: 'Quick actions' } as const;

interface Props {
  /** Every room, used to populate floor landing-filter options. */
  model: RoomsPageModel;
  prefs: RoomsPagePrefs;
  editingDevice: DeviceType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdatePrefs: (patch: Partial<RoomsPagePrefs>) => void;
  onResetPageOptions?: () => void;
}

export function RoomsCustomizeSheet({ model, prefs, editingDevice, isOpen, onOpenChange, onUpdatePrefs, onResetPageOptions }: Props) {
  const row = 'flex min-h-11 items-center gap-2';
  const namedFloors = model.floors.filter((f) => f.floorId !== null);
  const filterOptions = [
    { id: 'remember', label: 'Remember last' },
    { id: 'all', label: 'All rooms' },
    { id: 'active', label: 'Active' },
    { id: 'favourites', label: 'Favourites' },
    ...namedFloors.map((f) => ({ id: f.floorId as string, label: f.name }))
  ];

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Rooms options"
      subtitle={`${DEVICE_LABEL[editingDevice]} display · Applies on Save`}
      icon={SlidersHorizontalIcon}
      page="rooms"
      size="lg"
    >
      <div className="flex flex-col gap-5">
        <section aria-label="Landing filter" className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold text-muted">Default landing filter ({DEVICE_LABEL[editingDevice]})</h3>
          <SheetFilter
            label="Default landing filter"
            value={filterOptions.some((o) => o.id === prefs.defaultFilter) ? prefs.defaultFilter : 'remember'}
            onChange={(v) => onUpdatePrefs({ defaultFilter: v })}
            options={filterOptions}
          />
        </section>

        {(['page', 'cards', 'actions'] as const).map((group) => (
          <section key={group} aria-label={GROUP_TITLE[group]} className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-muted">{GROUP_TITLE[group]}</h3>
            {group === 'actions' ? <p className="text-xs text-muted">Shown only when a room has the devices for them. Standard tiles show two, large tiles three.</p> : null}
            {group === 'cards' ? (
              <>
                <div className={row}>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm">Sizes</span>
                    <span className="text-xs text-muted">Mixed follows each room; All standard is an even grid of tiles</span>
                  </span>
                  <SheetFilter
                    label="Tile sizes"
                    value={prefs.cardSize}
                    onChange={(v) => onUpdatePrefs({ cardSize: v })}
                    options={[
                      { id: 'large', label: 'Mixed' },
                      { id: 'standard', label: 'All standard' },
                      { id: 'compact', label: 'All compact' }
                    ]}
                  />
                </div>
                <div className={row}>
                  <span className="flex-1 text-sm">Big number</span>
                  <SheetFilter
                    label="Big number on tiles"
                    value={prefs.metric}
                    onChange={(v) => onUpdatePrefs({ metric: v })}
                    options={[
                      { id: 'temperature', label: 'Temperature' },
                      { id: 'humidity', label: 'Humidity' }
                    ]}
                  />
                </div>
              </>
            ) : null}
            {ROOMS_TOGGLES.filter((t) => t.group === group).map((t) => (
              <div key={t.key} className={row}>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm">{t.label}</span>
                  {t.hint ? <span className="text-xs text-muted">{t.hint}</span> : null}
                </span>
                <Switch
                  size="sm"
                  isSelected={prefs[t.key]}
                  onChange={() => onUpdatePrefs({ [t.key]: !prefs[t.key] })}
                  aria-label={t.label}
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>
            ))}
          </section>
        ))}

        {onResetPageOptions ? (
          <Button size="sm" variant="ghost" onPress={onResetPageOptions} className="self-start text-xs">
            Reset {DEVICE_LABEL[editingDevice].toLowerCase()} options & order
          </Button>
        ) : null}
      </div>
    </ProSheet>
  );
}
