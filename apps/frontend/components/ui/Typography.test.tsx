import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Typography } from './Typography';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('Typography', () => {
  describe('rendering', () => {
    test('should render children correctly', () => {
      render(<Typography>Text content</Typography>);
      expect(screen.getByText('Text content')).toBeInTheDocument();
    });

    test('should render as p by default for body variant', () => {
      const { container } = render(<Typography>Content</Typography>);
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    test('should render as h1 for display variant', () => {
      const { container } = render(<Typography variant="display">Content</Typography>);
      expect(container.querySelector('h1')).toBeInTheDocument();
    });

    test('should render as h2 for title variant', () => {
      const { container } = render(<Typography variant="title">Content</Typography>);
      expect(container.querySelector('h2')).toBeInTheDocument();
    });

    test('should render as h3 for heading variant', () => {
      const { container } = render(<Typography variant="heading">Content</Typography>);
      expect(container.querySelector('h3')).toBeInTheDocument();
    });

    test('should render as h4 for subheading variant', () => {
      const { container } = render(<Typography variant="subheading">Content</Typography>);
      expect(container.querySelector('h4')).toBeInTheDocument();
    });

    test('should render as span for small variant', () => {
      const { container } = render(<Typography variant="small">Content</Typography>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    test('should render as span for micro variant', () => {
      const { container } = render(<Typography variant="micro">Content</Typography>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    test('should override default element with as prop', () => {
      const { container } = render(
        <Typography variant="display" as="div">Content</Typography>
      );
      expect(container.querySelector('div')).toBeInTheDocument();
      expect(container.querySelector('h1')).not.toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(
        <Typography className="custom-class">Content</Typography>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-class');
    });

    test('should spread other props', () => {
      render(<Typography data-testid="test-typography">Content</Typography>);
      expect(screen.getByTestId('test-typography')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    test('should apply display variant classes', () => {
      const { container } = render(<Typography variant="display">Display</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-5xl');
      expect(element.className).toContain('font-bold');
      expect(element.className).toContain('font-display');
    });

    test('should apply title variant classes', () => {
      const { container } = render(<Typography variant="title">Title</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-2xl');
      expect(element.className).toContain('font-bold');
      expect(element.className).toContain('font-display');
    });

    test('should apply heading variant classes', () => {
      const { container } = render(<Typography variant="heading">Heading</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-xl');
      expect(element.className).toContain('font-semibold');
      expect(element.className).toContain('font-display');
    });

    test('should apply subheading variant classes', () => {
      const { container } = render(<Typography variant="subheading">Subheading</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-lg');
      expect(element.className).toContain('font-medium');
    });

    test('should apply body variant classes', () => {
      const { container } = render(<Typography variant="body">Body</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-base');
    });

    test('should apply small variant classes', () => {
      const { container } = render(<Typography variant="small">Small</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-sm');
    });

    test('should apply micro variant classes', () => {
      const { container } = render(<Typography variant="micro">Micro</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-xs');
    });
  });

  describe('colors', () => {
    test('should apply primary color by default', () => {
      const { container } = render(<Typography>Content</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-[var(--color-text)]');
    });

    test('should apply secondary color', () => {
      const { container } = render(<Typography color="secondary">Content</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-[var(--color-text-secondary)]');
    });

    test('should apply accent color', () => {
      const { container } = render(<Typography color="accent">Content</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-[var(--color-accent)]');
    });

    test('should apply error color', () => {
      const { container } = render(<Typography color="error">Content</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-[var(--color-error)]');
    });

    test('should apply success color', () => {
      const { container } = render(<Typography color="success">Content</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('text-[var(--color-success)]');
    });
  });

  describe('gradient', () => {
    test('should not apply gradient by default', () => {
      const { container } = render(<Typography>Content</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).not.toContain('gradient-text');
    });

    test('should apply gradient when gradient=true', () => {
      const { container } = render(<Typography gradient>Content</Typography>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('gradient-text');
    });

    test('should override color when gradient is applied', () => {
      const { container } = render(
        <Typography color="accent" gradient>Content</Typography>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('gradient-text');
      expect(element.className).not.toContain('text-[var(--color-accent)]');
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (default)', async () => {
      const { container } = render(<Typography>Content</Typography>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (all heading variants)', async () => {
      const { container } = render(
        <>
          <Typography variant="display">Display</Typography>
          <Typography variant="title">Title</Typography>
          <Typography variant="heading">Heading</Typography>
          <Typography variant="subheading">Subheading</Typography>
        </>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (all text variants)', async () => {
      const { container } = render(
        <>
          <Typography variant="body">Body</Typography>
          <Typography variant="small">Small</Typography>
          <Typography variant="micro">Micro</Typography>
        </>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (gradient)', async () => {
      const { container } = render(
        <Typography gradient>Gradient text</Typography>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should maintain heading hierarchy', () => {
      const { container } = render(
        <>
          <Typography variant="display">H1 Display</Typography>
          <Typography variant="title">H2 Title</Typography>
          <Typography variant="heading">H3 Heading</Typography>
          <Typography variant="subheading">H4 Subheading</Typography>
        </>
      );

      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('h2')).toBeInTheDocument();
      expect(container.querySelector('h3')).toBeInTheDocument();
      expect(container.querySelector('h4')).toBeInTheDocument();
    });
  });
});
