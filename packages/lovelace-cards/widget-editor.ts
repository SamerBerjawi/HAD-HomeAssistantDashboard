import { OPENING_CLASSES } from '../../src/pro/areas/ha/haTileModels';
import { DEFAULT_ROOMS_PREFS, ROOMS_TOGGLES } from '../../src/pro/pages/rooms/shared';

const roomToggles = ROOMS_TOGGLES.filter(option => option.group !== 'page');
const roomLabels: Record<string, string> = {
  metric: 'Primary reading', room_options: 'Room appearance and controls',
  showStates: 'Show status dot and activity details', showReading: 'Show primary reading or state', showCounts: 'Show lights and device counts',
  ...Object.fromEntries(roomToggles.map(option => [option.key, option.group === 'actions' ? option.label + ' quick action' : option.label])),
};
const roomDefaults = {
  metric: DEFAULT_ROOMS_PREFS.metric, showStates: true, showReading: true, showCounts: true,
  ...Object.fromEntries(roomToggles.map(({key}) => [key, DEFAULT_ROOMS_PREFS[key]])),
};
// One column in the default Sections picker spans three underlying grid columns.
const presets = {
  '2x0.5': { columns: 12, rows: 2 },
  '1x1': { columns: 6, rows: 3 },
  '2x1': { columns: 12, rows: 3 },
  '1x2': { columns: 6, rows: 6 },
  '2x2': { columns: 12, rows: 6 },
} as const;

export type Size = keyof typeof presets;
type EditorConfig = { size?: Size; grid_options?: Record<string, unknown>; [key: string]: unknown };

export function applySize(card: HTMLElement, size?: string) {
  if (size && !Object.hasOwn(presets, size)) throw Error('Choose a supported tile size.');
  if (size) {
    card.dataset.preset = size;

  } else {
    delete card.dataset.preset;

  }
}

export function grid(size?: string, room = false) {
  return { ...presets[(size ?? '1x1') as Size], min_columns: 6, min_rows: room ? 2 : 3 };
}

export function widgetEditor(label: string, domains: string[], id = label.toLowerCase(), designs: { id: string; name: string }[] = [], defaultSize: Size = '1x1', allowedSizes?: readonly Size[]) {
  const singleEntity = id.endsWith('-entity');
  const tag = 'at-home-' + id + '-editor';
  if (!customElements.get(tag)) {
    customElements.define(tag, class extends HTMLElement {
      private config: EditorConfig = {};
      private readonly form = document.createElement('ha-form') as HTMLElement & {
        hass?: unknown; data?: EditorConfig; schema?: unknown[]; computeLabel?: (field: {name: string}) => string;
      };
      private readonly buttons = new Map<Size, HTMLButtonElement>();

      constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = 'fieldset{border:0;margin:16px 0;padding:0;display:flex;gap:8px;flex-wrap:wrap}legend{margin-bottom:8px}button{background:transparent;color:inherit;border:1px solid var(--divider-color,#888);border-radius:8px;padding:9px 12px;cursor:pointer}button[aria-pressed=true]{color:var(--primary-color);border-color:currentColor}';
        this.form.schema = [
          { name: 'title', selector: { text: {} } },
          ...(singleEntity && ['light-entity','fan-entity','switch-entity','scene-entity','cover-entity'].includes(id) ? [{name:'confirm_action',selector:{boolean:{}}}] : []),
          ...(id === 'switch-entity' ? [{name:'display_role',selector:{select:{options:['auto','switch','plug','helper','light']}}}] : []),
          ...(designs.length > 1 ? [{name:'design', selector:{select:{options:designs.map(d=>({value:d.id,label:d.name}))}}}] : []),
          singleEntity ? {name:'entity', selector:{entity:{filter:[{domain:domains, ...(id === 'opening-entity' ? {device_class:[...OPENING_CLASSES]} : {})}]}}} : id === 'room' ? {name:'area', selector:{area:{}}} : domains[0] === 'area' ? { name: 'areas', selector: { area: { multiple: true } } } : { name: 'entities', selector: { entity: { filter: [{ domain: domains }], multiple: true } } },
          ...(id === 'room' ? [
              {name:'metric', selector:{select:{options:[{value:'temperature',label:'Temperature'},{value:'humidity',label:'Humidity'}]}}},
              ...['showReading', 'showStates', 'showCounts', ...roomToggles.map(option => option.key)].map(name => ({name, selector:{boolean:{}}})),
          ] : []),
        ];
        this.form.computeLabel = field => roomLabels[field.name] ?? (field.name === 'display_role' ? 'Display as' : field.name === 'confirm_action' ? (id === 'cover-entity' ? 'Confirm cover commands' : 'Confirm power and run actions') : field.name === 'entity' ? 'Entity' : field.name === 'area' ? 'Room' : field.name === 'design' ? 'Design' : field.name === 'areas' ? 'Rooms (optional)' : field.name === 'entities' ? label + ' entities (optional)' : 'Title');
        this.form.addEventListener('value-changed', event => {
          const { title, entity, confirm_action, display_role, entities, area, areas, design } = (event as CustomEvent).detail.value;
          this.save({ ...this.config, title, ...(designs.length > 1 ? {design} : {}), ...(singleEntity ? {entity, confirm_action, ...(id === 'switch-entity' ? {display_role} : {})} : id === 'room' ? { area, room_options: Object.fromEntries(Object.keys(roomDefaults).map(key => [key, (event as CustomEvent).detail.value[key]])) } : domains[0] === 'area' ? { areas } : { entities }) });
        });
        const sizes = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = 'Tile size';
        sizes.append(legend);
        for (const size of Object.keys(presets) as Size[]) {
          if (allowedSizes && !allowedSizes.includes(size)) continue;
          if (size === '2x0.5' && id !== 'room' && !singleEntity) continue;
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = size.replace('x', ' × ');
          button.onclick = () => {
            const config = { ...this.config, size };
            const options = { ...config.grid_options };
            delete options.columns;
            delete options.rows;
            if (Object.keys(options).length) config.grid_options = options;
            else delete config.grid_options;
            this.save(config);
          };
          this.buttons.set(size, button);
          sizes.append(button);
        }
        root.append(style, this.form, sizes);
      }
      set hass(hass: unknown) { this.form.hass = hass; }
      setConfig(config: EditorConfig) {
        this.config = config;
        this.form.data = id === 'room' ? {...roomDefaults, ...config, ...(config.room_options as object)} : config;
        const selectedSize = config.size && this.buttons.has(config.size) ? config.size : defaultSize;
        for (const [size, button] of this.buttons) button.setAttribute('aria-pressed', String(selectedSize === size));
      }
      private save(config: EditorConfig) {
        this.setConfig(config);
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
      }
    });
  }
  return document.createElement(tag);
}
