import { HugeiconsIcon } from '@hugeicons/react';
import { Car01Icon, FlashIcon, Home01Icon } from '@hugeicons/core-free-icons';
import type { Vehicle } from './vehicle';
import './garageDoor.css';

export function carHeaderParts(car: Vehicle) {
  const silhouette = <HugeiconsIcon icon={Car01Icon} className="mh-car" aria-hidden />;
  const name = <h3>{car.name}</h3>;
  const location = car.place && <span className="mh-location"><HugeiconsIcon icon={Home01Icon} size={16} /> {car.place}</span>;
  const state = <span className="mh-state"><HugeiconsIcon icon={Car01Icon} size={16} /> {car.state}</span>;
  const range = <strong className="mh-range">{car.range ?? '—'} <small>{car.range === null ? 'range unknown' : car.rangeUnit || 'km'}</small></strong>;
  const battery = <span className="mh-charge"><HugeiconsIcon icon={FlashIcon} size={16} /> {car.charge === null ? 'Battery unknown' : car.charge + '%'}</span>;
  return { silhouette, name, location, state, range, battery };
}

export function GarageDoor({ car }: { car: Vehicle }) {
  const { silhouette, name, location, state, range, battery } = carHeaderParts(car);
  return <article className="mh-door"><div className="mh-shutter">{name}{location}{silhouette}</div>
    <div className="mh-threshold"><h4>{state}</h4><div>{range}{battery}</div></div></article>;
}
