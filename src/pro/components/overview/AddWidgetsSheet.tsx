import { useMemo, useState } from 'react';
import { Button, SearchField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AddCircleIcon,
  ArrowExpand01Icon,
  BulbIcon,
  DashboardSquare01Icon,
  FilterIcon,
  FlashIcon,
  MusicNote01Icon,
  RotateLeft01Icon,
  Search01Icon,
  Shield01Icon,
  SunCloud02Icon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import type { OverviewTileVisibilityMode } from '@/types/userConfig';
import {
  getProWidgetSize,
  getProWidgetVisibilityMode,
  proWidgetSizeLabel,
  type ProWidgetCatalogItem,
  type ProWidgetCategory
} from '../../lib/overviewWidgets';
import { ProSheet } from '../ProSheet';
import { widgetIcon } from './widgetIcons';

const CATEGORIES: { id: ProWidgetCategory; label: string; icon: IconSvgElement }[] = [
  { id: 'all', label: 'All', icon: DashboardSquare01Icon },
  { id: 'weather', label: 'Weather', icon: SunCloud02Icon },
  { id: 'controls', label: 'Controls', icon: BulbIcon },
  { id: 'security', label: 'Security', icon: Shield01Icon },
  { id: 'energy', label: 'Energy', icon: FlashIcon },
  { id: 'media', label: 'Media', icon: MusicNote01Icon }
];

interface AddWidgetsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: ProWidgetCatalogItem[];
  tileSizes: Record<string, string> | undefined;
  hiddenTilesSet: Set<string>;
  hiddenFromAllSet: Set<string>;
  onCycleSize: (widgetId: string) => void;
  onSetVisibilityMode: (widgetId: string, mode: OverviewTileVisibilityMode) => void;
  onShowAllWidgets: () => void;
  onResetLayout: () => void;
}

/**
 * Add, resize, and toggle visibility for Overview widgets (docs/pro-ui/DESIGN.md 7.6).
 */
export function AddWidgetsSheet({
  isOpen,
  onOpenChange,
  catalog,
  tileSizes,
  hiddenTilesSet,
  hiddenFromAllSet,
  onCycleSize,
  onSetVisibilityMode,
  onShowAllWidgets,
  onResetLayout
}: AddWidgetsSheetProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProWidgetCategory>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    });
  }, [catalog, category, query]);

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Overview widgets"
      icon={DashboardSquare01Icon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex flex-col gap-3">
          <SearchField value={query} onChange={setQuery} fullWidth variant="secondary" aria-label="Search widgets">
            <SearchField.Group>
              <SearchField.SearchIcon>
                <HugeiconsIcon icon={Search01Icon} size={16} />
              </SearchField.SearchIcon>
              <SearchField.Input placeholder="Search widgets…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <ToggleButtonGroup
              aria-label="Widget category"
              size="sm"
              isDetached
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([category])}
              className="flex-wrap gap-1.5"
              onSelectionChange={(keys) => {
                const next = [...keys][0] as ProWidgetCategory | undefined;
                if (next) setCategory(next);
              }}
            >
              {CATEGORIES.map((c) => (
                <ToggleButton key={c.id} id={c.id} className="whitespace-nowrap">
                  <HugeiconsIcon icon={c.icon} size={14} />
                  {c.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="tertiary" onPress={onShowAllWidgets}>
                <HugeiconsIcon icon={ViewIcon} size={15} />
                Show all
              </Button>
              <Button size="sm" variant="tertiary" onPress={onResetLayout}>
                <HugeiconsIcon icon={RotateLeft01Icon} size={15} />
                Reset layout
              </Button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="pro-surface flex flex-col items-center gap-2 p-6 text-center">
            <HugeiconsIcon icon={AddCircleIcon} size={22} className="text-muted" />
            <p className="text-sm font-semibold text-foreground">No matching widgets</p>
            <p className="text-xs text-muted">Try another search or switch back to All categories.</p>
          </div>
        ) : (
          <ul className="flex max-h-[55vh] flex-col gap-2.5 overflow-y-auto pr-0.5">
            {filtered.map((item) => {
              const Icon = widgetIcon(item.id);
              const size = getProWidgetSize(tileSizes, item.id, catalog);
              const mode = getProWidgetVisibilityMode(item.id, hiddenTilesSet, hiddenFromAllSet);

              return (
                <li key={item.id} className="pro-surface flex flex-col gap-3 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="pro-soft grid size-9 shrink-0 place-items-center rounded-xl">
                        <HugeiconsIcon icon={Icon} size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted">{item.description}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="tertiary"
                      className="shrink-0"
                      aria-label={`Resize ${item.title} (currently ${proWidgetSizeLabel(size)})`}
                      onPress={() => onCycleSize(item.id)}
                    >
                      <HugeiconsIcon icon={ArrowExpand01Icon} size={14} />
                      {proWidgetSizeLabel(size)}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-separator pt-2.5">
                    <span className="text-xs font-medium text-muted">Visibility</span>
                    <ToggleButtonGroup
                      aria-label={`Visibility for ${item.title}`}
                      size="sm"
                      selectionMode="single"
                      disallowEmptySelection
                      selectedKeys={new Set([mode])}
                      onSelectionChange={(keys) => {
                        const next = [...keys][0] as OverviewTileVisibilityMode | undefined;
                        if (next) onSetVisibilityMode(item.id, next);
                      }}
                    >
                      <ToggleButton id="all_on">
                        <HugeiconsIcon icon={ViewIcon} size={14} />
                        All
                      </ToggleButton>
                      <ToggleButton id="tab_only">
                        <HugeiconsIcon icon={FilterIcon} size={14} />
                        Tab only
                      </ToggleButton>
                      <ToggleButton id="all_off">
                        <HugeiconsIcon icon={ViewOffSlashIcon} size={14} />
                        Hidden
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ProSheet>
  );
}
