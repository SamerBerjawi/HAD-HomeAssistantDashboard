import { useEffect, useRef, useState } from 'react';
import type { CameraAiDetection, CameraAiDetectionKind } from '../lib/securityCameras';

export type CameraAiModelStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CocoPrediction {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface CocoModel {
  detect: (
    img: HTMLVideoElement,
    maxNumBoxes?: number,
    minScore?: number
  ) => Promise<CocoPrediction[]>;
}

const DETECT_INTERVAL_MS = 1000;
const MIN_SCORE = 0.55;

const CLASS_MAP: Record<string, { kind: CameraAiDetectionKind; label: string }> = {
  person: { kind: 'person', label: 'Person' },
  car: { kind: 'vehicle', label: 'Vehicle' },
  truck: { kind: 'vehicle', label: 'Vehicle' },
  bus: { kind: 'vehicle', label: 'Vehicle' },
  motorcycle: { kind: 'vehicle', label: 'Vehicle' },
  bicycle: { kind: 'vehicle', label: 'Vehicle' },
  dog: { kind: 'animal', label: 'Animal' },
  cat: { kind: 'animal', label: 'Animal' },
  bird: { kind: 'animal', label: 'Animal' },
  horse: { kind: 'animal', label: 'Animal' },
  backpack: { kind: 'package', label: 'Package' },
  suitcase: { kind: 'package', label: 'Package' },
  handbag: { kind: 'package', label: 'Package' }
};

let modelPromise: Promise<CocoModel> | null = null;

async function loadDetectorModel(): Promise<CocoModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [tf, cocoSsd] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/coco-ssd')
      ]);
      await tf.ready();
      return cocoSsd.load({ base: 'lite_mobilenet_v2' });
    })().catch((err) => {
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

/**
 * Experimental opt-in on-device object detection (TensorFlow.js + COCO-SSD `lite_mobilenet_v2`).
 * Lazy-loaded only when `enabled` is true; runs at ~1 FPS on a live `<video>` while tab is visible.
 */
export function useCameraObjectDetection(
  getVideo: () => HTMLVideoElement | null,
  enabled: boolean
): { detections: CameraAiDetection[]; modelStatus: CameraAiModelStatus } {
  const [detections, setDetections] = useState<CameraAiDetection[]>([]);
  const [modelStatus, setModelStatus] = useState<CameraAiModelStatus>('idle');
  const getVideoRef = useRef(getVideo);
  getVideoRef.current = getVideo;

  useEffect(() => {
    if (!enabled) {
      setDetections([]);
      setModelStatus('idle');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    setModelStatus('loading');

    loadDetectorModel()
      .then((model) => {
        if (cancelled) return;
        setModelStatus('ready');

        const runOnce = async () => {
          if (cancelled) return;
          const video = getVideoRef.current();
          if (
            video &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0 &&
            document.visibilityState === 'visible'
          ) {
            try {
              const preds = await model.detect(video, 8, MIN_SCORE);
              if (cancelled) return;
              const best = new Map<CameraAiDetectionKind, { label: string; score: number }>();
              for (const p of preds) {
                const mapped = CLASS_MAP[p.class];
                if (!mapped) continue;
                const prev = best.get(mapped.kind);
                if (!prev || p.score > prev.score) {
                  best.set(mapped.kind, { label: mapped.label, score: p.score });
                }
              }
              const next: CameraAiDetection[] = [...best.entries()].map(([kind, info]) => ({
                kind,
                label: `${info.label} ${Math.round(info.score * 100)}%`,
                entityId: `local_ai:${kind}`
              }));
              setDetections(next);
            } catch {
              // Ignore transient frame decode glitches and try again next tick.
            }
          }
          if (!cancelled) {
            timer = setTimeout(() => void runOnce(), DETECT_INTERVAL_MS);
          }
        };

        void runOnce();
      })
      .catch(() => {
        if (!cancelled) setModelStatus('error');
      });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  return { detections, modelStatus };
}
