/**
 * The live library (docs/pro-ui/MEDIA.md §0): shelves to start something from, built from what
 * Home Assistant offers. Three sources, all honest about where they come from:
 * - Recently played: what this dashboard saw playing that HA can start again (it has a
 *   `media_content_id`), kept on this device.
 * - The player's own library through HA's media browser (`media_player/browse_media`): Music
 *   Assistant's playlists and radio, Spotify's playlists, Sonos favourites, an Apple TV's apps…
 * - A TV's apps and inputs from its `source_list`.
 * Pure functions here; the hook fetches and stores.
 */
import type { Artwork, LibraryItem, Player, Shelf, ShelfKind } from '../mediaHome';

/** One node of HA's media browser answer. */
export interface BrowseNode {
  title: string;
  media_class?: string | null;
  media_content_id: string;
  media_content_type: string;
  can_play?: boolean;
  can_expand?: boolean;
  thumbnail?: string | null;
  children?: BrowseNode[] | null;
  children_media_class?: string | null;
}

type Art = (src: string | null) => Artwork;

/** Media sources that aren't something to listen to (text-to-speech, cameras, uploaded images). */
const SKIP = /^media-source:\/\/(tts|camera|image_upload|image)\b/i;
export const skipNode = (n: BrowseNode) => SKIP.test(n.media_content_id) || /^(text[- ]to[- ]speech|camera|image upload|my media)$/i.test(n.title);

function itemKind(cls: string | null | undefined, contentType: string): LibraryItem['kind'] {
  const c = (cls ?? contentType ?? '').toLowerCase();
  if (c === 'playlist') return 'playlist';
  if (c === 'album') return 'album';
  if (c === 'artist') return 'artist';
  if (c === 'podcast' || c === 'episode') return 'podcast';
  if (c === 'app') return 'app';
  if (c === 'movie' || c === 'video') return 'movie';
  if (c === 'tv_show' || c === 'season') return 'tv';
  if (c === 'channel' || /radio/.test(contentType.toLowerCase())) return 'radio';
  return 'music';
}

export function shelfKind(title: string, childClass: string | null | undefined): ShelfKind {
  if (/recent/i.test(title)) return 'recent';
  if (/radio|station/i.test(title)) return 'radio';
  if (/podcast/i.test(title)) return 'podcasts';
  if (/playlist/i.test(title)) return 'playlists';
  if (/favou?rite/i.test(title)) return 'favourites';
  if (childClass === 'app' || /^apps?$/i.test(title)) return 'apps';
  return 'more';
}

export function itemOf(n: BrowseNode, playerId: string, art: Art, subtitle: string | null = null): LibraryItem {
  return {
    id: `${playerId}|${n.media_content_type}|${n.media_content_id}`,
    title: n.title,
    subtitle,
    art: art(n.thumbnail ?? null),
    kind: itemKind(n.media_class, n.media_content_type),
    contentId: n.media_content_id,
    contentType: n.media_content_type,
    on: [playerId]
  };
}

/** A shelf from a browsed folder: its playable children (up to `max`); null when there are none. */
export function shelfOf(node: BrowseNode, playerId: string, art: Art, title = node.title, max = 20): Shelf | null {
  const items = (node.children ?? []).filter((c) => c.can_play && !skipNode(c)).slice(0, max).map((c) => itemOf(c, playerId, art));
  if (!items.length) return null;
  return { id: `${playerId}|${node.media_content_type}|${node.media_content_id}`, kind: shelfKind(title, node.children_media_class), title, items };
}

/** Folders under a browsed node worth opening as shelves, the likeliest first. */
export function foldersOf(node: BrowseNode, max = 6): BrowseNode[] {
  const rank = (n: BrowseNode) => (/recent/i.test(n.title) ? 0 : /favou?rite/i.test(n.title) ? 1 : /playlist/i.test(n.title) ? 2 : /radio/i.test(n.title) ? 3 : /popular|local|top/i.test(n.title) ? 4 : 5);
  return (node.children ?? [])
    .filter((c) => c.can_expand && !skipNode(c))
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i)
    .slice(0, max)
    .map((x) => x.c);
}

/** A TV's apps and inputs (its `source_list`), started with `select_source`. */
export function appsShelf(p: Player): Shelf | null {
  if (p.kind !== 'tv' || !p.sources.length) return null;
  return {
    id: `${p.id}|sources`,
    kind: 'apps',
    title: `On the ${p.room ? `${p.room} ` : ''}TV`,
    items: p.sources.slice(0, 24).map((s) => ({ id: `${p.id}|source|${s}`, title: s, subtitle: null, art: { src: null, hue: null }, kind: 'app', contentId: null, contentType: null, on: [p.id] }))
  };
}

// ---------------------------------------------------------------------------------------------
// Recently played (kept on this device)
// ---------------------------------------------------------------------------------------------

export interface RecentEntry {
  contentId: string;
  contentType: string;
  title: string;
  subtitle: string | null;
  /** The artwork as HA gave it (a path or URL). */
  picture: string | null;
  /** The integration it played through: it can start it again on that integration's players. */
  platform: string;
  at: number;
}

export const RECENT_MAX = 12;

/** Adds what a player plays now to the front of the list (once per content), if HA can start it again. */
export function noteRecent(list: RecentEntry[], e: { attributes: Record<string, unknown>; state: string }, platform: string, at: number): RecentEntry[] {
  const a = e.attributes;
  if (e.state !== 'playing') return list;
  const id = typeof a.media_content_id === 'string' ? a.media_content_id : null;
  const title = typeof a.media_title === 'string' ? a.media_title : null;
  if (!id || !title) return list;
  // A playlist or album it came from is a better thing to start again than the one track.
  const type = typeof a.media_content_type === 'string' ? a.media_content_type : 'music';
  if (list[0]?.contentId === id) return list;
  const entry: RecentEntry = {
    contentId: id,
    contentType: type,
    title: typeof a.media_album_name === 'string' && a.media_album_name && type === 'album' ? a.media_album_name : title,
    subtitle: typeof a.media_artist === 'string' ? a.media_artist : null,
    picture: typeof a.entity_picture === 'string' ? a.entity_picture : null,
    platform,
    at
  };
  return [entry, ...list.filter((x) => x.contentId !== id)].slice(0, RECENT_MAX);
}

/** The recent shelf: what can play again, on the players of the integration it played through. */
export function recentShelf(list: RecentEntry[], players: Player[], art: Art): Shelf | null {
  const items: LibraryItem[] = [];
  for (const r of list) {
    const on = players.filter((p) => p.platform === r.platform && p.state !== 'unavailable').map((p) => p.id);
    if (!on.length) continue;
    items.push({ id: `recent|${r.contentId}`, title: r.title, subtitle: r.subtitle, art: art(r.picture), kind: 'music', contentId: r.contentId, contentType: r.contentType, on });
  }
  return items.length ? { id: 'recent', kind: 'recent', title: 'Recently played', items } : null;
}
