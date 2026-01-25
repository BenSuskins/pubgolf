import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Select } from './Select';
import { createRef } from 'react';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

const testOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

describe('Select', () => {
  describe('rendering', () => {
    test('should render select correctly', () => {
      render(<Select options={testOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('should render with label', () => {
      render(<Select label="Choose option" options={testOptions} />);
      expect(screen.getByLabelText('Choose option')).toBeInTheDocument();
    });

    test('should auto-generate id when not provided', () => {
      render(<Select label="Select" options={testOptions} />);
      const select = screen.getByLabelText('Select');
      expect(select).toHaveAttribute('id');
    });

    test('should use provided id', () => {
      render(<Select label="Select" id="custom-id" options={testOptions} />);
      const select = screen.getByLabelText('Select');
      expect(select).toHaveAttribute('id', 'custom-id');
    });

    test('should render all options', () => {
      render(<Select options={testOptions} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.options).toHaveLength(3);
      expect(select.options[0]).toHaveTextContent('Option 1');
      expect(select.options[1]).toHaveTextContent('Option 2');
      expect(select.options[2]).toHaveTextContent('Option 3');
    });

    test('should render options with correct values', () => {
      render(<Select options={testOptions} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.options[0]).toHaveValue('1');
      expect(select.options[1]).toHaveValue('2');
      expect(select.options[2]).toHaveValue('3');
    });

    test('should render helper text', () => {
      render(<Select options={testOptions} helperText="Please select an option" />);
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(<Select options={testOptions} className="custom-class" />);
      expect(screen.getByRole('combobox')).toHaveClass('custom-class');
    });

    test('should spread other props', () => {
      render(<Select options={testOptions} data-testid="test-select" />);
      expect(screen.getByTestId('test-select')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    test('should render error message', () => {
      render(<Select options={testOptions} error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('should have aria-invalid when error is present', () => {
      render(<Select options={testOptions} error="Invalid selection" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    test('should have aria-describedby pointing to error', () => {
      render(<Select label="Option" options={testOptions} error="Invalid option" />);
      const select = screen.getByRole('combobox');
      const errorId = select.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      const errorElement = document.getElementById(errorId!);
      expect(errorElement).toHaveTextContent('Invalid option');
    });

    test('should apply error styles', () => {
      render(<Select options={testOptions} error="Error" />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('border-[var(--color-error)]');
    });
  });

  describe('sizes', () => {
    test('should apply medium size by default', () => {
      render(<Select options={testOptions} />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('py-3');
      expect(select.className).toContain('px-4');
    });

    test('should apply small size classes', () => {
      render(<Select options={testOptions} size="sm" />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('py-2');
      expect(select.className).toContain('px-3');
      expect(select.className).toContain('text-sm');
    });

    test('should apply large size classes', () => {
      render(<Select options={testOptions} size="lg" />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('py-4');
      expect(select.className).toContain('px-5');
      expect(select.className).toContain('text-lg');
    });
  });

  describe('fullWidth', () => {
    test('should not be full width by default', () => {
      const { container } = render(<Select options={testOptions} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain('w-full');
    });

    test('should apply full width when fullWidth=true', () => {
      const { container } = render(<Select options={testOptions} fullWidth />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('w-full');
    });
  });

  describe('interactions', () => {
    test('should handle onChange events', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Select options={testOptions} onChange={onChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '2');

      expect(onChange).toHaveBeenCalled();
    });

    test('should update value', async () => {
      const user = userEvent.setup();
      render(<Select options={testOptions} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(select, '2');

      expect(select.value).toBe('2');
    });
  });

  describe('ref forwarding', () => {
    test('should forward ref to select element', () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select options={testOptions} ref={ref} />);

      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('SELECT');
    });

    test('should allow ref to be used for focus', () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select options={testOptions} ref={ref} />);

      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (default)', async () => {
      const { container } = render(<Select label="Choose" options={testOptions} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with error)', async () => {
      const { container } = render(
        <Select label="Choose" options={testOptions} error="Invalid selection" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with helper text)', async () => {
      const { container } = render(
        <Select label="Choose" options={testOptions} helperText="Select your preference" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should associate label with select', () => {
      render(<Select label="Option" options={testOptions} />);
      const label = screen.getByText('Option');
      const select = screen.getByRole('combobox');
      expect(label).toHaveAttribute('for', select.id);
    });
  });
});
