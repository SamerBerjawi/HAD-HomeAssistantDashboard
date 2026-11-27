import { CameraWindow } from '../../../src/pro/areas/tiles/security/CameraTiles';
import { OpeningDay } from '../../../src/pro/areas/tiles/security/OpeningTiles';
import { ProCameraPlayer } from './camera';
import { useOpeningHistory } from './opening-history';
import { AmbientMedia } from '../../../src/pro/areas/tiles/ambient/AmbientMedia';
import { VacuumDock } from '../../../src/pro/areas/tiles/machines/VacuumTiles';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button, Modal } from '@heroui/react';
import ThermoScale from '../../../src/pro/areas/tiles/climate/ThermoScale';
import CoverLadder from '../../../src/pro/areas/tiles/cover/CoverLadder';
import ReadingStatus from '../../../src/pro/areas/tiles/reading/ReadingStatus';
import LightHalo from '../../../src/pro/areas/tiles/light/LightHalo';
import FanBreeze from '../../../src/pro/areas/tiles/fan/FanBreeze';
import { AmbientSwitch } from '../../../src/pro/areas/tiles/ambient/AmbientPower';
import { AmbientScene } from '../../../src/pro/areas/tiles/ambient/AmbientScene';
import { applyEntityCustomization, buildAreaTiles } from '../../../src/pro/areas/ha/haRoomTiles';
import { deviceClass, num, OPENING_CLASSES, toTileModel } from '../../../src/pro/areas/ha/haTileModels';
import { tileActionCalls, type HaCall } from '../../../src/pro/areas/ha/haTileActions';
import type { TileAction, TileSize } from '../../../src/pro/areas/tileTypes';
import type { HAState } from '@/types';
import type { EntityDisplayRole } from '@/types/userConfig';
import { useRuntime } from './runtime';

export type EntityOptions = {confirm_action?:boolean; display_role?:EntityDisplayRole};
export function entityDomains(domain:string) {
  if (domain === 'switch') return ['switch','input_boolean'];
  if (domain === 'scene') return ['scene','script','button'];
  return [domain];
}

const tileSizes: Record<string, TileSize> = {'2x0.5':'xs', '1x1':'s', '2x1':'w', '1x2':'t', '2x2':'l'};
type Pending = {base:HAState; change:HaCall; token:number};

// Scripts and buttons do not report a scene activation timestamp. Keep HAD's
// room-local selection shared across sibling cards for this dashboard session.
const sceneSelections = new Map<string, {id:string; at:number}>();
const selectionEvents = new EventTarget();
function observeSelection(notify:() => void) {
  selectionEvents.addEventListener('change', notify);
  return () => selectionEvents.removeEventListener('change', notify);
}

