/**
 * The live Media model and actions (docs/pro-ui/MEDIA.md §0): HA's media players through
 * `lib/media/live.ts`, the library through `lib/media/library.ts` (what played lately on this device,
 * the target player's media browser, a TV's apps), artwork hues measured from the covers so the page
 * tints like Apple Music. `act` sends the page's action to HA and shows the expected state at once.
 * In demo mode it shows the studio's sample home, whose controls change the sample.
 * Page states: `loading`, `notSetUp` (no media players), `offline` (HA unreachable).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { haWebSocketService } from '@/services/haWebSocket';
import { resolveHAImageUrl } from '@/services/haImageService';
import { extractPaletteFromUrl } from '@/hooks/useAlbumArtColor';
import type { ResolvedEntity } from '@/types';
import { applySampleAction, type Artwork, type MediaAction, type MediaHome, type Shelf } from '../lib/mediaHome';
import { sampleMediaHome } from '../lib/media/sampleMedia';
import { livePlayers, mediaCalls } from '../lib/media/live';
import { appsShelf, foldersOf, noteRecent, recentShelf, shelfOf, type BrowseNode, type RecentEntry } from '../lib/media/library';
import { useServiceCall } from '../widgets/shared/useServiceCall';

const RECENT_KEY = 'had.pro.media.recent';
const BROWSE_TTL = 10 * 60_000;
const MAX_SHELVES = 8;

function readRecent(): RecentEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Hues measured from covers, shared by every page visit.
const hues = new Map<string, number | null>();
const pendingHue = new Set<string>();

// A player's library from HA's media browser, kept a few minutes.
const browsed = new Map<string, Browsed>();

const browse = (entityId: string, node?: BrowseNode) =>
  haWebSocketService.sendRequest<BrowseNode>('media_player/browse_media', { entity_id: entityId, ...(node ? { media_content_id: node.media_content_id, media_content_type: node.media_content_type } : {}) }, { timeoutMs: 15_000 });

/** Shelves from a player's media browser: its playable root items, then its likeliest folders (one level deeper when a folder holds only folders), all folders asked at once. */
async function loadLibrary(entityId: string, art: (src: string | null) => Artwork): Promise<Shelf[]> {
  const root = await browse(entityId);
  const top = shelfOf(root, entityId, art);
  const groups = await Promise.all(
    foldersOf(root).map(async (folder): Promise<Shelf[]> => {
      const node = await browse(entityId, folder).catch(() => null);
      if (!node) return [];
      const shelf = shelfOf(node, entityId, art, folder.title);
      if (shelf) return [shelf];
      const deep = await Promise.all(foldersOf(node, 2).map((sub) => browse(entityId, sub).then((d) => shelfOf(d, entityId, art, `${folder.title} · ${sub.title}`)).catch(() => null)));
      return deep.filter((x): x is Shelf => !!x);
    })
  );
  return [...(top ? [top] : []), ...groups.flat()].slice(0, MAX_SHELVES);
}

// The last library per player, kept on this device so a visit shows it at once while it refreshes.
const LIBRARY_KEY = 'had.pro.media.library';
type Browsed = { at: number; shelves: Shelf[] };
function storedLibrary(id: string): Browsed | null {
  try {
    const v = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? '{}')?.[id];
    return v && Array.isArray(v.shelves) && typeof v.at === 'number' ? v : null;
  } catch {
    return null;
  }
}
function storeLibrary(id: string, entry: Browsed) {
  try {
    const all = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? '{}');
    localStorage.setItem(LIBRARY_KEY, JSON.stringify({ ...all, [id]: entry }));
  } catch {
    /* storage blocked or full: kept for this visit */
  }
}

