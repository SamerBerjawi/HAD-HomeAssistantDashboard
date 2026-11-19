/**
 * Pure builders for the pro Overview active status pills bar (docs/pro-ui/DESIGN.md 7.6).
 * Sorts hazards first, followed by openings, motion, armed alarm, people in known zones, and
 * active home devices/media. No React, no store.
 */
import type { ResolvedEntity } from '@/types';
import { alarmStateLabel } from './securityLogic';

export type PillTone = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export type OverviewPillKind =
  | 'smoke'
  | 'leak'
  | 'alarm'
  | 'doors'
  | 'windows'
  | 'motion'
  | 'person'
  | 'lights'
  | 'switches'
  | 'fans'
  | 'vacuums'
  | 'media';

export type OverviewDrawerTarget =
  | 'users'
  | 'lights'
  | 'switches'
  | 'fans'
  | 'doors'
  | 'windows'
  | 'alarm'
  | 'media'
  | 'motion'
  | 'leak'
  | 'smoke'
  | 'vacuums';

export interface OverviewPersonPillMeta {
  entityId: string;
  name: string;
  firstName: string;
  initials: string;
  entityPicture?: string | null;
  isHome: boolean;
  zoneName: string;
}

export interface OverviewStatusPill {
  id: string;
  kind: OverviewPillKind;
  target: OverviewDrawerTarget;
  label: string;
  badgeText: string;
  ariaLabel: string;
  tone: PillTone;
  person?: OverviewPersonPillMeta;
}

export interface OverviewPersonZoneEntry {
  entity: ResolvedEntity;
  isHome: boolean;
  zoneName: string;
}

export interface BuildOverviewPillsInput {
  activeSmoke: ResolvedEntity[];
  activeLeaks: ResolvedEntity[];
  alarmEntity?: ResolvedEntity;
  openDoors: ResolvedEntity[];
  openWindows: ResolvedEntity[];
  activeMotion: ResolvedEntity[];
  peopleInZones: OverviewPersonZoneEntry[];
  onLights: ResolvedEntity[];
  onSwitches: ResolvedEntity[];
  activeFans: ResolvedEntity[];
  cleaningVacuumsCount: number;
  playingMedia: ResolvedEntity[];
}

function truncate(value: string, max = 28): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function displayName(entity: ResolvedEntity): string {
  const friendly = typeof entity.attributes?.friendly_name === 'string' ? entity.attributes.friendly_name : '';
  return entity.name || friendly || entity.entity_id;
}

export function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function makePill(
  id: string,
  kind: OverviewPillKind,
  target: OverviewDrawerTarget,
  label: string,
  badgeText: string,
  tone: PillTone,
  person?: OverviewPersonPillMeta
): OverviewStatusPill {
  return {
    id,
    kind,
    target,
    label,
    badgeText,
    ariaLabel: `${label}: ${badgeText}`,
    tone,
    person
  };
}

