import { lazy, Suspense, useMemo } from 'react';
import { Modal } from '@heroui/react';
import { buildRoomsPage } from '../../../src/pro/lib/roomsPage';
import { useRuntime } from './runtime';

const RoomPage = lazy(() => import('../../../src/pro/pages/room/RoomPage'));

export function RoomPageDialog({area, onClose}: {area:string; onClose:()=>void}) {
  const {store,config,open} = useRuntime();
  const rooms = useMemo(
    () => buildRoomsPage(store.resolvedAreas, store.floors, config.rooms?.favoriteAreas, [], {overrides:config.rooms?.areaOverrides}).rooms,
    [store.resolvedAreas, store.floors, config.rooms?.favoriteAreas, config.rooms?.areaOverrides],
  );
  return (
    <Modal.Backdrop isOpen onOpenChange={isOpen => {if (!isOpen) onClose();}}>
      <Modal.Container size="full">
        <Modal.Dialog aria-label={rooms.find(room => room.areaId === area)?.name ?? 'Room'} className="pro" data-page="rooms">
          <Modal.CloseTrigger/>
          <Modal.Body className="min-h-0 overflow-y-auto p-3 sm:p-5">
            <Suspense fallback={null}>
              <RoomPage key={area} areaId={area} rooms={rooms} onBack={onClose} onOpenRoom={id => open('room', id)}/>
            </Suspense>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
