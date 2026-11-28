/**
 * The simulated Area page (batch 6): the page concepts (A Sections, B Rail, C Now first, D Ambient)
 * around the chosen tiles, for three rooms (a full Living Room, a sensors-only Hallway, an empty
 * Guest Room), at phone, tablet and desktop widths, light and dark. Every tile is live against a
 * mock HA; Customize works (draft, drag, size, hide, Save / Cancel / Reset).
 */
import { useMemo, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import type { TileAction, TileModel, TileSize } from '../tileTypes';
import { TILE_TYPES, type TileConceptId } from './areaCatalog';
import { applyTileAction } from './areaStates';
import { Stage } from './Stage';
import { readAreaPicks } from './useAreaPicks';
import AmbientRoom from './AmbientRoom';
import { ROOMS, SEED } from './page/rooms';
import PageSections from './page/PageSections';
import PageRail from '../page/PageRail';
import PageNow, { foldAll } from '../page/PageNow';
import type { PageProps } from '../page/pageKit';
import { useRoomEditor } from '../page/useRoomEditor';

const WIDTH = { phone: 375, tablet: 768, desktop: 1280 } as const;
type Width = keyof typeof WIDTH;
type TileMode = 'picks' | Exclude<TileConceptId, 'D'>;
type PageConcept = 'BC' | 'A' | 'B' | 'C' | 'D';
/** The owner's pick (2026-11-21): B's frame with a switch between All (B) and Now (C). The real page is the same component, editing the saved layout. */
function PageViews(p: PageProps) {
  return <PageRail {...p} views editor={useRoomEditor(p.room.items, p.device, foldAll)} />;
}
const RailOnly = (p: PageProps) => <PageRail {...p} editor={useRoomEditor(p.room.items, p.device)} />;
const NowOnly = (p: PageProps) => <PageNow {...p} editor={useRoomEditor(p.room.items, p.device, foldAll)} />;
const PAGES = { BC: PageViews, A: PageSections, B: RailOnly, C: NowOnly } as const;

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; text: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <ToggleButtonGroup aria-label={label} size="sm" selectionMode="single" disallowEmptySelection selectedKeys={new Set([value])} onSelectionChange={(k) => onChange([...k][0] as T)}>
        {options.map((o) => (
          <ToggleButton key={o.id} id={o.id} className="text-xs">
            {o.text}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

export default function AreaPageSim() {
  const [page, setPage] = useState<PageConcept>('BC');
  const [width, setWidth] = useState<Width>('phone');
  const [dark, setDark] = useState<'light' | 'dark'>('dark');
  const [tiles, setTiles] = useState<TileMode>('picks');
  const [roomId, setRoomId] = useState(ROOMS[0].id);
  const [models, setModels] = useState<Record<string, TileModel>>(() => ({ ...SEED }));
  const picks = useMemo(readAreaPicks, []);
  const room = ROOMS.find((r) => r.id === roomId)!;
  const conceptFor = (kind: TileModel['kind']) => {
    const type = TILE_TYPES.find((t) => t.id === kind)!;
    const want = tiles === 'picks' ? (type.chosen?.concept ?? picks[kind]?.concept) : tiles;
    const id = want === 'A' || want === 'B' || want === 'C' || want === 'D' ? want : type.recommended;
    return type.concepts.find((c) => c.id === id) ?? type.concepts.find((c) => c.id === type.recommended)!;
  };
  const actOn = (id: string, a: TileAction) =>
    setModels((all) => {
      const next = { ...all, [id]: applyTileAction(all[id], a) };
      // One scene holds at a time: running one ends the others.
      if (a.type === 'activate') for (const [k, m] of Object.entries(next)) if (k !== id && m.kind === 'scene' && m.isOn) next[k] = { ...m, isOn: false };
      return next;
    });
  const model = (key: string): TileModel => {
    const it = room.items.find((i) => i.key === key)!;
    const m = models[it.entityId];
    return it.focus && m.kind === 'car' ? { ...m, focus: it.focus } : m;
  };
  const renderTile = (key: string, size: TileSize) => {
    const m = model(key);
    const C = conceptFor(m.kind).Component;
    return <C e={m} size={size} act={(a) => actOn(m.entityId, a)} />;
  };
  const Page = page === 'D' ? null : PAGES[page];

  return (
    <section className="pro-surface flex flex-col gap-4 p-5">
      <header className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-semibold">Area page · batch 6</h2>
          <p className="max-w-3xl text-sm text-muted">The page around the tiles: header, grouping, editing (Customize) and the empty room. Every tile is live; Customize works, with Save, Cancel and Reset. D is the earlier Ambient preview (Living Room only, no editing yet).</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Seg<PageConcept> label="Page" value={page} onChange={setPage} options={[{ id: 'BC', text: 'B + C · Two views' }, { id: 'A', text: 'A · Sections' }, { id: 'B', text: 'B · Rail' }, { id: 'C', text: 'C · Now first' }, { id: 'D', text: 'D · Ambient' }]} />
          <Seg<string> label="Room" value={roomId} onChange={setRoomId} options={ROOMS.map((r) => ({ id: r.id, text: !r.items.length ? `${r.name} (empty)` : r.id === 'hallway' ? `${r.name} (sensors only)` : r.name }))} />
          <Seg<TileMode> label="Tiles" value={tiles} onChange={setTiles} options={[{ id: 'picks', text: 'Chosen' }, { id: 'A', text: 'All A' }, { id: 'B', text: 'All B' }, { id: 'C', text: 'All C' }]} />
          <Seg<Width> label="Screen" value={width} onChange={setWidth} options={[{ id: 'phone', text: 'Phone' }, { id: 'tablet', text: 'Tablet' }, { id: 'desktop', text: 'Desktop' }]} />
          <Seg<'light' | 'dark'> label="Theme" value={dark} onChange={setDark} options={[{ id: 'light', text: 'Light' }, { id: 'dark', text: 'Dark' }]} />
        </div>
      </header>
      <div className="overflow-x-auto">
        {Page ? (
          <Stage dark={dark === 'dark'} className="w-max p-0">
            <div className="@container rounded-2xl" style={{ width: WIDTH[width] }}>
              <Page key={`${page}-${room.id}`} room={room} rooms={ROOMS} onRoom={setRoomId} model={model} renderTile={renderTile} actOn={(key, a) => actOn(model(key).entityId, a)} device={width === 'phone' ? 'phone' : 'wide'} />
            </div>
          </Stage>
        ) : (
          <Stage dark={dark === 'dark'} className="w-max bg-transparent p-0">
            <AmbientRoom screen={width} theme={dark} width={WIDTH[width]} />
          </Stage>
        )}
      </div>
    </section>
  );
}
