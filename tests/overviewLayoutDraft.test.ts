import { beforeEach, describe, expect, it } from 'vitest';
import { buildDefaultDeviceLayout } from '@/pro/lib/overviewLayout';
import { useOverviewLayoutDraft } from '@/pro/store/useOverviewLayoutDraft';
import { WIDGET_LAYOUT_INFO } from '@/pro/widgets/registry';

describe('overview layout draft', () => {
  beforeEach(() => useOverviewLayoutDraft.getState().end());

  it('edits a copy and leaves the saved layout alone until Save', () => {
    const saved = buildDefaultDeviceLayout(WIDGET_LAYOUT_INFO, 'tablet');
    const { begin, update } = useOverviewLayoutDraft.getState();
    begin('tablet', saved);
    update((l) => ({ ...l, collapsed: ['lights'] }));
    expect(useOverviewLayoutDraft.getState().draft?.collapsed).toEqual(['lights']);
    expect(saved.collapsed).toEqual([]);
    expect(useOverviewLayoutDraft.getState().device).toBe('tablet');
  });

  it('cancel throws the draft away; update without a draft does nothing', () => {
    const { begin, update, end } = useOverviewLayoutDraft.getState();
    update((l) => ({ ...l, hidden: ['lights'] }));
    expect(useOverviewLayoutDraft.getState().draft).toBeNull();
    begin('phone', buildDefaultDeviceLayout(WIDGET_LAYOUT_INFO, 'phone'));
    end();
    expect(useOverviewLayoutDraft.getState()).toMatchObject({ draft: null, device: null });
  });
});
