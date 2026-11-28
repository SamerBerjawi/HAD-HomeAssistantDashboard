import { Sheet, expandButton, node } from './sheet';
import { applySize, grid, widgetEditor } from './widget-editor';
import css from './people-card.css';

interface Entity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}
interface Hass {
  states: Record<string, Entity>;
  entities?: Record<string, { area_id?: string; device_id?: string; hidden?: boolean }>;
  devices?: Record<string, { area_id?: string }>;
  areas?: Record<string, { name: string }>;
  formatEntityState?(entity: Entity): string;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
}
type NativeConfig = Record<string, unknown>;
type NativeCard = HTMLElement & { hass: Hass };
type Config = { entities?: string[]; title?: string; size?: string; areas?: string[] };
interface Definition {
  id: string;
  title: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  detail(entity: Entity): NativeConfig;
  active(entity: Entity): boolean;
  summary(active: number, total: number): string;
  caption?(entity: Entity, hass: Hass): string;
}

const tile = (e: Entity, features: string[] = []): NativeConfig => ({
  type:'tile', entity:e.entity_id, features:features.map(type => ({ type })),
});
const enabled = (e: Entity) => e.state === 'on';
const count = (suffix: string) => (active: number, total: number) => active + ' of ' + total + ' ' + suffix;
const stateLabel = (e: Entity, hass: Hass) => hass.formatEntityState?.(e) ?? e.state.replaceAll('_',' ');

const definitions: Definition[] = [
  { id:'switches', title:'Switches', domain:'switch', icon:'mdi:toggle-switch', color:'#355a80', description:'Room switches and power readings.', active:enabled, summary:count('on'),
    detail:e=>tile(e,['toggle']), caption:(e,h)=>[stateLabel(e,h), e.attributes.current_power_w != null ? e.attributes.current_power_w + ' W' : ''].filter(Boolean).join(' · ') },
  { id:'fans', title:'Fans', domain:'fan', icon:'mdi:fan', color:'#287773', description:'Fan activity, speed and modes.', active:enabled, summary:count('running'),
    detail:e=>tile(e,['toggle', ...(Number(e.attributes.supported_features) & 1 ? ['fan-speed'] : []), ...(Number(e.attributes.supported_features) & 8 ? ['fan-preset-modes'] : [])]),
    caption:(e,h)=>e.state==='on' && typeof e.attributes.percentage==='number' ? e.attributes.percentage+'%' : stateLabel(e,h) },
  { id:'scenes', title:'Scenes', domain:'scene', icon:'mdi:palette', color:'#825479', description:'Room scenes and their last activation.', active:()=>false, summary:(_,n)=>n+' scenes',
    detail:e=>({ ...tile(e), tap_action:{action:'perform-action',perform_action:'scene.turn_on',target:{entity_id:e.entity_id}} }) },
  { id:'areas', title:'Areas', domain:'area', icon:'mdi:floor-plan', color:'#4c7166', description:'Explore rooms and their devices.', active:()=>false, summary:(_,n)=>n+' rooms',
    detail:e=>({type:'area',area:e.entity_id,show_camera:false}) },
  { id:'openings', title:'Doors & windows', domain:'binary_sensor', icon:'mdi:door-open', color:'#805d32', description:'Open doors, windows and their recent history.', active:enabled, summary:count('open'),
    detail:e=>({type:'history-graph',hours_to_show:24,entities:[e.entity_id]}) },
  { id:'weather', title:'Weather', domain:'weather', icon:'mdi:weather-partly-cloudy', color:'#386f9c', description:'Current conditions and station forecasts.', active:()=>false, summary:(_,n)=>n+' stations',
    detail:e=>({type:'weather-forecast',entity:e.entity_id,show_forecast:Boolean(Number(e.attributes.supported_features)&7),forecast_type:Number(e.attributes.supported_features)&1?'daily':Number(e.attributes.supported_features)&4?'hourly':'twice_daily'}),
    caption:(e,h)=>[stateLabel(e,h),e.attributes.temperature != null ? String(e.attributes.temperature)+(e.attributes.temperature_unit ?? '°') : ''].filter(Boolean).join(' · ') },
  { id:'thermostat', title:'Thermostat', domain:'climate', icon:'mdi:thermostat', color:'#946545', description:'Climate modes, readings and target temperatures.', active:e=>['heating','cooling'].includes(String(e.attributes.hvac_action)), summary:count('active'),
    detail:e=>({type:'thermostat',entity:e.entity_id,features:[{type:'climate-hvac-modes'}]}), caption:(e,h)=>[stateLabel(e,h),e.attributes.current_temperature != null ? e.attributes.current_temperature+'°' : ''].filter(Boolean).join(' · ') },
  { id:'media', title:'Media', domain:'media_player', icon:'mdi:music', color:'#6c5088', description:'Playback, artwork and media controls.', active:e=>e.state==='playing', summary:count('playing'),
    detail:e=>({type:'media-control',entity:e.entity_id}), caption:(e,h)=>String(e.attributes.media_title || stateLabel(e,h)) },
  { id:'vacuums', title:'Vacuums', domain:'vacuum', icon:'mdi:robot-vacuum', color:'#547592', description:'Cleaning status and vacuum commands.', active:e=>e.state==='cleaning', summary:count('cleaning'),
    detail:e=>tile(e,['vacuum-commands']), caption:(e,h)=>[stateLabel(e,h),e.attributes.battery_level != null ? e.attributes.battery_level+'%' : ''].filter(Boolean).join(' · ') },
  { id:'cameras', title:'Cameras', domain:'camera', icon:'mdi:cctv', color:'#455972', description:'Camera previews and live feeds.', active:e=>['streaming','recording'].includes(e.state), summary:(_,n)=>n+' cameras',
    detail:e=>({type:'picture-entity',entity:e.entity_id,camera_view:'live'}) },
];

