import { describe, expect, it } from 'vitest';
import { slideProgress } from '@/pro/widgets/shared/useSlideToConfirm';

describe('slideProgress', () => {
  it('moves left along the rail and clamps to 0–1', () => {
    expect(slideProgress(0, -50, 100)).toBe(0.5);
    expect(slideProgress(0.5, -80, 100)).toBe(1);
    expect(slideProgress(0.2, 40, 100)).toBe(0);
  });

  it('can slide right instead, and ignores an unmeasured rail', () => {
    expect(slideProgress(0, 25, 100, 1)).toBe(0.25);
    expect(slideProgress(0.3, -10, 0)).toBe(0.3);
  });
});