export function buildOverviewStatusPills(input: BuildOverviewPillsInput): OverviewStatusPill[] {
  const pills: OverviewStatusPill[] = [];
  const alarmState = input.alarmEntity?.state;

  // 1-3: Hazards first (smoke, leak, triggered alarm)
  if (input.activeSmoke.length > 0) {
    pills.push(makePill('smoke', 'smoke', 'smoke', 'Smoke', `${input.activeSmoke.length} detected`, 'danger'));
  }

  if (input.activeLeaks.length > 0) {
    pills.push(
      makePill(
        'leak',
        'leak',
        'leak',
        input.activeLeaks.length === 1 ? 'Leak' : 'Leaks',
        `${input.activeLeaks.length} detected`,
        'danger'
      )
    );
  }

  if (alarmState === 'triggered') {
    pills.push(makePill('alarm', 'alarm', 'alarm', 'Alarm', 'Triggered', 'danger'));
  }

  // 4-6: Openings & motion
  if (input.openDoors.length > 0) {
    pills.push(
      makePill(
        'doors',
        'doors',
        'doors',
        input.openDoors.length === 1 ? 'Door' : 'Doors',
        `${input.openDoors.length} open`,
        'warning'
      )
    );
  }

  if (input.openWindows.length > 0) {
    pills.push(
      makePill(
        'windows',
        'windows',
        'windows',
        input.openWindows.length === 1 ? 'Window' : 'Windows',
        `${input.openWindows.length} open`,
        'warning'
      )
    );
  }

  if (input.activeMotion.length > 0) {
    pills.push(makePill('motion', 'motion', 'motion', 'Motion', `${input.activeMotion.length} active`, 'warning'));
  }

  // 7: Non-triggered active alarm states (arming/pending = orange, armed_* = green)
  if (alarmState && alarmState !== 'triggered') {
    if (alarmState === 'arming' || alarmState === 'pending' || alarmState === 'disarming') {
      pills.push(makePill('alarm', 'alarm', 'alarm', 'Alarm', alarmStateLabel(alarmState), 'warning'));
    } else if (alarmState.startsWith('armed')) {
      pills.push(makePill('alarm', 'alarm', 'alarm', 'Alarm', alarmStateLabel(alarmState), 'success'));
    }
  }

  // 8: People in Home or a known HA zone (Home first, then alphabetical)
  const sortedPeople = [...input.peopleInZones].sort(
    (a, b) => Number(b.isHome) - Number(a.isHome) || displayName(a.entity).localeCompare(displayName(b.entity))
  );
  for (const entry of sortedPeople) {
    const fullName = displayName(entry.entity);
    const firstName = fullName.trim().split(/\s+/)[0] || fullName;
    const badgeText = entry.isHome ? 'Home' : entry.zoneName || 'Zone';
    const entityPicture =
      typeof entry.entity.attributes?.entity_picture === 'string' ? entry.entity.attributes.entity_picture : null;
    pills.push(
      makePill(
        `person:${entry.entity.entity_id}`,
        'person',
        'users',
        firstName,
        badgeText,
        entry.isHome ? 'success' : 'accent',
        {
          entityId: entry.entity.entity_id,
          name: fullName,
          firstName,
          initials: personInitials(fullName),
          entityPicture,
          isHome: entry.isHome,
          zoneName: badgeText
        }
      )
    );
  }

  // 9-13: Active home controls & media
  if (input.onLights.length > 0) {
    pills.push(
      makePill(
        'lights',
        'lights',
        'lights',
        input.onLights.length === 1 ? 'Light' : 'Lights',
        `${input.onLights.length} on`,
        'warning'
      )
    );
  }

  if (input.onSwitches.length > 0) {
    pills.push(
      makePill(
        'switches',
        'switches',
        'switches',
        input.onSwitches.length === 1 ? 'Switch' : 'Switches',
        `${input.onSwitches.length} on`,
        'default'
      )
    );
  }

  if (input.activeFans.length > 0) {
    pills.push(
      makePill(
        'fans',
        'fans',
        'fans',
        input.activeFans.length === 1 ? 'Fan' : 'Fans',
        `${input.activeFans.length} on`,
        'accent'
      )
    );
  }

  if (input.cleaningVacuumsCount > 0) {
    pills.push(
      makePill(
        'vacuums',
        'vacuums',
        'vacuums',
        input.cleaningVacuumsCount === 1 ? 'Vacuum' : 'Vacuums',
        `${input.cleaningVacuumsCount} cleaning`,
        'accent'
      )
    );
  }

  if (input.playingMedia.length > 0) {
    const first = input.playingMedia[0];
    const mediaTitle =
      (typeof first.attributes?.media_title === 'string' && first.attributes.media_title) ||
      (typeof first.attributes?.app_name === 'string' && first.attributes.app_name) ||
      displayName(first) ||
      'Playing';
    const badgeText =
      input.playingMedia.length === 1 ? truncate(mediaTitle, 28) : `${input.playingMedia.length} playing`;
    pills.push(makePill('media', 'media', 'media', 'Media', badgeText, 'accent'));
  }

  return pills;
}
