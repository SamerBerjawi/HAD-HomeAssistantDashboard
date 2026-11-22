/**
 * Alarm details (sheet kit, WIDGET_DESIGN.md §8). Hero on the card's alarm colours: the state,
 * who changed it and when, and every mode as one track (the same codes and "arm anyway" dialogs
 * as the card). A panel choice when there are several. Then what is open (to Doors & windows) and
 * the locks: Lock (tap) or Unlock (press and hold), Lock all.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Door01Icon, Shield01Icon, SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { alarmStateIcon, PRO_ALARM_MODE_ICON } from '../../components/overview/SecurityAlarmShared';
import { useOpenSheet } from '../../hooks/useSheetParam';
import type { ProOverviewAlarmModel } from '../../lib/overviewSecurity';
import { HoldButton } from '../shared/HoldButton';
import { DetailSheet, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSection } from '../shared/sheet/SheetKit';
import { RecentEvents } from '../shared/sheet/RecentEvents';
import type { WidgetSheetProps } from '../types';
import { alarmColors, changedLine, useAlarm } from './concepts/shared';

export default function AlarmSheet({ model: m, onClose }: WidgetSheetProps<ProOverviewAlarmModel>) {
  const setPanel = useAutoLayoutStore((s) => s.setSelectedAlarmEntityId);
  const open = useOpenSheet();
  const { actions, controller, dialogs } = useAlarm(m);
  const c = alarmColors(m);
  const unlocked = m.locks.filter((l) => l.isUnlocked);
  return (
    <DetailSheet
      title="Alarm details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={m.panel ? alarmStateIcon(m.state) : Shield01Icon}
          eyebrow={m.panelName || 'Alarm'}
          background={`linear-gradient(150deg, ${c.from}, ${c.to})`}
          headline={m.panel ? m.stateLabel : 'No alarm panel'}
          sub={m.panel ? changedLine(m) : undefined}
          onClose={onClose}
        >
          {m.panel && m.modes.length > 0 ? (
            <div role="group" aria-label="Alarm mode" className="mt-3 flex w-full gap-1 rounded-2xl bg-black/25 p-1 ring-1 ring-white/15">
              {m.modes.map((mode) => {
                const on = mode.id === m.currentMode;
                return (
                  <Button
                    key={mode.id}
                    variant="ghost"
                    isDisabled={controller.busy}
                    aria-pressed={on}
                    aria-label={`${mode.label}${on ? ', current' : ''}`}
                    onPress={() => controller.selectMode(mode.id)}
                    className={cn('h-14 min-w-0 flex-1 flex-col gap-1 rounded-xl px-1 text-xs font-semibold', on ? 'bg-white shadow-md' : 'text-white/80 hover:bg-white/10 hover:text-white')}
                    style={on ? { color: c.to } : undefined}
                  >
                    <HugeiconsIcon icon={PRO_ALARM_MODE_ICON[mode.id]} size={17} className="shrink-0" />
                    <span className="w-full truncate text-[11px]">{mode.label}</span>
                  </Button>
                );
              })}
            </div>
          ) : null}
        </SheetHero>
      }
      toolbar={
        m.panels.length > 1 && m.panel ? (
          <SheetFilter
            label="Alarm panel"
            value={m.panel.entity_id}
            onChange={(id) => setPanel(id)}
            options={m.panels.map((p) => ({ id: p.entity_id, label: String(p.attributes?.friendly_name ?? p.entity_id) }))}
          />
        ) : null
      }
    >
      {!m.panel ? (
        <SheetEmpty icon={Shield01Icon} title="No alarm panel" text="An alarm_control_panel from Home Assistant shows up here." />
      ) : (
        <>
          <SheetSection
            title="Doors & windows"
            aside={
              <Button size="sm" variant="ghost" onPress={() => open('openings')} className="h-6 gap-1 px-1.5 text-xs">
                All
                <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              </Button>
            }
          >
            {m.openingsCount === 0 ? (
              <SheetRow icon={Door01Icon} tone="success" title="All closed" subtitle="Nothing open while you arm" />
            ) : (
              m.openings.slice(0, 5).map((e) => <SheetRow key={e.entity_id} icon={Door01Icon} tone="warning" title={String(e.attributes?.friendly_name ?? e.entity_id)} subtitle="Open" />)
            )}
          </SheetSection>
          {m.locks.length > 0 ? (
            <SheetSection
              title="Locks"
              aside={
                unlocked.length > 0 ? (
                  <Button size="sm" variant="ghost" onPress={() => void actions.lockAll()} className="h-6 gap-1 px-1.5 text-xs">
                    <HugeiconsIcon icon={SquareLock02Icon} size={13} />
                    Lock all
                  </Button>
                ) : (
                  'All locked'
                )
              }
            >
              {m.locks.map((l) => (
                <SheetRow
                  key={l.entityId}
                  icon={l.isUnlocked ? SquareUnlock02Icon : SquareLock02Icon}
                  tone={l.isJammed ? 'danger' : l.isUnlocked ? 'warning' : 'success'}
                  title={l.shortName}
                  subtitle={[l.stateLabel, l.roomName].filter(Boolean).join(' · ')}
                  trailing={
                    l.isUnlocked ? (
                      <Button size="sm" variant="primary" onPress={() => void actions.setLockState(l.entityId, 'lock')} className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold">
                        <HugeiconsIcon icon={SquareLock02Icon} size={14} />
                        Lock
                      </Button>
                    ) : !l.isJammed && !l.isOffline ? (
                      <HoldButton
                        icon={SquareUnlock02Icon}
                        label="Unlock"
                        ariaLabel={`Unlock ${l.name}`}
                        onConfirm={() => void actions.setLockState(l.entityId, 'unlock')}
                        fillClassName="bg-foreground/15"
                        className="h-8 rounded-full px-3 text-xs font-semibold"
                      />
                    ) : null
                  }
                />
              ))}
            </SheetSection>
          ) : null}
          <RecentEvents key={m.panel.entity_id} title="Recent events" alarms={[m.panel.entity_id]} only={(e) => e.kind === 'alarm'} empty="No arming or disarming in the last 24 hours" />
        </>
      )}
      {dialogs}
    </DetailSheet>
  );
}
