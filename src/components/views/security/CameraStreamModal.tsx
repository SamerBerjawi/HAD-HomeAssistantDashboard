/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CameraStreamModal
 * Streamlined camera modal with clean responsive light/dark styling.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { Button } from '@heroui/react';
import { X, VideoCamera, CornersOut, CornersIn } from '@phosphor-icons/react';
import { ResolvedEntity } from '../../../types';
import CameraFeed from '../../camera/CameraFeed';

interface CameraStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: ResolvedEntity | null;
  darkMode?: boolean;
}

export default function CameraStreamModal({
  isOpen,
  onClose,
  camera,
  darkMode = true
}: CameraStreamModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === dialogRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [dialogRef]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      dialogRef.current?.requestFullscreen?.().catch(() => {});
    }
  };

  if (!isOpen || !camera) return null;

  const cameraName = camera.name || camera.attributes?.friendly_name || 'Camera Feed';

  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => { if (!open) onClose(); }}
      isDismissable
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 dark:bg-black/75 backdrop-blur-md modal-safe-viewport"
    >
      <Modal className="contents">
        <Dialog
          ref={dialogRef}
          aria-label={`Camera stream: ${cameraName}`}
          className={`relative w-full outline-none ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-4xl rounded-3xl'} overflow-hidden shadow-2xl border flex flex-col transition-colors duration-200 ${
            darkMode
              ? 'bg-slate-900 border-white/10 shadow-black/60'
              : 'bg-white border-slate-200 shadow-slate-900/20'
          }`}
        >
          {/* Header Bar */}
          <div className={`px-5 py-3.5 flex items-center justify-between border-b ${
            darkMode ? 'border-white/10 bg-slate-950/40' : 'border-slate-100 bg-white'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${
                darkMode
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'bg-slate-100 text-slate-700 border border-slate-200/60'
              }`}>
                <VideoCamera size={20} weight="duotone" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {cameraName}
                </h3>
                {camera.area_id && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    {camera.area_id}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                onPress={toggleFullscreen}
              >
                {isFullscreen ? <CornersIn size={18} /> : <CornersOut size={18} />}
              </Button>
              <Button isIconOnly size="sm" variant="ghost" aria-label="Close" onPress={onClose}>
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* Video Viewport Container */}
          <div className={`relative w-full bg-black ${isFullscreen ? 'flex-1 min-h-0' : 'aspect-video'} overflow-hidden flex items-center justify-center`}>
            <CameraFeed
              camera={camera}
              mode="live"
              darkMode={darkMode}
              showControls={false}
            />
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
