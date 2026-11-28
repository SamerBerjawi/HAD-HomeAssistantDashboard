/**
 * The Media page's model (docs/pro-ui/MEDIA.md §0), brand-neutral like Mobility's: every player in
 * the home (a HomePod, an Apple TV, a Sonos, a Music Assistant player, a Spotify Connect device…)
 * becomes one `Player`, with what it plays, its queue, its group and what it can do; the library
 * (playlists, favourites, recently played, radio, TV apps) becomes shelves of `LibraryItem`s to
 * start something from. Whatever a player or integration lacks stays null or empty, and the page
 * leaves it out.
 */

export type PlayerKind = 'speaker' | 'tv';
export type PlayerState = 'playing' | 'paused' | 'idle' | 'off' | 'unavailable';
export type MediaKind = 'music' | 'radio' | 'podcast' | 'tv' | 'movie' | 'app';
export type Repeat = 'off' | 'all' | 'one';

export interface Artwork {
  /** An image URL (HA's entity_picture, a library thumbnail, or a sample's generated art). */
  src: string | null;
  /** The artwork's main hue (0–360), to tint the page like Apple Music; null when unknown. */
  hue: number | null;
}

export interface NowPlaying {
  kind: MediaKind;
  title: string;
  /** Artist, show or station. */
  subtitle: string | null;
  album: string | null;
  art: Artwork;
  /** The app on a TV ("TV", "YouTube"…), else null. */
  app: string | null;
  /** Seconds; null for live radio and TV without a timeline. */
  duration: number | null;
  /** Seconds at `positionAt`. */
  position: number | null;
  positionAt: number | null;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  art: Artwork;
  duration: number | null;
}

export interface Player {
  id: string;
  name: string;
  room: string | null;
  kind: PlayerKind;
  /** The integration ("apple_tv", "music_assistant", "spotify", "sonos", "cast"…). */
  platform: string;
  /** The device ("HomePod mini", "Apple TV 4K", "Sonos One"…), when known. */
  model: string | null;
  state: PlayerState;
  media: NowPlaying | null;
  volume: number | null;
  muted: boolean;
  shuffle: boolean | null;
  repeat: Repeat | null;
  /** Up next (Music Assistant, Sonos); empty when the integration doesn't say. */
  queue: Track[];
  /** The players this one plays with (its group), itself excluded. */
  group: string[];
  /** Players it can be grouped with (same integration, or AirPlay targets). */
  joinable: string[];
  /** Inputs or apps to switch to (a TV's apps, a receiver's inputs). */
  sources: string[];
  source: string | null;
  can: { seek: boolean; skip: boolean; volume: boolean; shuffle: boolean; repeat: boolean; group: boolean; browse: boolean; power: boolean };
}

export type ShelfKind = 'recent' | 'favourites' | 'playlists' | 'radio' | 'podcasts' | 'apps' | 'more';

export interface LibraryItem {
  id: string;
  title: string;
  subtitle: string | null;
  art: Artwork;
  kind: MediaKind | 'playlist' | 'album' | 'artist';
  /** What `play_media` takes (media_content_id and type); null for TV apps, which switch `source`. */
  contentId: string | null;
  contentType: string | null;
  /** The players that can play it (a TV app only on its TV). */
  on: string[] | null;
}

export interface Shelf {
  id: string;
  kind: ShelfKind;
  title: string;
  items: LibraryItem[];
}

export interface MediaHome {
  now: number;
  players: Player[];
  shelves: Shelf[];
}

export type MediaAction =
  | { type: 'play-pause' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'seek'; seconds: number }
  | { type: 'volume'; pct: number }
  | { type: 'mute'; muted: boolean }
  | { type: 'shuffle'; on: boolean }
  | { type: 'repeat'; mode: Repeat }
  | { type: 'power'; on: boolean }
  | { type: 'source'; source: string }
  | { type: 'group'; with: string[] }
  | { type: 'play-item'; item: LibraryItem }
  | { type: 'play-track'; track: Track };

