/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldWarning, Lightning, Timer, HourglassMedium, CaretRight } from '@phosphor-icons/react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/base/modal/modal';
import { Button } from '@/components/base/buttons/button';

interface ArmAwayConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (delaySeconds: number) => void;
  alarmName?: string;
  /** @deprecated Theme comes from the `dark` class. */
  darkMode?: boolean;
}

const OPTIONS = [
  { seconds: 0, label: 'Arm Right Away', hint: 'Instant arming • No exit delay', Icon: Lightning, badge: '0s', primary: true },
  { seconds: 30, label: 'Delay 30 Seconds', hint: 'Standard grace period to exit & lock', Icon: Timer, badge: '30s', primary: false },
  { seconds: 60, label: 'Delay 1 Minute', hint: 'Extended delay for garage or family exit', Icon: HourglassMedium, badge: '60s', primary: false },
] as const;

export default function ArmAwayConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  alarmName = 'Security Guard'
}: ArmAwayConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      size="sm"
      aria-label="Confirm arm away"
      overlayClassName="z-[99999]"
    >
      <ModalHeader
        title="Arm Alarm (Away)"
        description={`All exterior perimeter sensors and interior motion detectors will be armed on ${alarmName}.`}
        icon={ShieldWarning}
        tone="danger"
      />
      <ModalBody>
        <div className="space-y-2.5 py-2">
          {OPTIONS.map(({ seconds, label, hint, Icon, badge, primary }) => (
            <button
              key={seconds}
              type="button"
              onClick={() => onConfirm(seconds)}
              className={`group flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 ${
                primary
                  ? 'bg-button-danger text-text-white hover:opacity-90'
                  : 'border border-border-button-default bg-background-primary-default text-text-primary hover:bg-background-primary-hover'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${primary ? 'bg-white/20' : 'bg-rose-500/15 text-rose-500'}`}>
                  <Icon size={20} weight={primary ? 'fill' : 'duotone'} />
                </span>
                <span>
                  <span className="block text-body-medium">{label}</span>
                  <span className={`block text-caption-1-regular ${primary ? 'text-white/80' : 'text-text-tertiary'}`}>{hint}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className={`rounded-full px-2 py-0.5 text-caption-1-semibold ${primary ? 'bg-white/20' : 'bg-background-primary-hover'}`}>{badge}</span>
                {!primary && <CaretRight size={14} weight="bold" className="text-text-tertiary transition-transform group-hover:translate-x-0.5" />}
              </span>
            </button>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
}
