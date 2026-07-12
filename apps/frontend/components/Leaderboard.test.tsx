import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Leaderboard } from './Leaderboard';
import { parRelativeTotal, formatParRelative } from '@/lib/scoring';
import { Player } from '@/lib/types';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

const pars = [1, 3, 2, 2, 2, 2, 4, 1, 1];

function buildPlayer(overrides: Partial<Player>): Player {
  return {
    id: 'player-1',
    name: 'Ben',
    scores: [null, null, null, null, null, null, null, null, null],
    totalScore: 0,
    randomise: null,
    penalties: [],
    ...overrides,
  };
}

describe('parRelativeTotal', () => {
  test('should sum score minus par over played holes only', () => {
    const scores = [3, 3, 1, null, null, null, null, null, null];
    expect(parRelativeTotal(scores, pars)).toBe(2 + 0 - 1);
  });

  test('should be zero when no holes are played', () => {
    const scores = [null, null, null, null, null, null, null, null, null];
    expect(parRelativeTotal(scores, pars)).toBe(0);
  });
});

describe('formatParRelative', () => {
  test('should format level par as E', () => {
    expect(formatParRelative(0)).toBe('E');
  });

  test('should format over par with plus sign', () => {
    expect(formatParRelative(3)).toBe('+3');
  });

  test('should format under par with minus sign', () => {
    expect(formatParRelative(-2)).toBe('−2');
  });
});

describe('Leaderboard', () => {
  test('should show empty message when there are no players', () => {
    render(<Leaderboard players={[]} pars={pars} />);
    expect(screen.getByText(/no players yet/i)).toBeInTheDocument();
  });

  test('should rank players by total score ascending', () => {
    const players = [
      buildPlayer({ id: 'p1', name: 'Ben', scores: [10, ...Array(8).fill(null)], totalScore: 10 }),
      buildPlayer({ id: 'p2', name: 'Rosa', scores: [1, ...Array(8).fill(null)], totalScore: 1 }),
    ];
    render(<Leaderboard players={players} pars={pars} />);

    const rows = screen.getAllByRole('button', { expanded: false });
    expect(rows[0]).toHaveTextContent('Rosa');
    expect(rows[1]).toHaveTextContent('Ben');
  });

  test('should show par-relative totals', () => {
    const players = [
      buildPlayer({ id: 'p1', name: 'Ben', scores: [4, ...Array(8).fill(null)], totalScore: 4 }),
    ];
    render(<Leaderboard players={players} pars={pars} />);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  test('should expand a row to reveal the hole-by-hole strip', async () => {
    const user = userEvent.setup();
    const players = [
      buildPlayer({
        id: 'p1',
        name: 'Ben',
        scores: [10, 3, null, null, null, null, null, null, null],
        totalScore: 13,
        penalties: [{ hole: 1, type: 'CHUNDER', points: 10 }],
      }),
    ];
    render(<Leaderboard players={players} pars={pars} />);

    await user.click(screen.getByRole('button', { name: /Ben/ }));

    expect(screen.getByRole('button', { name: /Ben/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('img', { name: /CHUNDER penalty on hole 1/i })).toBeInTheDocument();
  });

  test('should render a zero score as 0, not a dash, when expanded', async () => {
    const user = userEvent.setup();
    const players = [
      buildPlayer({
        id: 'p1',
        name: 'Ben',
        scores: [3, 0, null, null, null, null, null, null, null],
        totalScore: 3,
      }),
    ];
    render(<Leaderboard players={players} pars={pars} />);

    await user.click(screen.getByRole('button', { name: /Ben/ }));

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('should show the wildcard result on its hole when expanded', async () => {
    const user = userEvent.setup();
    const players = [
      buildPlayer({
        id: 'p1',
        name: 'Ben',
        scores: [2, null, null, null, null, null, null, null, null],
        totalScore: 2,
        randomise: { hole: 1, result: 'Tequila' },
      }),
    ];
    render(<Leaderboard players={players} pars={pars} />);

    await user.click(screen.getByRole('button', { name: /Ben/ }));

    expect(screen.getByRole('img', { name: /wildcard: tequila/i })).toBeInTheDocument();
  });

  test('should auto-expand the current player row', () => {
    const players = [
      buildPlayer({ id: 'p1', name: 'Ben', scores: [2, ...Array(8).fill(null)], totalScore: 2 }),
      buildPlayer({ id: 'p2', name: 'Rosa', scores: [1, ...Array(8).fill(null)], totalScore: 1 }),
    ];
    render(<Leaderboard players={players} pars={pars} currentPlayerId="p1" />);

    expect(screen.getByRole('button', { name: /Ben/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Rosa/ })).toHaveAttribute('aria-expanded', 'false');
  });

  test('should mark the host with a crown', () => {
    const players = [
      buildPlayer({ id: 'p1', name: 'Ben', scores: [2, ...Array(8).fill(null)], totalScore: 2 }),
    ];
    render(<Leaderboard players={players} pars={pars} hostPlayerId="p1" />);
    expect(screen.getByRole('img', { name: /game host/i })).toBeInTheDocument();
  });

  test('should have no accessibility violations', async () => {
    const players = [
      buildPlayer({ id: 'p1', name: 'Ben', scores: [2, ...Array(8).fill(null)], totalScore: 2 }),
      buildPlayer({ id: 'p2', name: 'Rosa', scores: [1, ...Array(8).fill(null)], totalScore: 1 }),
    ];
    const { container } = render(<Leaderboard players={players} pars={pars} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
