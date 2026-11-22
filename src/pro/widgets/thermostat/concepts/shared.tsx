/** Thermostat pieces the concepts share: actions, colours and the −/+ stepper. */
import { useMemo } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MinusSignIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ACTION_LABEL, stepTarget, type ProThermostatItem, type ThermostatAction } from '../../../lib/overviewThermostat';
import { useServiceCall } from '../../shared/useServiceCall';

export function useThermostatActions() {
  const { call, setOptimistic } = useServiceCall();
  return useMemo(
    () => ({
      step: (t: ProThermostatItem, dir: -1 | 1) => {
        const temperature = stepTarget(t, dir);
        setOptimistic(t.entityId, null, { temperature });
        void call('climate', 'set_temperature', { temperature }, t.entityId);
      }
    }),
    [call, setOptimistic]
  );
}

/** D1: colour only when the system is doing something. */
export function actionHue(a: ThermostatAction): string | null {
  if (a === 'heating') return 'hsl(22 95% 55%)';
  if (a === 'cooling') return 'hsl(205 90% 55%)';
  if (a === 'drying') return 'hsl(190 60% 48%)';
  if (a === 'fan') return 'hsl(165 50% 45%)';
  return null;
}

export const deg = (v: number | null, digits = 1) => (v === null ? '–' : `${Number(v.toFixed(digits))}°`);

/** "Cooling to 21°", "Idle · set to 21°", "Off". */
export function actionLine(t: ProThermostatItem): string {
  if (t.action === 'off') return 'Off';
  const to = t.targetLow !== null && t.targetHigh !== null ? `${deg(t.targetLow)}–${deg(t.targetHigh)}` : deg(t.target);
  if (t.action === 'idle') return `Idle · set to ${to}`;
  return `${ACTION_LABEL[t.action]} to ${to}`;
}

type Ink = 'auto' | 'light';

export function Stepper({ t, ink = 'auto', vertical, size = 'md' }: { t: ProThermostatItem; ink?: Ink; vertical?: boolean; size?: 'sm' | 'md' }) {
  const actions = useThermostatActions();
  const cls = cn(
    'min-w-0 rounded-full',
    size === 'sm' ? 'size-8' : 'size-10',
    ink === 'light' ? 'bg-white/20 text-white ring-1 ring-white/25 hover:bg-white/30' : 'bg-default text-foreground hover:bg-default/70'
  );
  const off = t.action === 'off' || t.target === null;
  return (
    <div className={cn('flex items-center gap-2', vertical && 'flex-col-reverse')}>
      <Button isIconOnly className={cls} isDisabled={off || (t.target ?? 0) <= t.min} aria-label={`Lower ${t.name} to ${deg(stepTarget(t, -1))}`} onPress={() => actions.step(t, -1)}>
        <HugeiconsIcon icon={MinusSignIcon} size={size === 'sm' ? 14 : 16} />
      </Button>
      <Button isIconOnly className={cls} isDisabled={off || (t.target ?? 0) >= t.max} aria-label={`Raise ${t.name} to ${deg(stepTarget(t, 1))}`} onPress={() => actions.step(t, 1)}>
        <HugeiconsIcon icon={PlusSignIcon} size={size === 'sm' ? 14 : 16} />
      </Button>
    </div>
  );
}
