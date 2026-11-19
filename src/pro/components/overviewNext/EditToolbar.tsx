import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DashboardSquareEditIcon, PlusSignIcon } from '@hugeicons/core-free-icons';

interface EditToolbarProps {
  isEditing: boolean;
  isDirty: boolean;
  hiddenCount: number;
  onBegin: () => void;
  onAddWidgets: () => void;
  onReset: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/** Customize → Add widgets / Reset / Cancel / Save (rebuild, Phase 2). Nothing is saved before Save. */
export function EditToolbar({ isEditing, isDirty, hiddenCount, onBegin, onAddWidgets, onReset, onCancel, onSave }: EditToolbarProps) {
  if (!isEditing) {
    return (
      <Button size="sm" variant="tertiary" onPress={onBegin}>
        <HugeiconsIcon icon={DashboardSquareEditIcon} size={16} />
        Customize
      </Button>
    );
  }
  return (
    <div role="toolbar" aria-label="Customize Overview" className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="tertiary" onPress={onAddWidgets}>
        <HugeiconsIcon icon={PlusSignIcon} size={16} />
        Add widgets{hiddenCount > 0 ? ` (${hiddenCount})` : ''}
      </Button>
      <Button size="sm" variant="ghost" onPress={onReset}>
        Reset
      </Button>
      <Button size="sm" variant="ghost" onPress={onCancel}>
        Cancel
      </Button>
      <Button size="sm" variant="primary" onPress={onSave} isDisabled={!isDirty}>
        Save
      </Button>
    </div>
  );
}
