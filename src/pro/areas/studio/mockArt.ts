/** Drawn stand-ins for album art, the camera view and the room photo (no real images in the studio). */
const url = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const svg = (s: string) => `${url(s)} center / cover no-repeat`;

export const SUNSET_ART = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3b2a78'/><stop offset='.45' stop-color='#b2559a'/><stop offset='.75' stop-color='#f59e6b'/><stop offset='1' stop-color='#fcd29f'/></linearGradient></defs><rect width='100' height='100' fill='url(#s)'/><circle cx='62' cy='64' r='11' fill='#ffe2b0' opacity='.9'/><path d='M0 78 L22 56 L36 68 L54 46 L74 70 L88 58 L100 66 L100 100 L0 100Z' fill='#5b3a8c'/><path d='M0 88 L18 74 L40 86 L60 70 L82 84 L100 76 L100 100 L0 100Z' fill='#2e1f57'/></svg>`
);

/** A living room at night: warm floor lamp, sofa, plant, a big window onto a dark garden. */
const ROOM = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'><defs>
<linearGradient id='wall' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2a221d'/><stop offset='.45' stop-color='#5a4535'/><stop offset='1' stop-color='#241d19'/></linearGradient>
<radialGradient id='lamp' cx='.4' cy='.42' r='.45'><stop offset='0' stop-color='#ffcf8a' stop-opacity='.75'/><stop offset='1' stop-color='#ffcf8a' stop-opacity='0'/></radialGradient>
<linearGradient id='night' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0c1424'/><stop offset='1' stop-color='#1b2a2a'/></linearGradient></defs>
<rect width='320' height='180' fill='url(#wall)'/>
<rect x='205' y='18' width='108' height='120' fill='url(#night)'/>
<g fill='#2c3d2d'><circle cx='225' cy='112' r='18'/><circle cx='262' cy='104' r='22'/><circle cx='300' cy='116' r='16'/></g>
<g fill='#ffb35c'><circle cx='238' cy='96' r='1.6'/><circle cx='270' cy='88' r='1.4'/><circle cx='292' cy='100' r='1.6'/><circle cx='252' cy='120' r='1.2'/></g>
<g stroke='#1a1512' stroke-width='3'><line x1='241' y1='18' x2='241' y2='138'/><line x1='277' y1='18' x2='277' y2='138'/></g>
<rect x='0' y='138' width='320' height='42' fill='#3a2c22'/>
<rect width='320' height='180' fill='url(#lamp)'/>
<rect x='126' y='52' width='3' height='88' fill='#c8b49a'/><ellipse cx='127' cy='50' rx='13' ry='9' fill='#ffe0ae'/>
<rect x='150' y='104' width='124' height='34' rx='8' fill='#b79c80'/><rect x='150' y='92' width='124' height='18' rx='8' fill='#c9ae90'/>
<rect x='170' y='146' width='70' height='8' rx='2' fill='#2a1f18'/>
<rect x='34' y='112' width='20' height='28' fill='#3d2f25'/><g fill='#355437'><circle cx='44' cy='96' r='16'/><circle cx='32' cy='82' r='11'/><circle cx='56' cy='80' r='12'/><circle cx='44' cy='70' r='9'/></g>
</svg>`;

export const CAMERA_STILL = svg(ROOM);
/** The room page's hero photo (same room). */
export const ROOM_PHOTO = url(ROOM);

/** A sleek electric car in side view, on transparent: stands in for the car's entity picture (an image URL). */
export const CAR_PICTURE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120'>
  <defs>
    <linearGradient id='b' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e9edf3'/><stop offset='0.55' stop-color='#b9c2cf'/><stop offset='1' stop-color='#7d8796'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#1d2533'/><stop offset='1' stop-color='#3a4558'/></linearGradient>
  </defs>
  <ellipse cx='160' cy='104' rx='138' ry='8' fill='#000' opacity='0.18'/>
  <path d='M22 84 C22 70 34 64 52 61 L96 54 C112 40 136 30 170 30 C204 30 226 40 246 54 L276 60 C292 63 300 72 300 84 L300 90 C300 94 297 96 293 96 L28 96 C24 96 22 93 22 90 Z' fill='url(#b)'/>
  <path d='M104 55 C118 43 140 36 168 36 C194 36 214 43 232 55 Z' fill='url(#g)'/>
  <path d='M168 36 L170 55' stroke='#c9d0da' stroke-width='3'/>
  <path d='M24 80 L298 80' stroke='#fff' stroke-opacity='0.5' stroke-width='1.5'/>
  <rect x='284' y='70' width='14' height='5' rx='2' fill='#ffd58a'/>
  <rect x='24' y='70' width='12' height='5' rx='2' fill='#ff6b6b'/>
  <g fill='#1b1f27'><circle cx='82' cy='94' r='19'/><circle cx='240' cy='94' r='19'/></g>
  <g fill='#9aa3b0'><circle cx='82' cy='94' r='9'/><circle cx='240' cy='94' r='9'/></g>
</svg>`
)}`;
