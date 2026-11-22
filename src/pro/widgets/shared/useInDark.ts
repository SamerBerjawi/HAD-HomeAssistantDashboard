import { useCallback, useState } from 'react';

/**
 * Whether a box sits in a dark theme (`.dark` on any ancestor), read from the box itself so a
 * light preview next to a dark one (the studio) gets its own answer. Callback ref.
 */
export function useInDark<T extends HTMLElement>(): { ref: (node: T | null) => void; isDark: boolean } {
  const [isDark, setDark] = useState(false);
  const ref = useCallback((node: T | null) => {
    if (node) setDark(Boolean(node.closest('.dark')));
  }, []);
  return { ref, isDark };
}
