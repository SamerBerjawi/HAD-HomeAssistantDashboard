import { TileFit } from './fit-tile';
import { applySize, grid, widgetEditor } from './widget-editor';
import css from './people-card.css';
import { Sheet, expandButton, node } from './sheet';

interface Hass {
  states: Record<string, { state: string; attributes: {
    friendly_name?: string; brightness?: number; supported_color_modes?: string[];
    power?: number; current_power_w?: number;
  } }>;
  entities?: Record<string, { hidden?: boolean; area_id?: string; device_id?: string }>;
  devices?: Record<string, { area_id?: string }>;
  areas?: Record<string, { name: string }>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
}

function getLights(hass: Hass, selected?: string[]) {
  const ids = selected?.length ? selected : Object.keys(hass.states).filter(id => id.startsWith('light.') && !hass.entities?.[id]?.hidden);
  return ids.map(id => {
    const entry = hass.entities?.[id];
    const area = entry?.area_id || hass.devices?.[entry?.device_id ?? '']?.area_id;
    const state = hass.states[id];
    const attr = state?.attributes;
    return { id, name: attr?.friendly_name || id, room: hass.areas?.[area ?? '']?.name || 'Other',
      on: state?.state === 'on', available: ['on','off'].includes(state?.state),
      level: typeof attr?.brightness === 'number' ? Math.round(attr.brightness * 100 / 255) : undefined,
      dim: attr?.supported_color_modes?.some(mode => !['onoff','unknown'].includes(mode)) ?? typeof attr?.brightness === 'number',
      watts: attr?.current_power_w ?? attr?.power };
  });
}
type Light = ReturnType<typeof getLights>[number];
type Command = (items: Light[], on: boolean, level?: number) => void;

function action(label: string, run: () => void, disabled = false) {
  const button = node('button', label);
  button.onclick = run;
  button.disabled = disabled;
  return button;
}
function slider(light: Light, command: Command) {
  const input = node('input');
  input.type = 'range';
  input.min = '1';
  input.max = '100';
  input.value = String(light.level ?? 100);
  input.setAttribute('aria-label', light.name + ' brightness');
  input.onchange = () => command([light], true, Number(input.value));
  return input;
}
function summary(items: Light[]) {
  const on = items.filter(i => i.on).length;
  return items.length ? on + ' of ' + items.length + ' on' : 'No lights';
}
function rooms(items: Light[]) {
  const groups = new Map<string, Light[]>();
  for (const item of items) {
    if (!groups.has(item.room)) groups.set(item.room, []);
    groups.get(item.room)!.push(item);
  }
  return groups;
}

class LightingSheet extends Sheet {
  private filter = 'All';
  private readonly search = node('input');
  private readonly list = node('div');
  items: Light[] = [];
  constructor(private command: Command) {
    super('Lighting');
    this.search.type = 'search';
    this.search.placeholder = 'Search lights or rooms';
    this.search.setAttribute('aria-label', this.search.placeholder);
    this.search.oninput = () => this.rows();
  }
  refresh() { if (this.dialog.open) this.draw(); }
  protected draw() {
    const hero = node('header');
    const on = this.items.filter(i => i.on);
    hero.dataset.tone = on.length ? 'amber' : 'night';
    hero.append(node('strong','Lighting'), node('h2',summary(this.items)));
    const levels = on.flatMap(i => i.level ?? []);
    const watts = this.items.reduce((sum,i) => sum + (Number(i.watts) || 0),0);
    const figures = [levels.length ? Math.round(levels.reduce((a,b) => a+b,0)/levels.length) + '% average brightness' : '', watts ? Math.round(watts) + ' W' : ''].filter(Boolean);
    if (figures.length) hero.append(node('p',figures.join(' · ')));
    for (const enable of [true,false]) {
      const targets = this.items.filter(i => i.available && i.on !== enable);
      hero.append(action(enable ? 'All on' : 'All off', () => this.command(targets,enable), !targets.length));
    }
    const nav = node('nav');
    for (const option of ['All','On','Off']) {
      const button = action(option, () => { this.filter = option; this.draw(); this.body.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus(); });
      button.setAttribute('aria-pressed', String(this.filter === option));
      nav.append(button);
    }
    const focused = this.search.matches(':focus');
    this.body.replaceChildren(hero, nav, this.search, this.list);
    if (focused) this.search.focus();
    this.rows();
  }
  private rows() {
    const shown = this.items.filter(i => (this.filter === 'All' || (i.available && i.on === (this.filter === 'On'))) &&
      (i.name + ' ' + i.room).toLowerCase().includes(this.search.value.trim().toLowerCase()));
    this.list.replaceChildren();
    for (const [room, items] of rooms(shown)) {
      this.list.append(node('h3',room + ' · ' + summary(items)));
      const group = node('section');
      for (const light of items) {
        const state = !light.available ? 'Unavailable' : light.on ? 'On' : 'Off';
        const label = [light.name, state, light.on && light.level != null ? light.level + '%' : '', light.watts ? light.watts + ' W' : ''].filter(Boolean).join(' · ');
        const toggle = action(label, () => this.command([light],!light.on), !light.available);
        toggle.setAttribute('aria-pressed', String(light.on));
        group.append(toggle);
        if (light.on && light.dim) group.append(slider(light,this.command));
      }
      this.list.append(group);
    }
    if (!shown.length) this.list.append(node('p', this.items.length ? 'No lights match' : 'No lights set up'));
  }
}

