/**
 * Siren tile (studio proposal, docs/pro-ui/SECURITY.md §8). No Area tile type exists for `siren.*`,
 * so this follows the security tile family (`Shell`, `IconDot`, the alarm colour): "Quiet" or
 * "Sounding". Sounding shows a full Silence button; quiet offers Test, press-and-hold only.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Megaphone01Icon, VolumeOffIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ALARM, BatteryNote, CALM, IconDot, Shell } from '../../areas/tiles/security/securityParts';
import { agoText, type TileSize } from '../../areas/tileTypes';
import { HoldButton } from '../../widgets/shared/HoldButton';
import type { SirenModel } from '../../lib/securityPage';

export function SirenTile({ e, size, onToggle }: { e: SirenModel; size: TileSize; onToggle: () => void }) {
  const hue = e.isOn ? ALARM : CALM;
  const button = e.isOn ? (
    <Button size="sm" variant="danger" className="h-9 w-full gap-1.5 rounded-full" onPress={onToggle}>
      <HugeiconsIcon icon={VolumeOffIcon} size={15} />
      Silence
    </Button>
  ) : (
    <HoldButton icon={Megaphone01Icon} label="Test" ariaLabel={`Test ${e.name}`} onConfirm={onToggle} isDisabled={!e.available} className="h-9 w-full rounded-full bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]" fillClassName="bg-[color-mix(in_oklab,var(--danger)_30%,transparent)]" />
  );
  return (
    <Shell
      size={size}
      label={e.name}
      name={e.name}
      className={cn(!e.available && 'pro-surface opacity-60', e.available && 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]')}
      style={e.available ? { background: `linear-gradient(160deg, color-mix(in srgb, ${hue} ${e.isOn ? 22 : 6}%, var(--surface)), var(--surface) 70%)` } : undefined}
      state={
        <span className={cn('font-semibold', size === 's' ? 'text-[22px]' : 'text-[24px]', e.isOn && 'animate-pulse')} style={{ color: e.isOn ? ALARM : undefined }}>
          {!e.available ? 'Offline' : e.isOn ? 'Sounding' : 'Quiet'}
        </span>
      }
      detail={
        <span className="flex flex-wrap items-center gap-x-2">
          {e.isOn ? `Since ${agoText(e.lastChanged).toLowerCase()}` : 'Tested ' + agoText(e.lastChanged).toLowerCase()}
          <BatteryNote battery={e.battery} />
        </span>
      }
      visual={(px) => (size === 'xs' || size === 'w' ? null : <IconDot icon={Megaphone01Icon} hue={hue} px={size === 's' ? 34 : Math.round(px * 0.45)} solid={e.isOn} />)}
      aside={size === 'xs' || size === 'w' ? button : undefined}
      strip={size === 's' || size === 't' || size === 'l' ? button : undefined}
    />
  );
}