function name(e: Entity) { return String(e.attributes.friendly_name || e.entity_id); }

class OverviewSheet extends Sheet {
  hass?: Hass;
  items: Entity[] = [];
  selected?: string;
  private detail?: NativeCard;
  private revision = 0;
  constructor(private def: Definition) {
    super(def.title);
    this.dialog.addEventListener('close', () => {
      this.revision++;
      this.detail = undefined;
      this.body.replaceChildren();
    });
  }
  refresh(changed: boolean) {
    if (!this.dialog.open || !this.hass) return;
    if (changed) this.draw();
    else if (this.detail) this.detail.hass = this.hass;
  }
  protected draw() {
    const generation = ++this.revision;
    this.detail = undefined;
    const hero = node('header');
    hero.style.background = 'linear-gradient(125deg,'+this.def.color+',#273047)';
    hero.append(node('strong',this.def.title),node('h2',this.def.summary(this.items.filter(this.def.active).length,this.items.length)));
    this.body.replaceChildren(hero);
    const selected = this.items.find(e=>e.entity_id===this.selected) ?? this.items.find(this.def.active) ?? this.items[0];
    if (!selected) { this.body.append(node('p','No matching entities')); return; }
    const nav = node('nav');
    for (const item of this.items) {
      const button = node('button',name(item));
      button.setAttribute('aria-pressed',String(item===selected));
      button.onclick = () => { this.selected=item.entity_id; this.draw(); this.body.querySelector<HTMLButtonElement>('button[aria-pressed=true]')?.focus(); };
      nav.append(button);
    }
    this.body.append(nav,node('h3',name(selected)));
    const host = node('section');
    this.body.append(host);
    void this.mount(host,selected,generation);
  }
  private async mount(host: HTMLElement, item: Entity, generation: number) {
    try {
      const dashboard = window as Window & { loadCardHelpers?(): Promise<{createCardElement(config: NativeConfig):NativeCard}> };
      if (!dashboard.loadCardHelpers) throw Error('Dashboard helpers unavailable');
      const helpers = await dashboard.loadCardHelpers();
      if (generation!==this.revision || !this.dialog.open || !this.hass) return;
      this.detail = helpers.createCardElement(this.def.detail(item));
      this.detail.hass = this.hass;
      host.append(this.detail);
    } catch { if (generation===this.revision) host.textContent='Unable to load Home Assistant controls.'; }
  }
}

