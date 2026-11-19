import { Drawer, Modal } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ProSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon: IconSvgElement;
  /** Page id for the accent (portaled overlays need the `pro` class and data-page again). */
  page: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/** HeroUI Drawer from the bottom on phones, HeroUI Modal from 768 px up (DESIGN.md 7.5, PIN). */
export function ProSheet({ isOpen, onOpenChange, title, subtitle, icon, page, size = 'sm', children }: ProSheetProps) {
  const desktop = useMediaQuery('(min-width: 768px)');
  const heading = (
    <span className="inline-flex items-center gap-2.5 text-lg font-semibold">
      <span className="pro-soft grid size-8 shrink-0 place-items-center rounded-xl">
        <HugeiconsIcon icon={icon} size={18} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate leading-tight">{title}</span>
        {subtitle ? <span className="truncate text-xs font-normal text-muted">{subtitle}</span> : null}
      </span>
    </span>
  );

  if (desktop) {
    return (
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size={size}>
          <Modal.Dialog
            aria-label={title}
            className={cn('pro', size === 'lg' && 'sm:w-[40rem] sm:max-w-2xl')}
            data-page={page}
          >
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{heading}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    );
  }

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog aria-label={title} className="pro pb-[max(16px,env(safe-area-inset-bottom))]" data-page={page}>
          <Drawer.Handle />
          <Drawer.Body className="flex flex-col gap-4 px-4 pt-2">
            {heading}
            {children}
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
