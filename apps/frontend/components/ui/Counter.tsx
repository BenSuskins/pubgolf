import { useId } from 'react';

/**
 * Counter component with increment and decrement buttons.
 *
 * @example
 * // Basic usage
 * <Counter value={sips} onChange={setSips} label="Sips" />
 *
 * @example
 * // With min/max bounds
 * <Counter value={count} onChange={setCount} min={0} max={10} />
 *
 * @example
 * // With error state
 * <Counter value={score} onChange={setScore} error="Score must be positive" />
 *
 * @example
 * // With helper text
 * <Counter value={count} onChange={setCount} helperText="Use + and - buttons to adjust" />
 */
export interface CounterProps {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Increment/decrement step */
  step?: number;
  /** Label text */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below counter */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Make counter full width */
  fullWidth?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Center the controls while keeping label left-aligned */
  centerControls?: boolean;
}

export function Counter({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  error,
  helperText,
  disabled = false,
  fullWidth = false,
  ariaLabel,
  centerControls = false,
}: CounterProps) {
  const generatedId = useId();
  const errorId = error ? `${generatedId}-error` : undefined;

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = value + step;
    if (max !== undefined && newValue > max) return;
    onChange(newValue);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = value - step;
    if (min !== undefined && newValue < min) return;
    onChange(newValue);
  };

  const isAtMin = min !== undefined && value <= min;
  const isAtMax = max !== undefined && value >= max;

  const wrapperClasses = fullWidth ? 'w-full' : '';

  return (
    <div className={wrapperClasses} role="group" aria-label={ariaLabel} aria-describedby={errorId}>
      {label && (
        <div className="eyebrow block mb-2 text-[var(--color-text-muted)]">
          {label}
        </div>
      )}
      <div className={centerControls ? 'flex justify-center' : ''}>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || isAtMin}
            className={`w-[52px] h-[52px] rounded-full bg-[var(--color-bg)] border text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? 'border-[var(--color-error)]' : 'border-[var(--color-border-subtle)]'
            }`}
            aria-label="Decrement"
          >
            <span className="text-2xl" aria-hidden="true">−</span>
          </button>

          <div
            className={`min-w-[5rem] text-center text-6xl font-display ${
              error ? 'text-[var(--color-error)]' : 'text-[var(--color-accent)]'
            }`}
            aria-live="polite"
            aria-invalid={error ? 'true' : 'false'}
          >
            {value}
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || isAtMax}
            className={`w-[52px] h-[52px] rounded-full bg-[var(--color-bg)] border text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? 'border-[var(--color-error)]' : 'border-[var(--color-border-subtle)]'
            }`}
            aria-label="Increment"
          >
            <span className="text-2xl" aria-hidden="true">+</span>
          </button>
        </div>
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {helperText}
        </p>
      )}
    </div>
  );
}

Counter.displayName = 'Counter';
