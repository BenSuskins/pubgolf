import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import HowToPlayPage from './page';

// Mock APIs with controlled promises
const mockGetPenaltyOptions = mock(() => Promise.resolve({
  penalties: [
    { type: 'SKIP', name: 'Skip', points: 5 },
    { type: 'CHUNDER', name: 'Chunder', points: 10 }
  ]
}));

const mockGetRoutes = mock(() => Promise.resolve({
  holes: [
    { hole: 1, par: 1, drinks: { 'Route A': 'Beer', 'Route B': 'Wine' } }
  ]
}));

mock.module('@/lib/api', () => ({
  getPenaltyOptions: mockGetPenaltyOptions,
  getRoutes: mockGetRoutes,
}));

mock.module('next/navigation', () => ({
  useRouter: () => ({
    back: mock(() => {}),
  }),
}));

describe('HowToPlayPage', () => {
  beforeEach(() => {
    mockGetPenaltyOptions.mockClear();
    mockGetRoutes.mockClear();
    mockGetPenaltyOptions.mockImplementation(() => Promise.resolve({
      penalties: [
        { type: 'SKIP', name: 'Skip', points: 5 },
        { type: 'CHUNDER', name: 'Chunder', points: 10 }
      ]
    }));
    mockGetRoutes.mockImplementation(() => Promise.resolve({
      holes: [
        { hole: 1, par: 1, drinks: { 'Route A': 'Beer', 'Route B': 'Wine' } }
      ]
    }));
  });

  describe('loading states', () => {
    test('should show penalties skeleton while loading', () => {
      mockGetPenaltyOptions.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      render(<HowToPlayPage />);

      expect(screen.getByLabelText(/loading penalties/i)).toBeInTheDocument();
    });

    test('should show routes skeleton while loading', () => {
      mockGetRoutes.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      render(<HowToPlayPage />);

      expect(screen.getByLabelText(/loading course/i)).toBeInTheDocument();
    });

    test('should hide penalties skeleton after data loads', async () => {
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/loading penalties/i)).not.toBeInTheDocument();
      });
    });

    test('should hide routes skeleton after data loads', async () => {
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/loading course/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('data display', () => {
    test('should render penalties after loading', async () => {
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.getByText('Skip')).toBeInTheDocument();
        expect(screen.getByText('Chunder')).toBeInTheDocument();
      });
    });

    test('should render routes table after loading', async () => {
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.getByText('Route A')).toBeInTheDocument();
      });
    });

    test('should render static rules immediately', () => {
      render(<HowToPlayPage />);

      expect(screen.getByText(/finish your drink in as few sips/i)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    test('should handle penalty API failure gracefully', async () => {
      mockGetPenaltyOptions.mockImplementation(() => Promise.reject(new Error('Network error')));
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/loading penalties/i)).not.toBeInTheDocument();
      });
    });

    test('should handle routes API failure gracefully', async () => {
      mockGetRoutes.mockImplementation(() => Promise.reject(new Error('Network error')));
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/loading course/i)).not.toBeInTheDocument();
      });
    });
  });
});
