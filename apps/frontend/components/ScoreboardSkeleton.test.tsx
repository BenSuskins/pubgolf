import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ScoreboardSkeleton } from './ScoreboardSkeleton';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('ScoreboardSkeleton', () => {
  describe('rendering', () => {
    test('should render table with header row', () => {
      render(<ScoreboardSkeleton />);
      expect(screen.getByText('Player')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    test('should render holes 1-9 in header', () => {
      render(<ScoreboardSkeleton />);
      for (let i = 1; i <= 9; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    test('should render skeleton rows', () => {
      const { container } = render(<ScoreboardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('should have scrollable region', () => {
      render(<ScoreboardSkeleton />);
      const region = screen.getByRole('region', { name: /scrollable scoreboard/i });
      expect(region).toBeInTheDocument();
    });
  });

  describe('structure', () => {
    test('should have sticky first column', () => {
      const { container } = render(<ScoreboardSkeleton />);
      const stickyHeaders = container.querySelectorAll('.sticky');
      expect(stickyHeaders.length).toBeGreaterThan(0);
    });

    test('should match ScoreboardTable structure', () => {
      render(<ScoreboardSkeleton />);
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(screen.getByRole('table', { name: /loading/i })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have proper loading state announcement', () => {
      render(<ScoreboardSkeleton />);
      expect(screen.getByText(/loading scoreboard/i)).toBeInTheDocument();
    });

    test('should have no accessibility violations', async () => {
      const { container } = render(<ScoreboardSkeleton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
