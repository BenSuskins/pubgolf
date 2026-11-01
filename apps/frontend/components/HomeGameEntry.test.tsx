import { beforeEach, expect, mock, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { HomeGameEntry } from './HomeGameEntry';

const parameters = new URLSearchParams();
mock.module('next/navigation', () => ({
  useSearchParams: () => parameters,
  useRouter: () => ({ push: mock(() => {}) }),
}));
mock.module('@/lib/api', () => ({ getGameState: mock(() => Promise.resolve({})) }));

beforeEach(() => {
  for (const key of [...parameters.keys()]) parameters.delete(key);
  localStorage.clear();
});

test('a landing-page Join action opens the join form', () => {
  parameters.set('mode', 'join');
  render(<HomeGameEntry />);
  expect(screen.getByLabelText('Game Code')).toBeInTheDocument();
});

test('an invitation selects Join even when the mode says Host', () => {
  parameters.set('mode', 'host');
  parameters.set('gameCode', 'ABC123');
  render(<HomeGameEntry />);
  expect(screen.getByLabelText('Game Code')).toHaveValue('ABC123');
});
