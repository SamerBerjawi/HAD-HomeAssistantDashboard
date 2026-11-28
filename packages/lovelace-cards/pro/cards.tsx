import {mergeConfig,mergeDelta} from '@/services/configMerge';
import {RoomPageDialog} from './room-page';
import {usePredictedStates} from './optimistic';
import {EntityCard, entityDomains, type EntityOptions} from './entity';
import roomStyles from './room.css?inline';
import {RoomCard} from './room';
import {HostDarkMode} from '../../../src/pro/components/overview/HostDarkMode';
import {enableShadowDOM} from 'react-stately/private/flags/flags';
import React,{Suspense,useState,useMemo,useEffect} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {UNSAFE_PortalProvider} from 'react-aria';
import {Runtime,DEFAULT_USER_CONFIG,type Hass} from './runtime';
import {setConnection} from './request';
import {forecastSubscriptionsFor} from '@/services/haWeatherForecast';
import {dashboardGraph} from './graph';
import {resolveDesign, type WidgetDefinition} from '../../../src/pro/widgets/types';
import {widgetEditor,grid,type Size} from '../widget-editor';
import styles from '../../../src/pro/pro.css?inline';
import fontUrl from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?inline';
import mapStyles from 'leaflet/dist/leaflet.css?inline';
import {presenceWidget} from '../../../src/pro/widgets/presence';
import {lightsWidget} from '../../../src/pro/widgets/lights';
import {switchesWidget} from '../../../src/pro/widgets/switches';
import {fansWidget} from '../../../src/pro/widgets/fans';
import {scenesWidget} from '../../../src/pro/widgets/scenes';
import {areasWidget} from '../../../src/pro/widgets/areas';
import {openingsWidget} from '../../../src/pro/widgets/openings';
import {weatherWidget} from '../../../src/pro/widgets/weather';
import {thermostatWidget} from '../../../src/pro/widgets/thermostat';
import {mediaWidget} from '../../../src/pro/widgets/media';
import {vacuumsWidget} from '../../../src/pro/widgets/vacuums';
import {camerasWidget} from '../../../src/pro/widgets/cameras';

import type {UserDashboardConfig} from '@/types/userConfig';

enableShadowDOM();