// ---------------------------------------------------------------------------------------------
// Reading the model
// ---------------------------------------------------------------------------------------------

export const isActive = (p: Player) => p.state === 'playing' || p.state === 'paused';

/** Where a track is now (seconds), counting on from `positionAt` while playing. */
export function positionNow(p: Player, now: number): number | null {
  const m = p.media;
  if (!m || m.position === null) return null;
  const run = p.state === 'playing' && m.positionAt !== null ? (now - m.positionAt) / 1000 : 0;
  return m.duration !== null ? Math.min(m.duration, m.position + run) : m.position + run;
}

/** Players that play together, the leader first: one entry per group, lone players alone. */
export function groupsOf(players: Player[]): Player[][] {
  const seen = new Set<string>();
  const out: Player[][] = [];
  for (const p of players) {
    if (seen.has(p.id)) continue;
    const members = [p, ...p.group.map((id) => players.find((x) => x.id === id)).filter((x): x is Player => !!x && !seen.has(x.id))];
    members.forEach((m) => seen.add(m.id));
    out.push(members);
  }
  return out;
}

/** "Living room", "Living room + Kitchen", "Living room + 2". */
export function groupName(members: Player[]): string {
  const names = members.map((m) => m.room ?? m.name);
  if (names.length <= 2) return names.join(' + ');
  return `${names[0]} + ${names.length - 1}`;
}

/** The player the page leads with: what is playing (music before TV, the latest first), else the last used. */
export function leadPlayer(home: MediaHome, chosen?: string | null): Player | null {
  const pick = chosen ? home.players.find((p) => p.id === chosen) : null;
  if (pick) return pick;
  const order = (p: Player) => (p.state === 'playing' ? 0 : p.state === 'paused' ? 1 : 2) + (p.kind === 'tv' ? 0.5 : 0);
  return [...home.players].filter((p) => p.state !== 'unavailable').sort((a, b) => order(a) - order(b))[0] ?? null;
}

/** The player whose library the page shows: the lead if it has one (a media browser, or a TV's apps), else another that has, the ones playing first. */
export function libraryPlayer(home: MediaHome, lead: Player | null): Player | null {
  const has = (p: Player) => p.can.browse || (p.kind === 'tv' && p.sources.length > 0);
  if (!lead || has(lead)) return lead;
  const order = (p: Player) => (p.state === 'playing' ? 0 : p.state === 'paused' ? 1 : 2);
  return [...home.players].filter((p) => has(p) && p.state !== 'unavailable').sort((a, b) => order(a) - order(b))[0] ?? lead;
}

/** "Playing in 2 rooms", "Paused in the Living room", "Nothing playing". */
export function homeLine(home: MediaHome): string {
  const groups = groupsOf(home.players).filter((g) => g.some(isActive));
  const playing = groups.filter((g) => g.some((p) => p.state === 'playing'));
  if (!groups.length) return 'Nothing playing';
  if (playing.length > 1) return `Playing in ${playing.length} places`;
  if (playing.length === 1) return `Playing in ${groupName(playing[0])}`;
  return `Paused in ${groupName(groups[0])}`;
}

