export interface Vehicle {
  id: string;
  kind: 'Car' | 'Bike';
  name: string;
  rangeUnit?: string;
  range: number | null;
  charge: number | null;
  state: string;
  place: string;
}
