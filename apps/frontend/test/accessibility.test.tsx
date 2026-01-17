import { describe, test, expect, mock } from 'bun:test';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CreateGameForm } from '@/components/CreateGameForm';
import { JoinGameForm } from '@/components/JoinGameForm';
import { ScoreboardTable } from '@/components/ScoreboardTable';
import { SlotMachine } from '@/components/SlotMachine';
import { Toast } from '@/components/Toast';
import { EventBanner } from '@/components/EventBanner';
import { Player, ActiveEvent } from '@/lib/types';

// Mock next/navigation
const mockPush = mock(() => {});
const mockReplace = mock(() => {});
mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

// Mock useLocalStorage
mock.module('@/hooks/useLocalStorage', () => ({
  useLocalStorage: () => ({
    setGameSession: mock(() => {}),
    getGameCode: () => null,
    getPlayerId: () => null,
    getPlayerName: () => null,
    clearSession: () => {},
  }),
}));

// Mock API
mock.module('@/lib/api', () => ({
  createGame: mock(() =>
    Promise.resolve({
      gameId: 'game-123',
      gameCode: 'ABCD',
      playerId: 'player-456',
      playerName: 'Test User',
    })
  ),
  joinGame: mock(() =>
    Promise.resolve({
      gameCode: 'ABCD',
      playerId: 'player-456',
      playerName: 'Test User',
    })
  ),
}));

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Forms', () => {
    test('CreateGameForm has no accessibility violations', async () => {
      const { container } = render(<CreateGameForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('JoinGameForm has no accessibility violations', async () => {
      const { container } = render(<JoinGameForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Components', () => {
    test('ScoreboardTable has no accessibility violations', async () => {
      const players: Player[] = [
        {
          id: '1',
          name: 'Player One',
          scores: [1, 2, 3, 2, 2, 2, 4, 1, 1],
          totalScore: 18,
          randomise: null,
          penalties: [],
        },
        {
          id: '2',
          name: 'Player Two',
          scores: [1, 3, 2, 2, 2, 2, 4, 1, 1],
          totalScore: 18,
          randomise: null,
          penalties: [],
        },
      ];
      const pars = [1, 3, 2, 2, 2, 2, 4, 1, 1];

      const { container } = render(
        <ScoreboardTable players={players} pars={pars} hostPlayerId="1" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('SlotMachine has no accessibility violations', async () => {
      const { container } = render(
        <SlotMachine
          items={['Option 1', 'Option 2', 'Option 3']}
          winningIndex={null}
          spinning={false}
          onSpinEnd={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Toast has no accessibility violations', async () => {
      const { container } = render(
        <Toast message="Test notification" onDismiss={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('EventBanner has no accessibility violations', async () => {
      const event: ActiveEvent = {
        id: 'event-1',
        title: 'Test Event',
        description: 'This is a test event',
        activeFrom: 1,
        activeTo: 5,
      };

      const { container } = render(<EventBanner event={event} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
