/**
 * The thermostat's mode (Heat, Cool, Heat/Cool, Auto, Dry, Fan, Off) as a small menu button, from
 * the modes the device reports (`hvac_modes`). Used by the dial (concept C) on the room page.
 */
import { Button, Dropdown } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowDataTransferHorizontalIcon, AiMagicIcon, DropletIcon, FastWindIcon, FireIcon, PowerIcon, SnowIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProThermostatItem } from '../../../lib/overviewThermostat';
import { useServiceCall } from '../../shared/useServiceCall';

export const MODE: Record<string, { label: string; icon: IconSvgElement; hue: string | null }> = {
  heat: { label: 'Heat', icon: FireIcon, hue: 'hsl(22 95% 55%)' },
  cool: { label: 'Cool', icon: SnowIcon, hue: 'hsl(205 90% 55%)' },
  heat_cool: { label: 'Heat/Cool', icon: ArrowDataTransferHorizontalIcon, hue: 'hsl(280 60% 60%)' },
  auto: { label: 'Auto', icon: AiMagicIcon, hue: 'hsl(150 55% 45%)' },
  dry: { label: 'Dry', icon: DropletIcon, hue: 'hsl(190 60% 48%)' },
  fan_only: { label: 'Fan', icon: FastWindIcon, hue: 'hsl(165 50% 45%)' },
  off: { label: 'Off', icon: PowerIcon, hue: null }
};

export const modeOf = (m: string) => MODE[m] ?? { label: m.replace(/_/g, ' '), icon: AiMagicIcon, hue: null };

export function ModeMenu({ t, className }: { t: ProThermostatItem; className?: string }) {
  const { call, setOptimistic } = useServiceCall();
  if (t.modes.length < 2) return null;
  const now = modeOf(t.mode);
  return (
    <Dropdown>
      <Button
        size="sm"
        variant="secondary"
        aria-label={`${t.shortName || t.name} mode: ${now.label}. Change the mode`}
        className={cn('h-7 min-w-0 gap-1 rounded-full px-2.5 text-xs font-semibold', className)}
        style={now.hue ? { color: now.hue, background: `color-mix(in srgb, ${now.hue} 14%, transparent)` } : undefined}
      >
        <HugeiconsIcon icon={now.icon} size={13} />
        {now.label}
        <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="opacity-60" />
      </Button>
      <Dropdown.Popover placement="bottom" className="min-w-40">
        <Dropdown.Menu
          aria-label="Thermostat mode"
          selectionMode="single"
          selectedKeys={new Set([t.mode])}
          onAction={(key) => {
            const hvac_mode = String(key);
            setOptimistic(t.entityId, hvac_mode);
            void call('climate', 'set_hvac_mode', { hvac_mode }, t.entityId);
          }}
        >
          {t.modes.map((m) => {
            const info = modeOf(m);
            return (
              <Dropdown.Item key={m} id={m} textValue={info.label}>
                <HugeiconsIcon icon={info.icon} size={15} className="shrink-0" style={info.hue ? { color: info.hue } : undefined} />
                <span className="truncate capitalize">{info.label}</span>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
