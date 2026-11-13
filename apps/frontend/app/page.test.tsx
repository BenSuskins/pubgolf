import { describe, expect, test } from 'bun:test';
import { render, screen, within } from '@testing-library/react';
import HomePage from './page';

describe('marketing homepage', () => {
  test('welcomes players and offers paths to host or join', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { level: 1, name: /pub golf.*let’s play/i })).toBeInTheDocument();
    expect(screen.getByText('Set up your round, get your mates together and see who comes out on top.')).toBeInTheDocument();
    expect(screen.getByText('Free to play. No sign-up or download.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /host a round/i }).every(link => link.getAttribute('href') === '/play?mode=host')).toBe(true);
    expect(screen.getAllByRole('link', { name: /join a round/i }).every(link => link.getAttribute('href') === '/play?mode=join')).toBe(true);
  });

  test('explains the round and answers common questions', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: /who’s winning/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /how to play/i })).toBeInTheDocument();
    expect(screen.getByText('Make it your round')).toBeInTheDocument();
    expect(screen.getByText('Bring your mates')).toBeInTheDocument();
    expect(screen.getByText('Play and keep score')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read the full rules/i })).toHaveAttribute('href', '/how-to-play');
    const basics = screen.getByRole('region', { name: /the basics/i });
    expect(within(basics).getByText('What is pub golf?')).toBeInTheDocument();
    expect(within(basics).getByText('Do we need nine pubs?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ready for your round/i })).toBeInTheDocument();
  });
});
