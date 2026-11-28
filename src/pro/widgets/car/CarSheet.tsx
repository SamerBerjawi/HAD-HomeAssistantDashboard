/**
 * Car details (sheet kit, WIDGET_DESIGN.md §8; new). Hero on the card's colours: what the car is
 * doing, the one line that matters, the battery and range, and Climate (press and hold) plus
 * Lock / Unlock (hold). Then alerts, charging, where it is (map), the cabin and the software.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  BatteryCharging01Icon,
  Car01Icon,
  Clock01Icon,
  DashboardSpeed01Icon,
  Download04Icon,
  FlashIcon,
  Location01Icon,
  SnowflakeIcon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  ThermometerWarmIcon
} from '@hugeicons/core-free-icons';
import { carLine, durationText, type ProCarModel } from '../../lib/overviewCar';
import { HoldButton } from '../shared/HoldButton';
import { DetailSheet, HERO_HOLD, SheetEmpty, SheetHero, SheetRow, SheetSection } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { useInDark } from '../shared/useInDark';
import { CarBattery, carGlow, modeIcon, ParkedMap, rangeText, useCarActions } from './concepts/shared';
const value = (t: string) => <span className="text-sm font-medium tabular-nums">{t}</span>;

export default function CarSheet({ model: m, onClose }: WidgetSheetProps<ProCarModel>) {
  const a = useCarActions(m);
  const { ref, isDark } = useInDark<HTMLDivElement>();
  const cooling = m.modeLabel === 'Cooling down' || (m.outdoorTemp !== null && m.outdoorTemp > 24);
  const range = rangeText(m);
  return (
    <DetailSheet
      title={`${m.name} details`}
      onClose={onClose}
      hero={
        <SheetHero
          icon={modeIcon(m)}
          eyebrow={m.name}
          background={m.hasCar ? carGlow(m) : undefined}
          headline={m.hasCar ? m.modeLabel : 'No car'}
          sub={m.hasCar ? carLine(m) : undefined}
          aside={
            m.hasCar ? (
              <p className="text-right text-4xl font-extralight leading-none tracking-tighter tabular-nums">
                {m.socPct ?? '–'}%<span className="mt-1 block text-xs font-normal tracking-normal text-white/85">{range}</span>
              </p>
            ) : null
          }
          onClose={onClose}
          actions={
            m.hasCar ? (
              <>
                {m.controls.climateId ? (
                  <HoldButton
                    icon={cooling ? SnowflakeIcon : ThermometerWarmIcon}
                    label={m.climateOn ? 'Stop climate' : 'Start climate'}
                    ariaLabel={`${m.climateOn ? 'Stop' : 'Start'} ${m.name} climate`}
                    isPending={a.busy === 'climate'}
                    isDisabled={m.mode === 'driving'}
                    onConfirm={() => void a.toggleClimate()}
                    className={HERO_HOLD}
                  />
                ) : null}
                {m.controls.lockId ? (
                  <HoldButton
                    icon={m.locked ? SquareUnlock02Icon : SquareLock02Icon}
                    label={m.locked ? 'Unlock' : 'Lock'}
                    ariaLabel={`${m.locked ? 'Unlock' : 'Lock'} ${m.name}`}
                    isPending={a.busy === 'lock'}
                    isDisabled={m.mode === 'driving'}
                    onConfirm={() => void a.setLocked(!m.locked)}
                    className={HERO_HOLD}
                  />
                ) : null}
              </>
            ) : null
          }
        >
          {m.hasCar ? (
            <div className="mt-2 max-w-xs">
              <CarBattery m={m} ink="light" />
            </div>
          ) : null}
        </SheetHero>
      }
    >
      {!m.hasCar ? (
        <SheetEmpty icon={Car01Icon} title="No car yet" text="Set up your car under Mobility in Settings to see it here." />
      ) : (
        <>
          {m.alerts.length > 0 || m.ota.state !== 'none' ? (
            <SheetSection title="Needs attention">
              {m.alerts.map((al) => (
                <SheetRow key={al.id} icon={Alert02Icon} tone={al.tone} title={al.text} />
              ))}
              {m.ota.state !== 'none' ? (
                <SheetRow icon={Download04Icon} tone="active" title={m.ota.state === 'installing' ? 'Installing a software update' : 'Software update ready'} subtitle={m.ota.text ?? undefined} />
              ) : null}
            </SheetSection>
          ) : null}
          <SheetSection title="Battery">
            <SheetRow icon={BatteryCharging01Icon} title="Charge" trailing={value(`${m.socPct ?? '–'}%${m.targetPct !== null ? ` of ${m.targetPct}%` : ''}`)} />
            {range ? <SheetRow icon={DashboardSpeed01Icon} title="Range" trailing={value(range)} /> : null}
            <SheetRow
              icon={FlashIcon}
              title={m.pluggedIn ? 'Plugged in' : 'Not plugged in'}
              subtitle={m.chargeKW ? `${m.chargeKW} kW${m.chargeMinutesLeft ? ` · full in ${durationText(m.chargeMinutesLeft)}` : ''}` : undefined}
            />
          </SheetSection>
          {/* The map is always shown (owner review 2026-11-20), while driving too: where the car is now. */}
          {m.location.lat !== null && m.location.lon !== null ? (
            <SheetSection
              title={m.mode === 'driving' ? 'Where it is now' : m.location.isHome ? 'At home' : `At ${m.location.place}`}
              aside={m.mode === 'driving' ? undefined : (m.location.sinceText ?? undefined)}
              plain
            >
              <div ref={ref} className="relative h-48 overflow-hidden rounded-[18px]">
                <ParkedMap m={m} dark={isDark} always className="absolute inset-0" />
              </div>
            </SheetSection>
          ) : null}
          <SheetSection title="Car">
            <SheetRow icon={m.locked ? SquareLock02Icon : SquareUnlock02Icon} tone={m.locked ? 'success' : 'warning'} title="Doors" trailing={value(m.locked ? 'Locked' : 'Unlocked')} />
            <SheetRow icon={Car01Icon} tone={m.windowsClosed ? 'default' : 'warning'} title="Windows" trailing={value(m.windowsClosed ? 'Closed' : 'Open')} />
            {m.cabinTemp !== null ? (
              <SheetRow
                icon={ThermometerWarmIcon}
                tone={m.climateOn ? 'active' : 'default'}
                title={m.climateOn ? 'Climate on' : 'Cabin'}
                subtitle={m.climateOn && m.climateMinutesLeft ? `${durationText(m.climateMinutesLeft)} left` : undefined}
                trailing={value(`${Math.round(m.cabinTemp)}${m.tempUnit}`)}
              />
            ) : null}
            {m.mode === 'driving' && m.speed !== null ? <SheetRow icon={DashboardSpeed01Icon} title="Speed" trailing={value(`${Math.round(m.speed)} ${m.speedUnit}`)} /> : null}
            {m.odometer !== null ? <SheetRow icon={Location01Icon} title="Odometer" trailing={value(`${Math.round(m.odometer).toLocaleString()} ${m.odometerUnit}`)} /> : null}
            {m.updatedAgoText ? <SheetRow icon={Clock01Icon} title="Last update" trailing={<span className="text-sm text-muted">{m.updatedAgoText}</span>} /> : null}
          </SheetSection>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <HugeiconsIcon icon={SquareLock02Icon} size={13} />
            Climate and the doors need a press and hold.
          </p>
        </>
      )}
    </DetailSheet>
  );
}
