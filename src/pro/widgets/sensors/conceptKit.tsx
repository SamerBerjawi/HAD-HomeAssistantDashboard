/**
 * Shared pieces for the Doors & windows, Safety and Motion concepts (WIDGET_DESIGN.md, Phase 3):
 * a mock sensor builder for studio states, the kind icon per sensor, and the empty state.
 */
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { AlarmSmokeIcon, DoorIcon, DropletIcon, Motion01Icon, SquareIcon } from '@hugeicons/core-free-icons';
import type { ResolvedEntity } from '@/types';
import type { ProOverviewSensorDomain, ProOverviewSensorItem } from '../../lib/overviewSecurity';
import { buildSensorDomainModels, buildSensorGroupModel, SENSOR_GROUP_DOMAINS, type SensorGroupKind, type SensorGroupModel } from './sensorGroup';

/** A mock binary sensor that changed `mins` minutes ago (studio states). */
export const mockSensor = (id: string, name: string, area: string, deviceClass: string, on: boolean, mins: number, state?: string) =>
  ({
    entity_id: `binary_sensor.${id}`,
    domain: 'binary_sensor',
    name,
    state: state ?? (on ? 'on' : 'off'),
    area_name: area,
    area: { name: area },
    last_changed: new Date(Date.now() - mins * 60000).toISOString(),
    attributes: { friendly_name: name, device_class: deviceClass }
  }) as unknown as ResolvedEntity;

export const buildGroup = (kind: SensorGroupKind, sensors: ResolvedEntity[]): SensorGroupModel => buildSensorGroupModel(kind, buildSensorDomainModels(SENSOR_GROUP_DOMAINS[kind], sensors));

const KIND_ICON: Record<ProOverviewSensorDomain, IconSvgElement> = {
  doors: DoorIcon,
  windows: SquareIcon,
  leak: DropletIcon,
  smoke: AlarmSmokeIcon,
  motion: Motion01Icon
};
export const sensorIcon = (i: Pick<ProOverviewSensorItem, 'domain'>) => KIND_ICON[i.domain];

/** "4m", "2h", "3d" since a change (short, for tight places). */
export function sinceShort(at: number | null, now = Date.now()): string {
  if (at === null) return '';
  const mins = Math.max(0, Math.round((now - at) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

export function NoSensors({ icon, text, className }: { icon: IconSvgElement; text: string; className?: string }) {
  return (
    <div className={className ?? 'flex h-full flex-col justify-end gap-1 p-3.5 text-muted'}>
      <HugeiconsIcon icon={icon} size={22} />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
