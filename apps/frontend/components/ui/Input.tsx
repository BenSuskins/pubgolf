import { forwardRef, useId } from 'react';

/**
 * Input component with label, error handling, and size variants.
 *
 * @example
 * // Basic usage with label
 * <Input label="Email" type="email" />
 *
 * @example
 * // With error state
 * <Input label="Username" error="Username is required" />
 *
 * @example
 * // With helper text
 * <Input label="Password" type="password" helperText="Must be at least 8 characters" />
 *
 * @example
 * // Full width input
 * <Input label="Full Name" fullWidth />
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Make input full width */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
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

    const inputClasses = `${baseClasses} ${sizeClasses[size]} ${errorClasses} ${className}`.trim();

    const wrapperClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          {...rest}
        />
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

Input.displayName = 'Input';
