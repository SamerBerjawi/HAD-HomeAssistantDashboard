/**
 * Presence Detail Sheet for pro Overview (docs/pro-ui/DESIGN.md 7.6, Option A): ProSheet
 * (Drawer on phones, Modal lg on desktop) with member switcher, device/battery cards, telemetry
 * grid, and an interactive minimal dark/light OpenStreetMap location card.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { Badge, Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  ArrowUpRight01Icon,
  Clock01Icon,
  Compass01Icon,
  Home01Icon,
  Location01Icon,
  MapsLocation01Icon,
  Remove01Icon,
  SmartPhone01Icon,
  UserGroupIcon,
  UserIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProBatteryBadgeTone, ProOverviewPresenceModel } from '../../lib/overviewPresence';
import { ProSheet } from '../ProSheet';
import { batteryIconFor, PersonAvatarBadge } from './PresenceWidget';

const LazyPresenceMap = lazy(() => import('./PresenceMap'));

const BATTERY_BAR_BG: Record<ProBatteryBadgeTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger'
};

interface PresenceDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  model: ProOverviewPresenceModel;
  selectedMemberId: string | null;
  onSelectMemberId: (entityId: string) => void;
  serverUrl: string | null;
}

export function PresenceDetailSheet({
  isOpen,
  onOpenChange,
  model,
  selectedMemberId,
  onSelectMemberId,
  serverUrl
}: PresenceDetailSheetProps) {
  const [zoom, setZoom] = useState(16);

  const activeMember =
    model.members.find((m) => m.entityId === selectedMemberId) ||
    model.members.find((m) => m.isHome) ||
    model.members[0];

  useEffect(() => {
    if (!isOpen || !model.members.length) return;
    if (!selectedMemberId && activeMember) {
      onSelectMemberId(activeMember.entityId);
    }
  }, [isOpen, selectedMemberId, activeMember, model.members.length, onSelectMemberId]);

  const subtitle = `${model.homeCount} of ${model.totalCount} member${model.totalCount === 1 ? '' : 's'} at home`;

  if (!activeMember) {
    return (
      <ProSheet
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title="Family Presence"
        subtitle={subtitle}
        icon={UserGroupIcon}
        page="overview"
        size="lg"
      >
        <div className="pro-surface flex flex-col items-center gap-2 p-6 text-center">
          <HugeiconsIcon icon={UserGroupIcon} size={24} className="text-muted" />
          <p className="text-sm font-semibold text-foreground">No household members found</p>
          <p className="text-xs text-muted">Configure person entities in Home Assistant to track presence here.</p>
        </div>
      </ProSheet>
    );
  }

  const BattIcon = batteryIconFor(activeMember.batteryPct, activeMember.isCharging);
  const StatusIcon = activeMember.isHome ? Home01Icon : Location01Icon;
  const batteryBarPct = activeMember.batteryPct !== undefined ? Math.max(0, Math.min(100, activeMember.batteryPct)) : 0;

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Family Presence"
      subtitle={subtitle}
      icon={UserGroupIcon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-3 pb-1">
        {model.members.length > 1 ? (
          <ToggleButtonGroup
            aria-label="Select family member"
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([activeMember.entityId])}
            className="flex-wrap gap-1.5"
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next) onSelectMemberId(String(next));
            }}
          >
            {model.members.map((member) => {
              const MemberIcon = member.isHome ? Home01Icon : Location01Icon;
              return (
                <ToggleButton key={member.entityId} id={member.entityId} className="gap-1.5 whitespace-nowrap">
                  <HugeiconsIcon
                    icon={MemberIcon}
                    size={14}
                    className={
                      member.statusTone === 'success'
                        ? 'text-success'
                        : member.statusTone === 'accent'
                          ? 'text-[var(--accent)]'
                          : 'text-muted'
                    }
                  />
                  <span>{member.firstName}</span>
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        ) : null}

        <section aria-label="Selected member summary" className="pro-surface flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <PersonAvatarBadge member={activeMember} serverUrl={serverUrl} size="lg" className="size-14 text-base" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-bold text-foreground">{activeMember.name}</h3>
                <Badge
                  size="sm"
                  variant="soft"
                  color={activeMember.statusTone}
                  className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
                >
                  <HugeiconsIcon icon={StatusIcon} size={12} />
                  <Badge.Label>{activeMember.statusLabel}</Badge.Label>
                </Badge>
              </div>
              <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs text-muted">
                <HugeiconsIcon icon={Location01Icon} size={13} className="shrink-0 text-[var(--accent)]" />
                <span className="truncate">{activeMember.locationLabel}</span>
              </p>
            </div>
          </div>
        </section>

        <section aria-label="Device and battery" className="pro-surface flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
              <span className="pro-soft grid size-7 shrink-0 place-items-center rounded-lg">
                <HugeiconsIcon icon={SmartPhone01Icon} size={15} />
              </span>
              <span className="truncate">{activeMember.deviceName}</span>
            </div>

            {activeMember.batteryPct !== undefined ? (
              <Badge
                size="sm"
                variant="soft"
                color={activeMember.batteryTone}
                className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
              >
                <HugeiconsIcon icon={BattIcon} size={12} />
                <Badge.Label className="font-mono">
                  {activeMember.batteryPct}% · {activeMember.batteryStateLabel}
                </Badge.Label>
              </Badge>
            ) : (
              <span className="text-xs text-muted">No battery sensor</span>
            )}
          </div>

          {activeMember.batteryPct !== undefined ? (
            <div className="h-2 w-full overflow-hidden rounded-full bg-default">
              <div
                className={cn('h-full rounded-full transition-all duration-300', BATTERY_BAR_BG[activeMember.batteryTone])}
                style={{ width: `${batteryBarPct}%` }}
              />
            </div>
          ) : null}
        </section>

        <section aria-label="Member telemetry" className="grid grid-cols-2 gap-2.5">
          <div className="pro-surface flex flex-col gap-1 p-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <HugeiconsIcon icon={Home01Icon} size={13} className="text-[var(--accent)]" />
              Presence state
            </span>
            <span className="truncate text-sm font-semibold text-foreground">{activeMember.statusLabel}</span>
          </div>

          <div className="pro-surface flex flex-col gap-1 p-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <HugeiconsIcon icon={Compass01Icon} size={13} className="text-[var(--accent)]" />
              Location detail
            </span>
            <span className="truncate text-sm font-semibold text-foreground">{activeMember.locationLabel}</span>
          </div>

          <div className="pro-surface flex flex-col gap-1 p-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <HugeiconsIcon icon={Clock01Icon} size={13} className="text-[var(--accent)]" />
              Last update
            </span>
            <span className="truncate text-sm font-semibold text-foreground">{activeMember.lastUpdatedFormatted}</span>
            {activeMember.lastUpdatedRelative ? (
              <span className="truncate text-[11px] text-muted">{activeMember.lastUpdatedRelative}</span>
            ) : null}
          </div>

          <div className="pro-surface flex flex-col gap-1 p-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <HugeiconsIcon icon={UserIcon} size={13} className="text-[var(--accent)]" />
              Entity ID
            </span>
            <span className="truncate font-mono text-xs font-medium text-foreground">{activeMember.entityId}</span>
          </div>
        </section>

        <section aria-label="OpenStreetMap location" className="pro-surface flex flex-col gap-2.5 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <HugeiconsIcon icon={MapsLocation01Icon} size={16} className="text-[var(--accent)]" />
              OpenStreetMap
            </span>

            {activeMember.latitude !== undefined && activeMember.longitude !== undefined ? (
              <div className="flex items-center gap-1.5">
                <Button
                  isIconOnly
                  size="sm"
                  variant="tertiary"
                  aria-label="Zoom out map"
                  className="size-8 min-w-8"
                  onPress={() => setZoom((z) => Math.max(12, z - 1))}
                >
                  <HugeiconsIcon icon={Remove01Icon} size={14} />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="tertiary"
                  aria-label="Zoom in map"
                  className="size-8 min-w-8"
                  onPress={() => setZoom((z) => Math.min(18, z + 1))}
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                </Button>
                {activeMember.osmUrl ? (
                  <Button
                    size="sm"
                    variant="tertiary"
                    className="h-8 min-h-8 gap-1 px-2.5 text-xs"
                    onPress={() => window.open(activeMember.osmUrl, '_blank', 'noopener,noreferrer')}
                  >
                    Open map
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <Suspense fallback={<div className="h-[184px] w-full animate-pulse rounded-2xl bg-default/50" />}>
              <LazyPresenceMap
                variant="sheet"
                height={184}
                zoom={zoom}
                members={model.members}
                activeMemberId={activeMember.entityId}
                onSelectMember={onSelectMemberId}
              />
            </Suspense>

            {activeMember.latitude !== undefined && activeMember.longitude !== undefined ? (
              <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-[400] flex flex-wrap items-center justify-between gap-2">
                <span className="pro-surface rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium text-foreground shadow-sm">
                  {activeMember.latitude.toFixed(4)}° {activeMember.latitude >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(activeMember.longitude).toFixed(4)}° {activeMember.longitude >= 0 ? 'E' : 'W'}
                </span>
                <span className="pro-surface rounded-full px-2.5 py-0.5 text-[10px] text-muted shadow-sm">
                  © OpenStreetMap
                </span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </ProSheet>
  );
}
