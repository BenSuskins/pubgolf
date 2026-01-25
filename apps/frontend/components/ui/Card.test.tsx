import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Card } from './Card';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('Card', () => {
  describe('rendering', () => {
    test('should render children correctly', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('should render as div by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    test('should render as section when as="section"', () => {
      const { container } = render(<Card as="section">Content</Card>);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    test('should render as article when as="article"', () => {
      const { container } = render(<Card as="article">Content</Card>);
      expect(container.querySelector('article')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    test('should apply glass class by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('glass');
    });

    test('should spread other props', () => {
      render(<Card data-testid="test-card">Content</Card>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    test('should apply glass variant by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('glass');
    });

    test('should apply accent variant border', () => {
      const { container } = render(<Card variant="accent">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-[var(--color-accent)]');
    });

    test('should apply danger variant border', () => {
      const { container } = render(<Card variant="danger">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-[var(--color-error)]');
    });

    test('should apply primary variant border', () => {
      const { container } = render(<Card variant="primary">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-[var(--color-primary)]');
    });
  });

  describe('padding', () => {
    test('should apply medium padding by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-5');
    });

    test('should apply no padding when padding="none"', () => {
      const { container } = render(<Card padding="none">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-0');
    });

    test('should apply small padding', () => {
      const { container } = render(<Card padding="sm">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-4');
    });

    test('should apply large padding', () => {
      const { container } = render(<Card padding="lg">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-6');
    });
  });

  describe('glow', () => {
    test('should not apply glow by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('glow');
    });

    test('should apply glow when glow=true', () => {
      const { container } = render(<Card glow>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('glow');
    });

    test('should apply small glow when glow="sm"', () => {
      const { container } = render(<Card glow="sm">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('glow-sm');
    });
  });

  describe('rounded', () => {
    test('should apply extra-large rounded by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-xl');
    });

    test('should apply medium rounded', () => {
      const { container } = render(<Card rounded="md">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-md');
    });

    test('should apply large rounded', () => {
      const { container } = render(<Card rounded="lg">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-lg');
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (default)', async () => {
      const { container } = render(<Card>Content</Card>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (section)', async () => {
      const { container } = render(<Card as="section">Content</Card>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (article)', async () => {
      const { container } = render(<Card as="article">Content</Card>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (all variants)', async () => {
      const { container } = render(
        <>
          <Card variant="glass">Glass</Card>
          <Card variant="accent">Accent</Card>
          <Card variant="danger">Danger</Card>
          <Card variant="primary">Primary</Card>
        </>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
