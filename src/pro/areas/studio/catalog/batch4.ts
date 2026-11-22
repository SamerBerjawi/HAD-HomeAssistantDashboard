/** Batch 4 · Security & sensing: the types, their states and concepts (docs/pro-ui/AREA_TILES.md). */
import { TILE_SIZES } from '../../tileTypes';
import { AmbientCamera } from '../../tiles/ambient/AmbientMedia';
import { AmbientLock, AmbientMotion, AmbientOpening, AmbientSafety } from '../../tiles/ambient/AmbientSecurity';
import { CameraPrivate, CameraTimeline, CameraWindow } from '../../tiles/security/CameraTiles';
import { LockBolt, LockHold, LockStatus } from '../../tiles/security/LockTiles';
import { OpeningBadge, OpeningDay, OpeningPlan } from '../../tiles/security/OpeningTiles';
import { MotionPulse, MotionSince, MotionTicks } from '../../tiles/security/MotionTiles';
import { SafetyAdvice, SafetyAlarm, SafetyDevice } from '../../tiles/security/SafetyTiles';
import { CAMERA_STATES, LOCK_STATES, OPENING_STATES, MOTION_STATES, SAFETY_STATES } from '../areaStates';
import { entry, type TileTypeEntry } from './catalogTypes';
import type { TileModel } from '../../tileTypes';

