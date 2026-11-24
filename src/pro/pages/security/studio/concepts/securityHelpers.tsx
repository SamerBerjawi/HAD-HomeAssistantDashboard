/**
 * Shared visual primitives, icon maps, and architectural mock camera viewports for Security Studio.
 * Zero external image dependencies, zero raw HTML controls, light & dark safe.
 */
import { Button, Tooltip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Airplane01Icon,
  Alert02Icon,
  Camera01Icon,
  Car01Icon,
  DoorIcon,
  DropletIcon,
  FireIcon,
  GarageIcon,
  Home01Icon,
  Logout03Icon,
  Megaphone01Icon,
  Moon02Icon,
  Motion01Icon,
  PackageIcon,
  PawPrintIcon,
  PowerIcon,
  SecurityCheckIcon,
  Shield01Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  TimeQuarterPassIcon,
  User02Icon,
  VideoOffIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { AlarmModeId, Tone } from '../../../../lib/securityLogic';
import type {
  StudioAiKind,
  StudioCamera,
  StudioDeviceKind,
  StudioSecurityDevice
} from '../studioSecurity';

export const ALARM_MODE_META: Record<
  AlarmModeId,
  { label: string; short: string; desc: string; icon: IconSvgElement }
> = {
  disarmed: { label: 'Disarmed', short: 'Off', desc: 'Monitoring paused', icon: PowerIcon },
  armed_home: { label: 'Armed home', short: 'Home', desc: 'Exterior doors & windows', icon: Home01Icon },
  armed_away: { label: 'Armed away', short: 'Away', desc: 'Full interior & perimeter', icon: Logout03Icon },
  armed_night: { label: 'Armed night', short: 'Night', desc: 'Perimeter while sleeping', icon: Moon02Icon },
  armed_vacation: { label: 'Vacation', short: 'Away+', desc: 'Extended absence', icon: Airplane01Icon },
  armed_custom_bypass: { label: 'Custom', short: 'Custom', desc: 'Selected bypass zones', icon: Shield01Icon }
};

export const AI_META: Record<StudioAiKind, { label: string; icon: IconSvgElement }> = {
  person: { label: 'Person', icon: User02Icon },
  vehicle: { label: 'Vehicle', icon: Car01Icon },
  package: { label: 'Package', icon: PackageIcon },
  animal: { label: 'Animal', icon: PawPrintIcon }
};

export const TONE_TINT: Record<Tone, string> = {
  default: '168, 85, 247',
  success: '34, 197, 94',
  warning: '245, 158, 11',
  danger: '239, 68, 68'
};

export const TONE_COLOR: Record<Tone, string> = {
  default: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)'
};

export function alarmStateIcon(state: string): IconSvgElement {
  if (state === 'triggered') return Alert02Icon;
  if (state === 'arming' || state === 'pending' || state === 'disarming') return TimeQuarterPassIcon;
  if (state.startsWith('armed')) return SecurityCheckIcon;
  return Shield01Icon;
}

export function deviceKindIcon(d: Pick<StudioSecurityDevice, 'kind' | 'state'>): IconSvgElement {
  switch (d.kind) {
    case 'lock':
      return d.state === 'locked' ? SquareLock02Icon : SquareUnlock02Icon;
    case 'garage':
      return GarageIcon;
    case 'siren':
      return Megaphone01Icon;
    case 'door':
    case 'window':
      return DoorIcon;
    case 'motion':
      return Motion01Icon;
    case 'smoke':
      return FireIcon;
    case 'leak':
      return DropletIcon;
  }
}

export function deviceGroupLabel(kind: StudioDeviceKind): string {
  switch (kind) {
    case 'lock':
      return 'Locks';
    case 'garage':
      return 'Garages & gates';
    case 'siren':
      return 'Sirens';
    case 'door':
    case 'window':
      return 'Doors & windows';
    case 'motion':
      return 'Motion sensors';
    case 'smoke':
    case 'leak':
      return 'Hazards';
  }
}

export function TipIconBtn({
  label,
  icon,
  onPress,
  variant = 'tertiary',
  size = 'sm',
  className
}: {
  label: string;
  icon: IconSvgElement;
  onPress: () => void;
  variant?: 'ghost' | 'secondary' | 'tertiary' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <Tooltip delay={0}>
      <Button
        isIconOnly
        size={size}
        variant={variant}
        aria-label={label}
        onPress={onPress}
        className={className}
      >
        <HugeiconsIcon icon={icon} size={15} />
      </Button>
      <Tooltip.Content placement="top">{label}</Tooltip.Content>
    </Tooltip>
  );
}

