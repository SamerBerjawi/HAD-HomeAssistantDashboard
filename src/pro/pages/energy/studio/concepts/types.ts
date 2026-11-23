/** Shared prop contracts for every Energy Studio & production Energy section component. */
import type { CustomRangePresetId, StudioEnergySnapshot, StudioPeriod } from '../../../../lib/energyPage';

export interface StudioSectionActions {
  onPeriod: (period: StudioPeriod) => void;
  onShiftDate: (direction: -1 | 1) => void;
  onToggleCompare: () => void;
  onCompareYear: (year: number) => void;
  onOpenCustomize: () => void;
  onRefresh: () => void;
  onCustomPreset?: (preset: CustomRangePresetId) => void;
  activePreset?: CustomRangePresetId | null;
  isFetching?: boolean;
  isCompareLoading?: boolean;
}

export interface SectionConceptProps {
  snap: StudioEnergySnapshot;
  actions: StudioSectionActions;
  /** True when preview content width is phone-sized (< 600 px). */
  compact?: boolean;
}
