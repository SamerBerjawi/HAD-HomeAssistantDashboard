/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * One confirmation dialog for the app (UI-012), built on the HeroUI Modal
 * (react-aria: focus trap, focus restore, Escape and aria wiring).
 */

import React, { useState } from 'react';
import { Button, Modal } from '@heroui/react';
import { WarningCircle } from '@phosphor-icons/react';

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

  const danger = tone === 'rose';

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(next) => { if (!next && !disabled) onClose(); }}
      isDismissable={!disabled}
      isKeyboardDismissDisabled={disabled}
    >
      <Modal.Container size="xs">
        <Modal.Dialog aria-label={title}>
          <Modal.Header>
            {danger && (
              <Modal.Icon className="bg-danger-soft text-danger">
                <WarningCircle size={20} weight="fill" />
              </Modal.Icon>
            )}
            <Modal.Heading>{title}</Modal.Heading>
            {subtitle && (
              <p className="max-w-full truncate font-mono text-xs font-semibold text-muted">{subtitle}</p>
            )}
            {description && <div className="text-sm text-muted">{description}</div>}
          </Modal.Header>
          {(icon || children) && (
            <Modal.Body>
              {icon && <div className="mb-3 flex items-center">{icon}</div>}
              {children}
            </Modal.Body>
          )}
          <Modal.Footer>
            <Button variant="secondary" autoFocus isDisabled={disabled} onPress={onClose}>
              {cancelLabel}
            </Button>
            <Button variant={danger ? 'danger' : 'primary'} isDisabled={disabled} onPress={handleConfirm}>
              <span className="inline-flex items-center gap-1.5">
                {!disabled && confirmIcon}
                {disabled ? 'Working…' : confirmLabel}
              </span>
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
