/**
 * Rooms Studio (docs/pro-ui/ROOMS.md §5). Dev only: /?studio=rooms. Compares the Rooms page tile
 * designs on the same representative home: A · Refined adaptive ambient, B · Soft
 * atmospheric and C · Precision ambient. Tile sizes, a floor-grouped page at real widths, light and
 * dark, named states, and a live preview: the quick actions work on the fixtures only (a stand-in
 * service), never on Home Assistant. Approving a design records the pick in this browser and copies
 * it for the chat; production keeps Design D until another change is applied.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, BulbIcon, CheckmarkCircle02Icon, Copy01Icon, Moon02Icon, PaintBoardIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { bandMetrics, blendMetrics, QUICK_ACTIONS, roomActions, type BandMetrics, type TileSize } from '../../../lib/roomTiles';
import type { RoomItem, RoomsFloor } from '../../../lib/roomsPage';
import type { ServiceCall } from '../../../widgets/shared/useServiceCall';
import { Stage } from '../../../areas/studio/Stage';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { RoomServiceContext, useFloorLightsOff } from '../RoomQuickActions';
import { RoomTile } from '../RoomTile';
import { RoomBands } from '../RoomsExplorer';
import { DEFAULT_ROOMS_PREFS, temp } from '../shared';
import { plural, type RoomTileComponent } from '../tileParts';
import { RoomTileBlend } from '../RoomTileBlend';
import { RoomTilePrecision } from './RoomTilePrecision';
import { RoomTileSoft } from './RoomTileSoft';
import { applyStudioService, STUDIO_STATES, studioPage, studioRooms, type StudioStateId } from './studioRooms';

type DesignId = 'A' | 'B' | 'C' | 'D';
const PRODUCTION: DesignId = 'D';

interface Design {
  id: DesignId;
  name: string;
  idea: string;
  strengths: string;
  tradeoffs: string;
  Tile: RoomTileComponent;
  metrics: (w: number) => BandMetrics;
  Heading: (p: HeadingProps) => ReactNode;
}

interface HeadingProps {
  floor: RoomsFloor;
}

function useFloorFacts(floor: RoomsFloor) {
  const lightsOff = useFloorLightsOff();
  const devices = floor.rooms.reduce((n, r) => n + r.deviceCount, 0);
  const lightsOn = floor.rooms.reduce((n, r) => n + r.lightsOn, 0);
  return { lightsOff: () => lightsOff(floor), devices, lightsOn };
}

function HeadingA({ floor }: HeadingProps) {
  const { lightsOff, devices, lightsOn } = useFloorFacts(floor);
  return (
    <div className="flex min-h-10 items-center gap-3 border-t border-[color-mix(in_oklab,var(--foreground)_7%,transparent)] pt-4">
      <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="shrink-0 text-muted" />
      <h3 className="truncate text-lg font-semibold">{floor.name}</h3>
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{[plural(floor.rooms.length, 'room'), plural(devices, 'device'), floor.avgTemp !== null ? `avg ${temp(floor.avgTemp)}` : null].filter(Boolean).join(' · ')}</span>
      {lightsOn ? (
        <Button size="sm" variant="ghost" onPress={lightsOff} className="h-9 gap-1.5 px-2.5 text-xs">
          <HugeiconsIcon icon={BulbIcon} size={15} className="pro-rt-lit" />
          Lights off
        </Button>
      ) : null}
    </div>
  );
}

function HeadingB({ floor }: HeadingProps) {
  const { lightsOff, lightsOn } = useFloorFacts(floor);
  return (
    <div className="flex min-h-10 items-end gap-3 pt-2">
      <h3 className="truncate text-[22px] font-light tracking-tight">{floor.name}</h3>
      <span className="min-w-0 flex-1 truncate pb-0.5 text-sm text-muted">
        {[plural(floor.rooms.length, 'room'), lightsOn ? `${plural(lightsOn, 'light')} on` : 'all dark'].join(' · ')}
      </span>
      {lightsOn ? (
        <Button size="sm" variant="ghost" onPress={lightsOff} className="h-9 rounded-full px-3 text-xs text-muted">
          Dim the floor
        </Button>
      ) : null}
    </div>
  );
}

function HeadingC({ floor }: HeadingProps) {
  const { lightsOff, devices, lightsOn } = useFloorFacts(floor);
  return (
    <div className="flex min-h-9 items-center gap-3 pt-1">
      <h3 className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em]">{floor.name}</h3>
      <span aria-hidden className="h-px flex-1 bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)]" />
      <span className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-muted tabular-nums">
        {floor.rooms.length} rooms · {devices} dev{floor.avgTemp !== null ? ` · ${temp(floor.avgTemp)}` : ''}
      </span>
      {lightsOn ? (
        <Button size="sm" variant="ghost" onPress={lightsOff} className="h-8 rounded-[8px] border border-[color-mix(in_oklab,var(--foreground)_14%,transparent)] px-2 text-[11px] uppercase tracking-[0.08em]">
          Lights off
        </Button>
      ) : null}
    </div>
  );
}

const DESIGNS: Design[] = [
  {
    id: 'A',
    name: 'Refined adaptive ambient',
    idea: 'The approved mockup, refined: layered radial light on a dark restrained surface, one thin curve, an icon tile, the name beside it, a big reading, a facts line, quiet round actions on the right.',
    strengths: 'Closest to the reference; strongest hierarchy; clear actions.',
    tradeoffs: 'The most "card-like" of the three.',
    Tile: RoomTile,
    metrics: bandMetrics,
    Heading: HeadingA
  },
  {
    id: 'B',
    name: 'Soft atmospheric',
    idea: 'Light without shapes: two large diffused glows and a haze, no borders or curves, the name as a quiet label, a large light-weight reading, one soft sentence, borderless actions that glow only when on.',
    strengths: 'Calmest and most atmospheric; reads well from across a room.',
    tradeoffs: 'Less information per tile; taller rows.',
    Tile: RoomTileSoft,
    metrics: (w) => {
      const m = bandMetrics(w);
      return { band: m.band + 16, large: m.large + 20, compact: m.compact - 6 };
    },
    Heading: HeadingB
  },
  {
    id: 'C',
    name: 'Precision ambient',
    idea: 'Architectural and dense: dark neutral surfaces with hairlines, the room’s light only as a fine line along the top, a state code, a medium reading, a labelled data row and square actions.',
    strengths: 'Most information per screen; very calm when the house is busy.',
    tradeoffs: 'Least atmospheric; small labels.',
    Tile: RoomTilePrecision,
    metrics: (w) => {
      const m = bandMetrics(w);
      return { band: m.band - 16, large: m.large - 12, compact: m.compact - 18 };
    },
    Heading: HeadingC
  },
  {
    id: 'D',
    name: 'Soft blend (B + A + C)',
    idea: 'In production. The owner’s mix: B’s soft surface, quiet title and glowing toggles; A’s information (big reading, status word, climate and media, lights · devices); C’s room icon tinted in the room’s light. Every size has the lights toggle.',
    strengths: 'B’s calm look with A’s detail; lights in reach on every tile.',
    tradeoffs: 'Taller rows than A.',
    Tile: RoomTileBlend,
    metrics: blendMetrics,
    Heading: HeadingA
  }
];

/** Page content widths at common screens (the shell's sidebar or rail and padding taken off). */
const WIDTHS = [
  { id: '375', label: 'Phone 375', content: 343 },
  { id: '768', label: 'Tablet 768', content: 640 },
  { id: '1024', label: 'Small desktop 1024', content: 740 },
  { id: '1440', label: 'Desktop 1440', content: 1140 },
  { id: '1920', label: 'Large 1920', content: 1620 }
] as const;
type WidthId = (typeof WIDTHS)[number]['id'];
type Theme = 'light' | 'dark' | 'both';
type View = DesignId | 'compare';

