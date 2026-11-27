import { forwardRef,useEffect,useImperativeHandle,useRef,useState } from 'react';
import { useRuntime } from './runtime';
import type { ProCameraPlayerHandle } from '../../../src/pro/components/security/ProCameraPlayer';
import type { ResolvedEntity } from '@/types';
export const ProCameraPlayer=forwardRef<ProCameraPlayerHandle,{
  camera:ResolvedEntity;live:boolean;className?:string;onStatus?:(status:'live'|'idle'|'error')=>void
}>(function Player({camera,live,className,onStatus},ref){
  const {hass, cameraStreams} = useRuntime();
  const options = cameraStreams?.[camera.entity_id];
  const host = useRef<HTMLDivElement>(null);
  type Stream = HTMLElement & {hass:typeof hass; stateObj?:unknown; muted?:boolean; allowExoPlayer?:boolean; setConfig?:(config:Record<string, unknown>)=>void};
  const player = useRef<Stream | null>(null);
  const latest = useRef({hass, onStatus});
  latest.current = {hass, onStatus};
  const [registered, setRegistered] = useState(() => !!customElements.get('webrtc-camera'));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (registered || !live) return;
    let active = true;
    void customElements.whenDefined('webrtc-camera').then(() => { if (active) setRegistered(true); });
    return () => { active = false; };
  }, [registered, live]);
  useEffect(() => {
    const container = host.current;
    if (!container || !live) return;
    let active = true;
    let timer:ReturnType<typeof setInterval> | undefined;
    async function mount() {
      const tag = registered ? 'webrtc-camera' : 'ha-camera-stream';
      if (!registered && !customElements.get(tag)) {
        const dashboard = window as Window & {loadCardHelpers?:()=>Promise<{importMoreInfoControl:(domain:string)=>Promise<unknown>}>};
        await (await dashboard.loadCardHelpers?.())?.importMoreInfoControl('camera');
        await customElements.whenDefined(tag);
      }
      if (!active) return;
      const stream = document.createElement(tag) as Stream;
      const current = latest.current.hass;
      if (registered) {
        const source = options?.url || options?.streams ? {} : {entity:camera.entity_id};
        stream.setConfig!({muted:true, ...source, ...options, type:'custom:webrtc-camera'});
      } else {
        stream.stateObj = current.states[camera.entity_id];
        stream.muted = true;
        stream.allowExoPlayer = false;
      }
      stream.hass = current;
      stream.style.cssText = 'display:block;width:100%;height:100%';
      player.current = stream;
      container!.append(stream);
      timer = setInterval(() => {
        const media = video();
        latest.current.onStatus?.(media?.error ? 'error' : media && media.readyState >= 2 ? 'live' : 'idle');
      }, 1000);
    }
    void mount().catch(() => { if (active) latest.current.onStatus?.('error'); });
    return () => {
      active = false;
      clearInterval(timer);
      player.current?.remove();
      player.current = null;
    };
  }, [camera.entity_id, live, registered, options, attempt]);
  useEffect(() => {
    const stream = player.current;
    if (!stream) return;
    stream.hass = hass;
    if (stream.localName === 'ha-camera-stream') stream.stateObj = hass.states[camera.entity_id];
  }, [hass, camera.entity_id]);
  function video():HTMLVideoElement|null {
    function find(root:ShadowRoot|HTMLElement):HTMLVideoElement|null {
      const direct=root.querySelector('video'); if(direct)return direct;
      for(const el of root.querySelectorAll('*')) if(el.shadowRoot){const v=find(el.shadowRoot);if(v)return v;}
      return null;
    }
    return host.current ? find(host.current):null;
  }
  useImperativeHandle(ref,()=>({get video(){return video();},enterFullscreen:()=>{void host.current?.requestFullscreen();},retry:()=>setAttempt(value=>value+1)}));
  return <div ref={host} className={className}>{!live && camera.attributes.entity_picture && <img className="size-full object-cover" alt={camera.name} src={camera.attributes.entity_picture}/>}</div>;
});
export async function captureAndDownloadSnapshot(video:HTMLVideoElement|null,entity:ResolvedEntity){
  if(!video?.videoWidth)return false;
  try {
    const canvas=document.createElement('canvas'); canvas.width=video.videoWidth;canvas.height=video.videoHeight;
    canvas.getContext('2d')?.drawImage(video,0,0);const a=document.createElement('a');a.href=canvas.toDataURL('image/jpeg');a.download=entity.entity_id+'.jpg';a.click();return true;
  }catch{return false;}
}
export { getCameraMotionStatus } from '../../../src/services/cameraIntegrationService';
