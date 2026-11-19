/** Demo/test model for the Lights widget: 10 lights, 8 on (matches the demo home). */
import type { ResolvedEntity } from '@/types';
import { buildControlDomainModel } from '../../lib/overviewControls';

const light = (id: string, name: string, area: string, on: boolean, brightness?: number) =>
  ({
    entity_id: `light.${id}`,
    domain: 'light',
    name,
    state: on ? 'on' : 'off',
    area_name: area,
    attributes: { friendly_name: name, supported_color_modes: ['brightness'], ...(on && brightness ? { brightness: Math.round((brightness / 100) * 255) } : {}) }
  }) as unknown as ResolvedEntity;

export const LIGHTS_FIXTURE_ENTITIES: ResolvedEntity[] = [
  light('living_ceiling', 'Living Room Ceiling', 'Living Room', true, 80),
  light('living_lamp', 'Living Room Lamp', 'Living Room', true, 45),
  light('kitchen_island', 'Kitchen Island', 'Kitchen', true, 100),
  light('kitchen_under', 'Kitchen Under Cabinet', 'Kitchen', true, 60),
  light('office_desk', 'Office Desk', 'Office', true, 70),
  light('hall', 'Hallway', 'Hallway', true, 30),
  light('porch', 'Porch', 'Outside', true, 100),
  light('garden', 'Garden Path', 'Outside', true, 50),
  light('bedroom', 'Bedroom Ceiling', 'Master Bedroom', false),
  light('guest', 'Guest Bedroom', 'Guest Bedroom', false)
];

export const LIGHTS_FIXTURE = buildControlDomainModel('lights', LIGHTS_FIXTURE_ENTITIES);
