/**
 * Security Studio (docs/pro-ui/SECURITY.md). Dev only: /?studio=security.
 * Compares 3 distinct visual concepts (A / B / C) across all 5 Security sections + edge states,
 * with live stand-in security actions (arm/disarm, lock/unlock, lock all, close garage, silence
 * sirens, switch camera), Light/Dark/Both theme stages, and 375–1920 px responsive widths.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Button, Chip, CloseButton, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  InformationCircleIcon,
  Moon02Icon,
  PaintBoardIcon,
  RefreshIcon,
  Shield01Icon,
  StarIcon,
  Sun01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { SecurityStatesPreview } from './concepts/DeviceGroupsConcepts';
import { SECURITY_CATALOG, type SecurityConceptId } from './securityCatalog';
import { SecurityPagePreview, type SecurityPagePreviewMode } from './SecurityPagePreview';
import {
  applySecurityAction,
  buildStudioSecuritySnapshot,
  SECURITY_SECTIONS,
  STUDIO_SECURITY_STATES,
  type SecuritySectionId,
  type StudioSecurityAction,
  type StudioSecuritySnapshot,
  type StudioSecurityStateId
} from './studioSecurity';
import { useSecurityPicks, type SecuritySectionChoice } from './useSecurityPicks';

const WIDTHS = [
  { id: '375', label: 'Phone 375', content: 343 },
  { id: '768', label: 'Tablet 768', content: 640 },
  { id: '1024', label: 'Small desktop 1024', content: 760 },
  { id: '1440', label: 'Desktop 1440', content: 1140 },
  { id: '1920', label: 'Large 1920', content: 1520 }
] as const;

type WidthId = (typeof WIDTHS)[number]['id'];
type Theme = 'light' | 'dark' | 'both';
type StudioView = 'section' | 'page';
type SectionOrStates = SecuritySectionId | 'states';
type PageDesignView = SecurityPagePreviewMode | 'compare';

function SecurityStage({ dark, children, className }: { dark: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn('w-fit max-w-full', dark && 'dark')}>
      <div className={cn('pro max-w-full overflow-x-auto rounded-2xl bg-[var(--background)] p-4 text-foreground', className)} data-page="security">
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

export default function SecurityStudio() {
  const [view, setView] = useState<StudioView>('section');
  const [sectionId, setSectionId] = useState<SectionOrStates>('alarm');
  const [pageView, setPageView] = useState<PageDesignView>('picks');
  const [stateId, setStateId] = useState<StudioSecurityStateId>('attention');
  const [snap, setSnap] = useState<StudioSecuritySnapshot>(() => buildStudioSecuritySnapshot('attention'));
  const [theme, setTheme] = useState<Theme>('dark');
  const [widthId, setWidthId] = useState<WidthId>('1440');

  const { state: picksState, pickedCount, copiedId, getSectionPick, setSectionPick, setPageNotes, copySection, copyAll } = useSecurityPicks();

  // Keep studio chrome light; preview stages own light/dark individually.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  const selectHomeState = useCallback((id: StudioSecurityStateId) => {
    setStateId(id);
    setSnap(buildStudioSecuritySnapshot(id));
    if (id === 'states') setSectionId('states');
  }, []);

  const dispatch = useCallback((action: StudioSecurityAction) => {
    setSnap((prev) => applySecurityAction(prev, action));
  }, []);

  const width = WIDTHS.find((w) => w.id === widthId)?.content ?? 1140;
  const isCompact = width < 600;
  const themes = theme === 'both' ? [true, false] : [theme === 'dark'];
  const activeEntry = sectionId !== 'states' ? SECURITY_CATALOG.find((e) => e.id === sectionId) : null;
  const currentPick = activeEntry ? getSectionPick(activeEntry.id) : null;

  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="security">
      <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="security" />

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="pro-soft grid size-11 shrink-0 place-items-center rounded-2xl">
              <HugeiconsIcon icon={Shield01Icon} size={22} />
            </span>
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold">Security Studio</h1>
              <p className="mt-1 text-sm text-muted">
                Compare 3 distinct concepts (A, B, C) across all 5 Security sections and preview the assembled page (scrolling on desktop/tablet, Alarm pinned above SmoothTab tabs on phone). All actions run on sample data only — never Home Assistant.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => setSnap(buildStudioSecuritySnapshot(stateId))}
              className="gap-1.5 text-xs"
            >
              <HugeiconsIcon icon={RefreshIcon} size={14} />
              Reset mock state
            </Button>
            <Chip size="md" variant="soft" color={pickedCount === SECURITY_CATALOG.length ? 'success' : 'accent'}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
              <Chip.Label>
                {pickedCount} / {SECURITY_CATALOG.length} sections picked
              </Chip.Label>
            </Chip>
          </div>
        </header>

        {snap.lastActionFeedback ? (
          <Alert status="accent">
            <Alert.Indicator>
              <HugeiconsIcon icon={Shield01Icon} size={16} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title className="text-xs">{snap.lastActionFeedback}</Alert.Title>
            </Alert.Content>
            <CloseButton aria-label="Dismiss simulation feedback" onPress={() => dispatch({ type: 'clearFeedback' })} />
          </Alert>
        ) : null}

        <section aria-label="Studio controls" className="pro-surface flex flex-wrap gap-4 p-4">
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { id: 'section', text: 'By section' },
              { id: 'page', text: 'Full page' }
            ]}
          />
          <Segmented
            label="Home state (resets mock)"
            value={stateId}
            onChange={selectHomeState}
            options={STUDIO_SECURITY_STATES.map((s) => ({ id: s.id, text: s.label }))}
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
                ...SECURITY_CATALOG.map((e) => ({
                  id: e.id as SectionOrStates,
                  text: e.title,
                  icon: picksState.sections[e.id]?.concept
                    ? CheckmarkCircle02Icon
                    : SECURITY_SECTIONS.find((s) => s.id === e.id)?.icon
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
                  Shown while Home Assistant initializes, when no security entities exist, or when a security service call fails.
                </p>
              </header>
              {themes.map((dark) => (
                <SecurityStage key={String(dark)} dark={dark} className="overflow-x-auto">
                  <div style={{ width }}>
                    <SecurityStatesPreview compact={isCompact} />
                  </div>
                </SecurityStage>
              ))}
            </section>
          ) : activeEntry && currentPick ? (
            <section aria-labelledby={`sec-${activeEntry.id}`} className="pro-surface flex flex-col gap-5 p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl">
                  <h2 id={`sec-${activeEntry.id}`} className="flex items-center gap-2 text-xl font-semibold">
                    <HugeiconsIcon
                      icon={SECURITY_SECTIONS.find((s) => s.id === activeEntry.id)?.icon ?? Shield01Icon}
                      size={20}
                      className="text-[var(--accent)]"
                    />
                    {activeEntry.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{activeEntry.job}</p>
                </div>
                <Chip size="sm" variant="soft" color={currentPick.concept ? 'success' : 'accent'}>
                  <Chip.Label>
                    {currentPick.concept
                      ? `Approved · ${currentPick.concept === 'mix' ? 'Mix' : `Concept ${currentPick.concept}`}`
                      : `Recommended · ${activeEntry.recommended}`}
                  </Chip.Label>
                </Chip>
              </header>

              {activeEntry.concepts.map((c) => {
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
                        {activeEntry.chosen === c.id ? (
                          <Chip size="sm" variant="soft" color="success">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                            <Chip.Label>In production</Chip.Label>
                          </Chip>
                        ) : null}
                        {activeEntry.recommended === c.id ? (
                          <Chip size="sm" variant="soft" color="accent">
                            <HugeiconsIcon icon={StarIcon} size={12} />
                            <Chip.Label>Recommended</Chip.Label>
                          </Chip>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant={isApproved ? 'primary' : 'secondary'}
                        onPress={() =>
                          setSectionPick(activeEntry.id, {
                            ...currentPick,
                            concept: isApproved ? null : c.id
                          })
                        }
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

                    <div className="flex flex-col gap-3">
                      {themes.map((dark) => (
                        <SecurityStage key={String(dark)} dark={dark}>
                          <div style={{ width }}>
                            <Comp snap={snap} dispatch={dispatch} compact={isCompact} />
                          </div>
                        </SecurityStage>
                      ))}
                    </div>
                  </article>
                );
              })}

              <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
                <p className="text-sm">
                  <span className="font-semibold">Recommendation: {activeEntry.recommended}.</span> {activeEntry.why}
                </p>
                <Segmented<string>
                  label="Your choice for this section"
                  value={currentPick.concept ?? 'none'}
                  onChange={(v) =>
                    setSectionPick(activeEntry.id, {
                      ...currentPick,
                      concept: v === 'none' ? null : (v as SecuritySectionChoice)
                    })
                  }
                  options={[
                    { id: 'none', text: 'Not yet' },
                    ...activeEntry.concepts.map((c) => ({ id: c.id, text: `${c.id} · ${c.name}` })),
                    { id: 'mix', text: 'Mix / Desktop vs Mobile' }
                  ]}
                />
                <TextArea
                  aria-label="Notes for this section"
                  placeholder="Notes (e.g. A on Desktop, C on Mobile)"
                  value={currentPick.notes}
                  onChange={(e) => setSectionPick(activeEntry.id, { ...currentPick, notes: e.target.value })}
                  rows={2}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    isDisabled={!currentPick.concept}
                    onPress={() => void copySection(activeEntry.id)}
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={14} />
                    {copiedId === activeEntry.id ? 'Copied section pick' : 'Copy section for chat'}
                  </Button>
                  <Button size="sm" variant="secondary" onPress={() => void copyAll()}>
                    <HugeiconsIcon icon={Copy01Icon} size={14} />
                    {copiedId === 'all' ? 'Copied all picks' : `Copy all picks (${pickedCount}/${SECURITY_CATALOG.length})`}
                  </Button>
                </div>
              </div>
            </section>
          ) : null
        ) : (
          <section className="pro-surface flex flex-col gap-5 p-5">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Assembled Security page preview</h2>
                <p className="mt-1 text-sm text-muted">
                  Phone (&lt; 600 px) pins Alarm Hero above SmoothTab tabs; Tablet and Desktop scroll smoothly.
                </p>
              </div>
              <Button size="sm" variant="primary" onPress={() => void copyAll()}>
                <HugeiconsIcon icon={Copy01Icon} size={14} />
                {copiedId === 'all' ? 'Copied all picks' : 'Copy all picks for chat'}
              </Button>
            </header>

            <div className="flex flex-col gap-5">
              {(pageView === 'compare' ? (['A', 'B', 'C'] as SecurityConceptId[]) : [pageView]).map((m) => (
                <div key={m} className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">
                    {m === 'picks' ? 'Assembled from your picks (or recommended)' : `Concept ${m}`}
                  </h3>
                  {themes.map((dark) => (
                    <SecurityStage key={`${m}-${String(dark)}`} dark={dark}>
                      <SecurityPagePreview mode={m} snap={snap} dispatch={dispatch} width={width} picks={picksState.sections} />
                    </SecurityStage>
                  ))}
                </div>
              ))}
            </div>

            <TextArea
              aria-label="Overall Security page notes"
              placeholder="Overall page notes (desktop vs mobile picks, spacing, missing details…)"
              value={picksState.pageNotes}
              onChange={(e) => setPageNotes(e.target.value)}
              rows={2}
            />
          </section>
        )}
      </main>
    </div>
  );
}