export function EntityCard({entity, domain, title, size, confirm_action, display_role}: EntityOptions & {entity?:string; domain:string; title?:string; size?:string}) {
  const {store,hass,report} = useRuntime();
  const selected = entity && store.resolvedEntities[entity];
  const opening = domain === 'binary_sensor' && selected && OPENING_CLASSES.has(deviceClass(selected) ?? '');
  const history = useOpeningHistory(hass, opening ? entity : undefined);
  const [cameraLive, setCameraLive] = useState(false);
  const scope = JSON.stringify([hass.user?.id, selected && (selected.area_id ?? selected.entity_id)]);
  const lastRun = useSyncExternalStore(observeSelection, () => domain === 'scene' ? sceneSelections.get(scope) : undefined);
  const [pending,setPending] = useState<Pending[]>([]);
  const [confirmation,setConfirmation] = useState<TileAction|null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [measuredSize, setMeasuredSize] = useState<TileSize>();
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => {
      const {width, height} = element.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const wide = width >= 285;
      const tall = height >= 260;
      // A two-row Sections card can exceed 120px. Keep HAD's compact ruler
      // for the short Climate preset, including when a theme adds row spacing.
      const compact = height < 120 || (domain === 'climate' && height < 150) || (size === '2x0.5' && !tall);
      setMeasuredSize(compact ? 'xs' : tall ? (wide ? 'l' : 't') : wide ? 'w' : 's');
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [domain, size, Boolean(selected && (domain !== 'sensor' || selected.state === 'unavailable' || num(selected.state) !== null))]);
  const sequence = useRef(0);
  const timers = useRef(new Set<number>());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!selected || !entityDomains(domain).includes(selected.domain)) {
    return <p className="p-4">{entity ? 'Entity unavailable.' : 'Select an entity in the card editor.'}</p>;
  }

  const base = hass.states[selected.entity_id];
  const current = {...selected, attributes:{...selected.attributes}};
  let activated = false;
  for (const entry of pending) {
    if (entry.base !== base) continue;
    const patch = entry.change.optimistic;
    current.state = patch?.state ?? current.state;
    Object.assign(current.attributes, patch?.attributes);
    activated ||= domain === 'scene';
  }
  const siblings = selected.device_id ? Object.values(store.resolvedEntities).filter(e => e.device_id === selected.device_id && e.entity_id !== selected.entity_id && !e.hidden && !e.disabled_by) : [];
  const raw = toTileModel(current, {room:selected.area?.name ?? '', now:Date.now(), siblings, history, forceInclude:domain !== 'binary_sensor', tempUnit:hass.config?.unit_system?.temperature});
  if (domain === 'binary_sensor' && !opening) return <p className="p-4">Select a door, window, garage door, or opening sensor.</p>;
  if (!raw) return <p className="p-4">This sensor has no numeric reading.</p>;
  if (raw.kind === 'scene') {
    const area = store.resolvedAreas.find(a => a.area_id === selected.area_id);
    const held = area && buildAreaTiles(area,{extraEntities:[selected]}).find(t => t.model.kind === 'scene' && t.model.isOn);
    const heldAt = held?.model.kind === 'scene' ? held.model.lastActivated : null;
    const useLocal = lastRun && Date.now() - lastRun.at < 7200000 && lastRun.at >= (heldAt ?? 0);
    raw.isOn = activated || (useLocal ? lastRun.id === selected.entity_id : held?.entityId === selected.entity_id);
  }
  if (raw.kind === 'camera') raw.live = raw.available && cameraLive;
  const model = applyEntityCustomization(raw, {customName:title,displayRole:display_role});
  function send(action:TileAction) {
    const result = tileActionCalls(model, action);
    if (model.kind === 'camera' && result.local && 'live' in result.local) {
      setCameraLive(Boolean(result.local.live));
    }
    for (const change of result.calls) {
      const token = ++sequence.current;
      const clear = () => setPending(previous => previous.filter(entry => entry.token !== token));
      setPending(previous => [...previous.filter(entry => entry.base === base), {base,change,token}]);
      const timer = window.setTimeout(() => { timers.current.delete(timer); clear(); }, 5000);
      timers.current.add(timer);
      const started = Date.now();
      void hass.callService(change.domain,change.service,change.data,{entity_id:change.entityId}).then(() => {
        if (domain === 'scene' && started >= (sceneSelections.get(scope)?.at ?? 0)) {
          sceneSelections.set(scope,{id:change.entityId,at:started});
          selectionEvents.dispatchEvent(new Event('change'));
        }
      }).catch(() => {
        clearTimeout(timer);
        timers.current.delete(timer);
        clear();
        report('Home Assistant could not complete '+change.domain+'.'+change.service);
      });
    }
  }
  const props = {
    size:measuredSize ?? tileSizes[size ?? '1x1'],
    act:(action:TileAction) => {
      if (confirm_action && (action.type === 'toggle' || action.type === 'activate' || action.type === 'cover')) setConfirmation(action);
      else send(action);
    },
  };
  return <div ref={frame} className="h-full min-h-0 w-full">
    {model.kind === 'camera' && <CameraWindow e={model} {...props} liveView={model.live ? (
      <ProCameraPlayer camera={selected} live className="pointer-events-none absolute inset-0 size-full overflow-hidden" onStatus={status => {
        if (status === 'error') {
          setCameraLive(false);
          report('Home Assistant could not open the camera stream');
        }
      }}/>
    ) : undefined}/>}
    {model.kind === 'opening' && <OpeningDay e={model} {...props} historyAvailable={Boolean(history)}/>}
    {model.kind === 'media' && <AmbientMedia e={model} {...props}/>}
    {model.kind === 'vacuum' && <VacuumDock e={model} {...props}/>}
    {model.kind === 'climate' && <ThermoScale e={model} {...props}/>}
    {model.kind === 'cover' && <CoverLadder e={model} {...props}/>}
    {model.kind === 'reading' && <ReadingStatus e={model} {...props}/>}
    {model.kind === 'light' && <LightHalo e={model} {...props}/>}
    {model.kind === 'fan' && <FanBreeze e={model} {...props}/>}
    {model.kind === 'switch' && <AmbientSwitch e={model} {...props}/>}
    {model.kind === 'scene' && <AmbientScene e={model} {...props}/>}
    <Modal.Backdrop isOpen={Boolean(confirmation)} onOpenChange={open => !open && setConfirmation(null)}>
      <Modal.Container size="sm"><Modal.Dialog aria-label="Confirm action" className="pro" data-page="rooms">
        <Modal.CloseTrigger/><Modal.Header><Modal.Heading>Confirm action</Modal.Heading></Modal.Header>
        <Modal.Body className="flex flex-col gap-4 pb-4">
          <p className="text-sm text-muted">Proceed with action on <span className="font-semibold text-foreground">{model.name}</span>?</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onPress={() => setConfirmation(null)}>Cancel</Button>
            <Button size="sm" variant="primary" onPress={() => {if (confirmation) send(confirmation); setConfirmation(null);}}>Confirm</Button>
          </div>
        </Modal.Body>
      </Modal.Dialog></Modal.Container>
    </Modal.Backdrop>
  </div>;
}
