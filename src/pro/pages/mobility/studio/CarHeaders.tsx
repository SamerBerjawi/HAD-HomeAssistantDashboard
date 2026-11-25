import type { Vehicle } from '../vehicle';
import { GarageDoor, carHeaderParts } from '../GarageDoor';
import './carHeaders.css';

export const headers = ['A · Parking pass', 'B · Dashboard dial', 'C · Garage door'] as const;
export function CarHeader({ car, design }: { car: Vehicle; design: string }) {
  if (design === headers[2]) return <GarageDoor car={car} />;
  const { silhouette, name, location, state, range, battery } = carHeaderParts(car);
  if (design === headers[0]) return <article className="mh-pass">
    <div className="mh-paper">{location}{silhouette}{name}{state}</div><div className="mh-stub">{range}{battery}</div>
  </article>;
  return <article className="mh-dashboard">
    <div className="mh-gauge" style={{background: 'conic-gradient(from 225deg,var(--accent) ' + (car.charge ?? 0) * 2.7 + 'deg,var(--separator) 0deg 270deg,transparent 270deg)'}}>
      <div>{range}{battery}</div></div><div className="mh-profile">{silhouette}{name}{state}{location}</div>
  </article>;
}
