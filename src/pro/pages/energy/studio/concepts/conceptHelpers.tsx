/**
 * Shared UI primitives, palettes, and icon helpers used across the 11 redesigned Energy Studio
 * concept files so every file stays compact and zero raw controls are needed.
 */
import { Button, Tooltip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Calendar01Icon,
  Calendar03Icon,
  Clock01Icon,
  SlidersHorizontalIcon
} from '@hugeicons/core-free-icons';
import type { CustomRangePresetId, StudioPeriod } from '../../../../lib/energyPage';

export const CUSTOM_PRESETS: readonly { id: CustomRangePresetId; label: string }[] = [
  { id: 'last7', label: 'Last 7D' },
  { id: 'last14', label: 'Last 14D' },
  { id: 'last30', label: 'Last 30D' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' }
];

export const SOURCE_TINT: Record<'solar' | 'battery' | 'grid' | 'idle', string> = {
  solar: '245, 168, 56',
  battery: '45, 190, 165',
  grid: '66, 153, 225',
  idle: '120, 130, 150'
};

export const PERIOD_OPTIONS: readonly {
  id: StudioPeriod;
  label: string;
  short: string;
  icon: IconSvgElement;
}[] = [
  { id: 'day', label: 'Day', short: '1D', icon: Clock01Icon },
  { id: 'week', label: 'Week', short: '1W', icon: Calendar01Icon },
  { id: 'month', label: 'Month', short: '1M', icon: Calendar03Icon },
  { id: 'year', label: 'Year', short: '1Y', icon: Calendar01Icon },
  { id: 'custom', label: 'Custom', short: 'Range', icon: SlidersHorizontalIcon }
];

export const DEVICE_PALETTE = [
  'oklch(0.72 0.16 52)',
  'oklch(0.65 0.15 190)',
  'oklch(0.63 0.17 254)',
  'oklch(0.66 0.16 148)',
  'oklch(0.64 0.18 320)',
  'oklch(0.68 0.14 95)'
] as const;

export function TipIconBtn({
  label,
  onPress,
  isDisabled,
  icon,
  variant = 'ghost',
  size = 'sm',
  className
}: {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  icon: IconSvgElement;
  variant?: 'ghost' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <Tooltip delay={0}>
      <Button
        isIconOnly
        size={size}
        variant={variant}
        isDisabled={isDisabled}
        aria-label={label}
        onPress={onPress}
        className={className}
      >
        <HugeiconsIcon icon={icon} size={16} />
      </Button>
      <Tooltip.Content placement="top">{label}</Tooltip.Content>
    </Tooltip>
  );
}

export function NoSectionData({
  icon,
  title,
  note
}: {
  icon: IconSvgElement;
  title: string;
  note: string;
}) {
  return (
    <div className="pro-surface flex items-center gap-3 p-4 text-sm text-muted">
      <span className="pro-soft grid size-9 shrink-0 place-items-center rounded-xl">
        <HugeiconsIcon icon={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{title} hidden in this home state</p>
        <p className="text-xs text-muted">{note}</p>
      </div>
    </div>
  );
}
