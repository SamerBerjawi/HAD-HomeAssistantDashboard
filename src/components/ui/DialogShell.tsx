import React from 'react';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';

interface DialogShellProps {
  /** Accessible name of the dialog */
  label: string;
  onClose: () => void;
  /** Classes for the full-screen scrim */
  overlayClassName?: string;
  /** Classes for the dialog card */
  className?: string;
  /** `alertdialog` for emergencies that need an answer. */
  role?: 'dialog' | 'alertdialog';
  /** Backdrop press and Escape close it. Turn off for dialogs that must be acknowledged. */
  dismissable?: boolean;
  children: React.ReactNode;
}

/**
 * Overlay + card for conditionally rendered inline modals (UI-002), on react-aria's
 * ModalOverlay: focus trap, focus restore, Escape, backdrop press and scroll lock come from the
 * library. Render it only while the modal is open. The caller owns the look through the class props.
 */
export default function DialogShell({
  label,
  onClose,
  overlayClassName = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs',
  className,
  role = 'dialog',
  dismissable = true,
  children
}: DialogShellProps) {
  return (
    <ModalOverlay
      isOpen
      isDismissable={dismissable}
      isKeyboardDismissDisabled={!dismissable}
      onOpenChange={(open) => { if (!open) onClose(); }}
      className={overlayClassName}
    >
      <Modal className="contents">
        <Dialog role={role} aria-label={label} className={`${className ?? ''} outline-none`}>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
