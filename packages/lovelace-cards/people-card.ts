import { personInitials } from '../../src/pro/lib/overviewPills';
import { presenceWarmth } from '../../src/pro/lib/presencePortraits';
import css from './people-card.css';

const tag = 'at-home-people-card';
const domains = ['person', 'device_tracker'];
const trackedEntity = /^(person|device_tracker)\.[a-z0-9_]+$/;

interface PeopleConfig {
  title?: string;
  entities?: string[];
}

interface EntityState {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    entity_picture?: string;
  };
}

interface HomeAssistant {
  states: Record<string, EntityState>;
  entities?: Record<string, { hidden?: boolean }>;
  formatEntityState?: (entity: EntityState) => string;
}

function selectPeople(hass: HomeAssistant, ids?: string[]): string[] {
  if (ids?.length) return ids;
  const people: string[] = [];
  const trackers: string[] = [];
  for (const id of Object.keys(hass.states)) {
    if (hass.entities?.[id]?.hidden) continue;
    if (id.startsWith('person.')) people.push(id);
    if (id.startsWith('device_tracker.')) trackers.push(id);
  }
  return people.length ? people : trackers;
}

function pictureUrl(picture?: string): string | undefined {
  if (!picture) return;
  try {
    const url = new URL(picture, window.location.origin);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch {
    // A malformed URL leaves the person's initials visible.
  }
}

function memberOf(hass: HomeAssistant, id: string) {
  const entity = hass.states[id];
  const name = entity?.attributes.friendly_name?.trim() || id;
  const state = entity?.state.trim().toLowerCase();
  const tone = state === 'home' ? 'home' :
    !state || state === 'unknown' || state === 'unavailable' ? 'unknown' :
    state === 'not_home' || state === 'away' ? 'away' : 'zone';
  const zoneName = tone === 'zone'
    ? hass.states[`zone.${state?.replace(/\s+/g, '_')}`]?.attributes.friendly_name
    : undefined;
  const status = tone === 'home' ? 'Home' : tone === 'away' ? 'Away' :
    zoneName || (entity && hass.formatEntityState?.(entity)) ||
    (tone === 'unknown' ? (entity ? 'Unknown' : 'Unavailable') : entity?.state) || 'Unknown';

  return { id, name, status, tone, available: Boolean(entity), picture: pictureUrl(entity?.attributes.entity_picture) };
}

type Member = ReturnType<typeof memberOf>;

function element<K extends keyof HTMLElementTagNameMap>(tagName: K, className: string, text?: string) {
  const node = document.createElement(tagName);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function portrait(member: Member) {
  const button = element('button', 'person');
  button.type = 'button';
  button.dataset.entity = member.id;
  button.dataset.tone = member.tone;
  button.disabled = !member.available;
  button.setAttribute('aria-label', `${member.name}: ${member.status}`);
  button.title = `${member.name} · ${member.status}`;

  const avatar = element('span', 'avatar', personInitials(member.name));
  avatar.setAttribute('aria-hidden', 'true');
  if (member.picture) {
    const image = element('img', 'picture');
    image.alt = '';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => image.remove(), { once: true });
    image.src = member.picture;
    avatar.append(image);
  }
  button.append(avatar);

  if (member.tone !== 'home') {
    button.append(element('span', 'location', `${member.name.split(/\s+/)[0]} · ${member.status}`));
  }

  const item = element('li', 'portrait');
  item.append(button);
  return item;
}

class PeopleCard extends HTMLElement {
  private config?: PeopleConfig;
  private homeAssistant?: HomeAssistant;
  private signature?: string;
  private readonly shadow = this.attachShadow({ mode: 'open' });
  private readonly card = document.createElement('ha-card');
  private readonly content = element('section', 'content');

  constructor() {
    super();
    const style = document.createElement('style');
    style.textContent = css;
    this.card.append(this.content);
    this.shadow.append(style, this.card);
    this.content.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const entityId = target.closest<HTMLButtonElement>('button[data-entity]')?.dataset.entity;
      if (entityId && this.homeAssistant?.states[entityId]) {
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          detail: { entityId },
          bubbles: true,
          composed: true,
        }));
      }
    });
  }

  static getConfigForm() {
    return {
      schema: [
        { name: 'title', selector: { text: {} } },
        { name: 'entities', selector: { entity: { filter: [{ domain: domains }], multiple: true } } },
      ],
      computeHelper: ({ name }: { name: string }) =>
        name === 'entities' ? 'Leave empty to find people automatically.' : undefined,
    };
  }

  setConfig(config: PeopleConfig) {
    if (config.title !== undefined && typeof config.title !== 'string') {
      throw new Error('Title must be text.');
    }
    if (config.entities !== undefined && (
      !Array.isArray(config.entities) ||
      config.entities.some((id) => typeof id !== 'string' || !trackedEntity.test(id))
    )) {
      throw new Error('Select only person or device tracker entities.');
    }
    this.config = { title: config.title?.trim(), entities: [...new Set(config.entities)] };
    this.render();
  }

  set hass(hass: HomeAssistant) {
    this.homeAssistant = hass;
    this.render();
  }

  getGridOptions() {
    return { columns: 12, rows: 3, min_columns: 6, min_rows: 2 };
  }

  getCardSize() {
    return Math.max(3, Math.ceil(this.content.scrollHeight / 50));
  }

  private render() {
    const hass = this.homeAssistant;
    if (!hass || !this.config) return;

    const title = this.config.title;
    const members = selectPeople(hass, this.config.entities).map((id) => memberOf(hass, id));
    const signature = JSON.stringify([title, members]);
    if (signature === this.signature) return;
    this.signature = signature;

    const focused = this.shadow.activeElement as HTMLButtonElement | null;
    const focusedId = focused?.dataset.entity;
    const atHome = members.filter((member) => member.tone === 'home');
    const away = members.filter((member) => member.tone !== 'home');
    const homeCount = atHome.length;
    let headline = `${homeCount} of ${members.length} home`;
    if (!members.length) headline = 'No people set up';
    else if (homeCount === members.length) headline = 'Everyone is home';
    else if (!homeCount && !away.some((member) => member.tone === 'unknown')) headline = 'Nobody is home';

    this.content.setAttribute('aria-label', title || 'People');
    this.card.style.setProperty('--atc-presence-glow', presenceWarmth(homeCount, members.length));
    const heading = element('h2', 'heading', title || headline);
    const nodes: HTMLElement[] = [heading];
    if (title) nodes.push(element('p', 'summary', headline));

    for (const [label, group, className] of [
      ['At home', atHome, 'home'],
      ['Away or unavailable', away, 'away'],
    ] as const) {
      if (!group.length) continue;
      const list = element('ul', `portraits ${className}`);
      list.setAttribute('aria-label', label);
      list.append(...group.map(portrait));
      nodes.push(list);
    }
    this.content.replaceChildren(...nodes);

    if (focusedId) {
      this.content.querySelector<HTMLButtonElement>(`button[data-entity="${CSS.escape(focusedId)}"]`)
        ?.focus({ preventScroll: true });
    }
  }
}

if (!customElements.get(tag)) customElements.define(tag, PeopleCard);

type PickerEntry = {
  type: string;
  name: string;
  description: string;
  preview: boolean;
  documentationURL: string;
};

const dashboard = window as Window & { customCards?: PickerEntry[] };
const picker = dashboard.customCards ??= [];
if (!picker.some((card) => card.type === tag)) {
  picker.push({
    type: tag,
    name: 'At Home People',
    description: 'See who is home and where others are.',
    preview: true,
    documentationURL: 'https://github.com/SamerBerjawi/at-home-cards#people-card',
  });
}