export function useMediaHome() {
  const { entities, registry, server, connection, loading } = useAutoLayoutStore(
    useShallow((s) => ({ entities: s.resolvedEntities, registry: s.rawEntityRegistry, server: s.serverUrl, connection: s.connectionStatus, loading: s.isLoading }))
  );
  const media = useMemo(() => Object.values(entities).filter((e): e is ResolvedEntity => e?.domain === 'media_player'), [entities]);
  const demo = haWebSocketService.isDemo();
  const offline = connection === 'disconnected';

  // Artwork hues: measured once per cover, the page re-renders when one arrives.
  const [hueTick, setHueTick] = useState(0);
  const image = useCallback((src: string | null) => (src ? resolveHAImageUrl(src, server) || null : null), [server]);
  const art = useCallback((src: string | null): Artwork => {
    const url = src ? resolveHAImageUrl(src, server) || null : null;
    return { src: url, hue: url ? hues.get(url) ?? null : null };
  }, [server]);
  const measure = useCallback((url: string | null) => {
    if (!url || hues.has(url) || pendingHue.has(url)) return;
    pendingHue.add(url);
    void extractPaletteFromUrl(url)
      .then((p) => hues.set(url, p && p.s >= 12 ? Math.round(p.h) : null))
      .catch(() => hues.set(url, null))
      .finally(() => {
        pendingHue.delete(url);
        setHueTick((t) => t + 1);
      });
  }, []);

  const players = useMemo(
    () => livePlayers({ entities: media, registry, image, hueOf: (src) => (src ? hues.get(src) ?? null : null) }),
    // `hueTick` re-reads the hues measured since.
    [media, registry, image, hueTick]
  );
  useEffect(() => {
    for (const p of players) measure(p.media?.art.src ?? null);
  }, [players, measure]);

  // Recently played, kept on this device.
  const [recent, setRecent] = useState<RecentEntry[]>(readRecent);
  const platformOf = useMemo(() => new Map(registry.map((r) => [r.entity_id, r.platform])), [registry]);
  useEffect(() => {
    if (demo) return;
    setRecent((list) => {
      let next = list;
      for (const e of media) next = noteRecent(next, e, platformOf.get(e.entity_id) ?? 'media_player', Date.now());
      if (next !== list) {
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
          /* storage blocked: kept for this visit */
        }
      }
      return next;
    });
  }, [media, platformOf, demo]);

  // The library of the player a tap plays on (the page says which).
  const [target, setTarget] = useState<string | null>(null);
  const [library, setLibrary] = useState<{ id: string; shelves: Shelf[] } | null>(null);
  const targetPlayer = players.find((p) => p.id === target) ?? null;
  const canBrowse = !!targetPlayer?.can.browse && !demo && !offline;
  useEffect(() => {
    if (!target || !canBrowse) return;
    const cached = browsed.get(target) ?? storedLibrary(target);
    if (cached) {
      browsed.set(target, cached);
      setLibrary({ id: target, shelves: cached.shelves });
      if (Date.now() - cached.at < BROWSE_TTL) return;
    }
    // Refresh behind what is shown; on failure keep it.
    let cancelled = false;
    loadLibrary(target, art)
      .then((shelves) => {
        const entry = { at: Date.now(), shelves };
        browsed.set(target, entry);
        storeLibrary(target, entry);
        if (!cancelled) setLibrary({ id: target, shelves });
      })
      .catch(() => {
        if (!cancelled && !cached) setLibrary({ id: target, shelves: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [target, canBrowse, art]);

  const shelves = useMemo(() => {
    const out: Shelf[] = [];
    const r = recentShelf(recent, players, art);
    if (r) out.push(r);
    if (library && library.id === target) out.push(...library.shelves.filter((s) => s.kind !== 'recent' || !r));
    if (targetPlayer) {
      const apps = appsShelf(targetPlayer);
      if (apps && !out.some((s) => s.kind === 'apps')) out.push(apps);
    }
    return out;
  }, [recent, players, art, library, target, targetPlayer]);

  // Cover hues for the library too.
  useEffect(() => {
    for (const s of shelves) for (const it of s.items.slice(0, 8)) measure(it.art.src);
  }, [shelves, measure]);

  const live: MediaHome = useMemo(() => ({ now: Date.now(), players, shelves }), [players, shelves]);

  // Demo mode: the studio's sample home.
  const [sample, setSample] = useState<MediaHome>(() => sampleMediaHome('evening'));

  const { call, setOptimistic } = useServiceCall();
  const latest = useRef(players);
  latest.current = players;
  const act = useCallback(
    (id: string, a: MediaAction) => {
      if (demo) {
        setSample((h) => applySampleAction(h, id, a));
        return;
      }
      for (const c of mediaCalls(latest.current, id, a)) {
        if (c.optimistic) setOptimistic(c.entityId, c.optimistic.state, c.optimistic.attributes);
        void call(c.domain, c.service, c.data, c.entityId);
      }
    },
    [call, setOptimistic, demo]
  );

  const home = demo ? sample : live;
  const none = !demo && players.length === 0;
  const waiting = none && (loading || (!offline && registry.length === 0));
  return { home, act, onTarget: setTarget, loading: waiting, notSetUp: none && !waiting && !offline, offline, demo };
}
