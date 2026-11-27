import { applyPrediction, pendingRollback } from './optimistic';
import { createContext, useCallback, useContext } from 'react';
import { DEFAULT_USER_CONFIG, type UserDashboardConfig } from '@/types/userConfig';
import type { resolveHAGraph } from '@/services/graphResolution';
import type { HAArea, HADevice, HAEntityRegistryEntry, HAFloor, HAState, ResolvedEntity } from '@/types';

export interface Hass {
  config?: {unit_system?: {temperature?:string}};
  user?: {id:string};
  states: Record<string,HAState>;
  areas?: Record<string,HAArea>;
  floors?: Record<string,HAFloor>;
  devices?: Record<string,HADevice>;
  entities?: Record<string,HAEntityRegistryEntry & { hidden?: boolean }>;
  themes?: {darkMode?:boolean};
  callWS<T>(message: Record<string,unknown>):Promise<T>;
  connection?: {subscribeMessage<T>(callback:(data:T)=>void,message:Record<string,unknown>):Promise<()=>void>};
  callService(domain:string,service:string,data:Record<string,unknown>,target?:Record<string,unknown>):Promise<unknown>;
}
type ModelStore = ReturnType<typeof resolveHAGraph> & {
  states:Hass['states']; areas:HAArea[]; floors:HAFloor[]; devices:HADevice[]; entityRegistry:HAEntityRegistryEntry[];
  serverUrl:string; selectedWeatherEntityId:string|null; setSelectedWeatherEntityId:(id:string)=>void;
};
export const Runtime = createContext<{
  cameraStreams?:Record<string, Record<string, unknown>>; hass:Hass; store:ModelStore; open:(sheet:string,id?:string)=>void;
  config:UserDashboardConfig; updateConfig:(patch:Partial<UserDashboardConfig>|((prev:UserDashboardConfig)=>Partial<UserDashboardConfig>))=>void;
  report:(message:string)=>void;
} | null>(null);
export function useRuntime() {
  const value=useContext(Runtime);
  if (!value) throw Error('Missing ATC widget context');
  return value;
}
export function useAutoLayoutStore<T>(select:(state:ModelStore)=>T) {return select(useRuntime().store);}
const ignore = () => {};
async function uploadRoomPhoto(file: File) {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 5_000_000) throw Error('Unsupported photo');
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
export function useUserConfig() {
  const runtime = useRuntime();
  return {...runtime, setDragActive:ignore, uploadVehicleAsset:uploadRoomPhoto, currentUser:runtime.hass.user};
}
export function useLayoutScope() {
  const {config,updateConfig}=useRuntime();
  const saveScopedPrefs = useCallback(async (patch:Record<string, unknown>) => {
    updateConfig({preferences:patch});
  }, [updateConfig]);
  return {
    effectivePrefs:config.preferences ?? {},
    effectiveFavorites:config.rooms?.favoriteAreas ?? [],
    scope:{activeTarget:'shared',canEditShared:true,userId:null,shareEnabled:false,isAdmin:false},
    saveScopedPrefs, setAdminTarget:ignore, toggleShareEnabled:ignore, forkToPersonal:ignore, revertToShared:ignore,
  };
}
export function useOpenSheet() {return useRuntime().open;}
export function useServiceCall() {
  const {hass,report}=useRuntime();
  return {
    call:async(domain:string,service:string,data:Record<string,unknown>,entityId:string|string[])=>{
      const rollback = pendingRollback(hass, entityId);
      try { await hass.callService(domain,service,data,{entity_id:entityId}); }
      catch { rollback(); report('Home Assistant could not complete '+domain+'.'+service); }
    },
    setOptimistic:(id:string,state:string|null,attributes?:Record<string, unknown>)=>applyPrediction(hass,id,state,attributes),
  };
}
export function useHaPicture(raw?:string|null) { return raw || ''; }
export function useHAImage(raw?:string|null) { return {imageUrl:raw || ''}; }
export function getConfiguredRtspCameras(_:unknown,cameras:ResolvedEntity[]) {return cameras.filter(c=>!c.hidden && !c.disabled_by);}
export { DEFAULT_USER_CONFIG };

export function useOpenArea() { const {open}=useRuntime(); return (id:string)=>open('room',id); }

export function resolveHAImageUrl(raw?:string|null, serverUrl?:string|null) {
  if (!raw) return '';
  try { return new URL(raw, serverUrl || location.origin).href; } catch { return ''; }
}
