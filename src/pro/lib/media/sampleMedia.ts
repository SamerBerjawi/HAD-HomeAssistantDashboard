/**
 * Sample homes for the Media studio (docs/pro-ui/MEDIA.md §0): the owner's set-up today (HomePods
 * and Apple TVs) plus the integrations the page must also take (Music Assistant, Spotify, Sonos).
 * Every title, artist, show and station is made up, and the artwork is generated here (abstract
 * shapes in one hue), never a real cover.
 */
import type { Artwork, LibraryItem, MediaHome, Player, Shelf, Track } from '../mediaHome';

type Motif = 'rings' | 'waves' | 'sun' | 'bars' | 'grid' | 'blob' | 'stripes' | 'dots';

/** An abstract square cover in one hue, as a data URI. */
export function coverArt(hue: number, motif: Motif, seed = 0): Artwork {
  const a = `hsl(${hue} 70% 58%)`;
  const b = `hsl(${(hue + 35) % 360} 75% 38%)`;
  const c = `hsl(${(hue + 340) % 360} 85% 78%)`;
  const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const shapes: Record<Motif, string> = {
    rings: [0, 1, 2, 3, 4].map((i) => `<circle cx="${150 + r(i) * 30 - 15}" cy="${150 + r(i + 7) * 30 - 15}" r="${120 - i * 22}" fill="none" stroke="${i % 2 ? c : 'white'}" stroke-opacity="${0.25 + i * 0.12}" stroke-width="10"/>`).join(''),
    waves: [0, 1, 2, 3].map((i) => `<path d="M0 ${110 + i * 40} C 80 ${70 + i * 40 + r(i) * 40}, 200 ${150 + i * 40 - r(i + 3) * 40}, 300 ${100 + i * 40}" fill="none" stroke="${i % 2 ? c : 'white'}" stroke-opacity="0.55" stroke-width="16" stroke-linecap="round"/>`).join(''),
    sun: `<circle cx="150" cy="${130 + r(1) * 30}" r="78" fill="${c}"/><rect y="190" width="300" height="110" fill="${b}"/>${[0, 1, 2].map((i) => `<rect x="0" y="${208 + i * 24}" width="300" height="8" fill="${c}" opacity="${0.5 - i * 0.12}"/>`).join('')}`,
    bars: Array.from({ length: 9 }, (_, i) => `<rect x="${24 + i * 29}" y="${240 - (60 + r(i) * 150)}" width="18" height="${60 + r(i) * 150}" rx="9" fill="${i % 3 ? 'white' : c}" opacity="0.8"/>`).join(''),
    grid: Array.from({ length: 16 }, (_, i) => `<rect x="${30 + (i % 4) * 62}" y="${30 + Math.floor(i / 4) * 62}" width="54" height="54" rx="${r(i) > 0.5 ? 27 : 8}" fill="${r(i + 2) > 0.6 ? c : 'white'}" opacity="${0.25 + r(i + 5) * 0.6}"/>`).join(''),
    blob: `<path d="M150 40 C 230 40, 270 110, 250 170 S 170 270, 110 250 S 30 160, 60 100 S 100 40, 150 40 Z" fill="${c}" opacity="0.85"/><circle cx="${110 + r(2) * 80}" cy="${120 + r(3) * 60}" r="34" fill="white" opacity="0.7"/>`,
    stripes: Array.from({ length: 7 }, (_, i) => `<rect x="-60" y="${i * 52 - 20}" width="420" height="22" fill="${i % 2 ? c : 'white'}" opacity="0.45" transform="rotate(-24 150 150)"/>`).join(''),
    dots: Array.from({ length: 24 }, (_, i) => `<circle cx="${20 + r(i) * 260}" cy="${20 + r(i + 30) * 260}" r="${6 + r(i + 60) * 26}" fill="${i % 3 ? 'white' : c}" opacity="${0.3 + r(i + 90) * 0.6}"/>`).join('')
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/>${shapes[motif]}</svg>`;
  return { src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, hue };
}

const H = 3600_000;
const NOW = new Date(2026, 10, 27, 20, 40).getTime();

const T = (id: string, title: string, artist: string, hue: number, motif: Motif, duration: number): Track => ({ id, title, artist, art: coverArt(hue, motif, id.length), duration });

const QUEUE: Track[] = [
  T('q1', 'Copper Skies', 'Lumen Fold', 28, 'sun', 223),
  T('q2', 'Undertow', 'Marigold Static', 200, 'waves', 254),
  T('q3', 'Paper Planets', 'The Quiet Harbour', 280, 'rings', 198),
  T('q4', 'Late Tram', 'Nadia Veil', 150, 'stripes', 241),
  T('q5', 'Glasshouse', 'Lumen Fold', 340, 'blob', 187)
];

const can = (p: Partial<Player['can']> = {}): Player['can'] => ({ seek: true, skip: true, volume: true, shuffle: true, repeat: true, group: true, browse: true, power: false, ...p });

/** The owner's players today: HomePods and Apple TVs (apple_tv integration, AirPlay grouping). */
function basePlayers(): Player[] {
  const homepod = (id: string, room: string, model = 'HomePod mini'): Player => ({
    id, name: `${room} HomePod`, room, kind: 'speaker', platform: 'apple_tv', model, state: 'idle', media: null, volume: 35, muted: false, shuffle: false, repeat: 'off', queue: [], group: [], joinable: [], sources: [], source: null, can: can({ shuffle: true, repeat: true })
  });
  const tv = (id: string, room: string): Player => ({
    id, name: `${room} Apple TV`, room, kind: 'tv', platform: 'apple_tv', model: 'Apple TV 4K', state: 'idle', media: null, volume: null, muted: false, shuffle: null, repeat: null, queue: [], group: [], joinable: [], sources: ['TV', 'Music', 'Photos', 'Arcade', 'Fitness', 'Podcasts'], source: null, can: can({ volume: false, shuffle: false, repeat: false, group: false, power: true })
  });
  const players = [homepod('hp-living', 'Living room', 'HomePod'), homepod('hp-kitchen', 'Kitchen'), homepod('hp-bedroom', 'Bedroom'), tv('tv-living', 'Living room'), tv('tv-den', 'Den')];
  // AirPlay: every HomePod can join every other.
  const pods = players.filter((p) => p.kind === 'speaker').map((p) => p.id);
  return players.map((p) => (p.kind === 'speaker' ? { ...p, joinable: pods.filter((x) => x !== p.id) } : p));
}

/** Integrations the page also takes: a Sonos in the office (Sonos), a Music Assistant player in the garage, Spotify Connect on the desk. */
function otherPlayers(): Player[] {
  return [
    { id: 'sonos-office', name: 'Office Sonos', room: 'Office', kind: 'speaker', platform: 'sonos', model: 'Sonos Era 100', state: 'idle', media: null, volume: 28, muted: false, shuffle: false, repeat: 'off', queue: [], group: [], joinable: ['ma-garage'], sources: ['Line-in'], source: null, can: can() },
    { id: 'ma-garage', name: 'Garage', room: 'Garage', kind: 'speaker', platform: 'music_assistant', model: 'Music Assistant', state: 'idle', media: null, volume: 50, muted: false, shuffle: false, repeat: 'off', queue: [], group: [], joinable: ['sonos-office'], sources: [], source: null, can: can() }
  ];
}

const music = (title: string, artist: string, album: string, hue: number, motif: Motif, duration: number, elapsed: number) => ({ kind: 'music' as const, title, subtitle: artist, album, art: coverArt(hue, motif, title.length), app: null, duration, position: elapsed, positionAt: NOW });

function shelves(withOthers: boolean): Shelf[] {
  const item = (id: string, title: string, subtitle: string | null, kind: LibraryItem['kind'], hue: number, motif: Motif, on: string[] | null = null): LibraryItem => ({ id, title, subtitle, art: coverArt(hue, motif, id.length * 3), kind, contentId: kind === 'app' ? null : `library://${kind}/${id}`, contentType: kind === 'app' ? null : kind === 'radio' ? 'radio' : kind === 'playlist' ? 'playlist' : 'music', on });
  const list: Shelf[] = [
    {
      id: 'recent', kind: 'recent', title: 'Recently played',
      items: [
        item('r1', 'Slow Morning', 'Playlist · you', 'playlist', 32, 'sun'),
        item('r2', 'Harbour Lights', 'The Quiet Harbour', 'album', 205, 'waves'),
        item('r3', 'Night Shift', 'Nadia Veil', 'album', 265, 'rings'),
        item('r4', 'Kitchen Radio', 'Station', 'radio', 12, 'bars'),
        item('r5', 'Focus Flow', 'Playlist', 'playlist', 165, 'grid'),
        item('r6', 'Fieldnotes', 'Podcast', 'podcast', 45, 'dots'),
        item('r7', 'Velvet Static', 'Marigold Static', 'album', 320, 'blob'),
        item('r8', 'Sunday Dinner', 'Playlist · you', 'playlist', 18, 'stripes')
      ]
    },
    {
      id: 'playlists', kind: 'playlists', title: 'Your playlists',
      items: [
        item('p1', 'Slow Morning', '42 songs', 'playlist', 32, 'sun'),
        item('p2', 'Run Club', '58 songs', 'playlist', 350, 'stripes'),
        item('p3', 'Focus Flow', '120 songs', 'playlist', 165, 'grid'),
        item('p4', 'Sunday Dinner', '37 songs', 'playlist', 18, 'stripes'),
        item('p5', 'Kids in the car', '64 songs', 'playlist', 55, 'dots'),
        item('p6', 'Late Night', '29 songs', 'playlist', 250, 'rings')
      ]
    },
    {
      id: 'radio', kind: 'radio', title: 'Radio',
      items: [
        item('s1', 'City FM', 'News and talk', 'radio', 210, 'bars'),
        item('s2', 'Kitchen Radio', 'Easy listening', 'radio', 12, 'bars'),
        item('s3', 'Lowlands Jazz', 'Jazz', 'radio', 280, 'waves'),
        item('s4', 'Classic North', 'Classical', 'radio', 45, 'rings')
      ]
    },
    {
      id: 'apps', kind: 'apps', title: 'On the TV',
      items: [
        item('a1', 'TV', 'Apple TV', 'app', 220, 'grid', ['tv-living', 'tv-den']),
        item('a2', 'Fitness', 'Apple TV', 'app', 140, 'rings', ['tv-living', 'tv-den']),
        item('a3', 'Photos', 'Apple TV', 'app', 30, 'blob', ['tv-living', 'tv-den']),
        item('a4', 'Arcade', 'Apple TV', 'app', 300, 'dots', ['tv-living', 'tv-den'])
      ]
    }
  ];
  return withOthers ? list : list;
}

export type SampleMediaId = 'evening' | 'party' | 'tv' | 'quiet' | 'mixed';

export const SAMPLE_MEDIA_STATES: { id: SampleMediaId; label: string }[] = [
  { id: 'evening', label: 'Music in the living room' },
  { id: 'party', label: 'Grouped: three rooms' },
  { id: 'tv', label: 'TV on, music paused' },
  { id: 'quiet', label: 'Nothing playing' },
  { id: 'mixed', label: 'Every integration' }
];

export function sampleMediaHome(id: SampleMediaId): MediaHome {
  const players = id === 'mixed' ? [...basePlayers(), ...otherPlayers()] : basePlayers();
  const set = (pid: string, p: Partial<Player>) => {
    const i = players.findIndex((x) => x.id === pid);
    if (i >= 0) players[i] = { ...players[i], ...p };
  };
  if (id === 'evening' || id === 'mixed') {
    set('hp-living', { state: 'playing', volume: 42, media: music('Neon Harbour', 'The Paper Lanterns', 'Tidewater', 262, 'waves', 236, 71), queue: QUEUE });
  }
  if (id === 'party') {
    const media = music('Fold the Night', 'Lumen Fold', 'Everything at Once', 330, 'rings', 252, 140);
    set('hp-living', { state: 'playing', volume: 55, media, queue: QUEUE, group: ['hp-kitchen', 'hp-bedroom'] });
    set('hp-kitchen', { state: 'playing', volume: 40, media, queue: QUEUE, group: ['hp-living', 'hp-bedroom'] });
    set('hp-bedroom', { state: 'playing', volume: 25, media, queue: QUEUE, group: ['hp-living', 'hp-kitchen'] });
  }
  if (id === 'tv') {
    set('tv-living', { state: 'playing', source: 'TV', media: { kind: 'tv', title: 'The Lighthouse Keepers', subtitle: 'S2 · E4 · Low Tide', album: null, art: coverArt(195, 'sun', 4), app: 'TV', duration: 2940, position: 1210, positionAt: NOW } });
    set('hp-kitchen', { state: 'paused', volume: 30, media: music('Copper Skies', 'Lumen Fold', 'Everything at Once', 28, 'sun', 223, 96), queue: QUEUE.slice(1) });
  }
  if (id === 'mixed') {
    set('sonos-office', { state: 'playing', media: { kind: 'radio', title: 'Lowlands Jazz', subtitle: 'The Late Set', album: null, art: coverArt(280, 'waves', 9), app: null, duration: null, position: null, positionAt: null } });
    set('ma-garage', { state: 'paused', media: { kind: 'podcast', title: 'Ep. 112 · Tools that last', subtitle: 'Fieldnotes', album: null, art: coverArt(45, 'dots', 12), app: null, duration: 3120, position: 1844, positionAt: NOW }, queue: [] });
    set('tv-den', { state: 'off' });
  }
  return { now: NOW + (id === 'quiet' ? -2 * H : 0), players, shelves: shelves(id === 'mixed') };
}
