import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinGameForm } from './JoinGameForm';

// Mock next/navigation
const mockPush = mock(() => {});
const mockSearchParams = new URLSearchParams();
mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  useSearchParams: () => mockSearchParams,
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
const mockJoinGame = mock(() =>
  Promise.resolve({
    gameId: 'game-123',
    gameCode: 'WXYZ',
    playerId: 'player-789',
    playerName: 'Test Player',
  })
);
mock.module('@/lib/api', () => ({
  joinGame: mockJoinGame,
}));

describe('JoinGameForm', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetGameSession.mockClear();
    mockJoinGame.mockClear();
    mockJoinGame.mockResolvedValue({
      gameId: 'game-123',
      gameCode: 'WXYZ',
      playerId: 'player-789',
      playerName: 'Test Player',
    });
    // Clear search params
    mockSearchParams.delete('gameCode');
  });

  describe('rendering', () => {
    test('should render name input and game code input', () => {
      render(<JoinGameForm />);

      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/game code/i)).toBeInTheDocument();
    });

    test('should render submit button', () => {
      render(<JoinGameForm />);

      expect(screen.getByRole('button', { name: /i'm in/i })).toBeInTheDocument();
    });

    test('should have proper placeholder texts', () => {
      render(<JoinGameForm />);

      expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/abc123/i)).toBeInTheDocument();
    });
  });

  describe('input handling', () => {
    test('should convert game code to uppercase on input', async () => {
      const user = userEvent.setup();
      render(<JoinGameForm />);

      const gameCodeInput = screen.getByLabelText(/game code/i);
      await user.type(gameCodeInput, 'abcd');

      expect(gameCodeInput).toHaveValue('ABCD');
    });
  });

  describe('validation', () => {
    test('should show error when name is less than 2 characters', async () => {
      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'A');
      await user.type(screen.getByLabelText(/game code/i), 'ABCD');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument();
    });

    test('should show error when game code is empty', async () => {
      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test User');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      expect(screen.getByText(/game code is required/i)).toBeInTheDocument();
    });

    test('should not show errors initially', () => {
      render(<JoinGameForm />);

      expect(screen.queryByText(/must be at least 2 characters/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/game code is required/i)).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    test('should call joinGame API with uppercase game code and trimmed name', async () => {
      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), '  Test Player  ');
      await user.type(screen.getByLabelText(/game code/i), 'wxyz');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      await waitFor(() => {
        expect(mockJoinGame).toHaveBeenCalledWith('WXYZ', 'Test Player');
      });
    });

    test('should call setGameSession with response data', async () => {
      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test Player');
      await user.type(screen.getByLabelText(/game code/i), 'WXYZ');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      await waitFor(() => {
        expect(mockSetGameSession).toHaveBeenCalledWith('WXYZ', 'player-789', 'Test Player');
      });
    });

    test('should navigate to /game on success', async () => {
      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test Player');
      await user.type(screen.getByLabelText(/game code/i), 'WXYZ');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/game');
      });
    });
  });

  describe('loading state', () => {
    test('should show loading text while submitting', async () => {
      mockJoinGame.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test Player');
      await user.type(screen.getByLabelText(/game code/i), 'WXYZ');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      expect(screen.getByRole('button', { name: /joining/i })).toBeInTheDocument();
    });

    test('should disable inputs while loading', async () => {
      mockJoinGame.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test Player');
      await user.type(screen.getByLabelText(/game code/i), 'WXYZ');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      expect(screen.getByLabelText(/your name/i)).toBeDisabled();
      expect(screen.getByLabelText(/game code/i)).toBeDisabled();
    });
  });

  describe('error handling', () => {
    test('should display error message when API fails', async () => {
      mockJoinGame.mockRejectedValue(new Error('Game not found'));

      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test Player');
      await user.type(screen.getByLabelText(/game code/i), 'INVALID');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      await waitFor(() => {
        expect(screen.getByText(/game not found/i)).toBeInTheDocument();
      });
    });

    test('should handle generic error (non-Error object)', async () => {
      mockJoinGame.mockRejectedValue('Something went wrong');

      const user = userEvent.setup();
      render(<JoinGameForm />);

      await user.type(screen.getByLabelText(/your name/i), 'Test Player');
      await user.type(screen.getByLabelText(/game code/i), 'WXYZ');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to join game/i)).toBeInTheDocument();
      });
    });
  });
});
