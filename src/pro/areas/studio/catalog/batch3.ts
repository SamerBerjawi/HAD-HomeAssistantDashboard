/** Batch 3 · Media & scenes: the types, their states and concepts (docs/pro-ui/AREA_TILES.md). */
import { TILE_SIZES } from '../../tileTypes';
import { AmbientMedia } from '../../tiles/ambient/AmbientMedia';
import MediaCover from '../../tiles/media/MediaCover';
import MediaRemote from '../../tiles/media/MediaRemote';
import MediaLevel from '../../tiles/media/MediaLevel';
import SceneButton from '../../tiles/scene/SceneButton';
import ScenePalette from '../../tiles/scene/ScenePalette';
import SceneSlide from '../../tiles/scene/SceneSlide';
import { AmbientScene } from '../../tiles/ambient/AmbientScene';
import { MEDIA_STATES, SCENE_STATES } from '../areaStates';
import { entry, type TileTypeEntry } from './catalogTypes';
import type { TileModel } from '../../tileTypes';

export const BATCH_3: TileTypeEntry<TileModel>[] = [
  entry({
    id: 'media',
    title: 'Speaker & TV',
    batch: 3,
    domains: 'media_player.*',
    job: "What’s playing, and play / pause / skip from the tile.",
    sizes: TILE_SIZES,
    states: MEDIA_STATES,
    recommended: 'A',
    chosen: { concept: 'D', notes: 'Ambient.' },
    why: 'Cover makes the room page feel alive and keeps play / pause one tap anywhere; it handles TVs without artwork too. Remote is best where volume matters most (a living-room speaker); Level is the calmest and the only one that switches inputs on the tile.',
    concepts: [
      {
        id: 'A',
        name: 'Cover',
        Component: MediaCover,
        idea: 'The artwork is the tile, edge to edge, with the title in white over it. Tall and Large: the artwork as a square over a blurred wash of itself.',
        interaction: 'Tap the picture to play or pause; previous / next from Wide up; progress, mute and times on Large. A TV with no artwork shows its app.',
        strengths: ['What’s playing, felt at a glance', 'Whole tile is the play button', 'Looks great in a grid'],
        tradeoffs: ['Depends on good artwork', 'No volume except mute (volume in the detail view)', 'White text on art needs the scrim']
      },
      {
        id: 'B',
        name: 'Remote',
        Component: MediaRemote,
        idea: 'Controls first: a big play / pause inside a volume ring you turn like a hi-fi knob; previous and next either side. What’s playing is text.',
        interaction: 'Turn the ring for volume (one change on release), tap the middle to play / pause; skip and mute from Wide up.',
        strengths: ['Volume always on the tile, even X-small', 'Works the same for TVs and speakers', 'Very direct'],
        tradeoffs: ['No artwork', 'Ring drag needs a steady thumb on Small']
      },
      {
        id: 'C',
        name: 'Level',
        Component: MediaLevel,
        idea: 'The tile is the volume: a violet wash fills it as loud as it is; level bars dance while it plays.',
        interaction: 'Slide sideways anywhere for volume, tap to play / pause. Large adds the inputs or services as chips (HDMI, apps, Spotify, radio).',
        strengths: ['Volume is one slide, no target to hit', 'Source switching on the tile (Large)', 'Calm and typographic'],
        tradeoffs: ['No skip buttons', 'Tap vs slide has to be learnt', 'No artwork']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientMedia,
        idea: "Artwork with a violet glow, live level bars while playing, round transport buttons.",
        interaction: "Play / pause (glowing orb), next; previous and volume on Large.",
        strengths: ['Artwork makes the room feel alive', 'One-tap play / pause'],
        tradeoffs: ['Volume only on Large', 'Needs artwork to shine']
      }
    ]
  }),
  entry({
    id: 'scene',
    title: 'Scene',
    batch: 3,
    domains: 'scene.*',
    job: 'Run the scene with one action, see which one is set now and when it last ran.',
    sizes: TILE_SIZES,
    states: SCENE_STATES,
    recommended: 'A',
    chosen: { concept: 'D', notes: 'Ambient.' },
    why: 'Button is the clearest and fastest to scan in a row of scenes. Palette is the most beautiful and lets people pick by how the room will look; Slide to run suits scenes that turn a lot off (Good Night).',
    concepts: [
      {
        id: 'A',
        name: 'Button',
        Component: SceneButton,
        idea: 'The tile is one big button: the scene’s icon in its colour, the name, when it last ran. The active scene stays filled with its colour.',
        interaction: 'Press anywhere to run; a check says it’s done.',
        strengths: ['Nothing to learn', 'Active scene stands out', 'Compact rows on X-small'],
        tradeoffs: ['A stray tap runs it', 'Looks alike from scene to scene (icon and colour differ)']
      },
      {
        id: 'B',
        name: 'Palette',
        Component: ScenePalette,
        idea: 'A preview of the room the scene makes: painted with the colours its lights go to, the name on a frosted label.',
        interaction: 'Press anywhere to run; a “Now” pill while it holds.',
        strengths: ['Pick by look, not by reading', 'Beautiful on the page', 'Each scene is unmistakable'],
        tradeoffs: ['Scenes without lights have no colours (falls back to grey)', 'Busy if a room has many scenes']
      },
      {
        id: 'C',
        name: 'Slide to run',
        Component: SceneSlide,
        idea: 'A track with a knob wearing the scene’s icon; slide it all the way to run. A tap only nudges the knob.',
        interaction: 'Slide the knob along (sideways, so the page still scrolls); Enter from the keyboard.',
        strengths: ['Never runs by accident', 'Good for scenes that turn many things off', 'Satisfying'],
        tradeoffs: ['Slower than a tap', 'Overkill for gentle scenes']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientScene,
        idea: 'Glass card; the scene’s colour glows from a corner while it holds; a round glowing button wearing its icon.',
        interaction: 'Press the orb to run.',
        strengths: ['Matches the chosen Ambient switches', 'Active state glows'],
        tradeoffs: ['The orb is the only target']
      }
    ]
  })
];
