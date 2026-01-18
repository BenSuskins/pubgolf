'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoute } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { RouteData } from '@/lib/types';
import GameMap from '@/components/GameMap';

export default function MapPage() {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { getGameCode } = useLocalStorage();

  useEffect(() => {
    const gameCode = getGameCode();
    if (!gameCode) {
      router.push('/');
      return;
    }

    const fetchRouteData = async () => {
      try {
        const data = await getRoute(gameCode);
        if (data.pubs.length === 0) {
          setError('No pub route configured for this game');
          return;
        }
        setRouteData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load route');
      } finally {
        setLoading(false);
      }
    };

    const getUserLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation([position.coords.longitude, position.coords.latitude]);
          },
          (error) => {
            console.log('Geolocation permission denied or unavailable:', error);
          }
        );
      }
    };

    fetchRouteData();
    getUserLocation();
  }, [getGameCode, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error || !routeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-4xl">🗺️</div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Map Not Available</h1>
          <p className="text-[var(--color-text-secondary)]">{error || 'Failed to load map'}</p>
          <Link
            href="/game"
            className="inline-block px-6 py-3 btn-gradient rounded-lg"
          >
            Back to Game
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <Link
          href="/game"
          className="px-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          ← Back to Game
        </Link>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Pub Route Map</h1>
        <div className="w-20" />
      </header>

      <div className="flex-1">
        <GameMap routeData={routeData} userLocation={userLocation} />
      </div>
    </div>
  );
}
