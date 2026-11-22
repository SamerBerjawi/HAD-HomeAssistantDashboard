/** Named Car states for the Widget Design Studio (made-up EV; the model is what `buildCarModel` returns). */
import { modeLabel, type ProCarModel } from '../../../lib/overviewCar';
import type { WidgetState } from '../../../studio/types';

const HOME = { lat: 52.3731, lon: 4.8922 };

function car(over: Partial<ProCarModel>): ProCarModel {
  const base: ProCarModel = {
    hasCar: true,
    name: 'Volt',
    image: null,
    mode: 'parked',
    modeLabel: '',
    socPct: 78,
    range: 312,
    rangeUnit: 'km',
    targetPct: 80,
    pluggedIn: false,
    chargeKW: null,
    chargeMinutesLeft: null,
    speed: null,
    speedUnit: 'km/h',
    gear: 'P',
    locked: true,
    windowsClosed: true,
    location: { place: 'Home', isHome: true, lat: HOME.lat, lon: HOME.lon, sinceText: 'since 18:40' },
    cabinTemp: 17,
    outdoorTemp: 9,
    targetCabinTemp: 21,
    tempUnit: '°C',
    climateOn: false,
    climateMinutesLeft: null,
    ota: { state: 'none', text: null },
    alerts: [],
    odometer: 24318,
    odometerUnit: 'km',
    updatedAgoText: '2 min ago',
    controls: { lockId: null, climateId: null }
  };
  const m = { ...base, ...over, location: { ...base.location, ...over.location } };
  return { ...m, modeLabel: modeLabel(m) };
}

export const CAR_STATES: WidgetState<ProCarModel>[] = [
  { id: 'home', label: 'Parked at home', model: car({ mode: 'asleep' }) },
  {
    id: 'charging',
    label: 'Charging',
    model: car({
      mode: 'charging',
      socPct: 46,
      range: 184,
      targetPct: 80,
      pluggedIn: true,
      chargeKW: 7.2,
      chargeMinutesLeft: 95,
      location: { place: 'Home', isHome: true, lat: HOME.lat, lon: HOME.lon, sinceText: 'since 19:05' }
    })
  },
  {
    id: 'driving',
    label: 'Driving',
    model: car({
      mode: 'driving',
      socPct: 61,
      range: 240,
      speed: 64,
      gear: 'D',
      locked: true,
      location: { place: 'On the road', isHome: false, lat: 52.36, lon: 4.86, sinceText: null },
      cabinTemp: 21
    })
  },
  {
    id: 'away',
    label: 'Parked away',
    model: car({ mode: 'parked', socPct: 54, range: 212, location: { place: 'Work', isHome: false, lat: 52.3397, lon: 4.8737, sinceText: 'for 2 h' } })
  },
  {
    id: 'climate',
    label: 'Warming up',
    model: car({ mode: 'climate', climateOn: true, cabinTemp: 8, outdoorTemp: 2, targetCabinTemp: 21, climateMinutesLeft: 12, socPct: 71, range: 280 })
  },
  {
    id: 'ota',
    label: 'Update ready',
    model: car({ mode: 'plugged', socPct: 80, range: 318, pluggedIn: true, ota: { state: 'available', text: 'Software 4.12 ready to install' } })
  },
  {
    id: 'updating',
    label: 'Updating',
    model: car({ mode: 'updating', socPct: 80, range: 318, pluggedIn: true, ota: { state: 'installing', text: 'Installing 4.12 · about 25 min' } })
  },
  {
    id: 'attention',
    label: 'Needs attention',
    model: car({
      mode: 'parked',
      socPct: 11,
      range: 38,
      locked: false,
      windowsClosed: false,
      location: { place: 'Supermarket', isHome: false, lat: 52.3584, lon: 4.9019, sinceText: 'for 25 min' },
      alerts: [
        { id: 'unlocked', text: 'Unlocked, away', tone: 'danger' },
        { id: 'battery', text: 'Battery low · 11%', tone: 'warning' },
        { id: 'window', text: 'Window open', tone: 'warning' },
        { id: 'tyres', text: 'Check tyres', tone: 'warning' }
      ]
    })
  },
  { id: 'none', label: 'No car', model: { ...car({}), hasCar: false } }
];