export const BATCH_4: TileTypeEntry<TileModel>[] = [
  entry({
    id: 'camera',
    title: 'Camera',
    batch: 4,
    domains: 'camera.*',
    job: "See the room live, know when it last saw motion.",
    sizes: TILE_SIZES,
    states: CAMERA_STATES,
    recommended: 'B',
    chosen: { concept: 'A', notes: 'Window, with Timeline (B) kept as the second style: either per camera.' },
    why: 'Timeline answers the question people open a camera for (has anything happened?) without opening recordings. Window is the most immersive; Private suits indoor cameras that guests see.',
    concepts: [
      {
        id: 'A',
        name: 'Window',
        Component: CameraWindow,
        idea: 'The view fills the tile edge to edge; a Live pill or Snapshot on it, the name and last motion on a scrim.',
        interaction: 'Tap to switch live ↔ snapshot here (on the real page: opens the full view).',
        strengths: ['The picture is everything', 'Works at every size, even X-small'],
        tradeoffs: ['Live video on many tiles is heavy (stills by default)', 'Text over the picture needs the scrim']
      },
      {
        id: 'B',
        name: 'Timeline',
        Component: CameraTimeline,
        idea: 'The view on top, the last six hours of motion as ticks underneath, with a count.',
        interaction: 'Tap the view to go live; the strip is read-only (later: tap a tick to see that clip).',
        strengths: ['How busy the room was, at a glance', 'Still shows the picture'],
        tradeoffs: ['Smaller picture than Window', 'Needs motion events from the camera or an integration']
      },
      {
        id: 'C',
        name: 'Private',
        Component: CameraPrivate,
        idea: 'Words first (“Quiet”, “Motion”), the view blurred until you press Show; it blurs again after 15 seconds.',
        interaction: 'Show / Hide; the status reads without the picture.',
        strengths: ['Respectful for indoor cameras', 'Status readable from across the room'],
        tradeoffs: ['One more tap to see the picture', 'Blur is a UI choice, not real privacy (the stream still loads)']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientCamera,
        idea: "A framed live view inside the glass card with a pulsing “Live” badge; Small is the picture with the name over it.",
        interaction: "Tap opens the full view (on the real page).",
        strengths: ['The picture is the tile', 'Live state obvious'],
        tradeoffs: ['Live video on many tiles is heavy (stills by default)']
      }
    ]
  }),
  entry({
    id: 'lock',
    title: 'Lock',
    batch: 4,
    domains: 'lock.*',
    job: 'Locked or not, at a glance; lock in one action, never unlock by accident.',
    sizes: TILE_SIZES,
    states: LOCK_STATES,
    recommended: 'A',
    chosen: { concept: 'C', notes: 'Status, but the second press is a hold: press Unlock, then hold it while it fills.' },
    why: 'Hold makes the safe action instant and the risky one deliberate, with no dialog. Bolt is the most literal; Status is the clearest from across the room.',
    concepts: [
      {
        id: 'A',
        name: 'Hold',
        Component: LockHold,
        idea: 'One round key in the state colour. Tap to lock; press and hold to unlock while a ring fills.',
        interaction: 'Tap to lock; hold 0.8 s to unlock (a short tap says “Hold to unlock”).',
        strengths: ['Unlocking can’t happen by accident', 'One control for both', 'No confirm dialog'],
        tradeoffs: ['Hold has to be discovered (the hint helps)', 'Keyboard users hold Space']
      },
      {
        id: 'B',
        name: 'Bolt',
        Component: LockBolt,
        idea: 'The deadbolt as a two-way switch, Unlocked | Locked; the bolt slides into the strike when locked.',
        interaction: 'Tap a side. Large adds Open (unlatch) when the lock supports it.',
        strengths: ['Both states always visible', 'Very literal', 'Room for Open'],
        tradeoffs: ['Unlock is one tap (deliberate, but no guard)', 'Wide control on a small tile']
      },
      {
        id: 'C',
        name: 'Status',
        Component: LockStatus,
        idea: 'The word first, green Locked or amber Unlocked, with who did it and when; one button.',
        interaction: 'Lock is one tap; Unlock is press, then hold (the button fills).',
        strengths: ['Readable from across the room', 'Who and when are on the tile', 'Jammed and low battery stand out'],
        tradeoffs: ['Two taps to unlock', 'Button text changes under the finger']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientLock,
        idea: 'Glass card; the state colour glows from a corner; a round glowing orb wearing the lock.',
        interaction: 'Tap the orb to lock; unlocking asks “Tap again”.',
        strengths: ['Matches the chosen Ambient tiles', 'Unlocked glows amber'],
        tradeoffs: ['Orb is the only target']
      }
    ]
  }),
  entry({
    id: 'opening',
    title: 'Door & window',
    batch: 4,
    domains: 'binary_sensor.* (door, window, garage_door, opening)',
    job: 'Open or closed, and for how long; a door left open must stand out.',
    sizes: TILE_SIZES,
    states: OPENING_STATES,
    recommended: 'C',
    chosen: { concept: 'B', notes: 'Day.' },
    why: 'Badge is built for rows of many doors and windows and makes a door left open impossible to miss. Plan is the most distinctive; Day shows the history.',
    concepts: [
      {
        id: 'A',
        name: 'Plan',
        Component: OpeningPlan,
        idea: 'The opening drawn as on a floor plan: a door leaf swings out on its arc, window sashes part, garage panels lift.',
        interaction: 'Read-only.',
        strengths: ['Instantly “a door”, not just a word', 'Open is felt from far away'],
        tradeoffs: ['A drawing takes room on Small', 'Same picture for every door']
      },
      {
        id: 'B',
        name: 'Day',
        Component: OpeningDay,
        idea: 'When it was open over the last 24 hours, as bars on a strip, with how many times.',
        interaction: 'Read-only.',
        strengths: ['Shows a door left open overnight', 'History without a chart'],
        tradeoffs: ['Needs history (recorder)', 'Busier than the others']
      },
      {
        id: 'C',
        name: 'Badge',
        Component: OpeningBadge,
        idea: 'A colour bar down the edge and the word, Closed or Open, with how long. Open too long: the whole tile turns red.',
        interaction: 'Read-only.',
        strengths: ['Scales to many sensors', 'Problems shout, normal is quiet'],
        tradeoffs: ['Plain', 'Thresholds (5 min door, 2 h window) are a guess']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientOpening,
        idea: 'Glass card; a status orb with the door or window; amber glow and wave while open.',
        interaction: 'Read-only.',
        strengths: ['Matches the chosen Ambient tiles'],
        tradeoffs: ['Open and closed differ mostly by colour']
      }
    ]
  }),
  entry({
    id: 'motion',
    title: 'Motion & presence',
    batch: 4,
    domains: 'binary_sensor.* (motion, occupancy, presence)',
    job: 'Is anyone there, and when was someone last there.',
    sizes: TILE_SIZES,
    states: MOTION_STATES,
    recommended: 'C',
    chosen: { concept: 'B', notes: 'Ticks.' },
    why: 'Since answers the real question (is the room empty?) with one number. Pulse is the liveliest; Ticks shows how busy the room is.',
    concepts: [
      {
        id: 'A',
        name: 'Pulse',
        Component: MotionPulse,
        idea: 'A dot sends out rings while it sees someone; still and fading the longer the room is quiet. Presence holds a steady glow.',
        interaction: 'Read-only.',
        strengths: ['Alive when it matters', 'Quiet rooms fade back'],
        tradeoffs: ['Motion on many tiles (honours reduced motion)', 'No exact time on Small']
      },
      {
        id: 'B',
        name: 'Ticks',
        Component: MotionTicks,
        idea: 'Every detection in the last six hours as a tick on a strip, with the count.',
        interaction: 'Read-only.',
        strengths: ['Busy vs. unused rooms', 'Pairs with the camera timeline'],
        tradeoffs: ['Needs history', 'Small has only a short strip']
      },
      {
        id: 'C',
        name: 'Since',
        Component: MotionSince,
        idea: 'One big number, how long since anyone moved (“14m”), or “Now”.',
        interaction: 'Read-only.',
        strengths: ['Answers “is it empty?” instantly', 'Big and calm'],
        tradeoffs: ['No history', '“Now” and minutes read differently']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientMotion,
        idea: 'Glass card; a status orb; a blue glow and wave while it sees someone.',
        interaction: 'Read-only.',
        strengths: ['Matches the chosen Ambient tiles'],
        tradeoffs: ['Clear and detected differ mostly by colour']
      }
    ]
  }),
  entry({
    id: 'safety',
    title: 'Leak & smoke',
    batch: 4,
    domains: 'binary_sensor.* (moisture, smoke, gas, carbon_monoxide)',
    job: 'All clear, or an alarm nobody can miss; and a sensor that stopped reporting.',
    sizes: TILE_SIZES,
    states: SAFETY_STATES,
    recommended: 'A',
    chosen: { concept: 'B', notes: 'Device.' },
    why: 'Alarm is unmistakable in an emergency and calm otherwise. Device puts sensor health first; Advice says what to do.',
    concepts: [
      {
        id: 'A',
        name: 'Alarm',
        Component: SafetyAlarm,
        idea: 'A calm green check while clear; on an alarm the tile floods red and pulses, the hazard in big letters.',
        interaction: 'Read-only.',
        strengths: ['Impossible to miss', 'Calm the rest of the time'],
        tradeoffs: ['Red flood on a dashboard is loud by design', 'Says what, not what to do']
      },
      {
        id: 'B',
        name: 'Device',
        Component: SafetyDevice,
        idea: 'The sensor itself: a puck with its status light (slow green blink, fast red) and battery; “last heard” first.',
        interaction: 'Read-only.',
        strengths: ['Sensor health is visible', 'A silent sensor stands out'],
        tradeoffs: ['Alarm is a red outline, quieter than A']
      },
      {
        id: 'C',
        name: 'Advice',
        Component: SafetyAdvice,
        idea: 'Quiet grey line while clear; on an alarm, what to do (“Turn off the water at the main valve”).',
        interaction: 'Read-only.',
        strengths: ['Tells people what to do', 'Takes no attention when fine'],
        tradeoffs: ['Advice text is generic per hazard', 'Clear state is very low-key']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientSafety,
        idea: 'Glass card; a soft green glow while clear, a red glow and wave on an alarm.',
        interaction: 'Read-only.',
        strengths: ['Matches the chosen Ambient tiles'],
        tradeoffs: ['Alarm is less loud than A']
      }
    ]
  })
];
