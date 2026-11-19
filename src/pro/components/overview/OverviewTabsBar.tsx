import { useMemo } from 'react';
import { Badge, Button, Switch, Tooltip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AddCircleIcon,
  BulbIcon,
  CheckmarkCircle02Icon,
  DashboardSquare01Icon,
  Door01Icon,
  FlashIcon,
  Layers01Icon,
  MusicNote01Icon,
  PencilEdit01Icon,
  Robot01Icon,
  RotateLeft01Icon,
  Shield01Icon,
  ThermometerIcon,
  ToggleOnIcon,
  Video01Icon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import type { OverviewTabId, OverviewTabItem } from '../../lib/overviewTabs';
import { SmoothTab, type SwipeTabItem } from '../../ui/kokonutui/SmoothTab';
import { BlurFade } from '../../ui/magicui/BlurFade';

export const TAB_ICON: Record<OverviewTabId, IconSvgElement> = {
  all: DashboardSquare01Icon,
  lights: BulbIcon,
  switches: ToggleOnIcon,
  energy: FlashIcon,
  security: Shield01Icon,
  cameras: Video01Icon,
  climate: ThermometerIcon,
  openings: Door01Icon,
  media: MusicNote01Icon,
  vacuums: Robot01Icon
};

interface OverviewTabsBarProps {
  tabs: OverviewTabItem[];
  activeTab: OverviewTabId;
  onSelectTab: (tabId: OverviewTabId) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  hiddenWidgetsCount: number;
  hideBadges: boolean;
  groupBySections: boolean;
  onOpenAddWidgets: () => void;
  onToggleHideBadges: () => void;
  onToggleGroupBySections: () => void;
  onResetLayout: () => void;
}

/**
 * Category filter tabs + Customize / Edit Mode controls for pro Overview (docs/pro-ui/DESIGN.md 7.6).
 */
export function OverviewTabsBar({
  tabs,
  activeTab,
  onSelectTab,
  isEditMode,
  onToggleEditMode,
  hiddenWidgetsCount,
  hideBadges,
  groupBySections,
  onOpenAddWidgets,
  onToggleHideBadges,
  onToggleGroupBySections,
  onResetLayout
}: OverviewTabsBarProps) {
  const smoothItems = useMemo<SwipeTabItem[]>(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        title: tab.label,
        icon: TAB_ICON[tab.id],
        badge: tab.badge,
        badgeTone: tab.badgeTone,
        ariaLabel: tab.badge ? `${tab.label}, ${tab.badge}` : tab.label
      })),
    [tabs]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <SmoothTab
            items={smoothItems}
            value={activeTab}
            onChange={(key) => onSelectTab(key as OverviewTabId)}
            label="Overview categories"
            mobileIconOnlyInactive
            className="w-full"
          />
        </div>

        <Tooltip delay={0}>
          <Button
            isIconOnly
            variant={isEditMode ? 'primary' : 'tertiary'}
            aria-label={isEditMode ? 'Done customizing' : 'Customize widgets'}
            className="h-11 w-11 shrink-0 md:hidden"
            onPress={onToggleEditMode}
          >
            <HugeiconsIcon icon={isEditMode ? CheckmarkCircle02Icon : PencilEdit01Icon} size={18} />
          </Button>
          <Tooltip.Content placement="bottom">
            {isEditMode ? 'Done customizing' : 'Customize widgets'}
          </Tooltip.Content>
        </Tooltip>

        <Button
          size="sm"
          variant={isEditMode ? 'primary' : 'tertiary'}
          className="hidden h-10 shrink-0 md:inline-flex"
          onPress={onToggleEditMode}
        >
          <HugeiconsIcon icon={isEditMode ? CheckmarkCircle02Icon : PencilEdit01Icon} size={16} />
          {isEditMode ? 'Done' : 'Customize'}
        </Button>
      </div>

      {isEditMode ? (
        <BlurFade duration={0.2} offset={4}>
          <section
            aria-label="Customize Overview"
            className="pro-surface flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="pro-soft grid size-9 shrink-0 place-items-center rounded-xl">
                <HugeiconsIcon icon={PencilEdit01Icon} size={18} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Customize Overview</h2>
                  <Badge
                    size="sm"
                    variant="soft"
                    color="accent"
                    className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
                  >
                    <Badge.Label>Edit mode</Badge.Label>
                  </Badge>
                </div>
                <p className="text-xs text-muted">
                  Reorder widgets, drag any widget corner to resize, or group the All tab into sections.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex min-h-10 items-center gap-2 rounded-full bg-default/55 px-3 py-1.5 md:min-h-9">
                <HugeiconsIcon
                  icon={Layers01Icon}
                  size={15}
                  className={groupBySections ? 'text-[var(--accent)]' : 'text-muted'}
                />
                <span className="text-xs font-medium text-foreground">Group by sections</span>
                <Switch
                  size="sm"
                  isSelected={groupBySections}
                  onChange={() => onToggleGroupBySections()}
                  aria-label="Group All tab widgets by sections"
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>

              <Button size="sm" variant="primary" className="min-h-10 md:min-h-9" onPress={onOpenAddWidgets}>
                <HugeiconsIcon icon={AddCircleIcon} size={16} />
                Add widgets
                {hiddenWidgetsCount > 0 ? (
                  <Badge
                    size="sm"
                    variant="soft"
                    color="default"
                    className="static transform-none! min-h-4.5 min-w-0 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold"
                  >
                    <Badge.Label>+{hiddenWidgetsCount}</Badge.Label>
                  </Badge>
                ) : null}
              </Button>

              <Button size="sm" variant="tertiary" className="min-h-10 md:min-h-9" onPress={onToggleHideBadges}>
                <HugeiconsIcon icon={hideBadges ? ViewIcon : ViewOffSlashIcon} size={16} />
                {hideBadges ? 'Show status pills' : 'Hide status pills'}
              </Button>

              <Button size="sm" variant="tertiary" className="min-h-10 md:min-h-9" onPress={onResetLayout}>
                <HugeiconsIcon icon={RotateLeft01Icon} size={16} />
                Reset layout
              </Button>

            </div>
          </section>
        </BlurFade>
      ) : null}
    </div>
  );
}
