/**
 * Customise sheet for Energy: reorder and hide/show any of the 11 sections
 * (docs/pro-ui/ENERGY.md §1, §4). Shared by Energy Studio and production `ProEnergy`.
 */
import { Button, Chip, Switch, Tooltip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon, RefreshIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons';
import { ProSheet } from '../../../components/ProSheet';
import { ENERGY_SECTIONS, isSectionAvailable, type EnergySectionId, type StudioEnergySnapshot } from '../../../lib/energyPage';

interface EnergyCustomizeSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: readonly EnergySectionId[];
  hidden: ReadonlySet<EnergySectionId>;
  snap: StudioEnergySnapshot;
  onMove: (id: EnergySectionId, dir: -1 | 1) => void;
  onToggleHidden: (id: EnergySectionId) => void;
  onReset: () => void;
  subtitle?: string;
  unavailableLabel?: string;
}

export function EnergyCustomizeSheet({
  isOpen,
  onOpenChange,
  order,
  hidden,
  snap,
  onMove,
  onToggleHidden,
  onReset,
  subtitle = 'Hide or reorder sections (studio preview only)',
  unavailableLabel
}: EnergyCustomizeSheetProps) {
  const byId = new Map(ENERGY_SECTIONS.map((s) => [s.id, s]));

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Customise Energy"
      subtitle={subtitle}
      icon={SlidersHorizontalIcon}
      page="energy"
      size="md"
    >
      <div className="flex flex-col gap-2 pb-2">
        {order.map((id, index) => {
          const meta = byId.get(id);
          if (!meta) return null;
          const available = isSectionAvailable(id, snap);
          const isShown = !hidden.has(id);

          return (
            <div key={id} className="flex items-center justify-between gap-2 rounded-2xl bg-default/55 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="pro-soft grid size-8 shrink-0 place-items-center rounded-xl">
                  <HugeiconsIcon icon={meta.icon} size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{meta.title}</p>
                  {!available ? (
                    <Chip size="sm" variant="soft" color="warning" className="mt-0.5">
                      <Chip.Label>{unavailableLabel ?? `Unavailable in ${snap.stateId}`}</Chip.Label>
                    </Chip>
                  ) : (
                    <p className="truncate text-[11px] text-muted">{meta.summary}</p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Tooltip delay={0}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    isDisabled={index === 0}
                    aria-label={`Move ${meta.title} up`}
                    onPress={() => onMove(id, -1)}
                  >
                    <HugeiconsIcon icon={ArrowUp01Icon} size={15} />
                  </Button>
                  <Tooltip.Content placement="top">Move up</Tooltip.Content>
                </Tooltip>
                <Tooltip delay={0}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    isDisabled={index === order.length - 1}
                    aria-label={`Move ${meta.title} down`}
                    onPress={() => onMove(id, 1)}
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} size={15} />
                  </Button>
                  <Tooltip.Content placement="top">Move down</Tooltip.Content>
                </Tooltip>
                <Switch
                  size="sm"
                  isSelected={isShown}
                  onChange={() => onToggleHidden(id)}
                  aria-label={`Show ${meta.title}`}
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button size="sm" variant="tertiary" onPress={onReset} className="gap-1.5">
            <HugeiconsIcon icon={RefreshIcon} size={14} />
            Reset defaults
          </Button>
          <Button size="sm" variant="primary" onPress={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </div>
    </ProSheet>
  );
}
