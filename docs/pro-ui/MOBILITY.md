# HAD Pro Mobility

**Next direction (2026-11-27):** the owner wants the page in the Room page's layout and tiles; designed element by element in the Vehicle Tiles Studio, see [VEHICLE_TILES.md](VEHICLE_TILES.md).

## 0. Restart (2026-11-26)

The owner restarted Mobility the same way as Security and Energy: whole-page directions first,
then section by section, in `/?studio=mobility` (sample vehicles only, never HA). The production
page (`src/pro/pages/ProMobility.tsx`, the Garage below) is untouched until a direction is approved.
Sections 1–4 below describe the earlier Garage work.

**Frame (owner, 2026-11-26).**
- Lead: **Ready to go?** Charge and range, plugged in or charging, locked, warm: can I leave now,
  and how far can I get.
- Scope: charging and range, controls, location and trips, condition, and whatever else the
  owner's integrations offer: FordPass (marq24/ha-fordpass) for the car, Cowboy (elsbrock/cowboy-ha)
  for the bike.
- Future proof: the owner changes car next year (Mercedes, BMW, Volvo…). So the page reads one
  brand-neutral model and each integration gets an adapter; nothing on the page knows a make.
- Several vehicles: rethink in the studio (the Garage entry rules below are open again).
- Dislikes: too sparse, inconsistent with Security and Energy, generic, layout. Likes the classic
  Mobility design and layout, which can be reworked.

**Model.** `src/pro/lib/mobilityHome.ts`: `Vehicle` (kind, powertrain, level, range, charging,
climate, security, place, motion, trips, condition, the actions its integration offers) and
`readiness(v, now)`, the page's one answer ("Ready to go", "Charging, ready by 07:10", "Unlocked",
"4 things to check", "Reported stolen") with the checks behind it, worst first. A part a vehicle
lacks is null and its section is left out. Tested in `tests/mobilityHome.test.ts`.

**What the integrations offer** (read 2026-11-26):
- FordPass: charge, range, plug, charging state and power, target charge (select, 50–100%),
  start / pause charging, lock, remote start with climate temperature and extras (windscreen, rear
  window, steering wheel, seats), odometer, speed, gear, ignition, tyre pressures, 12 V battery,
  oil, doors, windows, alarm, warnings / messages, last trip energy, last charging session, deep
  sleep, software updates, location, Remote Sync / Local Sync. Ford's backend is reverse-engineered;
  entities vary by car (EV Explorer / Capri lack 12 V, seats and target charge).
- Cowboy: battery and its health, range, mileage, time ridden, CO₂ saved, last ride mode, last
  trip (title, distance, duration, CO₂, calories), distance today, stolen, crashed, battery
  inserted, location (with address), firmware update, auto-lock (a reading, not a lock). No
  actions: no lock or ring.

**Studio.** `src/pro/pages/mobility/studio/`: `studioMobility.ts` (sample states: Charging
overnight, Ready warming up, Driving, Needs a look, Two cars + bike, where the second car is another
make with fewer parts), `designs/parts.tsx` (shared blocks), `MobilityStudio.tsx`. The controls
change the sample so they can be tried.

**Round 1: page direction (decided 2026-11-26: B · Ready check, with A’s vehicle pills).**

| | Direction | Idea |
|---|---|---|
| A | Cockpit | Classic's layout reworked: vehicles as pills; on desktop three columns (the vehicle with its picture, answer, checks, controls and key numbers; Charging and Climate; Where, Trips and Condition). |
| B | Ready check | The Security / Energy family: a row of vehicle cards, then one hero lit by the answer (charge ring, answer, checks, controls), then the sections in a bento. |
| C | Garage bays | Fleet first: one line for the whole garage, every vehicle as a bay with its charge and answer, then the chosen one's checks, controls and sections in tabs. |

Owner pick: **B · Ready check**, but with Cockpit's (A) selector: vehicles as pills (icon, name, a
dot in its answer's tone; the chosen one filled in the accent) instead of B's row of cards. Fixed
with it: the Mobility page now sets HeroUI's soft accent (`--accent-soft*` in `pro.css`) in
emerald, as Energy and Security do, so secondary buttons are no longer HeroUI's default blue.