function cardFor(def: Definition) {
  return class extends HTMLElement {
    private config?: Config;
    private api?: Hass;
    private signature?: string;
    private readonly card = document.createElement('ha-card');
    private readonly content = node('div');
    private readonly sheet = new OverviewSheet(def);
    constructor() {
      super();
      this.card.className='atc-overview';
      this.card.style.setProperty('--tone',def.color);
      this.content.className='content';
      this.card.append(this.content,expandButton(def.title,()=>this.sheet.open()));
      this.attachShadow({mode:'open'}).append(node('style',css),this.card,this.sheet.dialog);
    }
    static getConfigElement() { return widgetEditor(def.title,[def.domain],def.id); }
    disconnectedCallback() { if (this.sheet.dialog.open) this.sheet.dialog.close(); }
    setConfig(config: Config) {
      const values = def.domain==='area' ? config.areas : config.entities;
      if (values != null && (!Array.isArray(values) || values.some(v=>typeof v!=='string' || (def.domain!=='area' && !v.startsWith(def.domain+'.'))))) throw Error('Invalid selection for '+def.title);
      applySize(this.card,config.size);
      this.config=config;
      this.render();
    }
    getGridOptions() { return grid(this.config?.size); }
    getCardSize() { return this.config?.size?.endsWith('2') ? 7 : 3; }
    set hass(api: Hass) { this.api=api; this.render(); }
    private render() {
      const api=this.api, config=this.config;
      if (!api || !config) return;
      let items: Entity[];
      if (def.domain==='area') {
        const ids=config.areas?.length ? config.areas : Object.keys(api.areas ?? {});
        items=ids.map(id=>({entity_id:id,state:'',attributes:{friendly_name:api.areas?.[id]?.name || id}}));
      } else {
        const ids=config.entities?.length ? config.entities : Object.keys(api.states).filter(id=>id.startsWith(def.domain+'.') && !api.entities?.[id]?.hidden);
        items=ids.map(id=>api.states[id] ?? {entity_id:id,state:'unavailable',attributes:{}});
        if (def.id==='openings' && !config.entities?.length) items=items.filter(e=>['door','garage_door','window','opening'].includes(String(e.attributes.device_class)));
      }
      const caption = (e:Entity)=>def.domain==='area' ? '' : (def.caption ?? stateLabel)(e,api);
      const rows=items.map(e=>[e.entity_id,name(e),caption(e),def.active(e),e.attributes.supported_features]);
      const signature=JSON.stringify([config.title,rows]);
      this.sheet.items=items;
      this.sheet.hass=api;
      this.sheet.refresh(signature!==this.signature);
      if (signature===this.signature) return;
      this.signature=signature;
      const heading=node('strong',config.title || def.title);
      heading.className='heading';
      const featured=items.find(def.active) ?? items[0];
      const count=def.summary(items.filter(def.active).length,items.length);
      const icon=document.createElement('ha-icon');
      icon.setAttribute('icon',def.icon);
      const primary=node('h2',featured && ['weather','media'].includes(def.id) ? caption(featured) : count);
      this.content.replaceChildren(heading,icon,primary);
      if (featured) {
        const pick=node('button',name(featured));
        pick.className='overview-pick';
        pick.onclick=()=>{this.sheet.selected=featured.entity_id;this.sheet.open();};
        this.content.append(pick);
      }
    }
  };
}

export const overviewWidgets = definitions.map(def => ({
  type:'at-home-'+def.id+'-card',name:'At Home '+def.title,description:def.description,card:cardFor(def),anchor:'overview-cards',
}));
