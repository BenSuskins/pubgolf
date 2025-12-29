import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { ScoreboardTable } from './ScoreboardTable';
import { Player } from '@/lib/types';

const createPlayer = (
  id: string,
  name: string,
  scores: (number | null)[],
  totalScore: number,
  randomise: { hole: number; result: string } | null = null,
  penalties: { hole: number; type: 'SKIP' | 'CHUNDER'; points: number }[] = []
): Player => ({
  id,
  name,
  scores,
  totalScore,
  randomise,
  penalties,
});

describe('ScoreboardTable', () => {
  describe('empty state', () => {
    test('should display empty message when no players', () => {
      render(<ScoreboardTable players={[]} />);

      expect(
        screen.getByText(/no players yet/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/rally your crew/i)
      ).toBeInTheDocument();
    });
  });

  describe('table rendering', () => {
    const mockPlayers: Player[] = [
      createPlayer('p1', 'Alice', [1, 2, 2, 2, 2, 2, 4, 1, 1], 17),
      createPlayer('p2', 'Bob', [1, 3, 2, null, null, null, null, null, null], 6),
    ];

    test('should render table with correct headers (holes 1-9 and Total)', () => {
      render(<ScoreboardTable players={mockPlayers} />);

      expect(screen.getByText('Player')).toBeInTheDocument();
      for (let i = 1; i <= 9; i++) {
        expect(screen.getByRole('columnheader', { name: String(i) })).toBeInTheDocument();
      }
      expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument();
    });

    test('should display par values row', () => {
      render(<ScoreboardTable players={mockPlayers} />);

      expect(screen.getByText('Par')).toBeInTheDocument();
      // Total par should be 18
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    test('should render player rows with names', () => {
      render(<ScoreboardTable players={mockPlayers} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    test('should display "-" for null scores', () => {
      render(<ScoreboardTable players={mockPlayers} />);

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    test('should display total score for each player', () => {
      const { container } = render(<ScoreboardTable players={mockPlayers} />);

      // Check that total scores are in the last column cells
      const totalCells = container.querySelectorAll('tbody tr td:last-child');
      const totalScores = Array.from(totalCells).map((cell) => cell.textContent);
      expect(totalScores).toContain('17');
      expect(totalScores).toContain('6');
    });
  });

  describe('medals', () => {
    test('should display gold medal for first place', () => {
      const players: Player[] = [
        createPlayer('p1', 'Winner', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p2', 'Second', [2, 2, 2, 2, 2, 2, 2, 2, 2], 18),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    test('should display silver medal for second place', () => {
      const players: Player[] = [
        createPlayer('p1', 'Winner', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p2', 'Second', [2, 2, 2, 2, 2, 2, 2, 2, 2], 18),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByText('🥈')).toBeInTheDocument();
    });

    test('should display bronze medal for third place', () => {
      const players: Player[] = [
        createPlayer('p1', 'Winner', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p2', 'Second', [2, 2, 2, 2, 2, 2, 2, 2, 2], 18),
        createPlayer('p3', 'Third', [3, 3, 3, 3, 3, 3, 3, 3, 3], 27),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByText('🥉')).toBeInTheDocument();
    });

    test('should display gold medal for both players tied for first', () => {
      const players: Player[] = [
        createPlayer('p1', 'TiedFirst1', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p2', 'TiedFirst2', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p3', 'Third', [3, 3, 3, 3, 3, 3, 3, 3, 3], 27),
      ];

      render(<ScoreboardTable players={players} />);

      const goldMedals = screen.getAllByText('🥇');
      expect(goldMedals).toHaveLength(2);
    });

    test('should display silver medal for player after tied first places', () => {
      const players: Player[] = [
        createPlayer('p1', 'TiedFirst1', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p2', 'TiedFirst2', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p3', 'Second', [2, 2, 2, 2, 2, 2, 2, 2, 2], 18),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByText('🥈')).toBeInTheDocument();
    });

    test('should display silver medal for both players tied for second', () => {
      const players: Player[] = [
        createPlayer('p1', 'First', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p2', 'TiedSecond1', [2, 2, 2, 2, 2, 2, 2, 2, 2], 18),
        createPlayer('p3', 'TiedSecond2', [2, 2, 2, 2, 2, 2, 2, 2, 2], 18),
        createPlayer('p4', 'Fourth', [3, 3, 3, 3, 3, 3, 3, 3, 3], 27),
      ];

      render(<ScoreboardTable players={players} />);

      const silverMedals = screen.getAllByText('🥈');
      expect(silverMedals).toHaveLength(2);
    });

    test('should display gold medal for all three players in three-way tie for first', () => {
      const players: Player[] = [
        createPlayer('p1', 'TiedFirst1', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p2', 'TiedFirst2', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p3', 'TiedFirst3', [1, 1, 1, 1, 1, 1, 1, 1, 1], 9),
        createPlayer('p4', 'Fourth', [3, 3, 3, 3, 3, 3, 3, 3, 3], 27),
      ];

      render(<ScoreboardTable players={players} />);

      const goldMedals = screen.getAllByText('🥇');
      expect(goldMedals).toHaveLength(3);
    });
  });

  describe('current player highlighting', () => {
    test('should highlight current player row', () => {
      const players: Player[] = [
        createPlayer('p1', 'Player One', [1, 2, 2, 2, 2, 2, 4, 1, 1], 17),
        createPlayer('p2', 'Player Two', [1, 3, 2, 2, 2, 2, 4, 1, 1], 18),
      ];

      const { container } = render(
        <ScoreboardTable players={players} currentPlayerId="p1" />
      );

      // Check that the current player row has special styling
      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0].className).toContain('bg-[var(--color-primary)]');
    });
  });

  describe('randomise indicator', () => {
    test('should display randomise result under score for randomise holes', () => {
      const players: Player[] = [
        createPlayer(
          'p1',
          'Randomise Player',
          [1, 2, 2, 2, 2, 2, 4, 1, 1],
          17,
          { hole: 3, result: 'Double Points' }
        ),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByText('Double Points')).toBeInTheDocument();
    });

    test('should not display randomise indicator for non-randomise holes', () => {
      const players: Player[] = [
        createPlayer('p1', 'Regular Player', [1, 2, 2, 2, 2, 2, 4, 1, 1], 17),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.queryByText('Double Points')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have proper table role', () => {
      const players: Player[] = [
        createPlayer('p1', 'Test Player', [1, 2, 2, 2, 2, 2, 4, 1, 1], 17),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByRole('table', { name: /player scores/i })).toBeInTheDocument();
    });
  });

  describe('host indicator', () => {
    test('should display crown icon for host player', () => {
      const players: Player[] = [
        createPlayer('host-id', 'Host Player', [1, 2, 2, 2, 2, 2, 4, 1, 1], 17),
        createPlayer('other-id', 'Other Player', [1, 3, 2, 2, 2, 2, 4, 1, 1], 18),
      ];

      render(<ScoreboardTable players={players} hostPlayerId="host-id" />);

      expect(screen.getByTitle('Host')).toBeInTheDocument();
      expect(screen.getByText('👑')).toBeInTheDocument();
    });

    test('should not display crown icon when no hostPlayerId is provided', () => {
      const players: Player[] = [
        createPlayer('p1', 'Player One', [1, 2, 2, 2, 2, 2, 4, 1, 1], 17),
        createPlayer('p2', 'Player Two', [1, 3, 2, 2, 2, 2, 4, 1, 1], 18),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.queryByText('👑')).not.toBeInTheDocument();
    });

    test('should only display one crown for the host', () => {
      const players: Player[] = [
        createPlayer('host-id', 'Host Player', [1, 2, 2, 2, 2, 2, 4, 1, 1], 17),
        createPlayer('other-id', 'Other Player', [1, 3, 2, 2, 2, 2, 4, 1, 1], 18),
        createPlayer('third-id', 'Third Player', [2, 3, 2, 2, 2, 2, 4, 1, 1], 19),
      ];

      render(<ScoreboardTable players={players} hostPlayerId="host-id" />);

      const crowns = screen.getAllByText('👑');
      expect(crowns).toHaveLength(1);
    });
  });

  describe('penalty indicator', () => {
    test('should display SKIP penalty emoji for penalty holes', () => {
      const players: Player[] = [
        createPlayer(
          'p1',
          'Penalty Player',
          [1, 2, 5, 2, 2, 2, 4, 1, 1],
          20,
          null,
          [{ hole: 3, type: 'SKIP', points: 5 }]
        ),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByText('🚫')).toBeInTheDocument();
    });

    test('should display CHUNDER penalty emoji for penalty holes', () => {
      const players: Player[] = [
        createPlayer(
          'p1',
          'Penalty Player',
          [1, 2, 2, 2, 10, 2, 4, 1, 1],
          25,
          null,
          [{ hole: 5, type: 'CHUNDER', points: 10 }]
        ),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByText('🤮')).toBeInTheDocument();
    });

    test('should display both randomise and penalty on same hole', () => {
      const players: Player[] = [
        createPlayer(
          'p1',
          'Player',
          [1, 2, 5, 2, 2, 2, 4, 1, 1],
          20,
          { hole: 3, result: 'Double Points' },
          [{ hole: 3, type: 'SKIP', points: 5 }]
        ),
      ];

      render(<ScoreboardTable players={players} />);

      expect(screen.getByText('Double Points')).toBeInTheDocument();
      expect(screen.getByText('🚫')).toBeInTheDocument();
    });
  });
});