export class LightingCard extends HTMLElement {
  private config?: { size?: string; title?: string; entities?: string[] };
  private api?: Hass;
  private signature?: string;
  private readonly card = document.createElement('ha-card');
  private readonly content = node('div');
  private readonly error = node('p');
  private readonly sheet = new LightingSheet((...args) => void this.command(...args));
  private readonly fit = new TileFit(this.card, this.content);
  connectedCallback() { this.fit.connect(); }
  disconnectedCallback() { this.fit.disconnect(); }

  constructor() {
    super();
    this.content.className = 'content';
    this.card.className = 'lighting';
    this.error.setAttribute('role','alert');
    this.card.append(this.content,expandButton('Lighting',() => this.sheet.open()));
    this.sheet.dialog.className = 'lighting-sheet';
    this.attachShadow({ mode:'open' }).append(node('style',css), this.card,this.sheet.dialog);
  }
  static getConfigElement() { return widgetEditor('Lighting', ['light']); }

  static getConfigForm() {
    return { schema: [{ name:'title',selector:{ text:{} } },{ name:'entities',selector:{ entity:{ filter:[{domain:'light'}],multiple:true } } }] };
  }
  setConfig(config: { size?: string; title?: string; entities?: string[] }) {
    if (config.title != null && typeof config.title !== 'string') throw Error('Title must be text.');
    if (config.entities != null && (!Array.isArray(config.entities) || config.entities.some(id => typeof id !== 'string' || !/^light\.[a-z0-9_]+$/.test(id)))) throw Error('Select light entities.');
    applySize(this.card, config.size);
    this.config = { size: config.size, title:config.title, entities:[...new Set(config.entities)] };
    this.render();
  }
  set hass(hass: Hass) { this.api = hass; this.render(); }
  getGridOptions() { return grid(this.config?.size); }
  getCardSize() {
    if (this.config?.size) return this.config.size.endsWith("2") ? 7 : 3; return 3; }

  private async command(items: Light[], on: boolean, level?: number) {
    const ids = items.filter(i => i.available).map(i => i.id);
    if (!ids.length || !this.api) return;
    this.error.remove();
    try {
      await this.api.callService('light',on ? 'turn_on' : 'turn_off',{entity_id:ids,...(level != null ? {brightness_pct:level} : {})});
    } catch {
      this.error.textContent = 'Home Assistant could not change the lights. Try again.';
      (this.sheet.dialog.open ? this.sheet.dialog : this.card).append(this.error);
    }
  }
  private render() {
    if (!this.api || !this.config) return;
    const items = getLights(this.api,this.config.entities);
    const signature = JSON.stringify([this.config.title,items]);
    if (signature === this.signature) return;
    this.signature = signature;
    this.sheet.items = items;
    this.sheet.refresh();
    const lit = items.filter(i => i.on);
    const glow = lit.reduce((sum,i) => sum + (i.level ?? 100)/100,0)/Math.max(1,items.length);
    this.card.style.setProperty('--glow', String(0.18 + 0.65 * glow));
    this.content.replaceChildren(node('strong',this.config.title || 'Lighting'), node('h2',summary(items)));
    const controls = node('div');
    controls.className = 'light-controls';
    const toggle = (group: Light[]) => {
      const enable = !group.some(i => i.on);
      void this.command(group.filter(i => i.on !== enable),enable);
    };
    if (items.length === 1) {
      const light = items[0];
      controls.append(action(light.name,() => toggle(items),!light.available));
      if (light.on && light.dim) controls.append(slider(light,(...args) => void this.command(...args)));
    } else if (items.length) {
      controls.append(action(lit.length ? 'All off' : 'All on',() => toggle(items),!items.some(i => i.available)));
      for (const [room,group] of [...rooms(items)].slice(0,4)) controls.append(action(room + ' · ' + group.filter(i=>i.on).length,() => toggle(group), !group.some(i=>i.available)));
    }
    this.content.append(controls);
    this.fit.update();
  }
}
