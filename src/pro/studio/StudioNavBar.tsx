/**
 * Shared top navigation bar rendered across every dev-only Design Studio so designers
 * can return to the main menu (?studio) or switch directly between page studios in one click.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Home01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { STUDIOS, studioUrl, type StudioId } from './studioRegistry';

interface StudioNavBarProps {
  current?: StudioId;
}

export function StudioNavBar({ current }: StudioNavBarProps) {
  const go = (url: string) => {
    window.location.assign(url);
  };

  const exitStudioUrl = window.location.pathname || '/overview';

  return (
    <nav
      aria-label="Design studios navigation"
      className="pro-surface flex flex-wrap items-center justify-between gap-2 px-3 py-2"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant={current ? 'ghost' : 'secondary'}
          className="gap-1.5 text-xs font-medium"
          onPress={() => go(studioUrl())}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          All Studios
        </Button>

        <span aria-hidden className="mx-1 hidden h-4 w-px bg-[var(--separator)] sm:inline-block" />

        <div className="flex flex-wrap items-center gap-1">
          {STUDIOS.map((s) => {
            const active = s.id === current;
            return (
              <Button
                key={s.id}
                size="sm"
                variant={active ? 'secondary' : 'ghost'}
                className={cn('gap-1.5 text-xs', active ? 'font-semibold' : 'text-muted')}
                aria-current={active ? 'page' : undefined}
                onPress={() => go(studioUrl(s.query as StudioId))}
              >
                <HugeiconsIcon icon={s.icon} size={14} />
                {s.shortTitle}
              </Button>
            );
          })}
        </div>
      </div>

      <Button size="sm" variant="tertiary" className="gap-1.5 text-xs" onPress={() => go(exitStudioUrl)}>
        <HugeiconsIcon icon={Home01Icon} size={14} />
        Back to dashboard
      </Button>
    </nav>
  );
}
