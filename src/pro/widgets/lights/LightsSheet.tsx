import type { ProControlDomainModel } from '../../lib/overviewControls';
import { ControlDetailSheet } from '../../components/overview/ControlDetailSheet';
import { useControlActions } from '../controls/useControlActions';
import type { WidgetSheetProps } from '../types';

/** Lights sheet: the current control sheet for now; rebuilt in Phase 3a. */
export default function LightsSheet({ model, onClose }: WidgetSheetProps<ProControlDomainModel>) {
  const actions = useControlActions(model);
  return (
    <ControlDetailSheet
      domain="lights"
      onClose={onClose}
      model={model}
      onToggleItem={actions.toggleItem}
      onToggleBatch={(on) => void actions.toggleAll(on)}
      onChangeBrightness={actions.setBrightness}
    />
  );
}
