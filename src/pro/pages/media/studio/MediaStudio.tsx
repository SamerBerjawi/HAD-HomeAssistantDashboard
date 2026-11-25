import { useEffect, useState } from 'react';
import { Button, TextArea } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, Copy01Icon, MusicNote01Icon, PaintBoardIcon, PauseIcon, Speaker01Icon } from '@hugeicons/core-free-icons';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { pauseStudioPlayer, studioPlayers, type Scenario, type StudioPlayer } from './studioMedia';
import { generateSongWaveform } from '../../../lib/overviewMedia';
import { RoomList } from '../RoomList';
import { Monitor } from '../Monitor';
import './mediaStudio.css';

const concepts = ['A · Turntable', 'B · Broadcast monitor', 'C · Concert poster', 'D · Playback monitor'] as const;
type Concept = typeof concepts[number];
const scenarios: Scenario[] = ['Busy', 'Quiet', 'Missing metadata', 'No players'];
const pickKey = 'had.pro.mediaStudio.pick';
const icon = (glyph = MusicNote01Icon) => <HugeiconsIcon icon={glyph} size={18} aria-hidden />;

function Choices<T extends string>({ label, options, value, change }: {
  label: string; options: readonly T[]; value: T; change: (value: T) => void;
}) {
  return <fieldset className="min-w-0"><legend className="mb-1 flex items-center gap-2 text-sm">{icon(PaintBoardIcon)}{label}</legend>
    <div className="flex flex-wrap gap-1">{options.map(option =>
      <Button key={option} size="sm" variant={value === option ? 'secondary' : 'ghost'} className="min-h-11"
        aria-pressed={value === option} onPress={() => change(option)}>{icon()}{option}</Button>)}</div>
  </fieldset>;
}

function Cover({ player }: { player: StudioPlayer }) {
  const [failed, setFailed] = useState(false);
  return <div className="ms-cover">{player.rawImage && !failed
    ? <img alt="" src={player.rawImage} onError={() => setFailed(true)} />
    : icon(Speaker01Icon)}</div>;
}

function clockTime(seconds: number) {
  return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
}

function Preview({ players, concept, width, selected, select, pause, dark, seek }: {
  dark: boolean; seek: (id: string, seconds: number) => void; players: StudioPlayer[]; concept: Concept; width: number; selected: string;
  select: (id: string) => void; pause: (id: string) => void;
}) {
  const [detailId, openDetail] = useState('');
  const detail = players.find(p => p.entityId === detailId);
  const active = players.filter(p => p.isPlaying);
  const focus = active.find(p => p.entityId === selected) ?? active[0];
  const phone = width < 768;
  const cards = phone && focus ? [focus] : active;
  const heading = 'flex items-center gap-2 font-semibold';
  return <div className="ms-page" style={{ width }}>
    {active.length > 0 && <section><h3 className={heading}>{icon()}Now playing</h3>
      <div className="ms-grid" style={{ gridTemplateColumns: 'repeat(' + (phone ? 1 : width < 1280 ? 2 : 3) + ', minmax(0,1fr))' }}>
        {cards.map(p => {
          if (concept === concepts[3]) return <Monitor key={p.entityId} {...{p, dark, pause, seek}} />;
          const title = p.title || p.name;
          const room = <span className="ms-room">{icon(Speaker01Icon)}{p.roomName || p.name}</span>;
          const track = <div className="ms-track"><h4>{title}</h4>{p.artist && <p>{p.artist}</p>}</div>;
          const control = p.supportsPlayPause && <Button className="ms-action min-h-11" onPress={() => pause(p.entityId)} aria-label={'Pause ' + p.name}>{icon(PauseIcon)}Pause</Button>;
          if (concept === concepts[0]) return <article key={p.entityId} className="ms-A">
            <div className="ms-deck"><div className="ms-disc"><Cover player={p} /></div><i className="ms-arm" aria-hidden /></div>
            <div className="ms-caption">{room}{track}{control}</div>
          </article>;
          if (concept === concepts[1]) return <article key={p.entityId} className="ms-B">
            <header>{room}<Cover player={p} /></header>{track}
            <div className="ms-wave" aria-hidden>{generateSongWaveform(title, p.artist, p.durationSecs, 52).map((height, i) =>
              <i key={i} style={{height: height + '%'}} />)}</div>
            <footer>{control}{p.durationSecs > 0 && <span>{clockTime(p.positionSecs)} / {clockTime(p.durationSecs)}</span>}</footer>
          </article>;
          return <article key={p.entityId} className="ms-C">
            <div className="ms-poster-art"><Cover player={p} /></div>
            {room}{track}<footer>{control}</footer>
          </article>;
        })}
      </div>
      {phone && active.filter(p => p !== focus).map(p => <Button key={p.entityId} variant="ghost" className="mt-1 min-h-11 w-full justify-start" onPress={() => select(p.entityId)}>
        {icon()}<span className="truncate">{p.roomName} · {p.title || p.name}</span></Button>)}
    </section>}
    <RoomList players={players} open={openDetail} locate={id => {
      const room = id === 'media_player.tv' ? 'Bedroom' : id === 'media_player.kitchen' ? 'Kitchen' : 'Living room';
      const floor = room === 'Bedroom' ? 'Upstairs' : 'Ground floor';
      return { floorId: floor, floorName: floor, roomId: room, roomName: room };
    }} />
    {detail && <aside className="pro-surface mt-3 p-3"><h4 className={heading}>{icon()} {detail.name}</h4>
      <p>{detail.state} · {detail.title}</p>
      <Button variant="ghost" onPress={() => openDetail('')}>{icon()}Close details</Button></aside>}
  </div>;
}

