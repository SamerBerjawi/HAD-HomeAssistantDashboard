/** Shared bits for the vacuum tiles: words and colours per state, the main action, and buttons. */
import { VacuumEntityFeature as Feature } from '@/services/vacuumClassification';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Home01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { agoText, type TileAction, type VacuumTileModel } from '../../tileTypes';
import { ALARM, CALM, SAFE, WATCH } from '../security/securityParts';

export const VAC = 'hsl(190 75% 42%)';
const BACK = 'hsl(262 60% 62%)';

export function vacInfo(v: VacuumTileModel): { word: string; hue: string; detail: string; busy: boolean } {
  if (!v.available) return { word: 'Unavailable', hue: CALM, detail: '', busy: false };
  const run = [v.areaM2 !== null ? `${v.areaM2} m²` : null, v.minutes !== null ? `${v.minutes} min` : null].filter(Boolean).join(' · ');
  switch (v.state) {
    case 'cleaning':
      return { word: 'Cleaning', hue: VAC, detail: [v.room, run].filter(Boolean).join(' · '), busy: true };
    case 'returning':
      return { word: 'Going home', hue: BACK, detail: run ? `Done: ${run}` : 'Back to the dock', busy: true };
    case 'paused':
      return { word: 'Paused', hue: WATCH, detail: [v.room, run].filter(Boolean).join(' · '), busy: false };
    case 'error':
      return { word: 'Needs help', hue: ALARM, detail: v.error ?? 'Check the robot', busy: false };
    case 'idle':
      return { word: 'Idle', hue: CALM, detail: v.lastRun ? `Last clean ${agoText(v.lastRun).toLowerCase()}` : '', busy: false };
    default:
      return { word: v.battery !== null && v.battery < 100 ? 'Charging' : 'Docked', hue: SAFE, detail: v.lastRun ? `Last clean ${agoText(v.lastRun).toLowerCase()}${run ? ` · ${run}` : ''}` : 'Ready', busy: false };
  }
}

/** The one main action for the state: Pause while cleaning, Resume when paused, otherwise Start. */
export function mainAction(v: VacuumTileModel): { label: string; icon: IconSvgElement; cmd: 'start' | 'pause' } {
  if (v.state === 'cleaning') return { label: 'Pause', icon: PauseIcon, cmd: 'pause' };
  if (v.state === 'paused') return { label: 'Resume', icon: PlayIcon, cmd: 'start' };
  if (v.state === 'error') return { label: 'Retry', icon: PlayIcon, cmd: 'start' };
  return { label: v.target.length ? `Clean ${v.target.length === 1 ? v.target[0] : `${v.target.length} rooms`}` : 'Start', icon: PlayIcon, cmd: 'start' };
}

export function VacButton({ v, act, kind, size = 'md', iconOnly, className }: { v: VacuumTileModel; act: (a: TileAction) => void; kind: 'main' | 'dock'; size?: 'sm' | 'md'; iconOnly?: boolean; className?: string }) {
  const m = mainAction(v);
  const dock = kind === 'dock';
  const feature = dock ? Feature.RETURN_HOME : m.cmd === 'pause' ? Feature.PAUSE : Feature.START;
  const unsupported = v.supportedFeatures !== undefined && !(v.supportedFeatures & feature);
  const disabled = unsupported || !v.available || (dock && (v.state === 'docked' || v.state === 'returning'));
  const label = dock ? 'Dock' : m.label;
  const h = size === 'sm' ? 32 : 38;
  return (
    <Button
      isIconOnly={iconOnly}
      variant={dock ? 'secondary' : 'primary'}
      data-tile-control=""
      aria-label={`${v.name}: ${dock ? 'send to the dock' : m.label.toLowerCase()}`}
      isDisabled={disabled}
      onPress={() => act({ type: 'vacuum', cmd: dock ? 'dock' : m.cmd })}
      className={cn('min-w-0 shrink-0 gap-1.5 rounded-full font-semibold', iconOnly ? 'p-0' : size === 'sm' ? 'px-3 text-[12px]' : 'px-4 text-[13px]', className)}
      style={{ height: h, ...(iconOnly ? { width: h } : {}), ...(!dock && !disabled ? { background: v.state === 'cleaning' ? WATCH : VAC, color: 'white' } : {}) }}
    >
      <HugeiconsIcon icon={dock ? Home01Icon : m.icon} size={size === 'sm' ? 14 : 16} />
      {iconOnly ? null : <span className="truncate">{label}</span>}
    </Button>
  );
}
