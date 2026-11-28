/**
 * Vacuums details (sheet kit, WIDGET_DESIGN.md §8). Hero: the one vacuum (or how many clean) in
 * its state's colour, with Start / Pause and Dock. Each vacuum is a section: status, battery,
 * room, this run's area and time, suction as a segmented choice, Start / Pause, Dock, Locate;
 * then Clean rooms and the latest map (owner review 2026-11-20).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BatteryCharging01Icon,
  BatteryFullIcon,
  BatteryLowIcon,
  Clock01Icon,
  Home01Icon,
  Location01Icon,
  PauseIcon,
  PlayIcon,
  Robot01Icon,
  RulerIcon,
  VolumeHighIcon
} from '@hugeicons/core-free-icons';
import type { ProVacuumItem, ProVacuumsModel } from '../../lib/overviewAppliances';
import { DetailSheet, HeroButton, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSection, type HeroTone } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { CleanRooms, VacuumMap } from './VacuumExtras';
import { useVacuumActions } from './useVacuumActions';

const tone = (v: ProVacuumItem | null): HeroTone => (!v ? 'slate' : v.isError ? 'danger' : v.isCleaning ? 'blue' : v.isReturning ? 'violet' : v.isPaused ? 'warning' : 'slate');
const battery = (v: ProVacuumItem) => (v.batteryCharging ? BatteryCharging01Icon : (v.batteryPct ?? 100) < 25 ? BatteryLowIcon : BatteryFullIcon);

function Vacuum({ v, a, solo }: { v: ProVacuumItem; a: ReturnType<typeof useVacuumActions>; solo: boolean }) {
  return (
    <>
      <SheetSection title={solo ? undefined : v.name} aside={solo ? undefined : v.statusLabel}>
        <SheetRow
          icon={Robot01Icon}
          tone={v.isError ? 'danger' : v.isCleaning ? 'active' : 'default'}
          title="Status"
          subtitle={v.isError ? v.badgeText : undefined}
          trailing={<span className="text-sm font-medium">{v.statusLabel}</span>}
        />
        {v.batteryPct !== null ? (
          <SheetRow
            icon={battery(v)}
            tone={v.batteryPct < 20 && !v.batteryCharging ? 'warning' : 'default'}
            title="Battery"
            trailing={
              <span className="text-sm font-medium tabular-nums">
                {v.batteryPct}%{v.batteryCharging ? ' · charging' : ''}
              </span>
            }
          />
        ) : null}
        {v.currentRoom ? <SheetRow icon={Location01Icon} title={v.isCleaning ? 'Cleaning' : 'Room'} trailing={<span className="text-sm font-medium">{v.currentRoom}</span>} /> : null}
        {v.cleanedAreaM2 !== undefined ? <SheetRow icon={RulerIcon} title="Cleaned this run" trailing={<span className="text-sm font-medium tabular-nums">{v.cleanedAreaM2} m²</span>} /> : null}
        {v.cleaningTimeMinutes !== undefined ? (
          <SheetRow icon={Clock01Icon} title="Time this run" trailing={<span className="text-sm font-medium tabular-nums">{v.cleaningTimeMinutes} min</span>} />
        ) : null}
        {v.fanSpeedList.length > 1 ? (
          <SheetRow icon={VolumeHighIcon} title="Suction">
            <SheetFilter label={`${v.name} suction`} value={v.fanSpeed ?? v.fanSpeedList[0]} options={v.fanSpeedList.map((s) => ({ id: s, label: s }))} onChange={(s) => a.setSuction(v.entityId, s)} />
          </SheetRow>
        ) : null}
        <li className="flex flex-wrap gap-2 px-3 py-2.5">
          <Button size="sm" variant={v.isCleaning ? 'tertiary' : 'primary'} onPress={() => a.run(v.entityId, v.isCleaning ? 'pause' : 'start')} className="gap-1.5">
            <HugeiconsIcon icon={v.isCleaning ? PauseIcon : PlayIcon} size={14} />
            {v.isCleaning ? 'Pause' : v.isPaused ? 'Resume' : 'Start'}
          </Button>
          <Button size="sm" variant="tertiary" isDisabled={v.isDocked || v.isReturning} onPress={() => a.run(v.entityId, 'return_to_base')} className="gap-1.5">
            <HugeiconsIcon icon={Home01Icon} size={14} />
            Dock
          </Button>
          <Button size="sm" variant="ghost" onPress={() => a.run(v.entityId, 'locate')} className="gap-1.5">
            <HugeiconsIcon icon={Location01Icon} size={14} />
            Locate
          </Button>
        </li>
      </SheetSection>
      <CleanRooms v={v} onClean={(ids) => a.cleanAreas(v.entityId, ids)} />
      <VacuumMap v={v} />
    </>
  );
}

export default function VacuumsSheet({ model: m, onClose }: WidgetSheetProps<ProVacuumsModel>) {
  const a = useVacuumActions();
  const solo = m.items.length === 1 ? m.items[0] : null;
  const lead = solo ?? m.primaryVacuum;
  return (
    <DetailSheet
      title="Vacuums details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={Robot01Icon}
          eyebrow={solo ? solo.name : 'Vacuums'}
          tone={tone(lead)}
          headline={m.totalCount === 0 ? 'No vacuums' : solo ? solo.statusLabel : m.cleaningCount > 0 ? `${m.cleaningCount} of ${m.totalCount} cleaning` : 'All docked'}
          sub={
            solo
              ? [solo.currentRoom && solo.isCleaning ? solo.currentRoom : null, solo.batteryPct !== null ? `Battery ${solo.batteryPct}%` : null].filter(Boolean).join(' · ') || undefined
              : m.subtitleText
          }
          onClose={onClose}
          actions={
            solo ? (
              <>
                <HeroButton icon={solo.isCleaning ? PauseIcon : PlayIcon} solid onPress={() => a.run(solo.entityId, solo.isCleaning ? 'pause' : 'start')}>
                  {solo.isCleaning ? 'Pause' : solo.isPaused ? 'Resume' : 'Start cleaning'}
                </HeroButton>
                <HeroButton icon={Home01Icon} isDisabled={solo.isDocked || solo.isReturning} onPress={() => a.run(solo.entityId, 'return_to_base')}>
                  Dock
                </HeroButton>
              </>
            ) : null
          }
        />
      }
    >
      {m.totalCount === 0 ? (
        <SheetEmpty icon={Robot01Icon} title="No vacuums yet" text="Robot vacuums from Home Assistant show up here." />
      ) : (
        m.items.map((v) => <Vacuum key={v.entityId} v={v} a={a} solo={Boolean(solo)} />)
      )}
    </DetailSheet>
  );
}
