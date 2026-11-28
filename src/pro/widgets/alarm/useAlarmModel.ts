import { useMemo } from 'react';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { buildOverviewAlarmModel, type ProOverviewAlarmModel } from '../../lib/overviewSecurity';
import { classifyBinarySensorsCached } from '../sensors/sensorGroup';
import { useAllDomainEntities, useDomainEntities } from '../shared/entities';

/** Alarm panel (the chosen one, else an armed one, else the first), locks and open doors/windows. */
export function useAlarmModel(): ProOverviewAlarmModel {
  const alarms = useAllDomainEntities('alarm_control_panel');
  const locks = useAllDomainEntities('lock');
  const sensors = useDomainEntities('binary_sensor');
  const selected = useAutoLayoutStore((s) => s.selectedAlarmEntityId);
  return useMemo(() => {
    const { doorSensors, windowSensors } = classifyBinarySensorsCached(sensors);
    return buildOverviewAlarmModel({
      alarms,
      selectedAlarmEntityId: selected,
      openDoors: doorSensors.filter((d) => d.state === 'on'),
      openWindows: windowSensors.filter((w) => w.state === 'on'),
      locks
    });
  }, [alarms, locks, sensors, selected]);
}
