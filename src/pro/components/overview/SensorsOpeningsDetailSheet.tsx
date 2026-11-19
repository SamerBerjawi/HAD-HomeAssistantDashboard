/**
 * Shared Openings & Safety Sensors Detail Sheet for pro Overview (docs/pro-ui/DESIGN.md 7.6,
 * Option A): ProSheet (Drawer on phones, Modal lg on desktop) supporting doors, windows, motion,
 * leak, and smoke domains with domain switcher pills, SearchField, All/Active ToggleButtonGroup,
 * and room-grouped sensor rows.
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, ScrollShadow, SearchField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Clock01Icon, Home01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import {
  filterAndGroupSensorItems,
  type ProOverviewSensorDomain,
  type ProOverviewSensorDomainModel
} from '../../lib/overviewSecurity';
import { ProSheet } from '../ProSheet';
import { SENSOR_DOMAIN_ICON, sensorStateBadgeIcon } from './SensorOpeningWidgets';

const SENSOR_DOMAINS: ProOverviewSensorDomain[] = ['doors', 'windows', 'motion', 'leak', 'smoke'];

interface SensorsOpeningsDetailSheetProps {
  activeDomain: ProOverviewSensorDomain | null;
  onSelectDomain: (domain: ProOverviewSensorDomain | null) => void;
  models: Record<ProOverviewSensorDomain, ProOverviewSensorDomainModel>;
}

export function SensorsOpeningsDetailSheet({
  activeDomain,
  onSelectDomain,
  models
}: SensorsOpeningsDetailSheetProps) {
  const [query, setQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  useEffect(() => {
    setQuery('');
    setOnlyActive(false);
  }, [activeDomain]);

  const model = activeDomain ? models[activeDomain] : models.doors;
  const DomainIcon = SENSOR_DOMAIN_ICON[model.domain];

  const groups = useMemo(
    () => filterAndGroupSensorItems(model.items, { query, onlyActive }),
    [model.items, query, onlyActive]
  );

  return (
    <ProSheet
      isOpen={activeDomain !== null}
      onOpenChange={(open) => {
        if (!open) onSelectDomain(null);
      }}
      title={model.title}
      subtitle={`${model.headlineText} · ${model.totalCount} ${model.totalCount === 1 ? 'sensor' : 'sensors'}`}
      icon={DomainIcon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-3.5 pb-2">
        <ScrollShadow orientation="horizontal" hideScrollBar className="flex items-center gap-1.5 pb-0.5">
          {SENSOR_DOMAINS.map((domain) => {
            const domainModel = models[domain];
            const Icon = SENSOR_DOMAIN_ICON[domain];
            const selected = model.domain === domain;
            return (
              <Button
                key={domain}
                size="sm"
                variant={selected ? 'primary' : 'tertiary'}
                className="shrink-0 whitespace-nowrap"
                onPress={() => onSelectDomain(domain)}
              >
                <HugeiconsIcon icon={Icon} size={13} />
                <span>{domainModel.title}</span>
                {domainModel.activeCount > 0 ? (
                  <Badge
                    size="sm"
                    variant="soft"
                    color={domainModel.isCriticalHazard ? 'danger' : 'warning'}
                    className="static transform-none! min-h-4 min-w-0 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold"
                  >
                    <Badge.Label className="font-mono">{domainModel.activeCount}</Badge.Label>
                  </Badge>
                ) : null}
              </Button>
            );
          })}
        </ScrollShadow>

        <SearchField
          value={query}
          onChange={setQuery}
          fullWidth
          variant="secondary"
          aria-label={`Search ${model.title}`}
        >
          <SearchField.Group>
            <SearchField.SearchIcon>
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </SearchField.SearchIcon>
            <SearchField.Input placeholder={`Search ${model.title.toLowerCase()} or room…`} />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleButtonGroup
            aria-label={`Filter ${model.title}`}
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([onlyActive ? 'active' : 'all'])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next) setOnlyActive(next === 'active');
            }}
          >
            <ToggleButton id="all" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={DomainIcon} size={14} />
              All ({model.totalCount})
            </ToggleButton>
            <ToggleButton id="active" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={Alert02Icon} size={14} />
              Active ({model.activeCount})
            </ToggleButton>
          </ToggleButtonGroup>

          <Badge
            size="sm"
            variant="soft"
            color={model.badgeTone}
            className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold"
          >
            <Badge.Label>{model.badgeText}</Badge.Label>
          </Badge>
        </div>

        {groups.length === 0 ? (
          <div className="pro-surface flex flex-col items-center gap-2 p-6 text-center">
            <HugeiconsIcon icon={DomainIcon} size={22} className="text-muted" />
            <p className="text-sm font-semibold text-foreground">
              {model.totalCount === 0 ? `No ${model.title.toLowerCase()} found` : 'No matching sensors'}
            </p>
            <p className="text-xs text-muted">
              {model.totalCount === 0
                ? 'Configure binary sensors in Home Assistant to monitor them here.'
                : 'Try clearing the search filter or switching to All.'}
            </p>
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
                    color={group.activeCount > 0 ? (model.isCriticalHazard ? 'danger' : 'warning') : 'success'}
                    className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
                  >
                    <Badge.Label className="font-mono">
                      {group.activeCount}/{group.totalCount}
                    </Badge.Label>
                  </Badge>
                </div>

                <div className="flex flex-col divide-y divide-separator">
                  {group.items.map((item) => {
                    const StateIcon = sensorStateBadgeIcon(item);
                    return (
                      <div key={item.entityId} className="flex min-w-0 items-center justify-between gap-3 py-2 first:pt-1 last:pb-1">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                          <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[11px] text-muted">
                            <span className="min-w-0 truncate font-mono">{item.entityId}</span>
                            <span className="inline-flex shrink-0 items-center gap-1">
                              <HugeiconsIcon icon={Clock01Icon} size={11} />
                              {item.lastChangedText}
                            </span>
                          </p>
                        </div>

                        <Badge
                          size="sm"
                          variant="soft"
                          color={item.badgeTone}
                          className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
                        >
                          <HugeiconsIcon icon={StateIcon} size={11} />
                          <Badge.Label>{item.stateLabel}</Badge.Label>
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </ProSheet>
  );
}
