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
}

export const PageHeaderContext = createContext<(meta: PageHeaderMeta) => void>(() => {});

/** Called by a pro page to set its header ⋮ menu; cleared when the page unmounts. The subtitle
 * comes from src/pro/components/PageSentence.tsx. */
export function useProPageHeader({ menu }: PageHeaderMeta) {
  const setMeta = useContext(PageHeaderContext);
  useEffect(() => {
    setMeta({ menu });
  }, [setMeta, menu]);
  useEffect(() => () => setMeta({}), [setMeta]);
}
