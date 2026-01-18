'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RouteData } from '@/lib/types';

interface GameMapProps {
  routeData: RouteData;
  userLocation?: [number, number];
}

export default function GameMap({ routeData, userLocation }: GameMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || routeData.pubs.length === 0) return;

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
        center: [routeData.pubs[0].longitude, routeData.pubs[0].latitude],
        zoom: 13,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    const markers: maplibregl.Marker[] = [];
    routeData.pubs.forEach((pub) => {
      const el = document.createElement('div');
      el.className = 'w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full border-3 border-white shadow-xl font-bold cursor-pointer hover:bg-blue-700 transition-colors';
      el.textContent = String(pub.hole);

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold mb-2">${pub.name}</h3>
          <a
            href="https://maps.google.com/maps?daddr=${pub.latitude},${pub.longitude}&directionsmode=walking"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline text-sm"
          >
            Get Directions →
          </a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pub.longitude, pub.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.push(marker);
    });

    if (userLocation) {
      const userEl = document.createElement('div');
      userEl.className = 'w-4 h-4 bg-blue-400 rounded-full border-2 border-white shadow-lg';

      const userMarker = new maplibregl.Marker({ element: userEl })
        .setLngLat(userLocation)
        .addTo(map.current!);

      markers.push(userMarker);
    }

    if (routeData.route) {
      map.current.on('load', () => {
        if (!map.current) return;

        if (!map.current.getSource('route')) {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: routeData.route!,
            },
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8,
            },
          });
        }
      });
    }

    const bounds = new maplibregl.LngLatBounds();
    routeData.pubs.forEach((pub) => bounds.extend([pub.longitude, pub.latitude]));
    if (userLocation) bounds.extend(userLocation);
    map.current.fitBounds(bounds, { padding: 80 });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [routeData, userLocation]);

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return <div ref={mapContainer} className="w-full h-full" />;
}
