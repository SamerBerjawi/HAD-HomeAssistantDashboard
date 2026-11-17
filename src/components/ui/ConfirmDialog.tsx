/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * One confirmation dialog for the app (UI-012), built on the BoardUI Modal
 * (react-aria: focus trap, focus restore, Escape and aria wiring).
 */

import React, { useState } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/base/modal/modal';
import { Button } from '@/components/base/buttons/button';

export type ConfirmTone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Only `rose` is visually distinct (destructive); other tones use the default style. */
  tone?: ConfirmTone;
  /** Custom icon element. When omitted the header shows the default warning icon. */
  icon?: React.ReactNode;
  confirmIcon?: React.ReactNode;
  /** Small mono caption under the title, e.g. an entity name */
  subtitle?: string;
  /** @deprecated Theme comes from the `dark` class; kept so existing callers compile. */
  darkMode?: boolean;
  /** Extra content between the description and the buttons */
  children?: React.ReactNode;
  /** Controlled loading state; the dialog also tracks its own while onConfirm runs */
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'cyan',
  icon,
  confirmIcon,
  subtitle,
  children,
  isLoading = false
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const disabled = busy || isLoading;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error('[ConfirmDialog] Action failed:', err);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={(next) => { if (!next && !disabled) onClose(); }}
      isDismissable={!disabled}
      isKeyboardDismissDisabled={disabled}
      size="sm"
      aria-label={title}
    >
      <ModalHeader
        title={title}
        description={description}
        tone={tone === 'rose' ? 'danger' : 'default'}
        showCloseButton={false}
      >
        {subtitle && (
          <p className="mt-1 max-w-full truncate font-mono text-caption-1-semibold text-text-tertiary">{subtitle}</p>
        )}
      </ModalHeader>
      {(icon || children) && (
        <ModalBody>
          {icon && <div className="mb-3 flex items-center">{icon}</div>}
          {children}
        </ModalBody>
      )}
      <ModalFooter>
        <Button variant="secondary" autoFocus disabled={disabled} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'rose' ? 'danger' : 'primary'}
          disabled={disabled}
          onClick={handleConfirm}
        >
          <span className="inline-flex items-center gap-1.5">
            {!disabled && confirmIcon}
            {disabled ? 'Working…' : confirmLabel}
          </span>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
