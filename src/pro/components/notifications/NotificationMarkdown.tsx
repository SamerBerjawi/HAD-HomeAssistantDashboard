import { Fragment, type ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { LinkSquare02Icon } from '@hugeicons/core-free-icons';
import { cn, sanitizeSafeUrl } from '@/lib/utils';

/** Inline Markdown: links, bold, code. Images are dropped (HA messages rarely need them here). */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  const clean = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  while ((m = re.exec(clean)) !== null) {
    if (m.index > last) out.push(clean.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1]) {
      const href = sanitizeSafeUrl(m[2]);
      out.push(
        href && href !== '#' ? (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-[var(--accent)] underline-offset-2 hover:underline">
            {m[1]}
            <HugeiconsIcon icon={LinkSquare02Icon} size={12} />
          </a>
        ) : (
          m[1]
        )
      );
    } else if (m[3]) out.push(<strong key={k} className="font-semibold">{m[3]}</strong>);
    else if (m[4]) out.push(<code key={k} className="rounded bg-default px-1 font-mono text-[0.85em]">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < clean.length) out.push(clean.slice(last));
  return out;
}

/**
 * Small Markdown renderer for HA notification messages and release notes (DESIGN.md 7.7):
 * headings, paragraphs, bullet lists, links (sanitised), bold and code.
 */
export function NotificationMarkdown({ content, className }: { content: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let list: ReactNode[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(' '), `p${blocks.length}`)}</p>);
    para = [];
  };
  const flushList = () => {
    if (list.length)
      blocks.push(
        <ul key={`u${blocks.length}`} className="ml-4 list-disc space-y-0.5">
          {list}
        </ul>
      );
    list = [];
  };
  content.split('\n').forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      return;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      blocks.push(
        <p key={`h${idx}`} className="pt-1 font-semibold">
          {inline(heading[1], `h${idx}`)}
        </p>
      );
    } else if (bullet) {
      flushPara();
      list.push(<li key={`l${idx}`}>{inline(bullet[1], `l${idx}`)}</li>);
    } else {
      flushList();
      para.push(line);
    }
  });
  flushPara();
  flushList();
  return <div className={cn('flex flex-col gap-2 text-sm leading-relaxed text-foreground/85 [overflow-wrap:anywhere]', className)}>{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
