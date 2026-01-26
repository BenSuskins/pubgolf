import { describe, test, expect, vi } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EmptyState } from './EmptyState';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('EmptyState', () => {
  describe('rendering', () => {
    test('should render description', () => {
      render(<EmptyState description="No data available" />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    test('should render icon when provided', () => {
      render(<EmptyState icon="🎯" description="No scores yet" />);
      const icon = screen.getByLabelText('Empty state icon');
      expect(icon).toBeInTheDocument();
      expect(icon.textContent).toBe('🎯');
    });

    test('should render title when provided', () => {
      render(<EmptyState title="No Scores" description="Scores will appear here" />);
      expect(screen.getByText('No Scores')).toBeInTheDocument();
    });

    test('should render icon with title as aria-label', () => {
      render(<EmptyState icon="📝" title="No Events" description="Events will appear here" />);
      const icon = screen.getByLabelText('No Events');
      expect(icon).toBeInTheDocument();
    });

    test('should not render icon when not provided', () => {
      const { container } = render(<EmptyState description="No data" />);
      const icon = container.querySelector('[role="img"]');
      expect(icon).toBeNull();
    });

    test('should not render title when not provided', () => {
      render(<EmptyState description="No data" />);
      expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    });
  });

  describe('action button', () => {
    test('should render action button when provided', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          description="No data"
          action={{ label: 'Add Data', onClick }}
        />
      );
      expect(screen.getByRole('button', { name: 'Add Data' })).toBeInTheDocument();
    });

    test('should call onClick when action button is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <EmptyState
          description="No data"
          action={{ label: 'Add Data', onClick }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Data' });
      await user.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should not render button when action not provided', () => {
      render(<EmptyState description="No data" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('complete examples', () => {
    test('should render complete empty state with all props', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          icon="🎮"
          title="No Games"
          description="Create your first game to get started"
          action={{ label: 'Create Game', onClick }}
        />
      );

      expect(screen.getByLabelText('No Games')).toBeInTheDocument();
      expect(screen.getByText('No Games')).toBeInTheDocument();
      expect(screen.getByText('Create your first game to get started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Game' })).toBeInTheDocument();
    });

    test('should render minimal empty state with only description', () => {
      render(<EmptyState description="Nothing to show" />);
      expect(screen.getByText('Nothing to show')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (minimal)', async () => {
      const { container } = render(<EmptyState description="No data available" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with icon)', async () => {
      const { container } = render(
        <EmptyState icon="🎯" description="No scores yet" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (complete)', async () => {
      const { container } = render(
        <EmptyState
          icon="📝"
          title="No Events"
          description="Events will appear here"
          action={{ label: 'Learn More', onClick: () => {} }}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
