import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { CelebrationScreen } from './CelebrationScreen';
import { Player } from '@/lib/types';

const createPlayer = (
  id: string,
  name: string,
  totalScore: number
): Player => ({
  id,
  name,
  scores: [1, 2, 2, 2, 2, 2, 4, 1, 1],
  totalScore,
  randomise: null,
});

describe('CelebrationScreen', () => {
  test('should display winner name and trophy', () => {
    const winners = [createPlayer('p1', 'Alice', 15)];
    const onDismiss = mock(() => {});

    render(<CelebrationScreen winners={winners} onDismiss={onDismiss} />);

    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  test('should display score for winner', () => {
    const winners = [createPlayer('p1', 'Alice', 15)];
    const onDismiss = mock(() => {});

    render(<CelebrationScreen winners={winners} onDismiss={onDismiss} />);

    expect(screen.getByText('15 sips')).toBeInTheDocument();
  });

  test('should display multiple winners for tie', () => {
    const winners = [
      createPlayer('p1', 'Alice', 15),
      createPlayer('p2', 'Bob', 15),
    ];
    const onDismiss = mock(() => {});

    render(<CelebrationScreen winners={winners} onDismiss={onDismiss} />);

    expect(screen.getByText('Winners')).toBeInTheDocument();
    expect(screen.getByText('Alice & Bob')).toBeInTheDocument();
  });

  test('should display tap to dismiss message', () => {
    const winners = [createPlayer('p1', 'Alice', 15)];
    const onDismiss = mock(() => {});

    render(<CelebrationScreen winners={winners} onDismiss={onDismiss} />);

    expect(screen.getByText(/tap anywhere to view results/i)).toBeInTheDocument();
  });

  test('should call onDismiss when clicked', () => {
    const winners = [createPlayer('p1', 'Alice', 15)];
    const onDismiss = mock(() => {});

    render(<CelebrationScreen winners={winners} onDismiss={onDismiss} />);

    const overlay = screen.getByRole('button');
    fireEvent.click(overlay);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('should call onDismiss when Enter key is pressed', () => {
    const winners = [createPlayer('p1', 'Alice', 15)];
    const onDismiss = mock(() => {});

    render(<CelebrationScreen winners={winners} onDismiss={onDismiss} />);

    const overlay = screen.getByRole('button');
    fireEvent.keyDown(overlay, { key: 'Enter' });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('should call onDismiss when Space key is pressed', () => {
    const winners = [createPlayer('p1', 'Alice', 15)];
    const onDismiss = mock(() => {});

    render(<CelebrationScreen winners={winners} onDismiss={onDismiss} />);

    const overlay = screen.getByRole('button');
    fireEvent.keyDown(overlay, { key: ' ' });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('should have accessible label', () => {
    const winners = [createPlayer('p1', 'Alice', 15)];
    const onDismiss = mock(() => {});

    render(<CelebrationScreen winners={winners} onDismiss={onDismiss} />);

    expect(screen.getByLabelText(/tap to view full results/i)).toBeInTheDocument();
  });
});
