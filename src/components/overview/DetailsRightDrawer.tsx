/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DetailsRightDrawer: details panel on the BoardUI Drawer (react-aria: focus trap, Escape,
 * backdrop dismiss, scroll lock). Slides from the right on desktop and is a full-height panel on phones.
 */

import React from 'react';
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from '@/components/base/drawer/drawer';

interface DetailsRightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  /** @deprecated Theme comes from the `dark` class. */
  darkMode?: boolean;
}

export default function DetailsRightDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footerActions
}: DetailsRightDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      placement="end"
      size="lg"
      aria-label={title}
    >
      <DrawerHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            {icon && <span className="flex size-10 shrink-0 items-center justify-center">{icon}</span>}
            <span className="min-w-0 truncate">{title}</span>
          </span>
        }
        description={subtitle}
      />
      <DrawerBody className="space-y-4 pb-6">{children}</DrawerBody>
      {footerActions && <DrawerFooter>{footerActions}</DrawerFooter>}
    </Drawer>
  );
}
