import { Fragment, useState, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Car01Icon, Bicycle01Icon, ArrowLeft01Icon, FlashIcon } from '@hugeicons/core-free-icons';
import type { Vehicle } from './vehicle';
import './garage.css';
import { GarageDoor } from './GarageDoor';

const icon = (glyph: typeof Car01Icon, size = 18) => <HugeiconsIcon icon={glyph} size={size} aria-hidden />;
const vehicleIcon = (v: Vehicle) => v.kind === 'Car' ? Car01Icon : Bicycle01Icon;

export function GarageDial({ v, enter }: { v: Vehicle; enter: () => void }) {
  const range = v.range === null ? 'Range unknown' : v.range + ' ' + (v.rangeUnit || 'km');
  return <Button variant="ghost" className="mob-bay mob-D" onPress={enter} aria-label={'Open ' + v.name}>
    <span className="mob-parking">{icon(vehicleIcon(v), 52)}
      <span className="mob-dial" style={{ background: 'conic-gradient(var(--accent) ' + (v.charge ?? 0) + '%,var(--separator) 0)' }}><b>{range}</b></span>
    </span>
    <span><strong>{v.name}</strong><small>{[v.state, v.place].filter(Boolean).join(' · ')}</small></span>
    <b>{icon(FlashIcon)} {v.charge === null ? 'Battery unknown' : v.charge + '%'}</b>
  </Button>;
}

export function Garage({ fleet, width, renderBay }: { fleet: Vehicle[]; width?: number; renderBay?: (v: Vehicle, enter: () => void) => ReactNode }) {
  const [id, select] = useState('');
  const groups = (['Car','Bike'] as const).map(kind => fleet.filter(v => v.kind === kind));
  const bays = groups.some(group => group.length > 1);
  const current = fleet.find(v => v.id === id) ?? (bays ? undefined : fleet[0]);
  return <div style={{width}} className="mob-preview">
    {!fleet.length ? <p>{icon(Car01Icon)} No vehicles configured</p> : current ? <>
      {bays ? <Button variant="ghost" onPress={() => select('')}>{icon(ArrowLeft01Icon)}All bays</Button> :
        fleet.length === 2 && <div className="flex gap-2">{fleet.map(v => <Button key={v.id} aria-pressed={current === v} variant={current === v ? 'secondary' : 'ghost'} onPress={() => select(v.id)}>{icon(vehicleIcon(v))}{v.kind}</Button>)}</div>}
      {current.kind === 'Car' ? <div className="mt-3"><GarageDoor car={current} /></div> : <article className="pro-surface mt-3 space-y-2 p-4"><h3>{icon(vehicleIcon(current))}{current.name}</h3>
        <p>{current.state} · {current.range === null ? 'Range unknown' : current.range + ' ' + (current.rangeUnit || 'km')}</p>
        <p>{icon(FlashIcon)} {current.charge === null ? 'Battery unknown' : current.charge + '%'}</p></article>}
    </> : groups.filter(group => group.length).map(group => <section key={group[0].kind}>
      <h3>{icon(vehicleIcon(group[0]))}{group[0].kind === 'Car' ? 'Cars' : 'Bikes'}</h3>
      <div className="mob-group">{group.map(v => <Fragment key={v.id}>{renderBay ? renderBay(v, () => select(v.id)) : <GarageDial v={v} enter={() => select(v.id)} />}</Fragment>)}</div>
    </section>)}
  </div>;
}

