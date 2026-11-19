/**
 * AuthCard: the BoardUI Auth Card block, adapted for the HAD pro UI.
 *
 * Source: https://www.boardui.com/components/auth-card (registry item `auth-card`,
 * components/application/auth/auth-card.tsx), BoardUI free tier, MIT.
 *
 * What was kept: the card shell (400 px column, 24/32 px padding, rounded-3xl), the optional mark
 * above the title, the title + description heading with a configurable heading level, the form
 * first, then an "or" divider and the alternative actions, then a footer line, and a footnote
 * outside the card.
 * What changed: BoardUI's email/password/social/OTP internals are removed. The card is a slot
 * shell: the host passes the form as children, because HAD signs in against Home Assistant, not
 * with email. BoardUI tokens are replaced with HeroUI tokens (`.pro-surface`, `--foreground`,
 * `--muted`), there is no border (pro surfaces are borderless) and the divider is HeroUI Separator.
 * See docs/pro-ui/DESIGN.md, section 7.1.
 */
import type { ReactNode } from 'react';
import { Separator } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface AuthCardProps {
  /** Mark above the title: an app icon, a wordmark, anything. */
  logo?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Centre the mark and the heading. */
  centered?: boolean;
  /** Defaults to 1: on a sign-in screen the card is the page. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** The form. */
  children: ReactNode;
  /** Actions shown under an "or" divider, after the form. */
  alternatives?: ReactNode;
  dividerLabel?: ReactNode;
  /** A line at the bottom of the card. */
  footer?: ReactNode;
  /** Small print under the card, outside it. */
  footnote?: ReactNode;
  className?: string;
}

export function AuthCard({
  logo,
  title,
  description,
  centered = false,
  headingLevel = 1,
  children,
  alternatives,
  dividerLabel = 'or',
  footer,
  footnote,
  className
}: AuthCardProps) {
  const Heading = `h${headingLevel}` as const;

  const card = (
    <div className={cn('pro-surface flex w-full max-w-[400px] flex-col rounded-3xl p-6 sm:p-8', className)}>
      {logo ? <div className={cn('mb-5 flex', centered ? 'justify-center' : 'justify-start')}>{logo}</div> : null}

      <div className={cn('flex flex-col gap-1.5', centered && 'text-center')}>
        <Heading className="text-2xl font-semibold tracking-tight text-foreground">{title}</Heading>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>

      <div className="mt-6 flex flex-col gap-4">{children}</div>

      {alternatives ? (
        <>
          <div className="my-5 flex items-center gap-3" role="presentation">
            <Separator className="flex-1" />
            <span className="text-xs text-muted">{dividerLabel}</span>
            <Separator className="flex-1" />
          </div>
          <div className="flex flex-col gap-2.5">{alternatives}</div>
        </>
      ) : null}

      {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
    </div>
  );

  if (!footnote) return card;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {card}
      <p className="max-w-[400px] text-center text-xs text-muted">{footnote}</p>
    </div>
  );
}
