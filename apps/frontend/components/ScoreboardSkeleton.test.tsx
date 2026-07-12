import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ScoreboardSkeleton } from './ScoreboardSkeleton';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('ScoreboardSkeleton', () => {
  describe('rendering', () => {
    test('should render skeleton rows', () => {
      const { container } = render(<ScoreboardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('should render four placeholder rows', () => {
      const { container } = render(<ScoreboardSkeleton />);
      const rows = container.querySelectorAll('.glass');
      expect(rows.length).toBe(4);
    });
  });

  describe('accessibility', () => {
    test('should have proper loading state announcement', () => {
      render(<ScoreboardSkeleton />);
      expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
    });

    test('should have no accessibility violations', async () => {
      const { container } = render(<ScoreboardSkeleton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
