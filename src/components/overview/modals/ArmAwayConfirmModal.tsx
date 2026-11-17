/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldWarning, Lightning, Timer, HourglassMedium, CaretRight } from '@phosphor-icons/react';
import { Button, Modal } from '@heroui/react';

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
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} className="z-[99999]">
      <Modal.Container size="xs">
        <Modal.Dialog aria-label="Confirm arm away">
          <Modal.Header>
            <Modal.Icon className="bg-danger-soft text-danger">
              <ShieldWarning size={20} weight="fill" />
            </Modal.Icon>
            <Modal.Heading>Arm Alarm (Away)</Modal.Heading>
            <p className="text-sm text-muted">
              {`All exterior perimeter sensors and interior motion detectors will be armed on ${alarmName}.`}
            </p>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-2.5 py-2">
              {OPTIONS.map(({ seconds, label, hint, Icon, badge, primary }) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => onConfirm(seconds)}
                  className={`group flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                    primary
                      ? 'bg-danger text-danger-foreground hover:opacity-90'
                      : 'bg-default text-foreground hover:bg-default-hover'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${primary ? 'bg-white/20' : 'bg-rose-500/15 text-rose-500'}`}>
                      <Icon size={20} weight={primary ? 'fill' : 'duotone'} />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className={`block text-xs ${primary ? 'text-white/80' : 'text-muted'}`}>{hint}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${primary ? 'bg-white/20' : 'bg-foreground/10'}`}>{badge}</span>
                    {!primary && <CaretRight size={14} weight="bold" className="text-muted transition-transform group-hover:translate-x-0.5" />}
                  </span>
                </button>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={onClose}>Cancel</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
