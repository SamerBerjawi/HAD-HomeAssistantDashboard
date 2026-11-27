import { PeopleCard } from './people-card';
import { LightingCard } from './lighting-card';

import { overviewWidgets } from './overview-cards';

const widgets = [
  { type: 'at-home-people-card', name: 'At Home People', description: 'See who is home and where others are.', card: PeopleCard, anchor: 'people-card' },
  { type: 'at-home-lighting-card', name: 'At Home Lighting', description: 'Control lights by room and adjust brightness.', card: LightingCard, anchor: 'lighting-card' },
  ...overviewWidgets,
];

const dashboard = window as Window & { customCards?: Record<string, unknown>[] };
const picker = dashboard.customCards ??= [];
for (const { type, name, description, card, anchor } of widgets) {
  if (!customElements.get(type)) customElements.define(type, card);
  if (!picker.some(entry => entry.type === type)) {
    picker.push({ type, name, description, preview: true, documentationURL: 'https://github.com/SamerBerjawi/at-home-cards#' + anchor });
  }
}
