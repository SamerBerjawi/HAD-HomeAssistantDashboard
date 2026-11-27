# At Home Cards parity audit

Compared the released v0.2.18 bundle and the v0.2.19 candidate against current HAD production components in Chrome. The reference uses HAD's chosen entity tiles, Room tile, widget designs, and sheets with the same synthetic Home Assistant entities. The harness supplies the data and host context, so this comparison covers the renderers and ATC's card host. HAD's full dashboard shell and a live Home Assistant instance are separate verification environments.

| Cards | Compared | Candidate result |
| --- | --- | --- |
| Camera, Opening, Media Player, Vacuum, Climate, Cover, Sensor Reading, Switch, Scene, Light, Fan | 110 tile cases across five presets and two themes | Text, control labels and geometry matched |
| People, Lighting, Switches, Fans, Scenes, Areas, Openings, Thermostat, Media, Vacuums, Cameras | 88 widget cases across four presets and two themes | Measured text and controls matched for sampled entities. Cameras 1×2 has no production HAD preset |
| Weather | 32 cases across four presets, two themes, and default plus three explicit designs | Measured text and controls matched |
| Room | 10 tile cases across five presets and two themes | Portrait layout shows extra activity details in ATC |
| All visual editors | 24 editor instances | Expected preset buttons and HA form present |
| Overview and Room sheets | 13 dialogs | Accessible title and visible text matched. ATC opened each dialog and dismissed it with Escape |

The 240-case matrix found 19 differences in v0.2.18 and two text differences in the candidate, both for portrait Room. The candidate restores the compact composition at a 128 px Sections height and uses HAD's design resolver and Rooms theme. No tested control extended beyond its card bounds.

A separate 52-sample screenshot pass compared 2×1 tiles on equivalent backgrounds across both themes and all Weather designs. Mean absolute RGB difference was below 1 on a 0–255 scale for the 23 non-Room cards. Room averaged 3.47 in light and 3.77 in dark, with an intermittent positional difference in the dark sample. Those metrics describe the fixtures and dimensions tested.

## Remaining parity gaps

- Room portrait adds activity details in ATC to use the taller Sections space. Room navigation resolves to the Areas sheet in ATC. HAD opens a full room page.
- HAD's Cameras widget advertises small, wide, and large sizes. ATC also offers a tall overview preset.
- HAD has per-widget default sizes. ATC uses a common 1×1 default when no size is saved.
- Some HAD widgets apply optimistic updates before service acknowledgment. ATC's shared widget adapter currently waits for the state event. Entity tiles have a separate optimistic path.
- Live device commands, stream playback, forecast and Recorder payloads, theme-specific HA styles, editor integration, and full touch gesture coverage remain open. The synthetic comparison does not certify those paths.

ATC build, TypeScript, and 756 repository tests passed.

## v0.2.20 follow-up

- Removed the ATC portrait Room override. The 1×2 Room tile now renders the same activity layout as HAD. The 2×1 screenshot comparison yielded mean absolute RGB differences of 0.045 in light and 0.085 in dark on the same fixture.
- Room tiles and Areas room links now open the production HAD Room page inside a full-screen Lovelace dialog. Returning from a room restores the prior Areas sheet when it was open. Room preferences edited in ATC are local to the browser and HA user.
- Widget defaults follow the HAD definitions. The Cameras overview editor offers Small, Wide, and Large. A legacy tall preset falls back to Wide.
- Widget actions now immediately apply HAD's predicted state. HA state updates supersede the prediction, and failed commands roll it back.
- The final 238-case layout comparison covered all 24 cards. Text, control labels, and control bounds matched in the sampled fixtures. All 13 opening and dismissal checks passed, including the Room route. Additional checks covered opening a room from Areas and returning, Lighting feedback and rollback, the default editor selection, and the saved Cameras preset migration.
- A live Home Assistant instance is still needed to verify physical device responses, RTSP playback, actual Recorder and forecast data, dashboard themes, and editor integration.
