import type { Vehicle } from '../vehicle';
export type { Vehicle } from '../vehicle';
const volt: Vehicle = { id: 'volt', kind: 'Car', name: 'Volt', range: 184, charge: 46, state: 'Charging', place: 'Home' };
const nova: Vehicle = { id: 'nova', kind: 'Car', name: 'Nova', range: 240, charge: 61, state: 'Parked', place: 'Office' };
const cowboy: Vehicle = { id: 'cowboy', kind: 'Bike', name: 'Cowboy', range: 64, charge: 78, state: 'Locked', place: 'Home' };
const cargo: Vehicle = { id: 'cargo', kind: 'Bike', name: 'Cargo', range: 18, charge: 22, state: 'Locked', place: 'Station' };

export const fleets: Record<string, Vehicle[]> = {
  'Busy garage': [volt, nova, cowboy, cargo],
  'Car only': [volt],
  'Bike only': [cowboy],
  'One of each': [volt, cowboy],
  'Two bikes': [cowboy, cargo],
  'Missing readings': [volt, { ...nova, charge: null, range: null, state: 'Unavailable', place: '' }],
  'Empty': []
};

export const headerCars: Record<string, Vehicle> = {
  Charging: volt,
  Parked: nova,
  Driving: { ...nova, state: 'Driving', place: 'On the road' },
  'Missing readings': fleets['Missing readings'][1]
};
