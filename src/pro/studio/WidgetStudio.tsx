/**
 * Widget Design Studio (docs/pro-ui/WIDGET_DESIGN.md §4). Dev only: /overview?studio. Each widget
 * shows concepts A, B and C side by side at real phone cell sizes, in light and dark, across named
 * states, with a way to pick one. Rendered outside the shell so each preview owns its theme.
 */
import { useEffect, useState } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, Copy01Icon, Moon02Icon, PaintBoardIcon, StarIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SIZE_LABELS, type WidgetSize } from '../lib/overviewLayout';
import { DESIGN_REGISTRY, type ConceptId } from '../widgets/designRegistry';
import { WIDGET_BY_ID } from '../widgets/registry';
import { alarmStudio } from '../widgets/alarm/concepts';
import { areasStudio } from '../widgets/areas/concepts';
import { camerasStudio } from '../widgets/cameras/concepts';
import { carStudio } from '../widgets/car/concepts';
import { energyFlowStudio, energyNowStudio, energyTodayStudio } from '../widgets/energy/concepts';
import { useEnergyStore } from '../widgets/energy/energyStore';
import { fansStudio } from '../widgets/fans/concepts';
import { lightsStudio } from '../widgets/lights/concepts';
import { locksStudio } from '../widgets/locks/concepts';
import { motionStudio } from '../widgets/motion/concepts';
import { openingsStudio } from '../widgets/openings/concepts';
import { mediaStudio } from '../widgets/media/concepts';
import { presenceStudio } from '../widgets/presence/concepts';
import { safetyStudio } from '../widgets/safety/concepts';
import { scenesStudio } from '../widgets/scenes/concepts';
import { switchesStudio } from '../widgets/switches/concepts';
import { thermostatStudio } from '../widgets/thermostat/concepts';
import { vacuumsStudio } from '../widgets/vacuums/concepts';
import { weatherStudio } from '../widgets/weather/concepts';
import { StudioNavBar } from './StudioNavBar';
import type { StudioEntry } from './types';
import { useStudioSelection, type StudioPick } from './useStudioSelection';

// Each entry keeps its own model type; the studio only passes a state's model to its concepts.
const asEntry = <M,>(e: StudioEntry<M>) => e as unknown as StudioEntry<never>;
const ENTRIES: readonly StudioEntry<never>[] = [
  asEntry(weatherStudio),
  asEntry(lightsStudio),
  asEntry(mediaStudio),
  asEntry(vacuumsStudio),
  asEntry(presenceStudio),
  asEntry(switchesStudio),
  asEntry(fansStudio),
  asEntry(thermostatStudio),
  asEntry(scenesStudio),
  asEntry(areasStudio),
  asEntry(alarmStudio),
  asEntry(locksStudio),
  asEntry(camerasStudio),
  asEntry(openingsStudio),
  asEntry(safetyStudio),
  asEntry(motionStudio),
  asEntry(energyNowStudio),
  asEntry(energyTodayStudio),
  asEntry(energyFlowStudio),
  asEntry(carStudio)
];
const WIDGET_KEY = 'had.pro.widgetStudio.widget';

function readWidget(): string {
  try {
    const v = localStorage.getItem(WIDGET_KEY);
    if (v && ENTRIES.some((e) => e.widgetId === v)) return v;
  } catch {
    /* storage blocked: start on the first widget */
  }
  return ENTRIES[ENTRIES.length - 1].widgetId;
}

/** Phone cells (priority device): 2 columns at 375 px with a 16 px gutter and 12 px gaps. */
const CELL = { w: 165, h: 148, gap: 12 };
const dims = (size: WidgetSize) => ({
  width: size === 'w' || size === 'l' ? CELL.w * 2 + CELL.gap : CELL.w,
  height: size === 't' || size === 'l' ? CELL.h * 2 + CELL.gap : CELL.h
});

