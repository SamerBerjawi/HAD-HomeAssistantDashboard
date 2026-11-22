/** Pieces the Vacuums styles share: the main action, the dock action and state colours. */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BatteryCharging01Icon, BatteryFullIcon, BatteryLowIcon, BatteryMedium01Icon, Home01Icon, Location01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProVacuumItem } from '../../../lib/overviewAppliances';
import { useVacuumActions } from '../useVacuumActions';

/** State colour (D1: colour from state). Neutral when docked or idle. */
export function stateHue(v: ProVacuumItem): string | null {
  if (v.isError) return 'hsl(0 75% 55%)';
  if (v.isCleaning) return 'hsl(172 70% 42%)';
  if (v.isReturning) return 'hsl(212 85% 55%)';
  if (v.isPaused) return 'hsl(38 90% 50%)';
  return null;
}

export function batteryColor(pct: number | null): string {
  if (pct === null) return 'var(--muted)';
  if (pct <= 20) return 'hsl(0 75% 55%)';
  if (pct <= 40) return 'hsl(38 90% 50%)';
  return 'hsl(145 55% 42%)';
}

/** Battery glyph for a level (charging wins). */
export function batteryIcon(pct: number | null, charging: boolean) {
  if (charging) return BatteryCharging01Icon;
  if (pct === null || pct > 70) return BatteryFullIcon;
  if (pct > 30) return BatteryMedium01Icon;
  return BatteryLowIcon;
}

/** One word for the headline. */
export function stateWord(v: ProVacuumItem): string {
  if (v.isError) return 'Needs help';
  if (v.isCleaning) return 'Cleaning';
  if (v.isReturning) return 'Going home';
  if (v.isPaused) return 'Paused';
  if (v.isDocked) return 'Docked';
  return 'Ready';
}

export function stateDetail(v: ProVacuumItem): string {
  if (v.isCleaning || v.isPaused) return [v.currentRoom, v.fanSpeed].filter(Boolean).join(' · ');
  if (v.isError) return v.statusLabel;
  return v.roomName || v.name;
}

type Ink = 'auto' | 'light';

export function VacuumButtons({ v, ink = 'auto', compact }: { v: ProVacuumItem; ink?: Ink; compact?: boolean }) {
  const actions = useVacuumActions();
  const main = v.isError
    ? { label: 'Locate', icon: Location01Icon, action: 'locate' as const }
    : v.isCleaning
      ? { label: 'Pause', icon: PauseIcon, action: 'pause' as const }
      : { label: v.isPaused ? 'Resume' : 'Start', icon: PlayIcon, action: 'start' as const };
  const glass = ink === 'light' ? 'bg-white/20 text-white ring-1 ring-white/25 hover:bg-white/30' : 'bg-default text-foreground hover:bg-default/70';
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        onPress={() => actions.run(v.entityId, main.action)}
        aria-label={`${main.label} ${v.name}`}
        isIconOnly={compact}
        className={cn('h-9 rounded-full font-semibold', compact ? 'size-9 min-w-0' : 'px-3', glass)}
      >
        <HugeiconsIcon icon={main.icon} size={16} />
        {compact ? null : main.label}
      </Button>
      {!v.isDocked && !v.isReturning && !compact ? (
        <Button size="sm" isIconOnly onPress={() => actions.run(v.entityId, 'return_to_base')} aria-label={`Send ${v.name} to its dock`} className={cn('size-9 min-w-0 rounded-full', glass)}>
          <HugeiconsIcon icon={Home01Icon} size={16} />
        </Button>
      ) : null}
    </div>
  );
}
