import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { RoutesTable } from './RoutesTable';
import type { RouteHole } from '@/lib/types';

describe('RoutesTable', () => {
  describe('rendering', () => {
    test('should render nothing when holes array is empty', () => {
      const { container } = render(<RoutesTable holes={[]} />);

      expect(container.firstChild).toBeNull();
    });

    test('should render table layout for multiple routes', () => {
      const holes: RouteHole[] = [
        { hole: 1, par: 1, drinks: { 'Route A': 'Tequila', 'Route B': 'Sambuca' } },
      ];
      render(<RoutesTable holes={holes} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Route A')).toBeInTheDocument();
      expect(screen.getByText('Route B')).toBeInTheDocument();
    });

    test('should render single column layout for one route', () => {
      const holes: RouteHole[] = [{ hole: 1, par: 1, drinks: { 'Classic': 'Tequila' } }];
      render(<RoutesTable holes={holes} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.getByText('Tequila')).toBeInTheDocument();
    });
  });

  describe('data display for multiple routes', () => {
    test('should display all holes in order', () => {
      const holes: RouteHole[] = [
        { hole: 1, par: 1, drinks: { 'A': 'Drink1', 'B': 'Drink2' } },
        { hole: 2, par: 2, drinks: { 'A': 'Drink3', 'B': 'Drink4' } },
        { hole: 3, par: 3, drinks: { 'A': 'Drink5', 'B': 'Drink6' } },
      ];
      render(<RoutesTable holes={holes} />);

      expect(screen.getByText('Drink1')).toBeInTheDocument();
      expect(screen.getByText('Drink3')).toBeInTheDocument();
      expect(screen.getByText('Drink5')).toBeInTheDocument();
    });

    test('should display par values correctly', () => {
      const holes: RouteHole[] = [
        { hole: 1, par: 3, drinks: { 'A': 'Beer', 'B': 'Wine' } },
      ];
      render(<RoutesTable holes={holes} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('should display drinks for each route', () => {
      const holes: RouteHole[] = [
        { hole: 1, par: 1, drinks: { 'Route A': 'Tequila', 'Route B': 'Sambuca' } },
      ];
      render(<RoutesTable holes={holes} />);

      expect(screen.getByText('Tequila')).toBeInTheDocument();
      expect(screen.getByText('Sambuca')).toBeInTheDocument();
    });

    test('should use route names as column headers', () => {
      const holes: RouteHole[] = [
        { hole: 1, par: 1, drinks: { 'Hardcore': 'Absinthe', 'Casual': 'Beer' } },
      ];
      render(<RoutesTable holes={holes} />);

      expect(screen.getByText('Hardcore')).toBeInTheDocument();
      expect(screen.getByText('Casual')).toBeInTheDocument();
    });
  });

  describe('data display for single route', () => {
    test('should display hole numbers', () => {
      const holes: RouteHole[] = [
        { hole: 1, par: 1, drinks: { 'Classic': 'Tequila' } },
        { hole: 2, par: 2, drinks: { 'Classic': 'Beer' } },
      ];
      render(<RoutesTable holes={holes} />);

      expect(screen.getByText('Tequila')).toBeInTheDocument();
      expect(screen.getByText('Beer')).toBeInTheDocument();
    });

    test('should display pars', () => {
      const holes: RouteHole[] = [
        { hole: 1, par: 4, drinks: { 'Classic': 'Guinness' } },
      ];
      render(<RoutesTable holes={holes} />);

      expect(screen.getByText('Par 4')).toBeInTheDocument();
    });

    test('should not display route name header', () => {
      const holes: RouteHole[] = [
        { hole: 1, par: 1, drinks: { 'Route A': 'Tequila' } },
      ];
      render(<RoutesTable holes={holes} />);

      expect(screen.queryByText('Route A')).not.toBeInTheDocument();
    });
  });
});
