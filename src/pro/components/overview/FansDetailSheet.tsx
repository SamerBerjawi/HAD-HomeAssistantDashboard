/**
 * Fans & Airflow Detail Sheet for pro Overview (docs/pro-ui/DESIGN.md 7.6, Option A): ProSheet
 * (Drawer on phones, Modal lg on desktop) with SearchField, All/Running filter, batch controls,
 * room grouping, HeroUI Switch, speed Slider, preset mode ToggleButtonGroup, and oscillation/direction.
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, SearchField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDataTransferHorizontalIcon,
  FastWindIcon,
  FlashIcon,
  Home01Icon,
  RotateClockwiseIcon,
  Search01Icon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import {
  filterAndGroupFanItems,
  type ProFanItem,
  type ProFansModel
} from '../../lib/overviewAppliances';
import { ProSheet } from '../ProSheet';
import { ProControlSwitch } from './ControlWidgets';
import { ProFanSpeedSlider } from './FansVacuumWidgets';

interface FansDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  model: ProFansModel;
  onToggleFan: (fan: ProFanItem) => void;
  onToggleBatch: (forceOn: boolean) => void;
  onChangeSpeed: (entityId: string, pct: number) => void;
  onToggleOscillate: (fan: ProFanItem) => void;
  onToggleDirection: (fan: ProFanItem) => void;
  onSelectPresetMode: (entityId: string, mode: string) => void;
}

export function FansDetailSheet({
  isOpen,
  onOpenChange,
  model,
  onToggleFan,
  onToggleBatch,
  onChangeSpeed,
  onToggleOscillate,
  onToggleDirection,
  onSelectPresetMode
}: FansDetailSheetProps) {
  const [query, setQuery] = useState('');
  const [onlyRunning, setOnlyRunning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setOnlyRunning(false);
    }
  }, [isOpen]);

  const groups = useMemo(
    () => filterAndGroupFanItems(model.items, { query, onlyOn: onlyRunning }),
    [model.items, query, onlyRunning]
  );

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Fans & Airflow"
      subtitle={model.subtitleText}
      icon={FastWindIcon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-3.5 pb-2">
        <SearchField
          value={query}
          onChange={setQuery}
          fullWidth
          variant="secondary"
          aria-label="Search fans"
        >
          <SearchField.Group>
            <SearchField.SearchIcon>
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </SearchField.SearchIcon>
            <SearchField.Input placeholder="Search fans or rooms…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleButtonGroup
            aria-label="Filter fans"
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([onlyRunning ? 'on' : 'all'])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next) setOnlyRunning(next === 'on');
            }}
          >
            <ToggleButton id="all" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={FastWindIcon} size={14} />
              All ({model.totalCount})
            </ToggleButton>
            <ToggleButton id="on" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={RotateClockwiseIcon} size={14} />
              Running ({model.onCount})
            </ToggleButton>
          </ToggleButtonGroup>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={model.totalCount === 0 || model.onCount === model.totalCount}
              onPress={() => onToggleBatch(true)}
            >
              <HugeiconsIcon icon={FlashIcon} size={14} />
              All on
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={model.totalCount === 0 || model.onCount === 0}
              onPress={() => onToggleBatch(false)}
            >
              <HugeiconsIcon icon={ViewOffSlashIcon} size={14} />
              All off
            </Button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="pro-surface flex flex-col items-center gap-2 p-6 text-center">
            <HugeiconsIcon icon={FastWindIcon} size={22} className="text-muted" />
            <p className="text-sm font-semibold text-foreground">No matching fans</p>
            <p className="text-xs text-muted">Try clearing the search query or switching to All.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <section
                key={group.roomName}
                aria-label={group.roomName}
                className="pro-surface flex flex-col gap-2.5 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                    <HugeiconsIcon icon={Home01Icon} size={14} className="text-[var(--accent)]" />
                    {group.roomName}
                  </span>
                  <Badge
                    size="sm"
                    variant="soft"
                    color={group.onCount > 0 ? 'accent' : 'default'}
                    className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
                  >
                    <Badge.Label className="font-mono">
                      {group.onCount}/{group.totalCount} on
                    </Badge.Label>
                  </Badge>
                </div>

                <div className="flex flex-col divide-y divide-separator">
                  {group.items.map((fan) => (
                    <div key={fan.entityId} className="flex flex-col gap-2.5 py-2.5 first:pt-1 last:pb-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{fan.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                            <span className="font-mono">{fan.entityId}</span>
                            {fan.isOn ? (
                              <span className="font-mono font-semibold text-[var(--accent)]">
                                {fan.percentage}% speed
                              </span>
                            ) : (
                              <span>Off</span>
                            )}
                          </div>
                        </div>

                        <ProControlSwitch
                          isSelected={fan.isOn}
                          onChange={() => onToggleFan(fan)}
                          ariaLabel={`Toggle ${fan.name}`}
                        />
                      </div>

                      {fan.supportsSpeed && fan.isOn ? (
                        <ProFanSpeedSlider
                          value={fan.percentage}
                          onCommit={(pct) => onChangeSpeed(fan.entityId, pct)}
                          ariaLabel={`Adjust ${fan.name} speed`}
                        />
                      ) : null}

                      {(fan.supportsOscillation || fan.supportsDirection || fan.presetModes.length > 0) &&
                      fan.isOn ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {fan.supportsOscillation ? (
                            <Button
                              size="sm"
                              variant={fan.oscillating ? 'primary' : 'tertiary'}
                              onPress={() => onToggleOscillate(fan)}
                            >
                              <HugeiconsIcon icon={RotateClockwiseIcon} size={13} />
                              {fan.oscillating ? 'Oscillating' : 'Oscillate'}
                            </Button>
                          ) : null}

                          {fan.supportsDirection ? (
                            <Button
                              size="sm"
                              variant="tertiary"
                              onPress={() => onToggleDirection(fan)}
                            >
                              <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={13} />
                              {fan.direction === 'reverse' ? 'Reverse' : 'Forward'}
                            </Button>
                          ) : null}

                          {fan.presetModes.length > 0 ? (
                            <ToggleButtonGroup
                              aria-label={`Preset modes for ${fan.name}`}
                              size="sm"
                              isDetached
                              selectionMode="single"
                              disallowEmptySelection
                              selectedKeys={
                                fan.presetMode ? new Set([fan.presetMode]) : new Set([fan.presetModes[0]])
                              }
                              onSelectionChange={(keys) => {
                                const next = [...keys][0];
                                if (next) onSelectPresetMode(fan.entityId, String(next));
                              }}
                              className={cn('flex-wrap')}
                            >
                              {fan.presetModes.slice(0, 4).map((mode) => (
                                <ToggleButton key={mode} id={mode} className="px-2 text-xs">
                                  {mode}
                                </ToggleButton>
                              ))}
                            </ToggleButtonGroup>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </ProSheet>
  );
}
