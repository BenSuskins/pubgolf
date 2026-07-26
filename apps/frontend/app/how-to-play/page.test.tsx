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

const mockGetGameState = mock(() => Promise.resolve({
  holes: [
    { hole: 1, par: 4, drinks: { 'Ale Trail': 'Guinness' } }
  ]
}));

mock.module('@/lib/api', () => ({
  getPenaltyOptions: mockGetPenaltyOptions,
  getRoutes: mockGetRoutes,
  getGameState: mockGetGameState,
}));

// No stored game by default, so the page falls back to the default course.
const mockGetGameCode = mock<() => string | null>(() => null);
mock.module('@/hooks/useLocalStorage', () => ({
  useLocalStorage: () => ({
    getGameCode: mockGetGameCode,
    getPlayerId: () => null,
    setGameSession: () => {},
    clearSession: () => {},
  }),
}));

mock.module('next/navigation', () => ({
  useRouter: () => ({
    back: mock(() => {}),
  }),
}));

describe('HowToPlayPage', () => {
  beforeEach(() => {
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
    mockGetPenaltyOptions.mockClear();
    mockGetRoutes.mockClear();
    mockGetGameState.mockClear();
    mockGetGameCode.mockImplementation(() => null);
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

      // Wait for penalty content to appear
      await waitFor(() => {
        expect(screen.getByText('Skip')).toBeInTheDocument();
      });

      // Then verify skeleton is gone
      expect(screen.queryByLabelText(/loading penalties/i)).not.toBeInTheDocument();
    });

    test('should hide routes skeleton after data loads', async () => {
      render(<HowToPlayPage />);

      // Wait for route content to appear
      await waitFor(() => {
        expect(screen.getByText('Route A')).toBeInTheDocument();
      });

      // Then verify skeleton is gone
      expect(screen.queryByLabelText(/loading course/i)).not.toBeInTheDocument();
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

  describe('route rule', () => {
    test('should use generic wording before the course loads', () => {
      mockGetRoutes.mockImplementation(() => new Promise(() => {}));
      render(<HowToPlayPage />);

      expect(
        screen.getByText('Pick your route at the start. No switching mid-game.')
      ).toBeInTheDocument();
    });

    test("should name the course's routes once loaded", async () => {
      mockGetRoutes.mockImplementation(() => Promise.resolve({
        holes: [
          {
            hole: 1,
            par: 1,
            drinks: {
              'Ale Trail': 'Beer',
              'Spirit Run': 'Vodka',
              'Wine Walk': 'Merlot',
              'Soft Stroll': 'Lemonade',
            },
          },
        ],
      }));
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Pick Ale Trail, Spirit Run, Wine Walk, or Soft Stroll at the start. No switching mid-game.'
          )
        ).toBeInTheDocument();
      });
    });

    test('should drop the choice when the course has one route', async () => {
      mockGetGameCode.mockImplementation(() => 'ACE007');
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Everyone plays Ale Trail. One route, no switching mid-game.')
        ).toBeInTheDocument();
      });
    });

    test('should keep generic wording when the course fails to load', async () => {
      mockGetRoutes.mockImplementation(() => Promise.reject(new Error('Network error')));
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.getByText('Skip')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Pick your route at the start. No switching mid-game.')
      ).toBeInTheDocument();
    });
  });

  describe('game course', () => {
    test("should render the game's own course when in a game", async () => {
      mockGetGameCode.mockImplementation(() => 'ACE007');
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.getByText('Guinness')).toBeInTheDocument();
      });
      expect(mockGetGameState).toHaveBeenCalledWith('ACE007');
      expect(mockGetRoutes).not.toHaveBeenCalled();
    });

    test('should fall back to the default course when not in a game', async () => {
      render(<HowToPlayPage />);

      await waitFor(() => {
        expect(screen.getByText('Route A')).toBeInTheDocument();
      });
      expect(mockGetGameState).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle penalty API failure gracefully', async () => {
      mockGetPenaltyOptions.mockImplementation(() => Promise.reject(new Error('Network error')));
      render(<HowToPlayPage />);

      // Routes still load independently - wait for them
      await waitFor(() => {
        expect(screen.getByText('Route A')).toBeInTheDocument();
      });

      // Verify penalty skeleton is gone (error was handled)
      expect(screen.queryByLabelText(/loading penalties/i)).not.toBeInTheDocument();
    });

    test('should handle routes API failure gracefully', async () => {
      mockGetRoutes.mockImplementation(() => Promise.reject(new Error('Network error')));
      render(<HowToPlayPage />);

      // Penalties still load independently - wait for them
      await waitFor(() => {
        expect(screen.getByText('Skip')).toBeInTheDocument();
      });

      // Verify routes skeleton is gone (error was handled)
      expect(screen.queryByLabelText(/loading course/i)).not.toBeInTheDocument();
    });
  });
});