const entries=[
  ['camera-entity','Camera Entity','camera',null],
  ['opening-entity','Opening Entity','binary_sensor',null],
  ['media-player-entity','Media Player Entity','media_player',null],
  ['vacuum-entity','Vacuum Entity','vacuum',null],
  ['climate-entity','Climate Entity','climate',null],
  ['cover-entity','Cover Entity','cover',null],
  ['reading-entity','Sensor Reading Entity','sensor',null],
  ['switch-entity','Switch Entity','switch',null],['scene-entity','Scene Entity','scene',null],
  ['light-entity','Light Entity','light',null],['fan-entity','Fan Entity','fan',null],
  ['people','People','person',presenceWidget],['lighting','Lighting','light',lightsWidget],
  ['switches','Switches','switch',switchesWidget],['fans','Fans','fan',fansWidget],['scenes','Scenes','scene',scenesWidget],
  ['areas','Areas','area',areasWidget],['room','Room','area',areasWidget],['openings','Doors & windows','binary_sensor',openingsWidget],
  ['weather','Weather','weather',weatherWidget],['thermostat','Thermostat','climate',thermostatWidget],
  ['media','Media','media_player',mediaWidget],['vacuums','Vacuums','vacuum',vacuumsWidget],['cameras','Cameras','camera',camerasWidget],
] as const;
type Config=EntityOptions & {entity?:string;room_options?:Record<string, unknown>;area?:string;webrtc?:Record<string, Record<string, unknown>>;title?:string;size?:string;design?:string;entities?:string[];areas?:string[]};
const sizes={'1x1':'s','2x1':'w','1x2':'t','2x2':'l'} as const;
const presets = {s:'1x1',w:'2x1',t:'1x2',l:'2x2'} as const;
function Widget({room,widget,config,open,close,item,show}:{room:boolean;widget:WidgetDefinition<unknown>;config:Config;open:()=>void;close:()=>void;item?:string;show:boolean}){
  const model=widget.useModel();
  const Body=resolveDesign(widget,config.design)?.Body;
  const Sheet=widget.Sheet;
  const requestedSize = sizes[config.size as keyof typeof sizes];
  const widgetSize = requestedSize && widget.sizes.includes(requestedSize) ? requestedSize : widget.defaultSize;
  return <>{config.title && <strong className="shrink-0 truncate px-2">{config.title}</strong>}
    <div className="min-h-0 flex-1">{room ? <RoomCard options={config.room_options} area={config.area} size={config.size}/> : Body && <Body model={model} size={widgetSize} onOpenDetails={open}/>}</div>
    {show && Sheet && <Suspense fallback={null}><Sheet model={model} key={item} itemId={item} onClose={close}/></Suspense>}</>;
}
function useForecast(hass:Hass,domain:string,selection?:string[]){
  const [extra,setExtra]=useState<Record<string,Record<string,unknown>>>({});
  const ids=domain==='weather'?Object.keys(hass.states).filter(id=>id.startsWith('weather.') && (!selection?.length||selection.includes(id))):[];
  const key=JSON.stringify(ids.map(id=>[id,hass.states[id].attributes.supported_features]));
  useEffect(()=>{
    let active=true;const stops:(()=>void)[]=[];
    for(const id of ids)for(const {type,slot} of forecastSubscriptionsFor(hass.states[id].attributes.supported_features)){
      void hass.connection?.subscribeMessage<{forecast:unknown[]}>(event=>{
        if(active && Array.isArray(event?.forecast))setExtra(prev=>({...prev,[id]:{...prev[id],[slot==='daily'?'forecast':'hourly_forecast']:event.forecast}}));
      },{type:'weather/subscribe_forecast',entity_id:id,forecast_type:type}).then(stop=>active?stops.push(stop):stop()).catch(()=>{});
    }
    return ()=>{active=false;stops.forEach(stop=>stop());};
  },[hass.connection,key]);
  return extra;
}
function Host({room,widget,domain,hass,config,portal}:{room:boolean;widget:WidgetDefinition<unknown>|null;domain:string;hass:Hass;config:Config;portal:HTMLElement}){
  const [sheet,setSheet]=useState<{id?:string;room?:boolean;back?:{id?:string}}|null>(null);
  const predictedStates = usePredictedStates(hass);
  const closeRoom = () => setSheet(sheet?.back ?? null);
  const [station,setStation]=useState<string|null>(null);
  const prefKey='atc.pro.preferences.'+(hass.user?.id ?? 'local');
  const [prefs,setPrefs]=useState<UserDashboardConfig>(()=>{try{return mergeConfig(DEFAULT_USER_CONFIG,JSON.parse(localStorage.getItem(prefKey)||'{}'));}catch{return DEFAULT_USER_CONFIG;}});
  const [error,report]=useState('');
  const forecasts=useForecast(hass,domain,config.entities);
  const store=useMemo(()=>{
    const graph=dashboardGraph({...hass,states:predictedStates});
    const domainGroups={...graph.domainGroups};
    let resolvedAreas=graph.resolvedAreas;
    if(domain==='area' && config.areas?.length && !sheet?.room){
      resolvedAreas=resolvedAreas.filter(area=>config.areas!.includes(area.area_id));
    }
    if(domain!=='area' && config.entities?.length){
      domainGroups[domain]=config.entities.flatMap(id=>graph.resolvedEntities[id]?[graph.resolvedEntities[id]]:[]);
      if(domain==='person') domainGroups.device_tracker=[];
    }
    if(domain==='weather'){
      domainGroups.weather=(domainGroups.weather ?? []).map(e=>forecasts[e.entity_id]
        ? {...e,attributes:{...e.attributes,...forecasts[e.entity_id]}} : e);
    }
    return {...graph,domainGroups,resolvedAreas,serverUrl:location.origin,selectedWeatherEntityId:station,setSelectedWeatherEntityId:setStation};
  },[predictedStates,sheet?.room,hass.devices,hass.floors,hass.areas,hass.entities,config,station,forecasts,domain]);
  return <Runtime.Provider value={{hass,store,cameraStreams:config.webrtc,config:prefs,report,open:(name,id)=>setSheet(previous=>({id,room:name==='room',back:name==='room' ? (previous?.room ? previous.back : previous ?? undefined) : undefined})),updateConfig:patch=>setPrefs(prev=>{
    const changes=typeof patch==='function'?patch(prev):patch;
    const next=mergeConfig(DEFAULT_USER_CONFIG,mergeDelta(prev,changes));
    try{localStorage.setItem(prefKey,JSON.stringify({rooms:next.rooms,preferences:next.preferences,entities:next.entities}));}catch{}
    return next;
  })}}><UNSAFE_PortalProvider getContainer={()=>portal}>
    {widget ? <Widget room={room} widget={widget} config={config} open={()=>setSheet({})} close={()=>setSheet(null)} item={sheet?.id} show={!!sheet && !sheet.room}/> : <EntityCard key={config.entity} confirm_action={config.confirm_action} display_role={config.display_role} domain={domain} entity={config.entity} title={config.title} size={config.size}/>}
    {sheet?.room && sheet.id && <RoomPageDialog area={sheet.id} onClose={closeRoom}/>}
    {error && <button role="alert" onClick={()=>report('')}>{error}</button>}
  </UNSAFE_PortalProvider></Runtime.Provider>;
}
const font=new FontFace('Plus Jakarta Sans Variable','url('+fontUrl+')',{weight:'200 800'});
document.fonts.add(font);
void font.load().catch(()=>{});
const sheet=new CSSStyleSheet();
sheet.replaceSync(styles.replaceAll(':root',':host')+'\n'+mapStyles+'\n'+roomStyles+'\n:host{display:block;height:100%;min-width:0}.atc-mount{height:100%;min-height:0;background:transparent}');
const picker=(window as Window & {customCards?:{type:string;name:string;description:string;preview:boolean}[]}).customCards??=[];
for(const [id,label,domain,definition] of entries){
  const type='at-home-'+id+'-card';
  const defaultSize:Size = id==='room' || !definition ? '1x1' : presets[definition.defaultSize];
  const allowedSizes = id==='room' ? undefined : definition?.sizes.map(size => presets[size]);
  if(customElements.get(type))continue;
  class ProCard extends HTMLElement{
    private root?:Root;
    private readonly mount=document.createElement('div');
    private readonly layer=document.createElement('div');
    private readonly portal=document.createElement('div');
    private config?:Config;
    private api?:Hass;
    constructor(){super();const shadow=this.attachShadow({mode:'open'});shadow.adoptedStyleSheets=[sheet];shadow.append(this.mount);
      const overlays=this.layer.attachShadow({mode:'open'});overlays.adoptedStyleSheets=[sheet];overlays.append(this.portal);
      this.layer.style.cssText='position:fixed;inset:0;height:0;z-index:10000;pointer-events:none';
      this.portal.style.pointerEvents='auto';
      // A drawer lives outside the dashboard grid. Forward Lit context requests from
      // native HA players to the card, where the dashboard's providers can answer.
      this.layer.addEventListener('context-request',event=>{
        const request=event as Event & {context:unknown;callback:unknown;subscribe?:boolean};
        event.stopPropagation();
        const forwarded=Object.assign(new Event('context-request',{bubbles:true,composed:true}),{
          context:request.context,callback:request.callback,subscribe:request.subscribe,contextTarget:event.composedPath()[0],
        });
        this.dispatchEvent(forwarded);
      });
    }
    static getConfigElement(){return widgetEditor(label,!definition ? entityDomains(domain) : domain==='person'?['person','device_tracker']:[domain],id,[...definition?.designs??[]],defaultSize,allowedSizes);}
    getGridOptions(){return grid(this.config?.size ?? defaultSize,id==='room' || !definition);}
    getCardSize(){if(this.config?.size==='2x0.5')return 2;return (this.config?.size ?? defaultSize).endsWith('2')?7:3;}
    setConfig(config:Config){
      if (!definition && config.entity != null && (typeof config.entity !== 'string' || !entityDomains(domain).includes(config.entity.split('.')[0]))) throw Error('Select a '+domain+' entity');
      if(config.title != null && typeof config.title!=='string')throw Error('Title must be text');
      for(const field of ['entities','areas'] as const){
        if(config[field]!=null && (!Array.isArray(config[field])||config[field].some(id=>typeof id!=='string')))throw Error('Invalid '+field);
      }
      if(config.entities?.some(id=>!(id.startsWith(domain+'.') || (domain==='person' && id.startsWith('device_tracker.')))))throw Error('Choose entities supported by this widget');
      if(config.size && !((id==='room' || !definition) && config.size==='2x0.5') && !Object.hasOwn(sizes,config.size))throw Error('Unknown tile size');
      const legacyTallCamera = id==='cameras' && config.size==='1x2';
      this.config=legacyTallCamera ? {...config,size:defaultSize} : config;
      this.render();
    }
    set hass(value:Hass){this.api=value;setConnection(value);this.render();}
    connectedCallback(){this.root=createRoot(this.mount);document.body.append(this.layer);this.render();}
    disconnectedCallback(){this.root?.unmount();this.root=undefined;this.layer.remove();}
    private render(){if(!this.api||!this.config||!this.root)return;
      const dark=this.api.themes?.darkMode??matchMedia('(prefers-color-scheme: dark)').matches;
      this.mount.className=(dark?'dark ':'')+'pro atc-mount flex flex-col';
      this.portal.className=(dark?'dark ':'')+'pro';
      this.mount.dataset.page=id==='room' || !definition ? 'rooms' : 'overview';
      this.portal.dataset.page=definition?'overview':'rooms';
      this.mount.dataset.theme=this.portal.dataset.theme=dark?'dark':'light';
      this.root.render(<HostDarkMode.Provider value={dark}><Host room={id==='room'} widget={definition as WidgetDefinition<unknown>} domain={domain} hass={this.api} config={this.config} portal={this.portal}/></HostDarkMode.Provider>);
    }
  }
  customElements.define(type,ProCard);
  if(!picker.some(c=>c.type===type))picker.push({type,name:'At Home '+label,description:!definition?'Control one '+domain+' using its HAD entity tile':id==='room'?'A single HAD room tile with readings and quick actions':definition.designs?.[0].description??label,preview:true});
}
