# HAD Pro Media

## 0. Restart (2026-11-27)

The owner restarted Media like Security, Energy and Mobility: a studio (`/?studio=media`), whole-page
directions first, then section by section. Frame (owner, 2026-11-27): look at it like Spotify or
Apple Music. Today the home plays through Apple TV and HomePods; Music Assistant, the Spotify
integration, Sonos / AirPlay speakers and other TVs must fit too. Scope: player and library (start
music from playlists, favourites and recently played through HA's media browser), not player only.
Wanted from those apps, all four: big artwork with the page tinted by its colours (Apple Music's Now
Playing), a mini player bar with the device picker (Spotify), shelves and tiles to start something
(Spotify Home), and a speaker picker to choose and group rooms, a volume each (AirPlay / Spotify
Connect).

Model: one brand-neutral `MediaHome` (`src/pro/lib/mediaHome.ts`): players (speaker, TV, group),
what each plays (music, TV, film, radio, podcast, an app), queue, grouping, and library shelves; what
a player or integration lacks stays out. Samples use made-up titles and generated artwork, never
real covers. Elements (library first): HeroUI Slider (scrubber, volumes), Modal (speaker picker),
Checkbox (grouping), ScrollShadow (shelves), Button; Hugeicons.

**Round 1: page direction (decided 2026-11-27: B · Home; A · Now Playing first, changed the same day).** Three whole pages on the same sample homes
(`sampleMediaHome`: music in the living room, three rooms grouped, TV on with music paused, nothing
playing, every integration):

| | Design | Idea |
|---|---|---|
| A | Now Playing | Apple Music's Now Playing as the page: big artwork on a backdrop blurred from it, scrubber, transport, volume, "Playing on …" (speaker picker); Up next beside it (desktop) or under it; other playing rooms as tinted cards; library shelves last. |
| B | Home | Spotify Home: greeting, quick picks, "Playing in your home" cards, shelves; the mini player bar pinned to the bottom opens Now Playing as a sheet; on desktop the Now Playing view stays on the right. |
| C | Rooms | Room first (Spotify Connect / AirPlay): every room a card tinted by what it plays, groups as one card; the picked room is where the library plays; the mini bar follows it. |

The owner first picked A and refined it in rounds 2–5, then moved the page to B · Home and kept
those sections. `DesignB` now composes them: greeting, "Start something" (round 4's quick picks),
"Playing in your home" (round 3's List, every playing room), the other shelves; the mini bar opens
round 2's Immersive player as a sheet, and on desktop (1100 px and up) the Immersive player stays
on the right (380 px). "Playing on …" opens round 5's AirPlay sheet. Dialogs follow dark mode
through `MediaDarkContext` (they render in a portal, outside the page's `dark` class). Rounds 2–5
still preview inside A.

Files: `src/pro/lib/mediaHome.ts` (model, `applySampleAction`), `src/pro/lib/media/sampleMedia.ts`
(samples, generated `coverArt`), `src/pro/pages/media/home/parts.tsx` (Cover, BlurredArt, Scrubber,
Transport, Volume, DeviceButton + SpeakerPicker, ShelfRow, QuickGrid, UpNext, MiniBar, RoomCard,
NowPlayingPanel / Sheet), `src/pro/pages/media/studio/` (studio, designs A–C), `tests/mediaHome.test.ts`.
**Round 2: the Now Playing panel (decided 2026-11-27: 2 · Immersive, with Up next in the player as in Card).** Inside A (`designs/heroConcepts.tsx`;
`DesignA` takes `Hero`): 1 · Card (round 1's: artwork left on a blurred backdrop, Up next beside it
on desktop), 2 · Immersive (Apple Music's full player: the artwork's colour floods the panel in light
and dark, white type, the artwork shrinks when paused, Up next swaps in for the artwork), 3 · Band
(compact strip, Up next as a row of tiles). All three show TV with wide artwork and the room ("On the
Living room TV"; no speaker picker for a player that can't be grouped), radio as Live without a
scrubber. The pick: Immersive, Up next part of the player (a column on its right from 1024 px, under the controls below that; the swap button is gone); `DesignA` defaults to it. Sections after it, one round each: Up next, the "Also playing" room cards, the library
shelves, the speaker picker, "Nothing playing".

**Round 3: "Also playing" (decided 2026-11-27: 2 · List).** The other rooms that play, under the Immersive
player (`designs/elsewhereConcepts.tsx`; `DesignA` takes `Elsewhere`): 1 · Cards (round 1's tinted
room cards with their own controls), 2 · List (one quiet list like Apple Music's AirPlay list:
artwork, title, room and state, progress line, play/pause), 3 · Tiles (Spotify's "Jump back in": big
artwork with the room on it and a play button, a sideways shelf). In all three a tap brings that room
into the player above (and the room that was there moves down).

**Round 4: the library (decided 2026-11-27: 2 · Quick picks + shelves).** Where you start something, under the player and "Also
playing" (`designs/libraryConcepts.tsx`; `DesignA` takes `Library`): 1 · Shelves (round 1's rows of
tiles), 2 · Quick picks + shelves (Spotify Home: a grid of what you played lately, then rows),
3 · Tabs (Apple Music's Library: one shelf at a time as a grid, HeroUI Tabs). Each says where a tap
plays ("Plays in the Living room"); TV apps only show when the player is a TV.

**Round 5: the speaker picker (decided 2026-11-27: 2 · AirPlay sheet).** What "Playing on …" opens (`designs/pickerConcepts.tsx`; the
page reads it from `PickerContext` in `home/parts.tsx`): 1 · List with ticks (round 1's: a checkbox
per room, a volume under each one in the group), 2 · AirPlay sheet (what plays and one group volume
on top, rooms with a tick circle on the right, a volume under each one in the group), 3 · Room grid
(Sonos: rooms as tiles you tap on or off, the group volume, a slider per room). The group volume
moves every room by the same step. Only rooms that can join are offered; TVs have no picker. `DesignA` takes `Picker` (default `PickerAirPlay`).

**Round 6: nothing playing (decided 2026-11-27: 3 · Room bar).** B · Home when nothing plays (`designs/idleConcepts.tsx`;
`DesignB` takes `Idle`, a `{ Top, Bar? }` concept): 1 · Rooms first (the rooms as pills under the
greeting), 2 · Pick up where you left off (what you played last as a big art-tinted card, one
"Play in the Living room" button, the pills under it), 3 · Room bar (Spotify's "Playing on" bar where
the mini player goes: "Nothing playing · A tap plays in the Living room", Change opens a room list;
it becomes the mini player once something plays). `DesignB` defaults to `IdleBar`. All rounds are
decided; next is the live build.

**Live build (2026-11-27).** `ProMedia.tsx` renders `pages/media/home/MediaPage.tsx` (B · Home with
every pick) on live HA data from `hooks/useMediaHome.ts`; the old RoomList/Monitor page is gone.
- Players: `lib/media/live.ts` reads every `media_player` (hidden and disabled left out) the same
  way for every integration. What a player can do comes from `supported_features`; TV or speaker
  from the device model and platform; the room from its area. Grouping is offered only between
  players of one integration that announce GROUPING (Sonos, Music Assistant, Cast…): HomePods
  through the Apple TV integration can't group in HA, so they show where they play. Actions map
  to `media_player` services with the expected state shown at once (`join`/`unjoin` for groups,
  `play_media` for library items, `select_source` for a TV's apps).
- Library: `lib/media/library.ts`. Recently played is what this device saw playing that HA can
  start again (it has a `media_content_id`), kept in localStorage (`had.pro.media.recent`) and
  offered on players of the same integration. The target player's media browser
  (`media_player/browse_media`) gives the other shelves: its playable root items, then up to six
  folders (recent, favourites, playlists, radio first), one level deeper when a folder holds only
  folders; TTS, cameras and uploads skipped; kept 10 minutes. A TV adds its `source_list` as apps.
  With no recently played, Quick picks show the first shelf.
- Artwork: HA's signed `entity_picture` loads directly; its hue is measured from the cover
  (`extractPaletteFromUrl`) to tint the page.
- Not yet: Up next (HA has no queue for these integrations; Music Assistant's `get_queue` is a
  later step), and a check on the owner's own Apple TV and HomePods. Demo mode shows the sample home.

Live adapters (apple_tv, Music Assistant, Spotify, Sonos, cast) and HA's media browser for the
shelves come after the pick.

## 1. Brief

Help someone control what is playing anywhere in the home or find a specific speaker or TV while it is idle.

## 2. Page structure

The owner chose A · Now playing first on 2026-11-24. Alternatives considered were Rooms first and Selected player.

| Section | Phone (375 px) | Tablet and desktop |
|---|---|---|
| Now playing | Below the live header, show one active player with room, artwork when available, title and playback controls. Other active players appear as compact selectable rows. | Give simultaneous players equal prominence, two across on tablet and up to three on desktop. |
| Players by room | Single column grouped by floor, then room. Offer a floor filter when two or more floors have players. | Use the same grouping with players side by side where space allows. |
| Player details | Open a bottom sheet from either section. | Use a side panel on desktop. |

When nothing is playing, the directory moves up under the header. The floor filter leaves Now playing house-wide. Keep paused, idle and unavailable players findable. Show player-specific controls according to capabilities, including queue entries when available and the remote on compatible TVs.

## 3. Media Studio

**Removed 2026-11-26 (owner):** the Media Studio (`/?studio=media`) and the Widget Studio's Media entry are deleted, to be redone later. The shipped Media page (`ProMedia.tsx`, `pages/media/Monitor.tsx`, `RoomList.tsx`) and the Overview media widget (`widgets/media/`, which still uses `concepts/MediaConceptB`, `MediaConceptC` and `shared.tsx`) stay. The history below is kept for reference.

Page accent approved 2026-11-24: fuchsia (hue 330).

Studio route `/?studio=media`. Now playing is the first section for concept review. Players by room follows its approval.

The owner rejected the initial three Now playing cards as too similar. The revised studio candidates explore a turntable, a broadcast monitor and a concert poster. All three remain open for review.

B is the front-runner. D combines its three requested refinements for comparison: elapsed playback with capability-aware seeking, a surface following the preview theme, and stronger artwork or station/programme identity. Owner approved D for production on 2026-11-24. Players by room is the next section for review.

Players by room: owner approved A · Room list. Each room heading precedes compact rows showing player name and state. Selecting a player opens its details.
