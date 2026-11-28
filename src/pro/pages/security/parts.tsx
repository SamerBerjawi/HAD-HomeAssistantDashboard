/**
 * Small shared pieces for the three Security page directions: tone colours (the Area tiles'
 * safe / attention / alarm), the arm-mode picker, a camera view, and event icons. Each design
 * still owns its own layout and look.
 */
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  AlarmSmokeIcon,
  Car01Icon,
  DoorOpenIcon,
  Home01Icon,
  Moon02Icon,
  Motion02Icon,
  PackageIcon,
  PawPrintIcon,
  SecurityCheckIcon,
  Shield01Icon,
  SquareLock02Icon,
  User02Icon,
  Video01Icon,
  VideoOffIcon,
  Logout03Icon,
  ShieldBanIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ALARM, SAFE, WATCH } from '../../areas/tiles/security/securityParts';
import { agoText } from '../../areas/tileTypes';
import { ARM_MODES, type ArmMode, type Detection, type SecurityAction, type SecurityCamera, type SecurityEvent, type SecurityHome, type Tone } from '../../lib/securityPage';

export interface DesignProps {
  home: SecurityHome;
  /** Page content width in px (the shell's sidebar and padding already taken off). */
  width: number;
  act: (a: SecurityAction) => void;
}

export const TONE: Record<Tone, string> = { calm: SAFE, warning: WATCH, danger: ALARM };
export const toneIcon = (t: Tone): IconSvgElement => (t === 'calm' ? SecurityCheckIcon : Alert02Icon);

export const MODE_ICON: Record<ArmMode, IconSvgElement> = { disarmed: ShieldBanIcon, armed_home: Home01Icon, armed_night: Moon02Icon, armed_away: Logout03Icon };

export const EVENT_ICON: Record<SecurityEvent['kind'], IconSvgElement> = {
  alarm: Shield01Icon,
  lock: SquareLock02Icon,
  opening: DoorOpenIcon,
  motion: Motion02Icon,
  camera: Video01Icon,
  safety: AlarmSmokeIcon,
  person: User02Icon
};

/** Each kind of event has its own colour in the Today list; alerts and warnings take the tone's colour. */
export const EVENT_COLOR: Record<SecurityEvent['kind'], string> = {
  alarm: 'var(--accent)',
  lock: 'hsl(168 62% 38%)',
  opening: 'hsl(24 85% 54%)',
  motion: 'hsl(205 85% 52%)',
  camera: 'hsl(325 68% 56%)',
  safety: 'hsl(4 82% 54%)',
  person: 'hsl(145 52% 40%)'
};
export const eventColor = (e: Pick<SecurityEvent, 'kind' | 'tone'>) => (e.tone === 'calm' ? EVENT_COLOR[e.kind] : TONE[e.tone]);

export const DETECTION: Record<Detection, { icon: IconSvgElement; label: string }> = {
  person: { icon: User02Icon, label: 'Person' },
  vehicle: { icon: Car01Icon, label: 'Car' },
  package: { icon: PackageIcon, label: 'Package' },
  animal: { icon: PawPrintIcon, label: 'Animal' }
};

export const ago = (t: number | null) => agoText(t);
export const recentMotion = (c: SecurityCamera, mins = 10) => !!c.lastMotion && Date.now() - c.lastMotion < mins * 60_000;

/** The four arm modes as one segmented control. The current mode is selected. */
export function ModePicker({ home, act, className, size = 'md' }: { home: SecurityHome; act: DesignProps['act']; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const current = home.alarm.state === 'triggered' || home.alarm.state === 'arming' ? null : home.alarm.state;
  return (
    <ToggleButtonGroup
      aria-label="Alarm mode"
      size={size}
      selectionMode="single"
      className={cn('w-full', className)}
      selectedKeys={current ? new Set([current]) : new Set()}
      onSelectionChange={(keys) => {
        const id = [...keys][0] as ArmMode | undefined;
        if (id) act({ type: 'arm', mode: id });
      }}
    >
      {ARM_MODES.map((m) => (
        <ToggleButton key={m.id} id={m.id} className="flex-1 gap-1.5">
          <HugeiconsIcon icon={MODE_ICON[m.id]} size={16} />
          {m.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** A camera's picture at 16:9 (or filling its box), with a small live dot. No text on the video. */
export function CameraView({ c, className, fill, radius = 'rounded-2xl' }: { c: SecurityCamera; className?: string; fill?: boolean; radius?: string }) {
  return (
    <div className={cn('relative isolate overflow-hidden bg-black', radius, fill ? 'h-full w-full' : 'aspect-video w-full', className)}>
      {c.available ? (
        <div aria-hidden className="absolute inset-0" style={{ background: c.picture ?? undefined }} />
      ) : (
        <div className="grid h-full w-full place-items-center bg-[color-mix(in_oklab,var(--foreground)_8%,var(--surface))] text-muted">
          <HugeiconsIcon icon={VideoOffIcon} size={22} />
        </div>
      )}
      {c.available && c.live ? <span aria-label="Live" className="absolute right-2.5 top-2.5 size-2 rounded-full ring-2 ring-black/30" style={{ background: recentMotion(c, 2) ? ALARM : SAFE }} /> : null}
    </div>
  );
}

/** "Person · 2m ago", "Motion 4h ago", "Offline". */
export function cameraLine(c: SecurityCamera) {
  if (!c.available) return 'Offline';
  if (c.detection) return `${DETECTION[c.detection].label} · ${ago(c.lastMotion).toLowerCase()}`;
  return c.lastMotion ? `Motion ${ago(c.lastMotion).toLowerCase()}` : 'No motion';
}

/** "14:32" in the viewer's locale. */
export const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
