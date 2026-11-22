/**
 * Where the car is parked: a small, still OpenStreetMap (same minimal basemap as Presence) with one
 * car pin. Lazy-loaded (Leaflet) and only drawn once on screen.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { cn } from '@/lib/utils';
import { getProMinimalBasemapConfig } from '../../../lib/overviewPresence';

export default function CarMap({ lat, lon, dark, label, className }: { lat: number; lon: number; dark: boolean; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const basemap = getProMinimalBasemapConfig(dark);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (setInView(true), io.disconnect()), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        html: '<span style="display:block;width:22px;height:22px;border-radius:9999px;background:hsl(212 90% 52%);border:3px solid white;box-shadow:0 0 0 6px hsla(212,90%,52%,0.25),0 2px 6px rgba(0,0,0,.3)"></span>'
      }),
    []
  );
  return (
    <div ref={ref} role="img" aria-label={`Map: ${label}`} className={cn('relative isolate overflow-hidden', basemap.containerBgClass, className)}>
      {inView ? (
        <MapContainer
          key={`${lat},${lon}`}
          center={[lat, lon]}
          zoom={15}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        >
          <TileLayer url={basemap.primaryTileUrl} className={basemap.tileClassName} />
          <Marker position={[lat, lon]} icon={icon} interactive={false} />
        </MapContainer>
      ) : null}
    </div>
  );
}
