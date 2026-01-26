import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Counter } from './Counter';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

describe('Counter', () => {
  describe('rendering', () => {
    test('should render counter with value', () => {
      render(<Counter value={5} onChange={() => {}} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('should render label when provided', () => {
      render(<Counter value={0} onChange={() => {}} label="Sips" />);
      expect(screen.getByText('Sips')).toBeInTheDocument();
    });

    test('should render increment button', () => {
      render(<Counter value={0} onChange={() => {}} />);
      expect(screen.getByRole('button', { name: /increment/i })).toBeInTheDocument();
    });

    test('should render decrement button', () => {
      render(<Counter value={0} onChange={() => {}} />);
      expect(screen.getByRole('button', { name: /decrement/i })).toBeInTheDocument();
    });

    test('should use ariaLabel when provided', () => {
      render(<Counter value={0} onChange={() => {}} ariaLabel="Sip counter" />);
      const region = screen.getByRole('group');
      expect(region).toHaveAttribute('aria-label', 'Sip counter');
    });
  });

  describe('increment behavior', () => {
    test('should call onChange with incremented value', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={5} onChange={onChange} />);

      const incrementButton = screen.getByRole('button', { name: /increment/i });
      await user.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(6);
    });

    test('should increment by step value', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={0} onChange={onChange} step={5} />);

      const incrementButton = screen.getByRole('button', { name: /increment/i });
      await user.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(5);
    });

    test('should not increment beyond max', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={10} onChange={onChange} max={10} />);

      const incrementButton = screen.getByRole('button', { name: /increment/i });
      await user.click(incrementButton);

      expect(onChange).not.toHaveBeenCalled();
    });

    test('should disable increment button when at max', () => {
      render(<Counter value={10} onChange={() => {}} max={10} />);
      const incrementButton = screen.getByRole('button', { name: /increment/i });
      expect(incrementButton).toBeDisabled();
    });
  });

  describe('decrement behavior', () => {
    test('should call onChange with decremented value', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={5} onChange={onChange} />);

      const decrementButton = screen.getByRole('button', { name: /decrement/i });
      await user.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(4);
    });

    test('should decrement by step value', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={10} onChange={onChange} step={5} />);

      const decrementButton = screen.getByRole('button', { name: /decrement/i });
      await user.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(5);
    });

    test('should not decrement below min', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={0} onChange={onChange} min={0} />);

      const decrementButton = screen.getByRole('button', { name: /decrement/i });
      await user.click(decrementButton);

      expect(onChange).not.toHaveBeenCalled();
    });

    test('should disable decrement button when at min', () => {
      render(<Counter value={0} onChange={() => {}} min={0} />);
      const decrementButton = screen.getByRole('button', { name: /decrement/i });
      expect(decrementButton).toBeDisabled();
    });
  });

  describe('disabled state', () => {
    test('should disable both buttons when disabled=true', () => {
      render(<Counter value={5} onChange={() => {}} disabled />);
      expect(screen.getByRole('button', { name: /increment/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /decrement/i })).toBeDisabled();
    });

    test('should not call onChange when disabled', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={5} onChange={onChange} disabled />);

      await user.click(screen.getByRole('button', { name: /increment/i }));
      await user.click(screen.getByRole('button', { name: /decrement/i }));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('keyboard accessibility', () => {
    test('should be keyboard accessible via Tab', async () => {
      const user = userEvent.setup();
      render(<Counter value={0} onChange={() => {}} />);

      const decrementButton = screen.getByRole('button', { name: /decrement/i });
      const incrementButton = screen.getByRole('button', { name: /increment/i });

      await user.tab();
      expect(decrementButton).toHaveFocus();

      await user.tab();
      expect(incrementButton).toHaveFocus();
    });

    test('should trigger increment with Enter key', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={0} onChange={onChange} />);

      const incrementButton = screen.getByRole('button', { name: /increment/i });
      incrementButton.focus();
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith(1);
    });

    test('should trigger decrement with Enter key', async () => {
      const onChange = mock(() => {});
      const user = userEvent.setup();
      render(<Counter value={5} onChange={onChange} />);

      const decrementButton = screen.getByRole('button', { name: /decrement/i });
      decrementButton.focus();
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith(4);
    });
  });

  describe('error and helper text', () => {
    test('should render error message', () => {
      render(<Counter value={0} onChange={() => {}} error="Invalid value" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Invalid value');
    });

    test('should render helper text when no error', () => {
      render(<Counter value={0} onChange={() => {}} helperText="Use buttons to adjust" />);
      expect(screen.getByText('Use buttons to adjust')).toBeInTheDocument();
    });

    test('should not render helper text when error is present', () => {
      render(
        <Counter
          value={0}
          onChange={() => {}}
          error="Error message"
          helperText="Helper text"
        />
      );
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    test('should apply error styling to buttons when error is present', () => {
      render(<Counter value={0} onChange={() => {}} error="Error" />);
      const incrementButton = screen.getByRole('button', { name: /increment/i });
      const decrementButton = screen.getByRole('button', { name: /decrement/i });
      expect(incrementButton.className).toContain('border-[var(--color-error)]');
      expect(decrementButton.className).toContain('border-[var(--color-error)]');
    });

    test('should apply error styling to value when error is present', () => {
      const { container } = render(<Counter value={5} onChange={() => {}} error="Error" />);
      const valueDisplay = container.querySelector('[aria-live="polite"]');
      expect(valueDisplay?.className).toContain('text-[var(--color-error)]');
    });

    test('should set aria-invalid when error is present', () => {
      const { container } = render(<Counter value={0} onChange={() => {}} error="Error" />);
      const valueDisplay = container.querySelector('[aria-invalid]');
      expect(valueDisplay).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('fullWidth prop', () => {
    test('should apply full width class when fullWidth=true', () => {
      const { container } = render(<Counter value={0} onChange={() => {}} fullWidth />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-full');
    });

    test('should not apply full width class by default', () => {
      const { container } = render(<Counter value={0} onChange={() => {}} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass('w-full');
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (default)', async () => {
      const { container } = render(<Counter value={0} onChange={() => {}} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with label)', async () => {
      const { container } = render(
        <Counter value={5} onChange={() => {}} label="Sips" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with error)', async () => {
      const { container } = render(
        <Counter value={0} onChange={() => {}} error="Error message" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (with helper text)', async () => {
      const { container } = render(
        <Counter value={0} onChange={() => {}} helperText="Helper text" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (disabled)', async () => {
      const { container } = render(
        <Counter value={0} onChange={() => {}} disabled />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have aria-live region for value', () => {
      render(<Counter value={5} onChange={() => {}} />);
      const valueDisplay = screen.getByText('5');
      expect(valueDisplay).toHaveAttribute('aria-live', 'polite');
    });

    test('should have descriptive button labels', () => {
      render(<Counter value={5} onChange={() => {}} />);
      expect(screen.getByRole('button', { name: /decrement/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /increment/i })).toBeInTheDocument();
    });
  });
});
