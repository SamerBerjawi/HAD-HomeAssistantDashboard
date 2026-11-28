import { createContext } from 'react';

/** Embedded dashboards can supply their own theme across shadow roots and portals. */
export const HostDarkMode = createContext<boolean | undefined>(undefined);
