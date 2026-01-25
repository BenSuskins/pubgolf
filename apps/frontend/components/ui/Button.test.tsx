import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('Button', () => {
  describe('rendering', () => {
    test('should render children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    test('should render with default type="button"', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    test('should support type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    test('should support type="reset"', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });

    test('should apply custom className', () => {
      render(<Button className="custom-class">Click me</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    test('should use ariaLabel when provided', () => {
      render(<Button ariaLabel="Custom label">Click me</Button>);
      expect(screen.getByRole('button', { name: /custom label/i })).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    test('should apply primary variant classes by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-gradient');
    });

    test('should apply secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('glass');
    });

    test('should apply ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
    });

    test('should apply danger variant classes', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-red-500');
    });
  });

  describe('sizes', () => {
    test('should apply medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('py-3');
      expect(button.className).toContain('px-4');
    });

    test('should apply small size classes', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('py-2');
      expect(button.className).toContain('px-3');
      expect(button.className).toContain('text-sm');
    });

    test('should apply large size classes', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('py-4');
      expect(button.className).toContain('px-6');
      expect(button.className).toContain('text-lg');
    });
  });

  describe('loading state', () => {
    test('should show loading spinner when loading=true', () => {
      render(<Button loading>Click me</Button>);
      const spinner = screen.getByRole('status', { hidden: true });
      expect(spinner).toBeInTheDocument();
    });

    test('should disable button when loading', () => {
      render(<Button loading>Click me</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('should have aria-busy=true when loading', () => {
      render(<Button loading>Click me</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    test('should not call onClick when loading', async () => {
      const onClick = mock(() => {});
      const user = userEvent.setup();
      render(<Button loading onClick={onClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    test('should hide loading spinner when not loading', () => {
      render(<Button>Click me</Button>);
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    test('should disable button when disabled=true', () => {
      render(<Button disabled>Click me</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('should have aria-disabled=true when disabled', () => {
      render(<Button disabled>Click me</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    test('should not call onClick when disabled', async () => {
      const onClick = mock(() => {});
      const user = userEvent.setup();
      render(<Button disabled onClick={onClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    test('should apply opacity style when disabled', () => {
      render(<Button disabled>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('opacity-50');
    });
  });

  describe('interactions', () => {
    test('should call onClick when clicked', async () => {
      const onClick = mock(() => {});
      const user = userEvent.setup();
      render(<Button onClick={onClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should be keyboard accessible with Enter key', async () => {
      const onClick = mock(() => {});
      const user = userEvent.setup();
      render(<Button onClick={onClick}>Click me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should be keyboard accessible with Space key', async () => {
      const onClick = mock(() => {});
      const user = userEvent.setup();
      render(<Button onClick={onClick}>Click me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (primary)', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (loading)', async () => {
      const { container } = render(<Button loading>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (disabled)', async () => {
      const { container } = render(<Button disabled>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should maintain focus visible state', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible');
    });
  });
});