const PICK_KEY = 'had.pro.roomsStudio.pick';
const prefs = DEFAULT_ROOMS_PREFS;
const actionsOn = new Set(QUICK_ACTIONS);
const noop = () => {};

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; text: string; icon?: Parameters<typeof HugeiconsIcon>[0]['icon'] }[]; onChange: (v: T) => void }) {
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

/** One design's floor-grouped page at a given content width. */
function PagePreview({ design, rooms, width }: { design: Design; rooms: RoomItem[]; width: number }) {
  const model = useMemo(() => studioPage(rooms), [rooms]);
  return (
    <div className="flex flex-col gap-5" style={{ width }}>
      {model.floors.map((f) => (
        <section key={f.floorId ?? 'none'} aria-label={f.name} className="flex flex-col gap-3">
          <design.Heading floor={f} />
          <RoomBands rooms={f.rooms} prefs={prefs} width={width} actionsOn={actionsOn} onOpenRoom={noop} label={`Rooms on ${f.name}`} Tile={design.Tile} metrics={design.metrics} />
        </section>
      ))}
    </div>
  );
}

/** Each size of one design, on the rooms that best show it. */
function SizesPreview({ design, rooms }: { design: Design; rooms: RoomItem[] }) {
  const m = design.metrics(1140);
  const byId = (id: string) => rooms.find((r) => r.areaId === id) as RoomItem;
  const sample: { size: TileSize; r: RoomItem; w: number; h: number }[] = [
    { size: 'expanded', r: byId('living'), w: 440, h: m.large },
    { size: 'standard', r: byId('kitchen'), w: 220, h: m.band },
    { size: 'standard', r: byId('office'), w: 300, h: m.band },
    { size: 'compact', r: byId('bath'), w: 220, h: (m.band - 12) / 2 },
    { size: 'compact', r: byId('wc'), w: 343, h: design.metrics(343).compact }
  ];
  return (
    <div role="list" aria-label={`Design ${design.id} tile sizes`} className="flex flex-wrap items-start gap-3">
      {sample.map((s, i) => (
        <div key={i} className="flex flex-col gap-1">
          <span className="text-[11px] text-muted">
            {s.size} · {s.w}×{Math.round(s.h)}
          </span>
          <div style={{ width: s.w, height: s.h }}>
            <design.Tile r={s.r} size={s.size} prefs={prefs} actions={roomActions(s.r, actionsOn)} onOpen={noop} />
          </div>
        </div>
      ))}
    </div>
  );
}

function readPick(): { design: DesignId | null; notes: string } {
  try {
    const v = JSON.parse(localStorage.getItem(PICK_KEY) ?? 'null') as { design?: DesignId; notes?: string } | null;
    return { design: v?.design ?? null, notes: v?.notes ?? '' };
  } catch {
    return { design: null, notes: '' };
  }
}

export default function RoomsStudio() {
  const [view, setView] = useState<View>('D');
  const [state, setState] = useState<StudioStateId>('evening');
  const [theme, setTheme] = useState<Theme>('dark');
  const [widthId, setWidthId] = useState<WidthId>('1440');
  const [rooms, setRooms] = useState<RoomItem[]>(() => studioRooms('evening'));
  const [pick, setPickState] = useState(readPick);
  const [copied, setCopied] = useState(false);

  // Same as the other studios: the chrome stays light; each preview owns its theme.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  const service = useMemo<ServiceCall>(
    () => ({
      call: async (domain, svc, data, entityId) => {
        await new Promise((r) => setTimeout(r, 350));
        setRooms((rs) => applyStudioService(rs, domain, svc, data, entityId));
      },
      setOptimistic: () => {}
    }),
    []
  );

  const width = WIDTHS.find((w) => w.id === widthId)?.content ?? 1140;
  const themes = theme === 'both' ? [true, false] : [theme === 'dark'];
  const shown = view === 'compare' ? DESIGNS : DESIGNS.filter((d) => d.id === view);
  const setPick = (next: { design: DesignId | null; notes: string }) => {
    setPickState(next);
    setCopied(false);
    try {
      localStorage.setItem(PICK_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: the pick lasts this visit */
    }
  };
  const copy = async () => {
    const d = DESIGNS.find((x) => x.id === pick.design);
    const text = `Rooms studio: approve Design ${pick.design}${d ? ` (${d.name})` : ''} for the Rooms page.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <RoomServiceContext.Provider value={service}>
      <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="rooms">
        <main className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6">
          <StudioNavBar current="rooms" />
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold">Rooms Studio</h1>
              <p className="mt-1 text-sm text-muted">
                Four directions for the Rooms page on the same sample home. Previews are live on sample data only: quick actions change these tiles, never Home Assistant.
              </p>
            </div>
            <Chip size="md" variant="soft" color="accent">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
              <Chip.Label>
                In production: Design {PRODUCTION} · {DESIGNS.find((d) => d.id === PRODUCTION)?.name}
              </Chip.Label>
            </Chip>
          </header>

          <div className="pro-surface flex flex-wrap gap-4 p-4">
            <Segmented
              label="Design"
              value={view}
              onChange={setView}
              options={[{ id: 'compare' as View, text: 'Compare all' }, ...DESIGNS.map((d) => ({ id: d.id as View, text: `${d.id} · ${d.name}` }))]}
            />
            <Segmented
              label="Home state (resets the sample)"
              value={state}
              onChange={(id) => {
                setState(id);
                setRooms(studioRooms(id));
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
            <Segmented label="Screen (page content width)" value={widthId} onChange={setWidthId} options={WIDTHS.map((w) => ({ id: w.id, text: w.label }))} />
          </div>

          {/* Compare at phone width: the three designs side by side; wider screens stack them. */}
          <div className={cn('flex min-w-0 flex-col gap-6', view === 'compare' && width < 400 && 'grid grid-cols-[repeat(4,minmax(0,max-content))] items-start overflow-x-auto')}>
          {shown.map((d) => (
            <section key={d.id} aria-labelledby={`design-${d.id}`} className={cn('flex min-w-0 flex-col gap-4 rounded-2xl p-4', pick.design === d.id ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'pro-surface')}>
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl">
                  <h2 id={`design-${d.id}`} className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                    Design {d.id} · {d.name}
                    {d.id === PRODUCTION ? (
                      <Chip size="sm" color="success" variant="soft">
                        <Chip.Label>In production</Chip.Label>
                      </Chip>
                    ) : (
                      <Chip size="sm" variant="soft">
                        <Chip.Label>Studio only</Chip.Label>
                      </Chip>
                    )}
                  </h2>
                  <p className="mt-1 text-sm">{d.idea}</p>
                  <p className="mt-1 text-xs text-muted">
                    + {d.strengths} − {d.tradeoffs}
                  </p>
                </div>
                <Button size="sm" variant={pick.design === d.id ? 'primary' : 'secondary'} onPress={() => setPick({ ...pick, design: pick.design === d.id ? null : d.id })}>
                  {pick.design === d.id ? 'Approved' : `Approve ${d.id}`}
                </Button>
              </header>
              {themes.map((dark) => (
                <div key={String(dark)} className="flex min-w-0 flex-col gap-3">
                  <Stage dark={dark} className="flex flex-col gap-5 overflow-x-auto p-4">
                    {view === 'compare' && width < 400 ? null : <SizesPreview design={d} rooms={rooms} />}
                    <PagePreview design={d} rooms={rooms} width={width} />
                  </Stage>
                </div>
              ))}
            </section>
          ))}
          </div>

          <section aria-label="Your pick" className="pro-surface flex flex-col gap-3 p-4">
            <h2 className="text-base font-semibold">Your pick</h2>
            <p className="text-sm text-muted">
              {pick.design
                ? `Design ${pick.design} approved in this browser. Production stays on Design ${PRODUCTION} until the change is applied: copy this for the chat.`
                : 'Approve one design above. Production stays on Design D until you ask for a change.'}
            </p>
            <TextArea aria-label="Notes" placeholder="Notes (what to keep, mix or change)" value={pick.notes} onChange={(e) => setPick({ ...pick, notes: e.target.value })} className="min-h-20" />
            <Button size="sm" variant="secondary" isDisabled={!pick.design} onPress={copy} className="self-start gap-1.5">
              <HugeiconsIcon icon={Copy01Icon} size={14} />
              {copied ? 'Copied' : 'Copy for the chat'}
            </Button>
          </section>
        </main>
      </div>
    </RoomServiceContext.Provider>
  );
}
