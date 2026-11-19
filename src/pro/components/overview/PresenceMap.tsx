/**
 * Optimized, viewport-lazy OpenStreetMap component using a minimal dark/light basemap layer and
 * Leaflet member markers (docs/pro-ui/DESIGN.md 7.6).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { HugeiconsIcon } from '@hugeicons/react';
import { MapsLocation01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import {
  getProMinimalBasemapConfig,
  type ProPersonPresenceItem,
  type ProPresenceTone
} from '../../lib/overviewPresence';

const MARKER_COLORS: Record<ProPresenceTone, { bg: string; ring: string }> = {
  success: { bg: '#10b981', ring: 'rgba(16, 185, 129, 0.32)' },
  accent: { bg: '#3b82f6', ring: 'rgba(59, 130, 246, 0.32)' },
  default: { bg: '#64748b', ring: 'rgba(100, 116, 139, 0.28)' }
};

function useDocumentDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    if (document.documentElement.classList.contains('dark')) return true;
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const sync = () => {
      const rootDark = document.documentElement.classList.contains('dark');
      setIsDark(rootDark);
    };
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMemberDivIcon(
  initials: string,
  tone: ProPresenceTone,
  selected: boolean,
  isDark: boolean
): L.DivIcon {
  const palette = MARKER_COLORS[tone];
  const borderColor = isDark ? '#18181b' : '#ffffff';
  const size = selected ? 34 : 28;
  const fontSize = selected ? 11 : 10;
  const safeInitials = escapeHtml(initials);

  return L.divIcon({
    className: 'pro-presence-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 9999px;
        background: ${palette.bg};
        border: 2px solid ${borderColor};
        box-shadow: ${selected ? `0 0 0 6px ${palette.ring}, ` : ''}0 4px 10px rgba(0,0,0,0.32);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: ${fontSize}px;
        font-weight: 700;
        font-family: ui-sans-serif, system-ui, sans-serif;
        letter-spacing: -0.02em;
        transition: transform 0.15s ease;
      ">${safeInitials}</div>
    `
  });
}

function MapViewportSync({
  center,
  zoom,
  containerEl
}: {
  center: [number, number];
  zoom: number;
  containerEl: HTMLDivElement | null;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center[0], center[1], zoom]);

  useEffect(() => {
    if (!containerEl) return;
    let rafId = 0;
    const scheduleInvalidate = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
      });
    };
    scheduleInvalidate();
    const timer = window.setTimeout(scheduleInvalidate, 240);
    const observer = new ResizeObserver(scheduleInvalidate);
    observer.observe(containerEl);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [map, containerEl]);

  return null;
}

export interface PresenceMapProps {
  members: ProPersonPresenceItem[];
  activeMemberId?: string;
  onSelectMember?: (entityId: string) => void;
  variant: 'widget' | 'sheet';
  height?: number;
  zoom?: number;
  className?: string;
}

export default function PresenceMap({
  members,
  activeMemberId,
  onSelectMember,
  variant,
  height = 176,
  zoom = 15,
  className
}: PresenceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(variant === 'sheet');
  const isDark = useDocumentDarkMode();
  const basemap = useMemo(() => getProMinimalBasemapConfig(isDark), [isDark]);

  useEffect(() => {
    if (inView) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  const pinnedMembers = useMemo(
    () => members.filter((m) => m.latitude !== undefined && m.longitude !== undefined),
    [members]
  );

  const activeMember = useMemo(
    () =>
      pinnedMembers.find((m) => m.entityId === activeMemberId) ||
      pinnedMembers.find((m) => m.isHome) ||
      pinnedMembers[0],
    [pinnedMembers, activeMemberId]
  );

  const center: [number, number] | null =
    activeMember?.latitude !== undefined && activeMember?.longitude !== undefined
      ? [activeMember.latitude, activeMember.longitude]
      : null;

  const isSheet = variant === 'sheet';

  if (!center) {
    return (
      <div
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-default/50 p-4 text-center',
          className
        )}
        style={{ height }}
      >
        <HugeiconsIcon icon={MapsLocation01Icon} size={22} className="text-muted" />
        <p className="text-xs font-medium text-foreground">Location coordinates unavailable</p>
        <p className="text-[11px] text-muted">Configure zones or device GPS tracking in Home Assistant.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label="OpenStreetMap household locations"
      className={cn('relative w-full overflow-hidden rounded-2xl', basemap.containerBgClass, className)}
      style={{ height }}
    >
      {inView ? (
        <MapContainer
          center={center}
          zoom={zoom}
          zoomControl={false}
          attributionControl={false}
          dragging={isSheet}
          scrollWheelZoom={isSheet}
          doubleClickZoom={isSheet}
          touchZoom={isSheet}
          boxZoom={isSheet}
          keyboard={isSheet}
          className="z-0 h-full w-full"
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            key={isDark ? 'osm-dark' : 'osm-light'}
            url={basemap.primaryTileUrl}
            maxZoom={19}
            keepBuffer={1}
            updateWhenIdle={true}
            updateWhenZooming={false}
            detectRetina={true}
            className={basemap.tileClassName}
          />

          <MapViewportSync center={center} zoom={zoom} containerEl={containerRef.current} />

          {pinnedMembers.map((member) => {
            const selected = member.entityId === activeMember?.entityId;
            return (
              <Marker
                key={`${member.entityId}-${member.statusTone}-${selected ? 'sel' : 'idle'}-${isDark ? 'd' : 'l'}`}
                position={[member.latitude!, member.longitude!]}
                zIndexOffset={selected ? 250 : 0}
                icon={buildMemberDivIcon(member.initials, member.statusTone, selected, isDark)}
                eventHandlers={{
                  click: () => onSelectMember?.(member.entityId)
                }}
              />
            );
          })}
        </MapContainer>
      ) : null}
    </div>
  );
}
