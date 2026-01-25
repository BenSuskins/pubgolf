import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Skeleton } from './Skeleton';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('Skeleton', () => {
  describe('rendering', () => {
    test('should render with default props', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-[var(--color-border)]');
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('rounded');
    });

    test('should have default role and aria attributes', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('dimensions', () => {
    test('should accept custom width', () => {
      const { container } = render(<Skeleton width="200px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '200px' });
    });

    test('should accept custom height', () => {
      const { container } = render(<Skeleton height="50px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: '50px' });
    });

    test('should accept both width and height', () => {
      const { container } = render(<Skeleton width="150px" height="75px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '150px', height: '75px' });
    });
  });

  describe('variants', () => {
    test('should render rectangle variant by default', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded');
      expect(skeleton).not.toHaveClass('rounded-full');
    });

    test('should render circle variant', () => {
      const { container } = render(<Skeleton variant="circle" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveClass('aspect-square');
    });
  });

  describe('customization', () => {
    test('should apply custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('custom-class');
    });

    test('should merge custom className with default classes', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('custom-class');
      expect(skeleton).toHaveClass('bg-[var(--color-border)]');
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (default)', async () => {
      const { container } = render(<Skeleton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (circle variant)', async () => {
      const { container } = render(<Skeleton variant="circle" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (custom dimensions)', async () => {
      const { container } = render(<Skeleton width="200px" height="50px" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
