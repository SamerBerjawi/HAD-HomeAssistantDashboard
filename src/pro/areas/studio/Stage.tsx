import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A themed stage: `.pro` with its own `.dark`, wearing the Rooms page accent. */
export function Stage({ dark, children, className }: { dark: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn(dark && 'dark')}>
      <div className={cn('pro rounded-2xl bg-[var(--background)] p-3 text-foreground', className)} data-page="rooms">
        {children}
      </div>
    </div>
  );
}
