/**
 * Assembled Security page preview matching the agreed responsive structure:
 * - Phone (< 600 px): Alarm Hero pinned on top, followed by Kokonut SmoothTab tabs (Attention, Cameras, Activity, Devices)
 * - Tablet (600–999 px) & Desktop (>= 1000 px): One scrolling page (Alarm + Attention, Cameras + Activity, Device groups)
 */
import { useEffect, useMemo, useState } from 'react';
import { SmoothTab } from '../../../ui/kokonutui/SmoothTab';
import { SecurityStatesPreview } from './concepts/DeviceGroupsConcepts';
import { SECURITY_CATALOG, type SecurityConceptId } from './securityCatalog';
import {
  buildSecurityPhoneTabs,
  type SecurityPhoneTabId,
  type SecuritySectionId,
  type StudioSecurityAction,
  type StudioSecuritySnapshot
} from './studioSecurity';
import type { SecuritySectionPick } from './useSecurityPicks';

export type SecurityPagePreviewMode = SecurityConceptId | 'picks';

interface SecurityPagePreviewProps {
  mode: SecurityPagePreviewMode;
  snap: StudioSecuritySnapshot;
  dispatch: (action: StudioSecurityAction) => void;
  width: number;
  picks: Partial<Record<SecuritySectionId, SecuritySectionPick>>;
}

function renderSection(
  id: SecuritySectionId,
  mode: SecurityPagePreviewMode,
  snap: StudioSecuritySnapshot,
  dispatch: (action: StudioSecurityAction) => void,
  picks: Partial<Record<SecuritySectionId, SecuritySectionPick>>,
  compact: boolean
) {
  const entry = SECURITY_CATALOG.find((e) => e.id === id);
  if (!entry) return null;
  const pick = picks[id]?.concept;
  const conceptId: SecurityConceptId =
    mode !== 'picks' ? mode : pick === 'A' || pick === 'B' || pick === 'C' ? pick : entry.chosen;
  const concept = entry.concepts.find((c) => c.id === conceptId) ?? entry.concepts[0];
  const Comp = concept.Component;
  return <Comp snap={snap} dispatch={dispatch} compact={compact} />;
}

export function SecurityPagePreview({ mode, snap, dispatch, width, picks }: SecurityPagePreviewProps) {
  const isPhone = width < 600;
  const isDesktop = width >= 1000;

  const phoneTabs = useMemo(() => buildSecurityPhoneTabs(snap), [snap]);
  const [phoneTab, setPhoneTab] = useState<SecurityPhoneTabId>('attention');

  useEffect(() => {
    if (phoneTabs.length > 0 && !phoneTabs.some((t) => t.id === phoneTab)) {
      setPhoneTab(phoneTabs[0].id);
    }
  }, [phoneTab, phoneTabs]);

  if (snap.stateId === 'states') {
    return (
      <div style={{ width }}>
        <SecurityStatesPreview compact={isPhone} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" style={{ width }}>
      {isPhone ? (
        <>
          {renderSection('alarm', mode, snap, dispatch, picks, true)}
          {phoneTabs.length > 0 ? (
            <SmoothTab
              items={phoneTabs.map((t) => ({
                id: t.id,
                title: phoneTab === t.id ? t.title : '',
                ariaLabel: t.title,
                icon: t.icon,
                badge: t.badge,
                badgeTone: t.badgeTone
              }))}
              value={phoneTab}
              onChange={(id) => setPhoneTab(id as SecurityPhoneTabId)}
              label="Security sections"
              badges="always"
            />
          ) : null}
          <div>{renderSection(phoneTab, mode, snap, dispatch, picks, true)}</div>
        </>
      ) : isDesktop ? (
        <>
          <div className="grid grid-cols-12 items-stretch gap-4">
            <div className="col-span-8">{renderSection('alarm', mode, snap, dispatch, picks, false)}</div>
            <div className="col-span-4">{renderSection('attention', mode, snap, dispatch, picks, false)}</div>
          </div>
          <div className="grid grid-cols-12 items-start gap-4">
            <div className="col-span-8">{renderSection('cameras', mode, snap, dispatch, picks, false)}</div>
            <div className="col-span-4">{renderSection('activity', mode, snap, dispatch, picks, false)}</div>
          </div>
          <div>{renderSection('devices', mode, snap, dispatch, picks, false)}</div>
        </>
      ) : (
        <>
          {renderSection('alarm', mode, snap, dispatch, picks, false)}
          {renderSection('attention', mode, snap, dispatch, picks, false)}
          {renderSection('cameras', mode, snap, dispatch, picks, false)}
          {renderSection('activity', mode, snap, dispatch, picks, false)}
          {renderSection('devices', mode, snap, dispatch, picks, false)}
        </>
      )}
    </div>
  );
}
