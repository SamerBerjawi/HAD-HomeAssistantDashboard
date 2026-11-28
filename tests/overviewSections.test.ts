import { describe, expect, it } from 'vitest';
import { DEFAULT_OVERVIEW_SECTION_ORDER, OVERVIEW_SECTION_LABELS, sectionTab } from '@/pro/lib/overviewSections';
import { WIDGETS } from '@/pro/widgets/registry';

describe('overviewSections', () => {
  it('every section has a label and appears once in the default order', () => {
    expect(new Set(DEFAULT_OVERVIEW_SECTION_ORDER).size).toBe(DEFAULT_OVERVIEW_SECTION_ORDER.length);
    for (const s of DEFAULT_OVERVIEW_SECTION_ORDER) expect(OVERVIEW_SECTION_LABELS[s]).toBeTruthy();
  });

  it('every widget lives in a known section; People and Rooms map to an old tab icon', () => {
    for (const w of WIDGETS) expect(DEFAULT_OVERVIEW_SECTION_ORDER).toContain(w.section);
    expect(sectionTab('people')).toBe('security');
    expect(sectionTab('rooms')).toBe('climate');
    expect(sectionTab('lights')).toBe('lights');
  });
});
