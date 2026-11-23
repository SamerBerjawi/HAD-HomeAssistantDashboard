/**
 * Energy Studio (docs/pro-ui/ENERGY.md §2). Dev only: /?studio=energy.
 * Compares Concepts A · Calm Editorial, B · Adaptive Ambient, and C · Precision Telemetry across all
 * 11 Energy sections + edge states, with live interactive period/compare/customise controls on sample
 * data only (never touches Home Assistant) and responsive previews at 375–1920 px in light/dark.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  FlashIcon,
  InformationCircleIcon,
  Moon02Icon,
  PaintBoardIcon,
  StarIcon,
  Sun01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { EnergyStatesPreview } from './concepts/ImpactConcepts';
import type { StudioSectionActions } from './concepts/types';
import { ENERGY_CATALOG, type ConceptId } from './energyCatalog';
import { isSectionAvailable } from './energyParts';
import { EnergyCustomizeSheet } from './EnergyCustomizeSheet';
import { EnergyPagePreview, type PagePreviewMode } from './EnergyPagePreview';
import {
  buildStudioEnergySnapshot,
  ENERGY_SECTIONS,
  STUDIO_STATES,
  type EnergySectionId,
  type StudioEnergyStateId,
  type StudioPeriod
} from './studioEnergy';
import { useEnergyPicks, type SectionChoice } from './useEnergyPicks';

const WIDTHS = [
  { id: '375', label: 'Phone 375', content: 343 },
  { id: '768', label: 'Tablet 768', content: 640 },
  { id: '1024', label: 'Small desktop 1024', content: 740 },
  { id: '1440', label: 'Desktop 1440', content: 1140 },
  { id: '1920', label: 'Large 1920', content: 1620 }
] as const;

type WidthId = (typeof WIDTHS)[number]['id'];
type Theme = 'light' | 'dark' | 'both';
type StudioView = 'section' | 'page';
type SectionOrStates = EnergySectionId | 'states';
type PageDesignView = PagePreviewMode | 'compare';

const DEFAULT_ORDER: EnergySectionId[] = ENERGY_SECTIONS.map((s) => s.id);

function EnergyStage({ dark, children, className }: { dark: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn(dark && 'dark')}>
      <div className={cn('pro rounded-2xl bg-[var(--background)] p-4 text-foreground', className)} data-page="energy">
        {children}
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { id: T; text: string; icon?: IconSvgElement }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <ToggleButtonGroup
        aria-label={label}
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        className="flex-wrap"
        selectedKeys={new Set([value])}
        onSelectionChange={(keys) => {
          const hit = options.find((o) => o.id === [...keys][0]);
          if (hit) onChange(hit.id);
        }}
      >
        {options.map((o) => (
          <ToggleButton key={o.id} id={o.id} className="gap-1.5 text-xs">
            {o.icon ? <HugeiconsIcon icon={o.icon} size={14} /> : null}
            {o.text}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

export default function EnergyStudio() {
  const [view, setView] = useState<StudioView>('section');
  const [sectionId, setSectionId] = useState<SectionOrStates>('live');
  const [pageView, setPageView] = useState<PageDesignView>('picks');
  const [stateId, setStateId] = useState<StudioEnergyStateId>('sunny');
  const [period, setPeriod] = useState<StudioPeriod>('day');
  const [dateOffset, setDateOffset] = useState(0);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareYear, setCompareYear] = useState(2025);
  const [theme, setTheme] = useState<Theme>('dark');
  const [widthId, setWidthId] = useState<WidthId>('1440');
  const [order, setOrder] = useState<EnergySectionId[]>(DEFAULT_ORDER);
  const [hidden, setHidden] = useState<Set<EnergySectionId>>(() => new Set());
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const { state: picksState, pickedCount, copiedId, getSectionPick, setSectionPick, setPageNotes, copySection, copyAll } = useEnergyPicks();

  // Keep studio chrome light; each preview stage owns its own light/dark class.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  const snap = useMemo(
    () => buildStudioEnergySnapshot({ stateId, period, dateOffset, compareEnabled, compareYear }),
    [stateId, period, dateOffset, compareEnabled, compareYear]
  );

  const actions = useMemo<StudioSectionActions>(
    () => ({
      onPeriod: (p) => {
        setPeriod(p);
        setDateOffset(0);
      },
      onShiftDate: (dir) => setDateOffset((d) => Math.min(0, d + dir)),
      onToggleCompare: () => setCompareEnabled((v) => !v),
      onCompareYear: (y) => setCompareYear(y),
      onOpenCustomize: () => setCustomizeOpen(true),
      onRefresh: () => setDateOffset((d) => d)
    }),
    []
  );

  const moveSection = useCallback((id: EnergySectionId, dir: -1 | 1) => {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  }, []);

  const toggleHidden = useCallback((id: EnergySectionId) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const width = WIDTHS.find((w) => w.id === widthId)?.content ?? 1140;
  const isCompact = width < 600;
  const themes = theme === 'both' ? [true, false] : [theme === 'dark'];
  const activeCatalogEntry = sectionId !== 'states' ? ENERGY_CATALOG.find((e) => e.id === sectionId) : null;
  const currentPick = activeCatalogEntry ? getSectionPick(activeCatalogEntry.id) : null;

  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="energy">
      <main className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="energy" />
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="pro-soft grid size-11 shrink-0 place-items-center rounded-2xl">
              <HugeiconsIcon icon={FlashIcon} size={22} />
            </span>
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold">Energy Studio</h1>
              <p className="mt-1 text-sm text-muted">
                Compare distinct A, B, and C design concepts across all 11 Energy sections and preview the assembled Energy page at every width. Previews run on sample data only — nothing calls Home Assistant.
              </p>
            </div>
          </div>
          <Chip size="md" variant="soft" color={pickedCount === ENERGY_CATALOG.length ? 'success' : 'accent'}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
            <Chip.Label>
              {pickedCount} / {ENERGY_CATALOG.length} sections picked
            </Chip.Label>
          </Chip>
        </header>

        <section aria-label="Studio controls" className="pro-surface flex flex-wrap gap-4 p-4">
          <Segmented
            label="View"
            value={view}
            onChange={(v) => setView(v)}
            options={[
              { id: 'section', text: 'By section' },
              { id: 'page', text: 'Full page' }
            ]}
          />
          <Segmented
            label="Home state"
            value={stateId}
            onChange={(id) => {
              setStateId(id);
              if (id === 'states') setSectionId('states');
            }}
            options={STUDIO_STATES.map((s) => ({ id: s.id, text: s.label }))}
          />
          <Segmented
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { id: 'dark', text: 'Dark', icon: Moon02Icon },
              { id: 'light', text: 'Light', icon: Sun01Icon },
              { id: 'both', text: 'Both', icon: PaintBoardIcon }
            ]}
          />
          <Segmented
            label="Screen (content width)"
            value={widthId}
            onChange={setWidthId}
            options={WIDTHS.map((w) => ({ id: w.id, text: w.label }))}
          />
          {view === 'section' ? (
            <Segmented
              label="Section"
              value={sectionId}
              onChange={setSectionId}
              options={[
                ...ENERGY_CATALOG.map((e) => ({
                  id: e.id as SectionOrStates,
                  text: e.title,
                  icon: picksState.sections[e.id]?.concept ? CheckmarkCircle02Icon : ENERGY_SECTIONS.find((s) => s.id === e.id)?.icon
                })),
                { id: 'states' as SectionOrStates, text: 'States', icon: InformationCircleIcon }
              ]}
            />
          ) : (
            <Segmented
              label="Page design"
              value={pageView}
              onChange={setPageView}
              options={[
                { id: 'picks', text: 'My picks' },
                { id: 'A', text: 'Concept A' },
                { id: 'B', text: 'Concept B' },
                { id: 'C', text: 'Concept C' },
                { id: 'compare', text: 'Compare A/B/C' }
              ]}
            />
          )}
        </section>

        {view === 'section' ? (
          sectionId === 'states' ? (
            <section className="pro-surface flex flex-col gap-4 p-5">
              <header>
                <h2 className="text-xl font-semibold">Async & empty edge states</h2>
                <p className="mt-1 text-sm text-muted">
                  Shown when Home Assistant has no Energy configuration, while statistics load on first visit, or when recorder history errors.
                </p>
              </header>
              {themes.map((dark) => (
                <EnergyStage key={String(dark)} dark={dark} className="overflow-x-auto">
                  <div style={{ width }}>
                    <EnergyStatesPreview compact={isCompact} onRefresh={actions.onRefresh} />
                  </div>
                </EnergyStage>
              ))}
            </section>
          ) : activeCatalogEntry && currentPick ? (
            <section aria-labelledby={`sec-${activeCatalogEntry.id}`} className="pro-surface flex flex-col gap-5 p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl">
                  <h2 id={`sec-${activeCatalogEntry.id}`} className="flex items-center gap-2 text-xl font-semibold">
                    <HugeiconsIcon icon={ENERGY_SECTIONS.find((s) => s.id === activeCatalogEntry.id)?.icon ?? FlashIcon} size={20} className="text-[var(--accent)]" />
                    {activeCatalogEntry.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{activeCatalogEntry.job}</p>
                </div>
                <Chip size="sm" variant="soft" color={currentPick.concept ? 'success' : 'accent'}>
                  <Chip.Label>
                    {currentPick.concept
                      ? `Approved · ${currentPick.concept === 'mix' ? 'Mix' : `Concept ${currentPick.concept}`}`
                      : `Recommended · ${activeCatalogEntry.recommended}`}
                  </Chip.Label>
                </Chip>
              </header>

              {!isSectionAvailable(activeCatalogEntry.id, snap) ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-xs">
                  <span>This section is hidden in the <b>Grid only</b> home state because HA has no sensors for it.</span>
                  <Button size="sm" variant="secondary" onPress={() => setStateId('sunny')}>
                    Switch to Sunny afternoon
                  </Button>
                </div>
              ) : null}

              {activeCatalogEntry.concepts.map((c) => {
                const isApproved = currentPick.concept === c.id;
                const Comp = c.Component;
                return (
                  <article
                    key={c.id}
                    className={cn(
                      'flex min-w-0 flex-col gap-3 rounded-2xl p-4',
                      isApproved ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40'
                    )}
                  >
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">
                          {c.id} · {c.name}
                        </h3>
                        {activeCatalogEntry.chosen.desktop === c.id || activeCatalogEntry.chosen.mobile === c.id ? (
                          <Chip size="sm" variant="soft" color="success">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                            <Chip.Label>
                              {activeCatalogEntry.chosen.desktop === c.id && activeCatalogEntry.chosen.mobile === c.id
                                ? 'In production'
                                : activeCatalogEntry.chosen.desktop === c.id
                                  ? 'In production · Desktop'
                                  : 'In production · Mobile'}
                            </Chip.Label>
                          </Chip>
                        ) : activeCatalogEntry.recommended === c.id ? (
                          <Chip size="sm" variant="soft" color="accent">
                            <HugeiconsIcon icon={StarIcon} size={12} />
                            <Chip.Label>Recommended</Chip.Label>
                          </Chip>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant={isApproved ? 'primary' : 'secondary'}
                        onPress={() => setSectionPick(activeCatalogEntry.id, { ...currentPick, concept: isApproved ? null : c.id })}
                      >
                        {isApproved ? 'Approved' : `Approve ${c.id}`}
                      </Button>
                    </header>

                    <div className="grid gap-3 text-sm lg:grid-cols-[1.2fr_1fr_1fr]">
                      <p className="text-muted">{c.idea}</p>
                      <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs">
                        {c.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                      <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted">
                        {c.tradeoffs.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    {themes.map((dark) => (
                      <EnergyStage key={String(dark)} dark={dark} className="overflow-x-auto">
                        <div style={{ width }}>
                          <Comp snap={snap} actions={actions} compact={isCompact} />
                        </div>
                      </EnergyStage>
                    ))}
                  </article>
                );
              })}

              <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
                <p className="text-sm">
                  <span className="font-semibold">Recommendation: {activeCatalogEntry.recommended}.</span> {activeCatalogEntry.why}
                </p>
                <Segmented<string>
                  label="Your choice for this section"
                  value={currentPick.concept ?? 'none'}
                  onChange={(val) =>
                    setSectionPick(activeCatalogEntry.id, {
                      ...currentPick,
                      concept: val === 'none' ? null : (val as SectionChoice)
                    })
                  }
                  options={[
                    { id: 'none', text: 'Not yet' },
                    ...activeCatalogEntry.concepts.map((c) => ({ id: c.id, text: `${c.id} · ${c.name}` })),
                    { id: 'mix', text: 'Mix' }
                  ]}
                />
                <TextArea
                  aria-label={`Notes for ${activeCatalogEntry.title}`}
                  placeholder="Notes: what to keep, mix, or adjust (e.g. A with B's gauge)"
                  value={currentPick.notes}
                  onChange={(e) => setSectionPick(activeCatalogEntry.id, { ...currentPick, notes: e.target.value })}
                  rows={2}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={!currentPick.concept}
                    onPress={() => void copySection(activeCatalogEntry.id)}
                    className="gap-1.5"
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={14} />
                    {copiedId === activeCatalogEntry.id ? 'Copied' : 'Copy section pick'}
                  </Button>
                </div>
              </div>
            </section>
          ) : null
        ) : (
          <div
            className={cn(
              'flex min-w-0 flex-col gap-6',
              pageView === 'compare' && width < 400 && 'grid grid-cols-[repeat(3,minmax(0,max-content))] items-start overflow-x-auto'
            )}
          >
            {(pageView === 'compare' ? (['A', 'B', 'C'] as const) : [pageView]).map((mode) => (
              <section key={mode} className="pro-surface flex min-w-0 flex-col gap-4 p-4">
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">
                    {mode === 'picks'
                      ? 'Assembled page · Your picks (recommended where pending)'
                      : mode === 'A'
                      ? 'Design A · Calm Editorial'
                      : mode === 'B'
                      ? 'Design B · Adaptive Ambient'
                      : 'Design C · Precision Telemetry'}
                  </h2>
                  <Chip size="sm" variant="soft" color="accent">
                    <Chip.Label>{isCompact ? 'Phone tabs (< 600 px)' : width < 1000 ? 'Tablet 2-col scroll' : 'Desktop 12-col scroll'}</Chip.Label>
                  </Chip>
                </header>
                {themes.map((dark) => (
                  <EnergyStage key={String(dark)} dark={dark} className="overflow-x-auto">
                    <EnergyPagePreview
                      mode={mode}
                      snap={snap}
                      actions={actions}
                      width={width}
                      order={order}
                      hidden={hidden}
                      picks={picksState.sections}
                    />
                  </EnergyStage>
                ))}
              </section>
            ))}
          </div>
        )}

        <section aria-label="Your Energy Studio picks" className="pro-surface flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Your picks ({pickedCount} / {ENERGY_CATALOG.length})</h2>
            <Button size="sm" variant="primary" onPress={() => void copyAll()} className="gap-1.5">
              <HugeiconsIcon icon={Copy01Icon} size={14} />
              {copiedId === 'all' ? 'Copied all picks' : 'Copy all picks for the chat'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ENERGY_CATALOG.map((entry) => {
              const p = picksState.sections[entry.id];
              return (
                <Button
                  key={entry.id}
                  size="sm"
                  variant={p?.concept ? 'secondary' : 'ghost'}
                  onPress={() => {
                    setView('section');
                    setSectionId(entry.id);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <HugeiconsIcon
                    icon={p?.concept ? CheckmarkCircle02Icon : ENERGY_SECTIONS.find((s) => s.id === entry.id)?.icon ?? FlashIcon}
                    size={13}
                  />
                  {entry.title}: {p?.concept ?? `pending (${entry.recommended})`}
                </Button>
              );
            })}
          </div>
          <TextArea
            aria-label="Overall Energy page notes"
            placeholder="Overall notes across the Energy page..."
            value={picksState.pageNotes}
            onChange={(e) => setPageNotes(e.target.value)}
            rows={2}
          />
        </section>
      </main>

      <EnergyCustomizeSheet
        isOpen={customizeOpen}
        onOpenChange={setCustomizeOpen}
        order={order}
        hidden={hidden}
        snap={snap}
        onMove={moveSection}
        onToggleHidden={toggleHidden}
        onReset={() => {
          setOrder(DEFAULT_ORDER);
          setHidden(new Set());
        }}
      />
    </div>
  );
}
