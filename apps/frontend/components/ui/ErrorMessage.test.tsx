import { describe, test, expect, vi } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ErrorMessage } from './ErrorMessage';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('ErrorMessage', () => {
  describe('rendering', () => {
    test('should render error message', () => {
      render(<ErrorMessage message="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    test('should have role="alert" for accessibility', () => {
      render(<ErrorMessage message="Error occurred" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('should render icon by default', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('should not render icon when icon=false', () => {
      const { container } = render(<ErrorMessage message="Error" icon={false} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeNull();
    });
  });

  describe('variants', () => {
    test('should render inline variant by default', () => {
      render(<ErrorMessage message="Error" />);
      const alert = screen.getByRole('alert');
      expect(alert.className).not.toContain('glass');
    });

    test('should render card variant', () => {
      render(<ErrorMessage message="Error" variant="card" />);
      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('glass');
    });

    test('should apply inline styles for inline variant', () => {
      render(<ErrorMessage message="Error" variant="inline" />);
      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('flex');
      expect(alert.className).toContain('items-start');
      expect(alert.className).toContain('text-sm');
    });
  });

  describe('action button', () => {
    test('should render action button when provided in card variant', () => {
      const onClick = vi.fn();
      render(
        <ErrorMessage
          message="Failed to load"
          variant="card"
          action={{ label: 'Retry', onClick }}
        />
      );
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    test('should call onClick when action button is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <ErrorMessage
          message="Failed to load"
          variant="card"
          action={{ label: 'Retry', onClick }}
        />
      );

      const button = screen.getByRole('button', { name: 'Retry' });
      await user.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should not render button when action not provided', () => {
      render(<ErrorMessage message="Error" />);
      expect(screen.queryByRole('button')).toBeNull();
    });

    test('should render action button only in card variant', () => {
      const onClick = vi.fn();
      render(
        <ErrorMessage
          message="Error"
          variant="inline"
          action={{ label: 'Retry', onClick }}
        />
      );
      // Inline variant doesn't show action buttons
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('complete examples', () => {
    test('should render inline error with icon', () => {
      const { container } = render(
        <ErrorMessage message="Invalid email format" variant="inline" />
      );
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('should render card error with retry button', () => {
      const onClick = vi.fn();
      render(
        <ErrorMessage
          message="Failed to connect to server"
          variant="card"
          action={{ label: 'Retry', onClick }}
        />
      );
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    test('should render error without icon', () => {
      const { container } = render(
        <ErrorMessage message="Something went wrong" icon={false} />
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeNull();
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (inline)', async () => {
      const { container } = render(
        <ErrorMessage message="Error occurred" variant="inline" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (card)', async () => {
      const { container } = render(
        <ErrorMessage message="Error occurred" variant="card" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with action)', async () => {
      const { container } = render(
        <ErrorMessage
          message="Failed to load"
          variant="card"
          action={{ label: 'Retry', onClick: () => {} }}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (without icon)', async () => {
      const { container } = render(
        <ErrorMessage message="Error" icon={false} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
