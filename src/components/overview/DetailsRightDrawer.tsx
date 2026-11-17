/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DetailsRightDrawer: details panel on the HeroUI Drawer (react-aria: focus trap, Escape,
 * backdrop dismiss, scroll lock). Slides from the right on desktop and is a full-height panel on phones.
 */

import React from 'react';
import { Drawer } from '@heroui/react';

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
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Content placement="right">
        <Drawer.Dialog aria-label={title} className="w-full max-w-md sm:max-w-lg">
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading className="flex min-w-0 items-center gap-3">
              {icon && <span className="flex size-10 shrink-0 items-center justify-center">{icon}</span>}
              <span className="min-w-0 truncate">{title}</span>
            </Drawer.Heading>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </Drawer.Header>
          <Drawer.Body className="space-y-4 pb-6">{children}</Drawer.Body>
          {footerActions && <Drawer.Footer>{footerActions}</Drawer.Footer>}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
