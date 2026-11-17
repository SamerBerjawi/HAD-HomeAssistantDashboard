/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modal, ModalBody, ModalHeader } from '@/components/base/modal/modal';
import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Lock, LockOpen, ArrowRight, ShieldCheck } from '@phosphor-icons/react';

interface UnlockConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUnlock: () => Promise<void>;
  vehicleName?: string;
  darkMode?: boolean;
}

export function UnlockConfirmModal({
  isOpen,
  onClose,
  onConfirmUnlock,
  vehicleName = 'Electric Vehicle',
  darkMode = true
}: UnlockConfirmModalProps) {
  const [sliderPos, setSliderPos] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSliderPos(0);
      setIsUnlocked(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleDrag = (_: unknown, info: { point: { x: number; y: number }; offset: { x: number; y: number } }) => {
    if (!trackRef.current) return;
    const trackWidth = trackRef.current.clientWidth - 56; // 56px handle width
    const progress = Math.min(Math.max(info.offset.x, 0), trackWidth);
    setSliderPos(progress);
  };

  const handleDragEnd = async (_: unknown, info: { offset: { x: number } }) => {
    if (!trackRef.current) return;
    const trackWidth = trackRef.current.clientWidth - 56;
    if (info.offset.x >= trackWidth * 0.8) {
      // Confirmed swipe to unlock
      setIsUnlocked(true);
      setIsSubmitting(true);
      try {
        await onConfirmUnlock();
      } finally {
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } else {
      // Snap back to 0
      setSliderPos(0);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open && !isSubmitting) onClose(); }}
      size="sm"
      aria-label={`Unlock ${vehicleName}`}
    >
      <ModalHeader
        title={`Unlock ${vehicleName}`}
        description="Swipe the slider below to disarm perimeter security and unlock all vehicle doors."
        icon={Lock}
      />
      <ModalBody>
        {/* Swipe to Unlock Slider Track */}
        <div className="mt-3">
          <div
            ref={trackRef}
            className="relative w-full h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 p-1 flex items-center overflow-hidden select-none"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50 pl-6 animate-pulse">
                {isUnlocked ? 'Vehicle Unlocked' : 'Swipe to Unlock →'}
              </span>
            </div>

            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500/30 to-amber-400/50 rounded-2xl pointer-events-none transition-all"
              style={{ width: `${sliderPos + 48}px` }}
            />

            <motion.div
              drag={isSubmitting ? false : 'x'}
              dragConstraints={trackRef}
              dragElastic={0.05}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              animate={isUnlocked ? { x: 260 } : {}}
              className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30 flex items-center justify-center text-slate-950 cursor-grab active:cursor-grabbing shrink-0"
            >
              {isUnlocked ? <LockOpen size={20} weight="bold" /> : <ArrowRight size={20} weight="bold" />}
            </motion.div>
          </div>
        </div>

        <div className="mt-4 mb-2 flex items-center justify-center gap-1.5 text-[11px] text-text-tertiary font-medium">
          <ShieldCheck size={14} weight="bold" className="text-emerald-500" />
          <span>Encrypted Home Assistant Vehicle Command</span>
        </div>
      </ModalBody>
    </Modal>
  );
}
