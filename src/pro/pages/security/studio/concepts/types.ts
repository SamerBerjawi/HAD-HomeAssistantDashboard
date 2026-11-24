/** Shared prop contract for every Security Studio section concept component. */
import type { StudioSecurityAction, StudioSecuritySnapshot } from '../studioSecurity';

export interface SecurityConceptProps {
  snap: StudioSecuritySnapshot;
  dispatch: (action: StudioSecurityAction) => void;
  /** True when preview width is phone-sized (< 600 px). */
  compact?: boolean;
}
