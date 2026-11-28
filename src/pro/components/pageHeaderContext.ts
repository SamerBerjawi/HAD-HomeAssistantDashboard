import { createContext, useContext, useEffect } from 'react';
import type { IconSvgElement } from '@hugeicons/react';

export interface PageMenuItem {
  id: string;
  label: string;
  icon: IconSvgElement;
  onAction: () => void;
  danger?: boolean;
}

/** What a page contributes to the shared header (docs/pro-ui/DESIGN.md 7.4). */
export interface PageHeaderMeta {
  /** Items for the ⋮ menu. Pass a memoised array; no ⋮ when empty. */
  menu?: PageMenuItem[];
  /** Hide the shared outer page header (used on mobile/focused room drill-down views). */
  hideHeader?: boolean;
}

export const PageHeaderContext = createContext<(meta: PageHeaderMeta) => void>(() => {});
export const ShellNotificationsContext = createContext<(() => void) | null>(null);

export function useOpenNotifications() {
  return useContext(ShellNotificationsContext);
}

/** Called by a pro page to set its header ⋮ menu; cleared when the page unmounts. The subtitle
 * comes from src/pro/components/PageSentence.tsx. */
export function useProPageHeader({ menu, hideHeader }: PageHeaderMeta) {
  const setMeta = useContext(PageHeaderContext);
  useEffect(() => {
    setMeta({ menu, hideHeader });
  }, [setMeta, menu, hideHeader]);
  useEffect(() => () => setMeta({}), [setMeta]);
}
