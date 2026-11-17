import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  SidebarSimple,
} from "@phosphor-icons/react";

/** Navigation glyphs mirror in RTL; logos, media controls and trend arrows do not. */
const directionalIcons: ReadonlySet<unknown> = new Set([
  ArrowLeft, ArrowRight, CaretLeft, CaretRight, SidebarSimple,
]);

export function directionalIconClass(icon: unknown): string | undefined {
  return directionalIcons.has(icon) ? "rtl:rotate-180" : undefined;
}
