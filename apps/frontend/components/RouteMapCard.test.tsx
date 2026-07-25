import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { RouteMapCard } from './RouteMapCard';
import type { PubLocation } from '@/lib/types';

const pubs: PubLocation[] = [
  { hole: 1, name: 'Crown & Anchor', latitude: 51.5, longitude: -0.1 },
  { hole: 2, name: 'The Bell', latitude: 51.5, longitude: -0.11 },
  { hole: 3, name: 'Ship & Compass', latitude: 51.5, longitude: -0.12 },
];

describe('RouteMapCard', () => {
  test('should summarise the mapped route from first to last pub', () => {
    render(<RouteMapCard pubs={pubs} />);

    expect(screen.getByText('3 pubs mapped')).toBeInTheDocument();
    expect(screen.getByText('Crown & Anchor → Ship & Compass')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit →' })).toHaveAttribute('href', '/game/route');
  });

  test('should prompt to set up a route when none is mapped', () => {
    render(<RouteMapCard pubs={[]} />);

    expect(screen.getByText('No route mapped yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set up →' })).toHaveAttribute('href', '/game/route');
  });

  test('should use the singular for a one-pub route', () => {
    render(<RouteMapCard pubs={[pubs[0]]} />);

    expect(screen.getByText('1 pub mapped')).toBeInTheDocument();
  });
});
