/**
 * Shared Lighting & Switches Control Sheet for pro Overview (docs/pro-ui/DESIGN.md 7.6, Option A):
 * ProSheet (Drawer on phones, Modal lg on desktop) with SearchField, All/On filter, batch buttons,
 * room grouping, HeroUI Switch toggles, and HeroUI brightness Slider controls.
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, SearchField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BulbIcon,
  FlashIcon,
  Home01Icon,
  Search01Icon,
  Sun01Icon,
  ToggleOnIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import {
  filterAndGroupControlItems,
  type ProControlDomain,
  type ProControlDomainModel,
  type ProControlItem
} from '../../lib/overviewControls';
import { ProSheet } from '../ProSheet';
import { ProBrightnessSlider, ProControlSwitch } from './ControlWidgets';

interface ControlDetailSheetProps {
  domain: ProControlDomain | null;
  onClose: () => void;
  model: ProControlDomainModel;
  onToggleItem: (item: ProControlItem) => void;
  onToggleBatch: (forceOn: boolean) => void;
  onChangeBrightness: (entityId: string, pct: number) => void;
}

export function ControlDetailSheet({
  domain,
  onClose,
  model,
  onToggleItem,
  onToggleBatch,
  onChangeBrightness
}: ControlDetailSheetProps) {
  const [query, setQuery] = useState('');
  const [onlyOn, setOnlyOn] = useState(false);

  useEffect(() => {
    setQuery('');
    setOnlyOn(false);
  }, [domain]);

  const isLights = model.domain === 'lights';
  const groups = useMemo(
    () => filterAndGroupControlItems(model.items, { query, onlyOn }),
    [model.items, query, onlyOn]
  );

  return (
    <ProSheet
      isOpen={domain !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={isLights ? 'Lighting' : 'Switches'}
      subtitle={model.subtitleText}
      icon={isLights ? BulbIcon : ToggleOnIcon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-3.5 pb-2">
        <SearchField
          value={query}
          onChange={setQuery}
          fullWidth
          variant="secondary"
          aria-label={`Search ${model.domain}`}
        >
          <SearchField.Group>
            <SearchField.SearchIcon>
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </SearchField.SearchIcon>
            <SearchField.Input placeholder={`Search ${model.domain} or room…`} />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleButtonGroup
            aria-label={`Filter ${model.domain} state`}
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([onlyOn ? 'on' : 'all'])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next) setOnlyOn(next === 'on');
            }}
          >
            <ToggleButton id="all" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={isLights ? BulbIcon : ToggleOnIcon} size={14} />
              All ({model.totalCount})
            </ToggleButton>
            <ToggleButton id="on" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={isLights ? Sun01Icon : FlashIcon} size={14} />
              On ({model.onCount})
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
            <HugeiconsIcon icon={isLights ? BulbIcon : ToggleOnIcon} size={22} className="text-muted" />
            <p className="text-sm font-semibold text-foreground">No matching {model.domain}</p>
            <p className="text-xs text-muted">Try clearing the search query or switching to All.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <section key={group.roomName} aria-label={group.roomName} className="pro-surface flex flex-col gap-2.5 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                    <HugeiconsIcon icon={Home01Icon} size={14} className="text-[var(--accent)]" />
                    {group.roomName}
                  </span>
                  <Badge
                    size="sm"
                    variant="soft"
                    color={group.onCount > 0 ? (isLights ? 'warning' : 'accent') : 'default'}
                    className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
                  >
                    <Badge.Label className="font-mono">
                      {group.onCount}/{group.totalCount} on
                    </Badge.Label>
                  </Badge>
                </div>

                <div className="flex flex-col divide-y divide-separator">
                  {group.items.map((item) => (
                    <div key={item.entityId} className="flex flex-col gap-2 py-2.5 first:pt-0.5 last:pb-0.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              'grid size-8 shrink-0 place-items-center rounded-xl',
                              item.isOn
                                ? isLights
                                  ? 'bg-warning/15 text-warning'
                                  : 'pro-soft'
                                : 'bg-default/60 text-muted'
                            )}
                          >
                            <HugeiconsIcon icon={isLights ? BulbIcon : ToggleOnIcon} size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                            <p className="truncate font-mono text-[11px] text-muted">
                              {item.isOn
                                ? isLights && item.brightnessPct !== null
                                  ? `${item.brightnessPct}% brightness`
                                  : item.powerWatts !== undefined && item.powerWatts > 0
                                    ? `${item.powerWatts} W`
                                    : 'On'
                                : 'Off'}
                            </p>
                          </div>
                        </div>

                        <ProControlSwitch
                          isSelected={item.isOn}
                          onChange={() => onToggleItem(item)}
                          ariaLabel={`Toggle ${item.name}`}
                          warmTone={isLights}
                        />
                      </div>

                      {isLights && item.isOn && item.supportsBrightness ? (
                        <div className="pl-10">
                          <ProBrightnessSlider
                            value={item.brightnessPct ?? 80}
                            onCommit={(pct) => onChangeBrightness(item.entityId, pct)}
                            ariaLabel={`${item.name} brightness`}
                          />
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