**Round 2: the hero (decided 2026-11-26: 2 · Picture, made compact).** Inside B, with the pills; `designs/heroConcepts.tsx`, B takes it as
`Hero`. The studio's Show switch draws it in the B page or alone (one per vehicle).

| | Hero | Idea |
|---|---|---|
| 1 | Ring | Round 1's: charge ring (range inside, charge limit as a tick), the answer and checks beside it, the controls in a row under. |
| 2 | Picture | The vehicle first, as in classic: its picture large (the owner's, else a silhouette), the answer and a charge bar with range and limit; checks and controls under. |
| 3 | Status keys | The answer, then one key each for Charge, Plug, Doors and Climate showing its state and doing its job when tapped; other issues as pills; Flash and Refresh small in the corner. |

Owner pick: **2 · Picture**, more compact. Now: the name, the answer (a dot in its tone, 28 px,
22 on phones) and where it is, with the picture beside them (92 px, 64 on phones); one charge line
(level, range, a slim bar with the limit tick, the limit); the checks and the controls share the
last row on desktop and stack on phones. It is B's default hero.

**Round 3: Charging and Climate (decided 2026-11-26: 1 · Tidy cards).** Under the Picture hero; `designs/chargeClimateConcepts.tsx`,
B takes them through `cards` (`charging` / `climate`, or `combined` in place of both). The hero
already shows the charge, so these cards are about doing. New control: the set temperature
(FordPass's RC climate temperature select), `{ type: 'temp' }`.

| | Cards | Idea |
|---|---|---|
| 1 | Tidy cards | Charging: one sentence, the limit on a slider snapping to the car's targets, Start/Pause. Climate: inside / outside, − set temperature +, extras as icon toggles, Warm up. |
| 2 | Dials | Charging: a half dial of the charge with the limit dot, kW and ready-by inside, 80 / 90 / 100 chips. Climate: a thermostat half dial with − and + either side, extras and Warm up under. |
| 3 | Before you leave | One wide card: a line saying how the car will be when you go, charge (limit slider) beside cabin (stepper, extras), both buttons in one row. |

Owner pick: **1 · Tidy cards**; B's default Charging and Climate.

**Round 4: Where and Trips (decided 2026-11-26: 2 · The day on the map).** Under the Picture hero and Tidy cards;
`designs/whereTripsConcepts.tsx`, B takes them through `places` (`where` / `trips`, or `combined`,
full width, in place of both). Today's drives come from the speed history
(`drivesFromSpeeds` in `mobilityHome.ts`: runs above walking pace, distance ≈ average speed × time,
shown as "about").

| | Where + Trips | Idea |
|---|---|---|
| 1 | Tidy cards | Where: map, zone and address, last seen (no speed chart). Trips: last trip or ride in big numbers with when it ended, then drives today, today's distance, odometer. |
| 2 | The day on the map | One full-width card: map beside where it is, today as a 24-hour bar with each drive and a now tick, the drives listed, the last trip under a hairline. |
| 3 | Journey log | Where as a round map thumbnail with zone, address, last seen. Trips as a timeline of today's drives and the last trip, newest first, totals at the foot. |

Owner pick: **2 · The day on the map**; B's default Where and Trips (full width under Charging, Climate and Condition on desktop).

**Round 5: Condition and the bike's Battery (decided 2026-11-27: 2 · Top view).** Under everything chosen so far;
`designs/conditionConcepts.tsx`, B takes them through `health` (`condition` / `battery`, and
`merge` to fold the bike's Battery into Condition). `healthItems(v)` lists what the vehicle reports
(the make's warnings, tyres, 12 V battery, traction battery health, oil, software or firmware;
with `battery`, the bike's battery in or out and its ride mode), worst first. On desktop the bike's
Battery and Condition share a row (6 + 6); merged, the bike's card is full width.

| | Condition + Battery | Idea |
|---|---|---|
| 1 | Tidy cards | Condition: warnings on tinted rows, tyres in a 2 × 2 laid out like the car, the other readings in two columns. Battery: in or out with the mode, health as a bar, time ridden and CO₂ saved. |
| 2 | Top view | Condition: the car from above, a pressure by each wheel, the low one amber; the other readings as soft pills. Battery: the pack filled to its health, lost capacity hatched, dashed when out; CO₂ and time ridden as tiles. |
| 3 | Health check | One checklist, problems first (tick, amber alert, blue note); for the bike it replaces the Battery card; odometer, or CO₂ and time ridden, at the foot; two columns when wide. |

Owner pick: **2 · Top view**, with the battery pack for the car too. Then (same day) the car's
drive battery (the traction battery, not the 12 V one) moved to the **Charging** card, on top: a pack
filled to the charge, the capacity lost with age hatched past the health line, and the energy,
health and temperature under it. It animates (`BatteryPack` / `batteryFlow` in `parts.tsx`, keyframes
`pro-battery-flow` in `pro.css`, off under reduced motion): stripes flow in and the terminal lights
while charging; they flow out, slower, while driving or conditioning the cabin, and the line names
why. The bike's Battery card draws the same pack. Condition keeps the top view and the pills (the
car's battery health is no longer repeated there). The model gained `condition.batteryKwh` and
`condition.batteryTemp`; battery health for cars only when the integration reports it (FordPass:
to be confirmed in the adapter step, the sample assumes it). B's default Condition and Battery.

**Live adapters (built 2026-11-27).** `src/pro/lib/mobility/`: `kit.ts` (context, helpers, the
recipe for a new make), `adapters/fordpass.ts`, `adapters/cowboy.ts`, `adapters/generic.ts`,
`adapters/index.ts` (`buildMobilityHome`, `mobilityCalls`). Each adapter takes the HA devices of its
registry `platform` and finds entities by `translation_key` (else the `unique_id` suffix), so renamed
entities and a second vehicle of the same make work. Each vehicle comes with its own `calls(action)`,
which turns the page's actions into service calls. `MobilityAction` now lives in `mobilityHome.ts`.
`src/pro/hooks/useMobilityHome.ts` reads the store, fetches 24 h of speed per car (quarter-hour
peaks, for the day's drives) and exposes `{ home, act, loading, offline }`. The owner's pictures
still come from classic Mobility's settings.

- FordPass (keys read from its source): charge, range (`elveh`, or `fuelrange` for ICE), plug and
  charging state, power, target charge (select options), start / pause (`evstart` / `evpause`, else
  the `elvehcharge` switch), remote start (`ignition` switch), set temperature (`rcctemperature`
  number or select), windscreen / rear / wheel switches and front seat selects, door lock, alarm,
  open doors / bonnet / boot / windows from `doorstatus` / `windowposition` attributes, speed, gear,
  ignition, tyres (`tirepressure` attributes; low = 80% of the placard, else 2.2 bar / 32 psi),
  12 V volts, oil, messages as a warning, deep sleep, tracker, last trip (`lastenergyconsumed`),
  capacity (`maximumBatteryCapacity`) and battery temperature, and software updates: the stage
  from `firmwareupgstatus` (`rawState`: retrieval → downloading, queued → queued, deploying →
  installing, failure → failed), the next install window (`otaschedule`), what blocks it
  (`otareadiness`: low 12 V battery, too little time), the last install and its version
  (`lastfirmwareupdate`) and automatic updates (`autosoftwareupdates`); cabin temperature (`cabintemperature`). Not offered: battery health,
  distance today, an address. Never named by its VIN (the device name is "VIN: …").
- Cowboy: charge, range, health, mileage, distance today, time ridden, CO₂ (g → kg), ride mode,
  last trip, stolen, crashed, battery inserted, firmware (update entity), tracker with address. No
  actions.
- Generic fallback: any other device with a battery-class level and a range in km / mi (so phones
  are skipped); odometer, lock, tracker, plug / charging when present; lock and unlock only.

**Software updates (2026-11-27, owner).** `condition.software` is now a stage (`idle`, `available`,
`downloading`, `queued`, `installing`, `failed`) with the installed and offered versions, the last
install, the next window, what blocks it and automatic updates; `softwareLine` in `mobilityHome.ts`
words it for the Condition pill and the hero's checks (installing and failed are warnings: the car
cannot be driven while installing; a blocked update says why). The studio's "Charging overnight" car
is downloading one and "Needs a look" has one waiting on its low 12 V battery.

The studio's Vehicles switch has **Your vehicles (live, read only)**: your own vehicles through the
adapters in the chosen design; its controls send nothing. Not yet checked against the owner's real
FordPass and Cowboy entities (the preview runs in demo mode); Ford's state strings (charging, plug,
alarm, deep sleep) are matched loosely and may need tuning then. Tests: `tests/mobilityAdapters.test.ts`.

**Built: the live page (2026-11-27).** `ProMobility.tsx` now renders the picks on live data:
`pages/mobility/home/` holds the page (`MobilityPage.tsx`, round 1's B with every round's pick as
its default) and the chosen parts (`parts`, `heroConcepts`, `chargeClimateConcepts`,
`whereTripsConcepts`, `conditionConcepts`); the studio's `designs/` files re-export them. The sample
vehicles moved to `lib/mobility/sampleVehicles.ts` and the sample controls to `applySampleAction` in
`mobilityHome.ts`: in demo mode (no vehicles in the demo registry) the page shows the samples and
its controls change them. The header sentence (`vehiclesSentence` in `pageSentences.ts`) now reads the
same adapters, one clause per vehicle, so it always agrees with the page.

Edge states (`pages/mobility/MobilityStates.tsx`, the Security / Energy family; previewed in the
studio's **Page state** switch):
- Loading: skeletons in the page's shapes (pills, hero, cards, the day on the map) until HA's
  registry is in.
- No vehicles: what the page reads (FordPass, Cowboy, any integration with a battery level and a
  range) and a link to add an integration in Home Assistant.
- HA unreachable: one alert with Retry ("Showing what your vehicles last reported, at …; the
  controls are paused"), the last known page dimmed and inert under it.

Vehicle states, said in the hero by `freshness` (a tinted note under the answer; studio state
**Asleep, not reporting**):
- Asleep (FordPass deep sleep): "Asleep to save its 12 V battery. These numbers are from 3 h ago."
- Not heard from in 6 h (and not driving): "Last heard from 7 h ago."
- Integration down (every entity unavailable): the vehicle stays (`offline`, from
  `offlineVehicle` in `kit.ts`), the answer is "Not reporting", the note says since when and to check
  it in Home Assistant, and the page shows only its hero.

The old Garage page (`Garage.tsx`, `GarageDoor.tsx`, `garageFleet.ts`, `vehicle.ts`, `garage.css`,
`garageDoor.css`) was removed on 2026-11-27, unused once the live page replaced it.

**Round 6: colour and life (decided 2026-11-27: 1 · Ambient colour, without the wave).** The owner asked for the room pages' colour and
graphics. `Life` in `home/parts.tsx` (`plain` | `ambient` | `motion` | `scene`, a context the page
provides; `MobilityPage` takes `life`, `plain` until picked). Each card passes a `Mood` (hue, level
0–1, moving graphics) to `Block`; hues are the room tiles' (`HUE` in `ambientKit.tsx`): charge in the
power green, the cabin heat or cool, the road cool blue, condition teal or amber. Graphics: the room
tiles' `Wave` and corner glow; streams (`.pro-mob-flow`, like the fan tile's airflow) for charge in /
out and air; the road (`.pro-mob-road`); a pulsing ring on Condition's icon; twinkling stars
(`.pro-mob-twinkle`); the scene's cable (`.pro-mob-cable`). All still under reduced motion.

The controls take the colour too (owner, 2026-11-27: "not just the tile background, but the UI
elements and buttons themselves"), in all three levels. A lit card gets `pro-mob-hued` and `--hue`
(pro.css), which re-points HeroUI's `--accent` / `--default` tokens, so its controls turn its hue
without new components: primary buttons glow in a gradient like the room tiles' `OrbButton`, others
are glass tinted in the hue with the icon in it; the charge limit slider's fill glows, its thumb
ringed in the hue; climate extras that are on glow; the battery pack fills in the power green. In the
hero each control has its own hue (`hued(life, hue)`): Lock and Flash amber, Climate warm or cool,
Charge green, Refresh blue; the charge bar glows green; the vehicle pills take their readiness tone.

**Picked (2026-11-27):** 1 · Ambient colour, but without the curved wave backgrounds: cards keep the
corner glow, the tinted icon orb and the hued controls; `Block` no longer draws `Wave`. `MobilityPage`
defaults to `life = 'ambient'`, so the live page has it. The hero keeps only the controls no card
has: Lock / Unlock, Flash and Refresh. Charge / Pause is left to the Charging card and Climate to the
Climate card (`ActionDock`'s `skip`; a vehicle without that card still gets the control in the hero).

| | Life | Idea |
|---|---|---|
| 1 | Ambient colour | Every card in its hue: glow, a wave rising with its level, the icon in a tinted orb; the vehicle picture glowing in the answer's colour. Nothing moves. |
| 2 | Ambient + motion | 1, plus what is happening moves: charge streaming in (out while driving or conditioning), air drifting across Climate, the road passing under Where and today, Condition's icon pulsing when something needs a look, stars in the hero while asleep (the hero's motion kept to its right side). |
| 3 | Scene | 2, plus the hero opens with a little scene: the sky for the hour (night with stars, dawn, day, dusk), the car or bike drawn on the ground, the charger and its cable with the charge flowing, the road moving while driving, "z z" asleep, a warm or cool glow while conditioning. |

**FordPass remote start (fixed 2026-11-27, seen on the owner's car).** FordPass's `switch.*_ignition`
is its remote start (on while Ford's countdown runs, with an expiry check); `remotestartstatus` says
exactly "Active" or "Inactive". The adapter used to test for "active", so "Inactive" read as on
("On · 0 min left"). Now: the switch decides (the status, matched exactly, only without it), and the
countdown sensor (Ford's raw timer, no expiry check) only counts while running. `Climate.remoteStart`
makes the control say what it does: "Remote start" with "Starts the car and warms the cabin to 21°",
"Stop remote start" while running, the aside "Running · 8 min left", the check "Remote start on".

**Vehicle pictures (2026-11-27).** The picture in the hero is, in order: the owner's choice, saved
per HA device in `preferences.proCarPictures` (the Room page's car tile reads the same); classic
Mobility's vehicle image; the picture the integration gives it in Home Assistant (the first
`entity_picture` among the device's entities, an `image.*` entity first, then its tracker;
`devicePicture` in `lib/mobility/kit.ts`); else the silhouette. Pictures load through
`useHaPicture`, with the HA session for protected paths and `/api/assets` uploads resolved, so
they are no longer handed raw to `<img>` (that's why they didn't appear). On the live page, tap the
picture (pencil badge) for the Room page's `CarPictureControl`: "From the car", "Upload your own…"
(PNG, JPEG or WebP up to 5 MB, admin only, via `/api/assets`) or "None"; a note says when the
integration gives no picture. Not editable in the studio or demo.

FordPass's picture (seen 2026-11-27): its tracker's entity_picture copies its `image.*` vehicle
image entity's, a signed `/api/image_proxy/…?token=…` link. Fetching it with the session fails when
HA doesn't allow the dashboard's origin, so signed image/camera proxy links go straight to `<img>`
(as HA's frontend and the Room page do; `isSignedHaPicture`). A picture that fails to load gives way
to the next (owner's, then the integration's), then the silhouette. FordPass now looks up its
`image.fordpass_<vin>_vehicleimage` entity explicitly (`fordPicture`): by key on the device, else by
entity id with the device's VIN (or the only one), since that entity is not always tied to the device. Cards in a row are the same
height (the grid stretches its rows; owner, 2026-11-27).

**Cockpit refinement (2026-11-27, owner picked "Two-column cockpit").** An aesthetic and UX pass after
looking at the Tesla (new tablet two-column layout), BMW, Volvo and Mercedes apps and Dribbble EV
concepts. They all make the vehicle the hero and range the headline number, with round quick
actions under the car. Same content. `HeroStage` (`heroConcepts.tsx`) is now the page's hero:
the name and answer, the vehicle on a lit floor (the owner's picture, else a drawn side view,
`VehicleSilhouette` in `parts.tsx`), range large with the charge and limit beside it and a glowing
bar, the checks, then Lock / Flash / Refresh as round buttons (`ActionDock round`).
- Desktop (≥ 1000 px): the hero is a sticky left column (340 px, 380 px from 1240), below the slim
  header. The cards sit in two columns beside it. Where and today spans both, and an odd card out
  (Condition for the Ford) spans both too, with the top view beside the readings (`@[560px]`).
- Tablet: the hero is a row, readout left and the stage with its round actions right. Cards in two columns.
- Phone: everything stacks, car centred, range under it, round actions at the foot of the hero.

**Refined, not cartoonish (2026-11-27, owner: "very cartoonish compared to Tesla and Volvo").** The
page now defaults to `life = 'plain'` (round 6's ambient colour is still in the studio): neutral
surfaces, with colour kept for status (the answer's dot, warnings) and the emerald accent. Also:
- The hero is a neutral panel (`Panel`), with no tinted gradient. Its floor is a soft contact shadow and a
  hairline horizon. The checks are a quiet list (`StatusList`) with a small icon, coloured only when
  something needs a look. The charge bar is 6 px with a hairline limit tick.
- Without a picture, the vehicle is a fine technical line drawing (`VehicleSilhouette`), as in
  the makers' configurators, not a filled cartoon.
- The drive battery (`BatteryPack`) is a slim segmented bar under a large thin number, with the capacity
  lost to age faintly hatched at the end. A soft sheen sweeps it while charging (in) or in use (out, slower),
  replacing the stripes and the terminal nub (`pro-battery-sheen`, off under reduced motion).
- Remote start is back in the hero (owner, 2026-11-27), as well as on Climate; plain climate
  on / off is still left to the card. The round actions sit in a grid that never wraps.
- Phones get a compact hero: the vehicle (52 px high) beside the answer, the range at 36 px, the
  checks inline and smaller round buttons. The desktop column keeps the stage layout.
- The Mobility page sets HeroUI's `--accent-hover` in emerald, so hovered primary buttons are no
  longer its default blue.

**Left:** check the adapters on the owner's real FordPass and Cowboy entities (Ford's
state strings may need tuning).


## 1. Garage entry

Approved by the owner on 2026-11-24. Count distinct vehicles within each category.

| Cars | Bikes | Entry |
|---|---|---|
| 1 | 0 | Car Garage |
| 0 | 1 | Bike Garage |
| 1 | 1 | Separate Car and Bike tabs |
| 2 or more | Any | Bays first |
| Any | 2 or more | Bays first |

Group bays by Cars and Bikes. Use a single column on phones and a grid within each group on wider screens. Each bay shows the vehicle name, picture or silhouette, available range and state. Selecting a bay opens the vehicle Garage with a way back to all bays.

## 2. Vehicle Garage

Car sections cover vehicle identity and range, charge and cabin controls, location and speed history, and vehicle condition. Bike sections cover identity and range, battery and ride activity, location, and bike condition.

## 3. Data and studio

Classic Mobility derives one car and one bike through `useMobilityData`. A multiple-vehicle implementation needs vehicle-scoped readings and service targets. Keep the classic UI intact.

Dev route `/?studio=mobility`. Owner approved emerald (hue 155) for both vehicle types. The first studio review compares A · Garage floor, B · Range dial and C · Departure board on the same simulated vehicles. Zero-vehicle presentation and production component choices remain open.

The owner requested A + B. In D, the vehicle sits in A’s marked bay beside B’s charge ring with remaining range in the centre. Name, state and location sit below. The owner approved D for production. The individual Garage sections await review.

## 4. Car header studio

The owner requested A · Parking pass, B · Dashboard dial and C · Garage door side by side. Compare the same charging, parked, driving and unavailable car readings. Owner chose C · Garage door for production.
