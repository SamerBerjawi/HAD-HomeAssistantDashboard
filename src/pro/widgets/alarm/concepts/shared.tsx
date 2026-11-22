/** Alarm pieces the concepts share: mode control (with the shared code and "arm anyway" dialogs). */
import { ProAlarmDialogs, useAlarmModeController } from '../../../components/overview/SecurityAlarmShared';
import type { ProOverviewAlarmModel } from '../../../lib/overviewSecurity';
import type { AlarmModeId } from '../../../lib/securityLogic';
import { useAlarmActions } from '../useAlarmActions';

export function useAlarm(model: ProOverviewAlarmModel) {
  const actions = useAlarmActions(model);
  const controller = useAlarmModeController(model, actions.executeMode);
  const quickTarget: AlarmModeId = model.isArmed || model.isTriggered || model.isTransitioning ? 'disarmed' : 'armed_home';
  const dialogs = (
    <ProAlarmDialogs
      model={model}
      confirmMode={controller.confirmMode}
      codeMode={controller.codeMode}
      codeError={controller.codeError}
      onConfirmArmAnyway={controller.confirmArmAnyway}
      onCancelConfirm={controller.cancelConfirm}
      onCancelCode={controller.cancelCode}
      onSubmitCode={controller.submitCode}
    />
  );
  return { actions, controller, quickTarget, dialogs };
}

/** "Sarah · 50 min ago", else the panel name. */
export const changedLine = (m: ProOverviewAlarmModel) => [m.changedBy, m.changedAgoText].filter(Boolean).join(' · ') || m.panelName;

/** Colours per state (D1: neutral when disarmed, status colours when armed or alarming). */
export function alarmColors(m: ProOverviewAlarmModel): { from: string; to: string } {
  if (m.isTriggered) return { from: 'hsl(0 80% 52%)', to: 'hsl(350 75% 30%)' };
  if (m.isTransitioning) return { from: 'hsl(38 92% 52%)', to: 'hsl(25 80% 34%)' };
  if (m.state === 'armed_away' || m.state === 'armed_vacation') return { from: 'hsl(232 45% 40%)', to: 'hsl(240 45% 18%)' };
  if (m.state === 'armed_night') return { from: 'hsl(255 35% 34%)', to: 'hsl(250 40% 14%)' };
  if (m.isArmed) return { from: 'hsl(160 50% 34%)', to: 'hsl(180 45% 16%)' };
  return { from: 'hsl(215 12% 42%)', to: 'hsl(220 14% 22%)' };
}
