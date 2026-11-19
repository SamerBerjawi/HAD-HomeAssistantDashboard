/**
 * Pro Overview Family Presence widget across 1x, 2x, and 2x2 sizes (docs/pro-ui/DESIGN.md 7.6,
 * Option 3: HeroUI Avatar + Badge card with optimized minimal OpenStreetMap mini-map on 2x2).
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { Avatar, Badge, Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowUpRight01Icon,
  BatteryCharging01Icon,
  BatteryFullIcon,
  BatteryLowIcon,
  BatteryMedium01Icon,
  Home01Icon,
  Location01Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useHAImage } from '@/services/haImageService';
import type {
  ProBatteryBadgeTone,
  ProOverviewPresenceModel,
  ProPersonPresenceItem,
  ProPresenceTone
} from '../../lib/overviewPresence';
import type { ProWidgetSize } from '../../lib/overviewWidgets';

const LazyPresenceMap = lazy(() => import('./PresenceMap'));

const TONE_DOT_BG: Record<ProPresenceTone, string> = {
  success: 'bg-success',
  accent: 'bg-[var(--accent)]',
  default: 'bg-muted/60'
};

const BATTERY_TEXT_TONE: Record<ProBatteryBadgeTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger'
};

export function batteryIconFor(pct: number | undefined, isCharging: boolean): IconSvgElement {
  if (isCharging) return BatteryCharging01Icon;
  if (pct !== undefined && pct <= 25) return BatteryLowIcon;
  if (pct !== undefined && pct <= 70) return BatteryMedium01Icon;
  return BatteryFullIcon;
}

export function PersonAvatarBadge({
  member,
  serverUrl,
  size = 'sm',
  className
}: {
  member: ProPersonPresenceItem;
  serverUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { imageUrl } = useHAImage(member.entityPicture, serverUrl);
  return (
    <Badge.Anchor className="shrink-0">
      <Avatar size={size} variant="soft" color={member.statusTone} className={className}>
        {imageUrl ? <Avatar.Image src={imageUrl} alt={member.name} className="object-cover" /> : null}
        <Avatar.Fallback>{member.initials}</Avatar.Fallback>
      </Avatar>
      <Badge
        size="sm"
        variant="primary"
        color={member.statusTone}
        placement="bottom-right"
        className="size-2.5 min-h-2.5 min-w-2.5 rounded-full p-0"
        aria-hidden="true"
      />
    </Badge.Anchor>
  );
}

export function FamilyPresenceWidgetBody({
  model,
  size,
  serverUrl,
  onOpenMember
}: {
  model: ProOverviewPresenceModel;
  size: ProWidgetSize;
  serverUrl: string | null;
  onOpenMember: (entityId?: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(
    () => model.members.find((m) => m.isHome)?.entityId || model.members[0]?.entityId || ''
  );

  useEffect(() => {
    if (model.members.length === 0) return;
    if (!model.members.some((m) => m.entityId === selectedId)) {
      setSelectedId(model.members.find((m) => m.isHome)?.entityId || model.members[0].entityId);
    }
  }, [model.members, selectedId]);

  if (model.totalCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-default/40 p-3 text-xs text-muted">
        <HugeiconsIcon icon={UserGroupIcon} size={16} className="shrink-0" />
        <span>No household members tracked yet.</span>
      </div>
    );
  }

  if (size === '1x') {
    const visibleStack = model.members.slice(0, 4);
    const extraCount = Math.max(0, model.members.length - visibleStack.length);

    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center -space-x-2">
            {visibleStack.map((member) => (
              <div key={member.entityId} className="rounded-full ring-2 ring-[var(--surface)]">
                <PersonAvatarBadge member={member} serverUrl={serverUrl} size="sm" className="size-8" />
              </div>
            ))}
            {extraCount > 0 ? (
              <span className="grid size-8 place-items-center rounded-full bg-default text-[11px] font-semibold text-foreground ring-2 ring-[var(--surface)]">
                +{extraCount}
              </span>
            ) : null}
          </div>

          <Badge
            size="sm"
            variant="soft"
            color={model.summaryBadgeTone}
            className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={Home01Icon} size={12} />
            <Badge.Label>{model.summaryBadgeText}</Badge.Label>
          </Badge>
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="font-mono text-lg font-bold tracking-tight text-foreground">
            {model.homeCount} of {model.totalCount} home
          </p>
          <p className="truncate text-xs text-muted">{model.subtitleSummary}</p>
        </div>
      </div>
    );
  }

  if (size === '2x') {
    const visibleCards = model.members.slice(0, 4);
    const remaining = Math.max(0, model.members.length - visibleCards.length);

    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-lg font-bold tracking-tight text-foreground">
            {model.homeCount} of {model.totalCount} at home
          </span>
          <div className="flex items-center gap-1.5">
            <Badge
              size="sm"
              variant="soft"
              color={model.summaryBadgeTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={Home01Icon} size={12} />
              <Badge.Label>{model.summaryBadgeText}</Badge.Label>
            </Badge>
            {remaining > 0 ? (
              <Badge
                size="sm"
                variant="soft"
                color="default"
                className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
              >
                <Badge.Label>+{remaining}</Badge.Label>
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 @md:grid-cols-4">
          {visibleCards.map((member) => {
            const BattIcon = batteryIconFor(member.batteryPct, member.isCharging);
            const LocIcon = member.isHome ? Home01Icon : Location01Icon;
            return (
              <div
                key={member.entityId}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMember(member.entityId);
                }}
                className="flex min-w-0 items-center gap-2 rounded-xl bg-default/50 p-2.5 transition-colors hover:bg-default/80"
              >
                <PersonAvatarBadge member={member} serverUrl={serverUrl} size="sm" className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{member.firstName}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'inline-flex max-w-full items-center gap-1 truncate text-[11px]',
                        member.isHome
                          ? 'font-medium text-success'
                          : member.isInKnownZone
                            ? 'font-medium text-[var(--accent)]'
                            : 'text-muted'
                      )}
                    >
                      <HugeiconsIcon icon={LocIcon} size={11} className="shrink-0" />
                      <span className="truncate">{member.statusLabel}</span>
                    </span>
                    {member.batteryPct !== undefined ? (
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 font-mono text-[10px] font-semibold',
                          member.batteryPct <= 30 || member.isCharging
                            ? BATTERY_TEXT_TONE[member.batteryTone]
                            : 'text-muted'
                        )}
                      >
                        <HugeiconsIcon icon={BattIcon} size={11} className="shrink-0" />
                        {member.batteryPct}%
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2x2 Large layout with optimized minimal OpenStreetMap mini-map
  const activeMember = model.members.find((m) => m.entityId === selectedId) || model.members[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {model.homeCount} of {model.totalCount}
          </span>
          <span className="text-xs text-muted">members at home</span>
        </div>
        <Badge
          size="sm"
          variant="soft"
          color={model.summaryBadgeTone}
          className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
        >
          <HugeiconsIcon icon={Home01Icon} size={12} />
          <Badge.Label>{model.summaryBadgeText}</Badge.Label>
        </Badge>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <ToggleButtonGroup
          aria-label="Select family member on map"
          size="sm"
          isDetached
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([activeMember.entityId])}
          className="flex-wrap gap-1.5"
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (next) setSelectedId(String(next));
          }}
        >
          {model.members.map((member) => (
            <ToggleButton key={member.entityId} id={member.entityId} className="gap-1.5 whitespace-nowrap">
              <span className={cn('size-2 rounded-full', TONE_DOT_BG[member.statusTone])} aria-hidden="true" />
              <span>{member.firstName}</span>
              {member.batteryPct !== undefined ? (
                <span className="font-mono text-[10px] opacity-75">{member.batteryPct}%</span>
              ) : null}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <div className="relative overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <Suspense fallback={<div className="h-[168px] w-full animate-pulse rounded-2xl bg-default/50" />}>
          <LazyPresenceMap
            variant="widget"
            height={168}
            zoom={15}
            members={model.members}
            activeMemberId={activeMember.entityId}
            onSelectMember={setSelectedId}
          />
        </Suspense>

        <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-[400] flex items-center justify-between gap-2">
          <div className="pro-surface pointer-events-auto flex min-w-0 items-center gap-2 rounded-full px-2.5 py-1 text-xs shadow-sm">
            <span className={cn('size-2 shrink-0 rounded-full', TONE_DOT_BG[activeMember.statusTone])} />
            <span className="truncate font-semibold text-foreground">{activeMember.firstName}</span>
            <span className="truncate text-muted">{activeMember.locationLabel}</span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="pointer-events-auto h-7 min-h-7 rounded-full px-2.5 text-xs"
            onPress={() => onOpenMember(activeMember.entityId)}
          >
            Inspect
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
