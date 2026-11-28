/** Drawn stand-ins for camera views in the Security Studio (no real images or streams in the studio). */
export { CAMERA_STILL as LIVING_ROOM } from '../../../areas/studio/mockArt';

const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}") center / cover no-repeat`;

/** Driveway by day: a house front, paving, a parked car. */
export const DRIVEWAY = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'>
<defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9fc3df'/><stop offset='1' stop-color='#dfe9ef'/></linearGradient></defs>
<rect width='320' height='180' fill='url(#sky)'/>
<rect x='0' y='60' width='170' height='70' fill='#d8cfc2'/><path d='M-10 62 L80 20 L180 62Z' fill='#6b5f57'/>
<rect x='22' y='78' width='34' height='30' fill='#5d7385'/><rect x='104' y='78' width='46' height='52' fill='#7a5b43'/>
<g fill='#4f7a4a'><circle cx='200' cy='96' r='26'/><circle cx='236' cy='84' r='30'/><circle cx='292' cy='98' r='28'/></g>
<path d='M0 130 L320 120 L320 180 L0 180Z' fill='#a9a39a'/><path d='M120 180 L170 128 L222 126 L300 180Z' fill='#c7c1b7'/>
<g transform='translate(168 124)'><path d='M0 30 C0 22 8 18 18 17 L36 12 C44 4 58 0 74 0 C90 0 100 5 108 12 L122 16 C130 18 134 24 134 30 L134 36 L0 36Z' fill='#2f4e6e'/><path d='M40 13 C48 6 60 3 74 3 C86 3 96 7 102 13Z' fill='#1b2633'/><g fill='#15181d'><circle cx='28' cy='36' r='10'/><circle cx='108' cy='36' r='10'/></g></g>
</svg>`);

/** Front porch: the front door, steps, and a parcel on the mat. */
export const PORCH = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'>
<rect width='320' height='180' fill='#cfc6b8'/><rect x='0' y='0' width='320' height='18' fill='#8d8173'/>
<rect x='118' y='26' width='84' height='124' fill='#3d4f45'/><rect x='126' y='34' width='68' height='48' fill='#4c6156'/><rect x='126' y='90' width='68' height='52' fill='#4c6156'/>
<circle cx='186' cy='96' r='3.5' fill='#d9b46a'/><rect x='60' y='40' width='38' height='60' fill='#e9e2d3'/><rect x='222' y='40' width='38' height='60' fill='#e9e2d3'/>
<rect x='0' y='150' width='320' height='30' fill='#9b9184'/><rect x='104' y='148' width='112' height='8' fill='#6e655b'/>
<rect x='196' y='126' width='34' height='26' rx='2' fill='#b98a55'/><rect x='211' y='126' width='4' height='26' fill='#e2c595'/>
<g fill='#5b7d4f'><circle cx='30' cy='140' r='18'/><circle cx='290' cy='140' r='18'/></g>
</svg>`);

/** Back garden at night: lawn, trees, a fence and the patio light. */
export const GARDEN_NIGHT = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'>
<defs><linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0b1220'/><stop offset='1' stop-color='#1a2a2c'/></linearGradient>
<radialGradient id='l' cx='.2' cy='.7' r='.5'><stop offset='0' stop-color='#ffd79a' stop-opacity='.45'/><stop offset='1' stop-color='#ffd79a' stop-opacity='0'/></radialGradient></defs>
<rect width='320' height='180' fill='url(#n)'/>
<g fill='#16231d'><circle cx='60' cy='86' r='34'/><circle cx='120' cy='74' r='40'/><circle cx='250' cy='80' r='42'/><circle cx='300' cy='94' r='30'/></g>
<g stroke='#2a3530' stroke-width='3'><line x1='0' y1='112' x2='320' y2='108'/><line x1='0' y1='124' x2='320' y2='120'/></g>
<path d='M0 128 L320 124 L320 180 L0 180Z' fill='#1f3326'/><rect width='320' height='180' fill='url(#l)'/>
<g fill='#cfd8d2' opacity='.55'><circle cx='210' cy='122' r='5'/><rect x='206' y='127' width='8' height='18' rx='3'/></g>
</svg>`);

/** Garage interior: up-and-over door, shelves, a bike. */
export const GARAGE = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'>
<rect width='320' height='180' fill='#4a4c50'/><rect x='70' y='20' width='180' height='120' fill='#8b8f95'/>
<g stroke='#6f7378' stroke-width='3'><line x1='70' y1='50' x2='250' y2='50'/><line x1='70' y1='80' x2='250' y2='80'/><line x1='70' y1='110' x2='250' y2='110'/></g>
<rect x='0' y='140' width='320' height='40' fill='#5d5f63'/><g fill='#2e3033'><rect x='10' y='40' width='44' height='6'/><rect x='10' y='76' width='44' height='6'/><rect x='266' y='40' width='44' height='6'/></g>
<g stroke='#1d1f22' stroke-width='4' fill='none'><circle cx='278' cy='150' r='16'/><circle cx='308' cy='150' r='16'/><path d='M278 150 L292 128 L308 150'/></g>
</svg>`);