function readPick(): { concept: Concept; notes: string } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(pickKey) ?? 'null');
    return saved && concepts.includes(saved.concept) && typeof saved.notes === 'string' ? saved : null;
  } catch { return null; }
}

export default function MediaStudio() {
  const [pick, setPick] = useState(readPick);
  const [notes, setNotes] = useState(pick?.notes ?? '');
  const [scenario, setScenario] = useState<Scenario>('Busy');
  const [players, setPlayers] = useState(() => studioPlayers('Busy'));
  const [selected, select] = useState('');
  const [theme, setTheme] = useState('Light');
  const [width, setWidth] = useState('375');
  const [status, setStatus] = useState('');
  useEffect(() => {
    const root = document.documentElement;
    const dark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => { root.classList.toggle('dark', dark); };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setPlayers(current => current.map(p =>
      p.isPlaying && p.durationSecs > 0 ? { ...p, positionSecs: Math.min(p.positionSecs + 1, p.durationSecs) } : p)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  function seek(id: string, seconds: number) {
    setPlayers(current => current.map(p => p.entityId === id && p.supportsSeek
      ? { ...p, positionSecs: Math.max(0, Math.min(seconds, p.durationSecs)) } : p));
  }
  function approve(concept: Concept) {
    const saved = { concept, notes };
    try { localStorage.setItem(pickKey, JSON.stringify(saved)); setPick(saved); setStatus('Saved ' + concept); }
    catch { setStatus('Browser storage unavailable'); }
  }
  async function copy() {
    if (!pick) return;
    try { await navigator.clipboard.writeText('Media · Now playing · ' + pick.concept + '\n' + pick.notes); setStatus('Copied'); }
    catch { setStatus('Copy unavailable'); }
  }
  return <main data-page="media" className="pro h-dvh overflow-auto p-4">
    <StudioNavBar current="media" />
    <h1 className="my-4 flex items-center gap-2 text-2xl font-semibold">{icon()}Media Studio</h1>
    <div className="flex flex-wrap gap-5">
      <Choices label="Sample home" options={scenarios} value={scenario} change={s => { setScenario(s); setPlayers(studioPlayers(s)); select(''); }} />
      <Choices label="Preview width" options={['375','768','1024','1440','1920']} value={width} change={setWidth} />
      <Choices label="Preview theme" options={['Light','Dark','Both']} value={theme} change={setTheme} />
    </div>
    <label className="my-4 block max-w-lg"><span className="flex items-center gap-2">{icon(PaintBoardIcon)}Review notes</span>
      <TextArea value={notes} onChange={e => setNotes(e.target.value)} /></label>
    <div className="flex items-center gap-2"><Button className="min-h-11" isDisabled={!pick} onPress={copy}>{icon(Copy01Icon)}Copy for the chat</Button>
      <span role="status">{status || pick?.concept}</span></div>
    <div className="mt-5 flex items-start gap-4 overflow-x-auto pb-4">{[concepts[3], concepts[1], concepts[0], concepts[2]].map(concept =>
      <section key={concept} className="shrink-0"><h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">{icon(PaintBoardIcon)}{concept}</h2>
        {(theme === 'Both' ? ['Light','Dark'] : [theme]).map(t => <div key={t} className={t === 'Dark' ? 'dark' : ''}>
          <div className="pro" data-page="media"><Preview {...{concept, players, selected, select, seek}} dark={t === 'Dark'} width={Number(width)} pause={id => setPlayers(ps => pauseStudioPlayer(ps, id))} /></div></div>)}
        <Button className="mt-2 min-h-11" onPress={() => approve(concept)}>{icon(CheckmarkCircle02Icon)}Approve {concept[0]}</Button>
      </section>)}</div>
  </main>;
}
