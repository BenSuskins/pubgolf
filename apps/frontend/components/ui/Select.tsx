import { forwardRef, useId } from 'react';

/**
 * Select component with label, error handling, and size variants.
 *
 * @example
 * // Basic usage with label
 * <Select
 *   label="Country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'uk', label: 'United Kingdom' },
 *   ]}
 * />
 *
 * @example
 * // With error state
 * <Select
 *   label="Hole"
 *   options={holeOptions}
 *   error="Please select a hole"
 * />
 *
 * @example
 * // Full width select
 * <Select label="Size" options={sizeOptions} fullWidth />
 */
export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Label text for the select */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below select */
  helperText?: string;
  /** Options to display in the select */
  options: SelectOption[];
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Make select full width */
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      size = 'md',
      fullWidth = false,
      id: providedId,
      className = '',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = error ? `${id}-error` : undefined;

    const sizeClasses = {
      sm: 'py-2 px-3 text-sm',
      md: 'py-3 px-4 text-base',
      lg: 'py-4 px-5 text-lg',
    };

    const baseClasses = 'w-full border rounded-lg bg-[var(--color-bg)] focus:outline-none focus:ring-2 transition-all';
    const errorClasses = error
      ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
      : 'border-[var(--color-border)] focus:ring-[var(--color-primary)] focus:border-transparent';

    const selectClasses = `${baseClasses} ${sizeClasses[size]} ${errorClasses} ${className}`.trim();

    const wrapperClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={selectClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
);

Select.displayName = 'Select';
