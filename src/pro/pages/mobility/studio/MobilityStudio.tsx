import { useState } from 'react';
import { Button, TextArea } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Car01Icon, Bicycle01Icon, Home01Icon, PaintBoardIcon, CheckmarkCircle02Icon, Copy01Icon, ArrowLeft01Icon, FlashIcon } from '@hugeicons/core-free-icons';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { CarHeader, headers } from './CarHeaders';
import { fleets, headerCars, type Vehicle } from './studioFleet';
import { Garage, GarageDial } from '../Garage';
import './bays.css';

const designs = ['A · Garage floor', 'B · Range dial', 'C · Departure board', 'D · Garage dial'] as const;
type Design = typeof designs[number];
const key = 'had.pro.mobilityStudio.pick';
const icon = (glyph: typeof Car01Icon, size = 18) => <HugeiconsIcon icon={glyph} size={size} aria-hidden />;
const vehicleIcon = (v: Vehicle) => v.kind === 'Car' ? Car01Icon : Bicycle01Icon;
type Choice = Design | typeof headers[number];
function readPick(storage: string): { design: Choice; notes: string } | null {
  try {
    const value = JSON.parse(localStorage.getItem(storage) ?? 'null');
    return value && (storage === key ? [...designs] as readonly string[] : headers as readonly string[]).includes(value.design) && typeof value.notes === 'string' ? value : null;
  } catch { return null; }
}

function Bay({ v, design, enter }: { v: Vehicle; design: Design; enter: () => void }) {
  if (design === designs[3]) return <GarageDial {...{v, enter}} />;
  const shape = icon(vehicleIcon(v), 52);
  const range = v.range === null ? 'Range unknown' : v.range + ' km';
  const battery = v.charge === null ? 'Battery unknown' : v.charge + '%';
  const identity = <strong>{v.name}</strong>;
  const state = <small>{[v.state, v.place].filter(Boolean).join(' · ')}</small>;
  const dial = <span className="mob-dial" style={{background: 'conic-gradient(var(--accent) ' + (v.charge ?? 0) + '%,var(--separator) 0)'}}><b>{range}</b></span>;
  return <Button variant="ghost" aria-label={'Open ' + v.name} onPress={enter} className={'mob-bay mob-' + design[0]}>
    {design === designs[0] ? <><span className="mob-parking">{shape}</span><span>{identity}{state}</span><b>{range}<small>{battery}</small></b></>
    : design === designs[1] ? <>{dial}<span>{icon(vehicleIcon(v))}{identity}{state}<small>{battery}</small></span></>
    : <><span className="mob-board-icon">{shape}</span><span>{identity}{state}</span><b>{range}<small>{battery}</small></b></>}
  </Button>;
}

function Options({ label, options, value, change }: { label: string; options: string[]; value: string; change: (v: string) => void }) {
  return <fieldset><legend>{icon(PaintBoardIcon)} {label}</legend><div className="flex flex-wrap gap-1">{options.map(v =>
    <Button key={v} className="min-h-11" size="sm" aria-pressed={value === v} variant={value === v ? 'secondary' : 'ghost'} onPress={() => change(v)}>{icon(Home01Icon)}{v}</Button>)}</div></fieldset>;
}

export default function MobilityStudio() {
  const [section, sectionTo] = useState('Car header');
  return <Review key={section} section={section} sectionTo={sectionTo} />;
}

function Review({ section, sectionTo }: { section: string; sectionTo: (s: string) => void }) {
  const carHeader = section === 'Car header';
  const storage = carHeader ? key + '.carHeader' : key;
  const [scenario, scenarioTo] = useState(carHeader ? 'Charging' : 'Busy garage');
  const [theme, themeTo] = useState('Light');
  const [width, widthTo] = useState('375');
  const [pick, setPick] = useState(() => readPick(storage));
  const [notes, edit] = useState(pick?.notes ?? '');
  const [status, report] = useState('');
  function approve(design: Choice) {
    const next = {design, notes};
    try { localStorage.setItem(storage, JSON.stringify(next)); setPick(next); report('Saved ' + design); }
    catch { report('Browser storage unavailable'); }
  }
  async function copy() {
    if (!pick) return;
    try { await navigator.clipboard.writeText('Mobility · ' + section + ' · ' + pick.design + '\n' + pick.notes); report('Copied'); }
    catch { report('Copy unavailable'); }
  }
  return <main className="pro mob-studio h-dvh overflow-auto p-4" data-page="mobility">
    <StudioNavBar current="mobility" /><h1 className="my-4 text-2xl font-semibold">{icon(Car01Icon)} Mobility Studio</h1>
    <div className="flex flex-wrap gap-4"><Options label="Section" value={section} change={sectionTo} options={['Car header','Vehicle bays']} /><Options label={carHeader ? 'Vehicle state' : 'Garage'} value={scenario} change={scenarioTo} options={Object.keys(carHeader ? headerCars : fleets)} />
      <Options label="Page width" value={width} change={widthTo} options={['375','768','1024','1440','1920']} />
      <Options label="Preview theme" value={theme} change={themeTo} options={['Light','Dark','Both']} /></div>
    <div className="my-4 flex items-end gap-2 flex-wrap"><label>{icon(PaintBoardIcon)} Review notes<TextArea value={notes} onChange={e => edit(e.target.value)} /></label>
      <Button isDisabled={!pick} onPress={copy}>{icon(Copy01Icon)}Copy for the chat</Button><span role="status">{status || pick?.design}</span></div>
    <div className="flex items-start gap-4 overflow-x-auto">{(carHeader ? headers : [designs[3], ...designs.slice(0, 3)]).map(design => <section key={design} className="shrink-0">
      <h2 className="my-2 text-lg font-semibold">{icon(PaintBoardIcon)} {design}</h2>
      {(theme === 'Both' ? ['Light','Dark'] : [theme]).map(t => <div key={t} className={t === 'Dark' ? 'dark' : 'light'} style={{colorScheme:t.toLowerCase() as 'dark'|'light'}}>
        <div className="pro" data-page="mobility">{carHeader ? <div className="mh-preview" style={{width:Number(width)}}><CarHeader car={headerCars[scenario]} design={design} /></div> : <Garage key={scenario} fleet={fleets[scenario]} width={Number(width)} renderBay={(v, enter) => <Bay v={v} enter={enter} design={design as Design} />} />}</div></div>)}
      <Button className="my-2" onPress={() => approve(design)}>{icon(CheckmarkCircle02Icon)}Approve {design[0]}</Button>
    </section>)}</div>
  </main>;
}
