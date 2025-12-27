import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateGameForm } from './CreateGameForm';

// Mock next/navigation
const mockPush = mock(() => {});
mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    prefetch: mock(() => {}),
  }),
}));

// Mock useLocalStorage
const mockSetGameSession = mock(() => {});
mock.module('@/hooks/useLocalStorage', () => ({
  useLocalStorage: () => ({
    setGameSession: mockSetGameSession,
    getGameCode: () => null,
    getPlayerId: () => null,
    getPlayerName: () => null,
    clearSession: () => {},
  }),
}));

// Mock API
const mockCreateGame = mock(() =>
  Promise.resolve({
    gameId: 'game-123',
    gameCode: 'ABCD',
    playerId: 'player-456',
    playerName: 'Test User',
  })
);
mock.module('@/lib/api', () => ({
  createGame: mockCreateGame,
}));

describe('CreateGameForm', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetGameSession.mockClear();
    mockCreateGame.mockClear();
    mockCreateGame.mockResolvedValue({
      gameId: 'game-123',
      gameCode: 'ABCD',
      playerId: 'player-456',
      playerName: 'Test User',
    });
  });

  describe('rendering', () => {
    test('should render form with name input', () => {
      render(<CreateGameForm />);

      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    });

    test('should render "Create Game" submit button', () => {
      render(<CreateGameForm />);

      expect(screen.getByRole('button', { name: /create game/i })).toBeInTheDocument();
    });

    test('should have proper placeholder text', () => {
      render(<CreateGameForm />);

      expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    test('should show error when name is less than 2 characters', async () => {
      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'A');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument();
    });

    test('should not show error initially', () => {
      render(<CreateGameForm />);

      expect(screen.queryByText(/must be at least 2 characters/i)).not.toBeInTheDocument();
    });

    test('should show error for empty name after whitespace trim', async () => {
      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), '   ');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    test('should call createGame API with trimmed name', async () => {
      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), '  Test User  ');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      await waitFor(() => {
        expect(mockCreateGame).toHaveBeenCalledWith('Test User');
      });
    });

    test('should call setGameSession with response data', async () => {
      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      await waitFor(() => {
        expect(mockSetGameSession).toHaveBeenCalledWith('ABCD', 'player-456', 'Test User');
      });
    });

    test('should navigate to /game on success', async () => {
      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/game');
      });
    });
  });

  describe('loading state', () => {
    test('should show loading text while submitting', async () => {
      mockCreateGame.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument();
    });

    test('should disable input while loading', async () => {
      mockCreateGame.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      expect(screen.getByLabelText(/your name/i)).toBeDisabled();
    });

    test('should disable button while loading', async () => {
      mockCreateGame.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });

  describe('error handling', () => {
    test('should display error message when API fails', async () => {
      mockCreateGame.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('should handle generic error (non-Error object)', async () => {
      mockCreateGame.mockRejectedValue('Something went wrong');

      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create game/i)).toBeInTheDocument();
      });
    });

    test('should reset loading state after error', async () => {
      mockCreateGame.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<CreateGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /create game/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create game/i })).not.toBeDisabled();
      });
    });
  });
});