type ThemeView = 'light' | 'dark' | 'both';

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { id: T; text: string; icon?: Parameters<typeof HugeiconsIcon>[0]['icon'] }[];
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
          const next = [...keys][0];
          const hit = options.find((o) => o.id === next);
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

type PreviewComponent = StudioEntry<never>['concepts'][number]['Component'];

function Preview({ entry, Concept, size, stateIndex, dark }: { entry: StudioEntry<never>; Concept: PreviewComponent; size: WidgetSize; stateIndex: number; dark: boolean }) {
  const { width, height } = dims(size);
  return (
    <div className={cn('pro rounded-2xl bg-[var(--background)] p-3', dark && 'dark')}>
      <div style={{ width, height }}>
        <Concept model={entry.states[stateIndex].model} size={size} onOpenDetails={() => undefined} />
      </div>
    </div>
  );
}

function WidgetSection({ entry }: { entry: StudioEntry<never> }) {
  const [size, setSize] = useState<WidgetSize>(entry.sizes.includes('w') ? 'w' : entry.sizes[0]);
  const [stateId, setStateId] = useState(entry.states[0].id);
  const [theme, setTheme] = useState<ThemeView>('both');
  const { pick, setPick, copy, copied } = useStudioSelection(entry);
  const stateIndex = Math.max(
    0,
    entry.states.findIndex((s) => s.id === stateId)
  );
  const record = DESIGN_REGISTRY[entry.widgetId];
  // What the real widget wears now, rendered with the same mock states.
  const shipped = WIDGET_BY_ID.get(entry.widgetId)?.designs;

  return (
    <section aria-labelledby={`studio-${entry.widgetId}`} className="pro-surface flex flex-col gap-5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`studio-${entry.widgetId}`} className="text-xl font-semibold">
            {entry.title}
          </h2>
          <p className="text-sm text-muted">{entry.personality}</p>
          <p className="mt-1 max-w-2xl text-sm">{entry.direction}</p>
        </div>
        <Chip size="sm" variant="soft" color={record?.status === 'built' ? 'success' : record?.status === 'chosen' ? 'accent' : 'default'}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
          <Chip.Label>{record ? `${record.status}${record.concept ? ` · ${record.concept}` : ''}` : 'not in registry'}</Chip.Label>
        </Chip>
      </header>

      <div className="flex flex-wrap gap-4">
        <Segmented label="Size" value={size} onChange={setSize} options={entry.sizes.map((s) => ({ id: s, text: SIZE_LABELS[s] }))} />
        <Segmented label="State" value={stateId} onChange={setStateId} options={entry.states.map((s) => ({ id: s.id, text: s.label }))} />
        <Segmented
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { id: 'light', text: 'Light', icon: Sun01Icon },
            { id: 'dark', text: 'Dark', icon: Moon02Icon },
            { id: 'both', text: 'Both', icon: PaintBoardIcon }
          ]}
        />
      </div>

      {shipped && shipped.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-[var(--success)]/10 p-3">
          <h3 className="text-sm font-semibold">Shipped in the dashboard</h3>
          <div className="flex flex-wrap gap-4">
            {shipped.map((d) => (
              <div key={d.id} className="flex flex-col gap-2">
                <p className="text-xs text-muted">
                  {d.name}: {d.description}
                </p>
                <div className="flex flex-wrap items-start gap-2">
                  {theme !== 'dark' ? <Preview entry={entry} Concept={d.Body as PreviewComponent} size={size} stateIndex={stateIndex} dark={false} /> : null}
                  {theme !== 'light' ? <Preview entry={entry} Concept={d.Body as PreviewComponent} size={size} stateIndex={stateIndex} dark /> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {entry.concepts.map((c) => (
          <article key={c.id} className={cn('flex min-w-0 flex-col gap-3 rounded-2xl p-3', pick.concept === c.id ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40')}>
            <header className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {c.id} · {c.name}
              </h3>
              {entry.recommended === c.id ? (
                <Chip size="sm" variant="soft" color="accent">
                  <HugeiconsIcon icon={StarIcon} size={12} />
                  <Chip.Label>Recommended</Chip.Label>
                </Chip>
              ) : null}
            </header>
            <div className="flex flex-col items-start gap-2 overflow-x-auto">
              {theme !== 'dark' ? <Preview entry={entry} Concept={c.Component} size={size} stateIndex={stateIndex} dark={false} /> : null}
              {theme !== 'light' ? <Preview entry={entry} Concept={c.Component} size={size} stateIndex={stateIndex} dark /> : null}
            </div>
            <p className="text-sm">{c.idea}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="mb-1 font-semibold text-success">Strengths</p>
                <ul className="flex list-disc flex-col gap-0.5 pl-4">
                  {c.strengths.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-semibold text-warning">Trade-offs</p>
                <ul className="flex list-disc flex-col gap-0.5 pl-4">
                  {c.tradeoffs.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
        <p className="text-sm">
          <span className="font-semibold">Recommendation: {entry.recommended}.</span> {entry.why}
        </p>
        <Segmented<StudioPick['concept']>
          label="Your choice"
          value={pick.concept}
          onChange={(concept) => setPick({ ...pick, concept })}
          options={[{ id: 'none', text: 'Not yet' }, ...entry.concepts.map((c) => ({ id: c.id as ConceptId, text: `${c.id} · ${c.name}` })), { id: 'mix', text: 'Mix' }]}
        />
        <TextArea
          aria-label="Notes for this widget"
          placeholder="Notes: what to keep, change or mix (e.g. B, but with C's hour line on Wide)"
          value={pick.notes}
          onChange={(e) => setPick({ ...pick, notes: e.target.value })}
          rows={2}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" isDisabled={pick.concept === 'none'} onPress={() => void copy()}>
            <HugeiconsIcon icon={Copy01Icon} size={14} />
            {copied ? 'Copied' : 'Copy selection'}
          </Button>
          <span className="text-xs text-muted">Paste it in the chat; your pick is also kept in this browser.</span>
        </div>
      </div>
    </section>
  );
}

/**
 * The studio's own chrome stays light: a `.dark` ancestor would turn every light preview dark
 * (pro tokens and `dark:` variants match any descendant of `.dark`).
 */
export default function WidgetStudio() {
  const [widgetId, setWidgetId] = useState(readWidget);
  const choose = (id: string) => {
    setWidgetId(id);
    try {
      localStorage.setItem(WIDGET_KEY, id);
    } catch {
      /* not remembered; fine */
    }
  };
  const entry = ENTRIES.find((e) => e.widgetId === widgetId) ?? ENTRIES[0];
  // The app puts `.dark` on <html> in dark mode; lift it while the studio is open, restore after.
  // Energy concepts show "Loading energy…" until the shared energy store is ready; the studio
  // renders mock models only, so mark it ready while open (restored after).
  useEffect(() => {
    const before = useEnergyStore.getState().load;
    useEnergyStore.getState().publish({ load: 'ready' });
    return () => useEnergyStore.getState().publish({ load: before });
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);
  return (
    // h-dvh, not min-h: #root is fixed with overflow hidden, so the studio must scroll itself.
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="overview">
      <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="widgets" />
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <HugeiconsIcon icon={PaintBoardIcon} size={24} className="text-[var(--accent)]" />
              Widget Design Studio
            </h1>
            <p className="text-sm text-muted">Concepts for the HAD Overview widgets. Dev only; nothing here changes the dashboard.</p>
          </div>
          <Segmented
            label="Widget"
            value={entry.widgetId}
            onChange={choose}
            options={ENTRIES.map((e) => ({ id: e.widgetId, text: `${e.title}${DESIGN_REGISTRY[e.widgetId]?.status === 'built' ? ' ✓' : ''}` }))}
          />
        </header>
        <WidgetSection key={entry.widgetId} entry={entry} />
      </main>
    </div>
  );
}