/**
 * Clean architectural SVG camera preview frame (zero external URLs, zero text overlaid on picture
 * per DESIGN.md 7.5 — captions always sit below the viewport!).
 */
export function MockCameraViewport({
  cam,
  aspect = 'video',
  className
}: {
  cam: StudioCamera;
  aspect?: 'video' | 'thumb';
  className?: string;
}) {
  const isOffline = cam.status === 'offline';
  const palette: Record<StudioCamera['scene'], [string, string, string]> = {
    driveway: ['#141e30', '#243b55', '#3b82f6'],
    front_door: ['#1f1c2c', '#3c3454', '#a855f7'],
    garden: ['#0f2027', '#203a43', '#22c55e'],
    living: ['#1e1b24', '#2d2638', '#f59e0b']
  };
  const [bgA, bgB, glow] = palette[cam.scene];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl bg-black/85',
        aspect === 'video' ? 'aspect-video' : 'aspect-[16/10]',
        cam.motion && 'ring-2 ring-[var(--warning)]',
        className
      )}
      role="img"
      aria-label={`${cam.name} camera feed (${cam.status})`}
    >
      {isOffline ? (
        <div className="flex size-full flex-col items-center justify-center gap-1.5 bg-default/70 text-muted">
          <HugeiconsIcon icon={VideoOffIcon} size={aspect === 'video' ? 28 : 18} className="text-danger" />
          {aspect === 'video' ? <span className="text-xs font-medium">Camera offline</span> : null}
        </div>
      ) : (
        <svg viewBox="0 0 320 180" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id={`cam-bg-${cam.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={bgA} />
              <stop offset="100%" stopColor={bgB} />
            </linearGradient>
            <radialGradient id={`cam-glow-${cam.id}`} cx="50%" cy="62%" r="48%">
              <stop offset="0%" stopColor={glow} stopOpacity="0.34" />
              <stop offset="100%" stopColor={glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill={`url(#cam-bg-${cam.id})`} />
          <rect width="320" height="180" fill={`url(#cam-glow-${cam.id})`} />

          {/* Perspective architectural ground & horizon */}
          <line x1="0" y1="108" x2="320" y2="108" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          {cam.scene === 'driveway' ? (
            <>
              <polygon points="80,180 132,108 188,108 240,180" fill="rgba(255,255,255,0.07)" />
              <rect x="28" y="64" width="76" height="44" rx="4" fill="rgba(255,255,255,0.08)" />
              <rect x="44" y="76" width="44" height="32" rx="2" fill="rgba(255,255,255,0.06)" />
              {cam.motion ? (
                <rect x="132" y="114" width="66" height="36" rx="6" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" />
              ) : null}
            </>
          ) : cam.scene === 'front_door' ? (
            <>
              <rect x="122" y="42" width="76" height="106" rx="4" fill="rgba(255,255,255,0.09)" />
              <circle cx="184" cy="98" r="3" fill="rgba(255,255,255,0.45)" />
              <polygon points="60,180 108,148 212,148 260,180" fill="rgba(255,255,255,0.06)" />
              {cam.aiDetections.includes('package') ? (
                <rect x="196" y="132" width="22" height="18" rx="2" fill="#d97706" fillOpacity="0.85" stroke="#fef3c7" strokeWidth="1" />
              ) : null}
            </>
          ) : cam.scene === 'garden' ? (
            <>
              <path d="M0 112 Q80 86 160 104 T320 96 L320 180 L0 180 Z" fill="rgba(34,197,94,0.12)" />
              <line x1="20" y1="84" x2="300" y2="84" stroke="rgba(255,255,255,0.16)" strokeWidth="2" strokeDasharray="8 6" />
              {cam.motion ? (
                <rect x="184" y="78" width="42" height="68" rx="6" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" />
              ) : null}
            </>
          ) : (
            <>
              <rect x="44" y="74" width="110" height="58" rx="6" fill="rgba(255,255,255,0.07)" />
              <rect x="190" y="96" width="84" height="36" rx="6" fill="rgba(255,255,255,0.06)" />
            </>
          )}

          {/* Subtle corner lens reticle marks (non-text) */}
          <path d="M14 22 V14 H22 M306 22 V14 H298 M14 158 V166 H22 M306 158 V166 H298" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        </svg>
      )}
    </div>
  );
}

export function CameraBadgeIcon() {
  return <HugeiconsIcon icon={Camera01Icon} size={14} />;
}
