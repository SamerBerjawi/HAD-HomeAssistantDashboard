/**
 * Thermostat details (sheet kit, WIDGET_DESIGN.md §8; new). Hero on the card's air colour: the
 * target as the big number, −/+ beside it, the state and room temperature under it. With several
 * thermostats a segmented choice picks the one shown (and "Show on card" makes it the card's).
 * Then the mode (Heat, Cool, Auto…) and the readings.
 */
import { useState } from 'react';
import { CheckmarkCircle02Icon, DropletIcon, RulerIcon, ThermometerIcon, ThermometerWarmIcon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { ACTION_LABEL, chosenThermostatId, type ProThermostatItem, type ProThermostatModel } from '../../lib/overviewThermostat';
import { useServiceCall } from '../shared/useServiceCall';
import { DetailSheet, HeroButton, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSection } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { deg, Stepper } from './concepts/shared';
import { air } from './ThermostatCard';
import { ThermostatHistory } from './ThermostatHistory';
import { useChooseThermostat } from './ThermostatPicker';

const MODE_LABEL: Record<string, string> = { heat: 'Heat', cool: 'Cool', heat_cool: 'Heat & cool', auto: 'Auto', dry: 'Dry', fan_only: 'Fan', off: 'Off' };
export const modeLabel = (m: string) => MODE_LABEL[m] ?? m.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function ThermostatSheet({ model: m, itemId, onClose }: WidgetSheetProps<ProThermostatModel>) {
  const { config } = useUserConfig();
  const choose = useChooseThermostat();
  const { call, setOptimistic } = useServiceCall();
  const [picked, setPicked] = useState<string | null>(itemId ?? m.primary?.entityId ?? null);
  const t: ProThermostatItem | null = m.items.find((i) => i.entityId === picked) ?? m.primary;
  const onCard = (chosenThermostatId(config.preferences) ?? m.primary?.entityId) === t?.entityId;
  const setMode = (mode: string) => {
    if (!t) return;
    setOptimistic(t.entityId, mode);
    void call('climate', 'set_hvac_mode', { hvac_mode: mode }, t.entityId);
  };
  const label = (i: ProThermostatItem) => i.roomName || i.shortName;

  return (
    <DetailSheet
      title="Thermostat details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={ThermometerIcon}
          eyebrow={t ? `${label(t)} thermostat` : 'Thermostat'}
          background={air(t)}
          headline={t ? (t.mode === 'off' ? 'Off' : `${ACTION_LABEL[t.action]} to ${deg(t.target)}`) : 'No thermostats'}
          sub={t ? [`Now ${deg(t.current)}`, t.humidity !== null ? `${t.humidity}% humidity` : null].filter(Boolean).join(' · ') : undefined}
          aside={t && t.mode !== 'off' ? <Stepper t={t} ink="light" vertical /> : null}
          onClose={onClose}
          actions={
            t && m.items.length > 1 ? (
              <HeroButton icon={CheckmarkCircle02Icon} solid={!onCard} isDisabled={onCard} onPress={() => void choose(t.entityId)}>
                {onCard ? 'Shown on the card' : 'Show on the card'}
              </HeroButton>
            ) : null
          }
        />
      }
      toolbar={m.items.length > 1 && t ? <SheetFilter label="Thermostat" value={t.entityId} onChange={setPicked} options={m.items.map((i) => ({ id: i.entityId, label: label(i) }))} /> : null}
    >
      {!t ? (
        <SheetEmpty icon={ThermometerIcon} title="No thermostats yet" text="Climate devices from Home Assistant show up here." />
      ) : (
        <>
          {t.modes.length > 1 ? (
            <SheetSection title="Mode" plain>
              <SheetFilter label={`${t.name} mode`} value={t.mode} onChange={setMode} options={t.modes.map((md) => ({ id: md, label: modeLabel(md) }))} />
            </SheetSection>
          ) : null}
          <ThermostatHistory key={t.entityId} t={t} />
          <SheetSection title="Readings">
            <SheetRow icon={ThermometerWarmIcon} title="Room temperature" trailing={<span className="text-sm font-medium tabular-nums">{deg(t.current)}</span>} />
            {t.targetLow !== null && t.targetHigh !== null ? (
              <SheetRow icon={ThermometerIcon} title="Keep between" trailing={<span className="text-sm font-medium tabular-nums">{`${deg(t.targetLow)} – ${deg(t.targetHigh)}`}</span>} />
            ) : null}
            {t.humidity !== null ? <SheetRow icon={DropletIcon} title="Humidity" trailing={<span className="text-sm font-medium tabular-nums">{t.humidity}%</span>} /> : null}
            <SheetRow icon={RulerIcon} title="Range" subtitle={`In steps of ${t.step}°`} trailing={<span className="text-sm font-medium tabular-nums">{`${deg(t.min)} – ${deg(t.max)}`}</span>} />
          </SheetSection>
          {m.items.length > 1 ? (
            <SheetSection title="All thermostats">
              {m.items.map((i) => (
                <SheetRow
                  key={i.entityId}
                  icon={ThermometerIcon}
                  tone={i.action === 'heating' ? 'warning' : i.action === 'cooling' ? 'active' : 'default'}
                  title={label(i)}
                  subtitle={i.mode === 'off' ? 'Off' : `${ACTION_LABEL[i.action]} · set to ${deg(i.target)}`}
                  trailing={<span className="text-sm font-medium tabular-nums">{deg(i.current)}</span>}
                />
              ))}
            </SheetSection>
          ) : null}
        </>
      )}
    </DetailSheet>
  );
}
