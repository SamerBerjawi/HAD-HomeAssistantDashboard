/**
 * HAD Design Studio Main Menu (/overview?studio). Dev only.
 * Central hub linking to Widgets, Areas, Rooms, Energy, and any future page studios.
 */
import { useEffect } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Home01Icon, PaintBoardIcon, SparklesIcon } from '@hugeicons/core-free-icons';
import { STUDIOS, studioUrl, type StudioId } from './studioRegistry';

export default function StudioHub() {
  // Keep studio chrome light and predictable; individual studios manage preview light/dark stages.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  const open = (url: string) => {
    window.location.assign(url);
  };

  const exitStudioUrl = window.location.pathname || '/overview';

  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="overview">
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="pro-soft grid size-12 shrink-0 place-items-center rounded-2xl">
              <HugeiconsIcon icon={PaintBoardIcon} size={24} />
            </span>
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">HAD Design Studio</h1>
                <Chip size="sm" variant="soft" color="accent">
                  <HugeiconsIcon icon={SparklesIcon} size={12} />
                  <Chip.Label>Dev Sandbox</Chip.Label>
                </Chip>
              </div>
              <p className="mt-1 text-sm text-muted">
                Main menu for comparing Pro UI visual concepts on realistic mock states across phone, tablet, and desktop before shipping changes to Home Assistant Dashboard.
              </p>
            </div>
          </div>

          <Button size="sm" variant="tertiary" className="gap-1.5" onPress={() => open(exitStudioUrl)}>
            <HugeiconsIcon icon={Home01Icon} size={15} />
            Back to dashboard
          </Button>
        </header>

        <section aria-label="Available studios" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {STUDIOS.map((s) => (
            <article
              key={s.id}
              data-page={s.pageAccent}
              className="pro pro-surface flex flex-col justify-between gap-4 p-5"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="pro-soft grid size-11 shrink-0 place-items-center rounded-2xl">
                      <HugeiconsIcon icon={s.icon} size={21} />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold leading-tight text-foreground">{s.title}</h2>
                      <span className="text-xs text-muted">{studioUrl(s.query as StudioId)}</span>
                    </div>
                  </div>
                  <Chip size="sm" variant="soft" color={s.statusTone}>
                    <Chip.Label>{s.status}</Chip.Label>
                  </Chip>
                </div>

                <p className="text-sm leading-relaxed text-muted">{s.subtitle}</p>

                <div className="flex flex-wrap gap-1.5">
                  {s.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-lg bg-default/70 px-2.5 py-1 text-[11px] font-medium text-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_7%,transparent)] pt-3">
                <span className="text-xs text-muted">Page accent: {s.pageAccent}</span>
                <Button
                  size="sm"
                  variant="primary"
                  className="gap-1.5"
                  onPress={() => open(studioUrl(s.query as StudioId))}
                >
                  Open {s.shortTitle}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Button>
              </div>
            </article>
          ))}
        </section>

        <footer className="pro-surface flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-muted">
          <span>
            New page studios register automatically in this hub when added to <code className="font-mono text-foreground">studioRegistry.ts</code>.
          </span>
          <span>Dev builds only — excluded from production bundles.</span>
        </footer>
      </main>
    </div>
  );
}
