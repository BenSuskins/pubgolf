import { describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('marketing homepage', () => {
  test('explains the game and answers common questions', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: /how to play/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
    expect(screen.getByText('What is pub golf?')).toBeInTheDocument();
    expect(screen.getByText('How do you score in pub golf?')).toBeInTheDocument();
    expect(screen.getByText('How many pubs do you need for pub golf?')).toBeInTheDocument();
    expect(screen.getByText('Do I need to download an app to play?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read the full rules/i })).toHaveAttribute('href', '/how-to-play');
  });
});

test('names the scorecard in the main heading', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { level: 1, name: /pub golf scorecard/i })).toBeInTheDocument();
});
