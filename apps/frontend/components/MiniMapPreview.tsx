'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Pub } from '@/lib/types';

interface MiniMapPreviewProps {
  pubs: Pub[];
}

export default function MiniMapPreview({ pubs }: MiniMapPreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || pubs.length === 0) return;

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors © CARTO',
            },
          },
          layers: [
            {
              id: 'carto-dark',
              type: 'raster',
              source: 'carto-dark',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [pubs[0].longitude, pubs[0].latitude],
        zoom: 12,
      });
    }

    const markers: maplibregl.Marker[] = [];
    pubs.forEach((pub, index) => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full border-2 border-white shadow-lg font-bold text-sm';
      el.textContent = String(index + 1);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pub.longitude, pub.latitude])
        .addTo(map.current!);

      markers.push(marker);
    });

    const bounds = new maplibregl.LngLatBounds();
    pubs.forEach((pub) => bounds.extend([pub.longitude, pub.latitude]));
    map.current.fitBounds(bounds, { padding: 50 });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [pubs]);

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (pubs.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-64 rounded-md overflow-hidden border border-[var(--color-border)]">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
