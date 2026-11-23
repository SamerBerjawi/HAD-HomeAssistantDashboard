/**
 * Pro Energy page (docs/pro-ui/DESIGN.md 7.9, docs/pro-ui/ENERGY.md).
 * Renders the 11 owner-chosen section designs from live/demo Home Assistant energy statistics,
 * with Live now above Period bar, Kokonut SmoothTab tabs on phone (< 768 px), scrolling 2-col
 * tablet / 12-col desktop grid, and persistent section customisation (`preferences.proEnergy`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon, RefreshIcon, SlidersHorizontalIcon, SolarPanel01Icon } from '@hugeicons/core-free-icons';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useEnergyComparison } from '@/hooks/useEnergyComparison';
import { useEnergyData } from '@/hooks/useEnergyData';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useProPageHeader } from '../components/pageHeaderContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  buildLiveEnergySnapshot,
  buildPhoneTabs,
  computeCustomPresetDates,
  DEFAULT_ENERGY_ORDER,
  ENERGY_SECTIONS,
  readEnergyPrefs,
  visibleSections,
  writeEnergyPrefs,
  type CustomRangePresetId,
  type EnergySectionId,
  type PhoneTabId
} from '../lib/energyPage';
import { SmoothTab } from '../ui/kokonutui/SmoothTab';
import { useEnergyStore } from '../widgets/energy/energyStore';
import { BatteryB } from './energy/studio/concepts/BatteryConcepts';
import { CostsA, CostsC } from './energy/studio/concepts/CostsConcepts';
import { DevicesA, DevicesB } from './energy/studio/concepts/DevicesConcepts';
import { FlowA, FlowC } from './energy/studio/concepts/FlowConcepts';
import { ImpactB } from './energy/studio/concepts/ImpactConcepts';
import { LiveNowB, LiveNowC } from './energy/studio/concepts/LiveNowConcepts';
import { PeriodBarB, PeriodBarC } from './energy/studio/concepts/PeriodBarConcepts';
import { SolarA, SolarB } from './energy/studio/concepts/SolarConcepts';
import { SummaryB, SummaryC } from './energy/studio/concepts/SummaryConcepts';
import { UsageA } from './energy/studio/concepts/UsageConcepts';
import { UtilitiesA, UtilitiesC } from './energy/studio/concepts/UtilitiesConcepts';
import type { StudioSectionActions } from './energy/studio/concepts/types';
import { EnergyCustomizeSheet } from './energy/studio/EnergyCustomizeSheet';

function desktopSpanClass(id: EnergySectionId, visibleSet: ReadonlySet<EnergySectionId>): string {
  if (id === 'summary' || id === 'usage' || id === 'flow') return 'col-span-12';
  if (id === 'solar') return visibleSet.has('battery') ? 'col-span-6' : 'col-span-12';
  if (id === 'battery') return visibleSet.has('solar') ? 'col-span-6' : 'col-span-12';
  if (id === 'devices') return visibleSet.has('costs') ? 'col-span-6' : 'col-span-12';
  if (id === 'costs') return visibleSet.has('devices') ? 'col-span-6' : 'col-span-12';
  if (id === 'utilities') return visibleSet.has('impact') ? 'col-span-8' : 'col-span-12';
  if (id === 'impact') return visibleSet.has('utilities') ? 'col-span-4' : 'col-span-12';
  return 'col-span-12';
}

export default function ProEnergy() {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)');

  const { config, updateConfig } = useUserConfig();
  const energy = useEnergyData();
  const compare = useEnergyComparison({
    period: energy.period,
    targetDate: energy.targetDate,
    customRange: energy.customRange,
    resolvedEntityIds: energy.resolvedEntityIds,
    preferences: energy.preferences,
    currency: energy.currency
  });

  const { states, resolvedEntities, areas, floors } = useAutoLayoutStore(
    useShallow((s) => ({
      states: s.states,
      resolvedEntities: s.resolvedEntities,
      areas: s.areas,
      floors: s.floors
    }))
  );

  const [customizing, setCustomizing] = useState(false);
  const [activePreset, setActivePreset] = useState<CustomRangePresetId | null>(null);
  const [phoneTab, setPhoneTab] = useState<PhoneTabId>('summary');

  const prefs = useMemo(() => readEnergyPrefs(config.preferences), [config.preferences]);

  const snap = useMemo(
    () =>
      buildLiveEnergySnapshot({
        period: energy.period,
        dateLabel: energy.dateLabel,
        isAtFutureLimit: energy.isAtFutureLimit,
        currency: energy.currency,
        energyModel: energy.model,
        realtime: energy.realtime,
        states,
        resolvedEntities,
        areas,
        floors,
        compareEnabled: compare.isCompareEnabled,
        compareYear: compare.compareYear,
        availableYears: compare.availableYears,
        compareBuckets: compare.compareBuckets,
        compareTotals: compare.compareTotals
      }),
    [
      energy.period,
      energy.dateLabel,
      energy.isAtFutureLimit,
      energy.currency,
      energy.model,
      energy.realtime,
      states,
      resolvedEntities,
      areas,
      floors,
      compare.isCompareEnabled,
      compare.compareYear,
      compare.availableYears,
      compare.compareBuckets,
      compare.compareTotals
    ]
  );

  // Sync Energy page telemetry into the shared Overview energyStore.
  const publishEnergyStore = useEnergyStore((s) => s.publish);
  const lastPublishedRef = useRef('');
  useEffect(() => {
    const key = JSON.stringify(snap.model);
    if (key === lastPublishedRef.current) return;
    lastPublishedRef.current = key;
    publishEnergyStore({ model: snap.model });
  }, [snap.model, publishEnergyStore]);

  useEffect(() => {
    publishEnergyStore({ load: energy.loadState, setPeriod: energy.setPeriod });
  }, [energy.loadState, energy.setPeriod, publishEnergyStore]);

  const refreshRef = useRef(energy.refresh);
  refreshRef.current = energy.refresh;
  const headerMenu = useMemo(
    () => [
      { id: 'customise', label: 'Customise page', icon: SlidersHorizontalIcon, onAction: () => setCustomizing(true) },
      { id: 'refresh', label: 'Refresh statistics', icon: RefreshIcon, onAction: () => void refreshRef.current() }
    ],
    []
  );
  useProPageHeader({ menu: headerMenu });

  const savePrefs = useCallback(
    (nextOrder: readonly EnergySectionId[], nextHidden: ReadonlySet<EnergySectionId>) => {
      void updateConfig({
        preferences: writeEnergyPrefs(config.preferences as Record<string, unknown> | undefined, {
          order: nextOrder,
          hidden: nextHidden
        }) as typeof config.preferences
      });
    },
    [config.preferences, updateConfig]
  );

  const handleMoveSection = useCallback(
    (id: EnergySectionId, dir: -1 | 1) => {
      const idx = prefs.order.indexOf(id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prefs.order.length) return;
      const next = [...prefs.order];
      [next[idx], next[target]] = [next[target], next[idx]];
      savePrefs(next, prefs.hidden);
    },
    [prefs.hidden, prefs.order, savePrefs]
  );

  const handleToggleHidden = useCallback(
    (id: EnergySectionId) => {
      const next = new Set(prefs.hidden);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      savePrefs(prefs.order, next);
    },
    [prefs.hidden, prefs.order, savePrefs]
  );

  const handleResetPrefs = useCallback(() => {
    savePrefs(DEFAULT_ENERGY_ORDER, new Set());
  }, [savePrefs]);

  const actions = useMemo<StudioSectionActions>(
    () => ({
      onPeriod: (p) => {
        if (p === 'custom') {
          const preset = activePreset ?? 'last7';
          const range = computeCustomPresetDates(preset);
          setActivePreset(preset);
          energy.setCustomRange(range.start, range.end);
          return;
        }
        setActivePreset(null);
        energy.setPeriod(p);
      },
      onShiftDate: (dir) => {
        setActivePreset(null);
        energy.shiftPeriod(dir);
      },
      onToggleCompare: () => compare.toggleCompare(),
      onCompareYear: (y) => compare.setCompareYear(y),
      onOpenCustomize: () => setCustomizing(true),
      onRefresh: () => void energy.refresh(),
      onCustomPreset: (preset) => {
        const range = computeCustomPresetDates(preset);
        setActivePreset(preset);
        energy.setCustomRange(range.start, range.end);
      },
      activePreset,
      isFetching: energy.isFetchingStats,
      isCompareLoading: compare.isLoadingCompare
    }),
    [activePreset, compare, energy]
  );

  const visible = useMemo(() => visibleSections(prefs.order, prefs.hidden, snap), [prefs.order, prefs.hidden, snap]);
  const topSections = useMemo(() => visible.filter((id) => id === 'live' || id === 'period'), [visible]);
  const bodySections = useMemo(() => visible.filter((id) => id !== 'live' && id !== 'period'), [visible]);
  const bodySet = useMemo(() => new Set(bodySections), [bodySections]);

  const tabMap = useMemo(
    () => Object.fromEntries(ENERGY_SECTIONS.map((s) => [s.id, s.phoneTab])) as Record<EnergySectionId, PhoneTabId | null>,
    []
  );
  const phoneTabs = useMemo(() => buildPhoneTabs(bodySections, tabMap), [bodySections, tabMap]);
  useEffect(() => {
    if (phoneTabs.length > 0 && !phoneTabs.some((t) => t.id === phoneTab)) {
      setPhoneTab(phoneTabs[0].id);
    }
  }, [phoneTab, phoneTabs]);

  const renderSection = (id: EnergySectionId, compact: boolean) => {
    switch (id) {
      case 'live':
        return compact ? <LiveNowC snap={snap} actions={actions} compact /> : <LiveNowB snap={snap} actions={actions} />;
      case 'period':
        return compact ? <PeriodBarC snap={snap} actions={actions} compact /> : <PeriodBarB snap={snap} actions={actions} />;
      case 'summary':
        return compact ? <SummaryC snap={snap} actions={actions} compact /> : <SummaryB snap={snap} actions={actions} />;
      case 'usage':
        return <UsageA snap={snap} actions={actions} compact={compact} />;
      case 'solar':
        return compact ? <SolarA snap={snap} actions={actions} compact /> : <SolarB snap={snap} actions={actions} />;
      case 'battery':
        return <BatteryB snap={snap} actions={actions} compact={compact} />;
      case 'flow':
        return compact ? <FlowC snap={snap} actions={actions} compact /> : <FlowA snap={snap} actions={actions} />;
      case 'devices':
        return compact ? <DevicesB snap={snap} actions={actions} compact /> : <DevicesA snap={snap} actions={actions} />;
      case 'costs':
        return compact ? <CostsA snap={snap} actions={actions} compact /> : <CostsC snap={snap} actions={actions} />;
      case 'utilities':
        return compact ? <UtilitiesC snap={snap} actions={actions} compact /> : <UtilitiesA snap={snap} actions={actions} />;
      case 'impact':
        return <ImpactB snap={snap} actions={actions} compact={compact} />;
    }
  };

  if (energy.loadState === 'unconfigured') {
    return (
      <div className="pro-surface mx-auto flex max-w-lg flex-col items-start gap-4 p-6">
        <span className="pro-soft grid size-11 place-items-center rounded-2xl">
          <HugeiconsIcon icon={SolarPanel01Icon} size={22} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Energy not set up in Home Assistant</h2>
          <p className="text-sm text-muted">
            Configure your grid meter, solar panels, or home battery under Home Assistant → Settings → Dashboards → Energy, then check again.
          </p>
        </div>
        <Button size="sm" variant="primary" onPress={() => void energy.refresh()} className="gap-1.5">
          <HugeiconsIcon icon={RefreshIcon} size={15} />
          Check again
        </Button>
      </div>
    );
  }

  if (energy.loadState === 'loading' && !energy.hasLoadedInitial) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading Home Assistant energy statistics">
        <div className="pro-surface flex items-center gap-2 p-4 text-sm text-muted">
          <HugeiconsIcon icon={RefreshIcon} size={16} className="animate-spin text-[var(--accent)]" />
          Loading Home Assistant energy statistics…
        </div>
        <div className="pro-surface h-36 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="pro-surface h-44 animate-pulse" />
          <div className="pro-surface h-44 animate-pulse" />
        </div>
      </div>
    );
  }

  if (energy.loadState === 'error' && energy.error && !energy.hasLoadedInitial) {
    return (
      <div className="pro-surface mx-auto flex max-w-lg flex-col items-start gap-4 p-6">
        <span className="grid size-11 place-items-center rounded-2xl bg-danger/15 text-danger">
          <HugeiconsIcon icon={AlertCircleIcon} size={22} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Couldn’t load Energy statistics</h2>
          <p className="text-sm text-muted">{energy.error}</p>
        </div>
        <Button size="sm" variant="primary" onPress={() => void energy.refresh()} className="gap-1.5">
          <HugeiconsIcon icon={RefreshIcon} size={15} />
          Try again
        </Button>
      </div>
    );
  }

  const activePhoneDef = phoneTabs.find((t) => t.id === phoneTab) ?? phoneTabs[0];

  return (
    <>
      <div className={cn('flex flex-col gap-4 transition-opacity duration-150', energy.isFetchingStats && 'opacity-85')}>
        {topSections.map((id) => (
          <div key={id}>{renderSection(id, isPhone)}</div>
        ))}

        {bodySections.length === 0 ? (
          <div className="pro-surface flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-muted">All Energy sections are hidden.</p>
            <Button size="sm" variant="primary" onPress={() => setCustomizing(true)} className="gap-1.5">
              <HugeiconsIcon icon={SlidersHorizontalIcon} size={14} />
              Customise sections
            </Button>
          </div>
        ) : isPhone ? (
          <div className="flex flex-col gap-3">
            {phoneTabs.length > 0 ? (
              <SmoothTab
                items={phoneTabs.map((t) => ({ id: t.id, title: t.title, icon: t.icon }))}
                value={activePhoneDef?.id}
                onChange={(id) => setPhoneTab(id as PhoneTabId)}
                label="Energy sections"
              />
            ) : null}
            {activePhoneDef ? (
              <div className="flex flex-col gap-3">
                {activePhoneDef.sections.map((id) => (
                  <div key={id}>{renderSection(id, true)}</div>
                ))}
              </div>
            ) : null}
          </div>
        ) : isTablet ? (
          <div className="grid grid-cols-2 items-start gap-4">
            {bodySections.map((id, i) => {
              const meta = ENERGY_SECTIONS.find((s) => s.id === id);
              const fullSpan = meta?.desktopSpan === 'full' || meta?.desktopSpan === 'wide';
              const isOddTrailing = !fullSpan && i === bodySections.length - 1;
              return (
                <div key={id} className={cn(fullSpan || isOddTrailing ? 'col-span-2' : 'col-span-1')}>
                  {renderSection(id, false)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-12 items-start gap-4">
            {bodySections.map((id) => (
              <div key={id} className={desktopSpanClass(id, bodySet)}>
                {renderSection(id, false)}
              </div>
            ))}
          </div>
        )}
      </div>

      <EnergyCustomizeSheet
        isOpen={customizing}
        onOpenChange={setCustomizing}
        order={prefs.order}
        hidden={prefs.hidden}
        snap={snap}
        onMove={handleMoveSection}
        onToggleHidden={handleToggleHidden}
        onReset={handleResetPrefs}
        subtitle="Hide or reorder Energy sections across your screens"
        unavailableLabel="Not configured in Home Assistant"
      />
    </>
  );
}