/** A track length as 3:41 or 1:02:05. */
export function clockOf(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '';
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** The Apple Music tint for some artwork: a deep and a light shade of its hue, neutral when unknown. */
export function tintOf(art: Artwork | null | undefined, dark: boolean): { deep: string; soft: string; hue: number | null } {
  const h = art?.hue ?? null;
  if (h === null) return { deep: dark ? 'hsl(240 6% 16%)' : 'hsl(240 8% 92%)', soft: dark ? 'hsl(240 6% 22%)' : 'hsl(240 10% 96%)', hue: null };
  return dark ? { deep: `hsl(${h} 45% 20%)`, soft: `hsl(${h} 40% 30%)`, hue: h } : { deep: `hsl(${h} 55% 82%)`, soft: `hsl(${h} 60% 93%)`, hue: h };
}

/** A greeting for the library home, by the hour. */
export function greeting(now: number): string {
  const h = new Date(now).getHours();
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// ---------------------------------------------------------------------------------------------
// Sample actions (studio and demo): what each control does to a sample player
// ---------------------------------------------------------------------------------------------

export function applySampleAction(home: MediaHome, playerId: string, a: MediaAction): MediaHome {
  const now = home.now;
  const target = home.players.find((p) => p.id === playerId);
  if (!target) return home;
  // Playback controls act on the whole group, as on AirPlay and Sonos.
  const members = new Set([playerId, ...target.group]);
  const map = (fn: (p: Player) => Player) => ({ ...home, players: home.players.map((p) => (members.has(p.id) ? fn(p) : p)) });
  const settle = (p: Player): NowPlaying | null => (p.media ? { ...p.media, position: positionNow(p, now), positionAt: now } : null);
  switch (a.type) {
    case 'play-pause':
      return map((p) => ({ ...p, media: settle(p), state: p.state === 'playing' ? 'paused' : p.media ? 'playing' : p.state }));
    case 'next':
    case 'prev': {
      const q = target.queue;
      if (!q.length) return map((p) => (p.media ? { ...p, media: { ...p.media, position: 0, positionAt: now } } : p));
      const t = a.type === 'next' ? q[0] : q[q.length - 1];
      const rest = a.type === 'next' ? q.slice(1) : q.slice(0, -1);
      return map((p) => ({ ...p, state: 'playing', queue: rest, media: trackMedia(t, now) }));
    }
    case 'seek':
      return map((p) => (p.media ? { ...p, media: { ...p.media, position: a.seconds, positionAt: now } } : p));
    case 'volume':
      return { ...home, players: home.players.map((p) => (p.id === playerId ? { ...p, volume: a.pct, muted: false } : p)) };
    case 'mute':
      return { ...home, players: home.players.map((p) => (p.id === playerId ? { ...p, muted: a.muted } : p)) };
    case 'shuffle':
      return map((p) => ({ ...p, shuffle: a.on }));
    case 'repeat':
      return map((p) => ({ ...p, repeat: a.mode }));
    case 'power':
      return { ...home, players: home.players.map((p) => (p.id === playerId ? { ...p, state: a.on ? 'idle' : 'off', media: a.on ? p.media : null } : p)) };
    case 'source':
      return { ...home, players: home.players.map((p) => (p.id === playerId ? { ...p, source: a.source, state: 'playing', media: { kind: 'app', title: a.source, subtitle: null, album: null, art: { src: null, hue: null }, app: a.source, duration: null, position: null, positionAt: null } } : p)) };
    case 'group': {
      // The leader's music goes to everyone in the new group; players dropped from it stop.
      const next = new Set(a.with.filter((id) => id !== playerId));
      return {
        ...home,
        players: home.players.map((p) => {
          if (p.id === playerId) return { ...p, group: [...next] };
          if (next.has(p.id)) return { ...p, group: [playerId, ...[...next].filter((x) => x !== p.id)], state: target.state, media: target.media, queue: target.queue, shuffle: target.shuffle, repeat: target.repeat };
          if (target.group.includes(p.id)) return { ...p, group: [], state: 'idle', media: null, queue: [] };
          return p;
        })
      };
    }
    case 'play-item':
      return map((p) => ({ ...p, state: 'playing', media: { kind: a.item.kind === 'radio' || a.item.kind === 'podcast' ? a.item.kind : 'music', title: a.item.kind === 'radio' ? a.item.title : `${a.item.title}`, subtitle: a.item.subtitle, album: a.item.kind === 'album' ? a.item.title : null, art: a.item.art, app: null, duration: a.item.kind === 'radio' ? null : 214, position: 0, positionAt: now } }));
    case 'play-track':
      return map((p) => ({ ...p, state: 'playing', media: trackMedia(a.track, now), queue: p.queue.filter((t) => t.id !== a.track.id) }));
  }
}

const trackMedia = (t: Track, now: number): NowPlaying => ({ kind: 'music', title: t.title, subtitle: t.artist, album: null, art: t.art, app: null, duration: t.duration, position: 0, positionAt: now });
