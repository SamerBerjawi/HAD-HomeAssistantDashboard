import type { Hass } from './runtime';
// All cards in one HA frontend share its authenticated connection.
let current:Hass | undefined;
export function setConnection(hass:Hass) { current=hass; }
export const haWebSocketService = {
  isDemo:()=>false,
  sendRequest<T>(type:string,data:Record<string,unknown>) {
    if (!current) return Promise.reject(Error('Home Assistant disconnected'));
    return current.callWS<T>({ ...data,type });
  },
};
