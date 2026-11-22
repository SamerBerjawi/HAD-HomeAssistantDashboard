/**
 * Choose which thermostat the widget controls (owner, 2026-11-20): the room name on the card opens
 * a menu of every thermostat; the choice is saved in the user's preferences (all screens). With one
 * thermostat it is plain text.
 */
import { Button, Dropdown } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { THERMOSTAT_PREF_KEY, type ProThermostatItem, type ProThermostatModel } from '../../lib/overviewThermostat';
import { deg } from './concepts/shared';

export function useChooseThermostat() {
  const { updateConfig } = useUserConfig();
  return (entityId: string) =>
    updateConfig((prev) => ({
      ...prev,
      preferences: { ...(prev.preferences || {}), [THERMOSTAT_PREF_KEY]: entityId } as typeof prev.preferences
    }));
}

export function ThermostatPicker({ model, t, icon, className }: { model: ProThermostatModel; t: ProThermostatItem; icon: IconSvgElement; className?: string }) {
  const choose = useChooseThermostat();
  const label = t.roomName || t.shortName;
  if (model.items.length < 2) {
    return (
      <p className={cn('flex min-w-0 items-center gap-1 text-xs font-medium text-white/85', className)}>
        <HugeiconsIcon icon={icon} size={13} className="shrink-0" />
        <span className="truncate">{label}</span>
      </p>
    );
  }
  return (
    <Dropdown>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`${label} thermostat: choose another`}
        className={cn('-ml-2 h-7 min-w-0 max-w-full shrink justify-start gap-1 rounded-full px-2 text-xs font-medium text-white/90 hover:bg-white/15', className)}
      >
        <HugeiconsIcon icon={icon} size={13} className="shrink-0" />
        <span className="truncate">{label}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={13} className="shrink-0" />
      </Button>
      <Dropdown.Popover placement="bottom start" className="max-h-[60dvh] min-w-56 overflow-y-auto">
        <Dropdown.Menu aria-label="Thermostats" onAction={(key) => choose(String(key))}>
          {model.items.map((o) => (
            <Dropdown.Item key={o.entityId} id={o.entityId} textValue={o.entityId === t.entityId ? `${o.roomName || o.shortName}, shown` : o.roomName || o.shortName}>
              <span className="flex w-full items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{o.roomName || o.shortName}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted">{deg(o.current)}</span>
                {o.entityId === t.entityId ? <HugeiconsIcon icon={Tick02Icon} size={14} className="shrink-0" /> : <span className="w-3.5 shrink-0" />}
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
