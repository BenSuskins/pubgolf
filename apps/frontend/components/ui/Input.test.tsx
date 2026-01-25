import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from './Input';
import { createRef } from 'react';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('Input', () => {
  describe('rendering', () => {
    test('should render input correctly', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('should render with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    test('should auto-generate id when not provided', () => {
      render(<Input label="Email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id');
    });

    test('should use provided id', () => {
      render(<Input label="Email" id="custom-id" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    test('should render helper text', () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(<Input className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });

    test('should spread other props', () => {
      render(<Input placeholder="Type here" />);
      expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    test('should render error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('should have aria-invalid when error is present', () => {
      render(<Input error="Invalid input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    test('should have aria-describedby pointing to error', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      const errorElement = document.getElementById(errorId!);
      expect(errorElement).toHaveTextContent('Invalid email');
    });

    test('should apply error styles', () => {
      render(<Input error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-[var(--color-error)]');
    });
  });

  describe('sizes', () => {
    test('should apply medium size by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('py-3');
      expect(input.className).toContain('px-4');
    });

    test('should apply small size classes', () => {
      render(<Input size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('py-2');
      expect(input.className).toContain('px-3');
      expect(input.className).toContain('text-sm');
    });

    test('should apply large size classes', () => {
      render(<Input size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('py-4');
      expect(input.className).toContain('px-5');
      expect(input.className).toContain('text-lg');
    });
  });

  describe('fullWidth', () => {
    test('should not be full width by default', () => {
      const { container } = render(<Input />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain('w-full');
    });

    test('should apply full width when fullWidth=true', () => {
      const { container } = render(<Input fullWidth />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('w-full');
    });
  });

  describe('interactions', () => {
    test('should handle onChange events', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Input onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(onChange).toHaveBeenCalled();
    });

    test('should update value', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'test value');

      expect(input.value).toBe('test value');
    });
  });

  describe('ref forwarding', () => {
    test('should forward ref to input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    test('should allow ref to be used for focus', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (default)', async () => {
      const { container } = render(<Input label="Name" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with error)', async () => {
      const { container } = render(<Input label="Email" error="Invalid email" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with helper text)', async () => {
      const { container } = render(
        <Input label="Password" helperText="Must be at least 8 characters" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should associate label with input', () => {
      render(<Input label="Username" />);
      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', input.id);
    });
  });
});
