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
 * // With custom step
 * <Counter value={score} onChange={setScore} step={5} />
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
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export function Counter({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  disabled = false,
  ariaLabel,
}: CounterProps) {
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

  return (
    <div role="group" aria-label={ariaLabel}>
      {label && (
        <div className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
          {label}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || isAtMin}
          className="glass px-4 py-3 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Decrement"
        >
          <span className="text-xl font-bold" aria-hidden="true">−</span>
        </button>

        <div
          className="min-w-[3rem] text-center text-2xl font-bold font-mono"
          aria-live="polite"
        >
          {value}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || isAtMax}
          className="glass px-4 py-3 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Increment"
        >
          <span className="text-xl font-bold" aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}

Counter.displayName = 'Counter';
