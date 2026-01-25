import { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      onClick,
      type = 'button',
      className = '',
      ariaLabel,
      ...rest
    },
    ref
  ) => {
    const baseClasses = 'rounded-lg font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

    const variantClasses = {
      primary: 'btn-gradient focus-visible:outline-[var(--color-accent)]',
      secondary: 'glass border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-[var(--color-primary)]',
      ghost: 'bg-transparent text-[var(--color-text)] hover:bg-white/5 focus-visible:outline-[var(--color-primary)]',
      danger: 'border border-red-500 text-red-500 hover:bg-red-500/10 focus-visible:outline-red-500',
    };

    const sizeClasses = {
      sm: 'py-2 px-3 text-sm',
      md: 'py-3 px-4 text-base',
      lg: 'py-4 px-6 text-lg',
    };

    const disabledClasses = disabled || loading
      ? 'opacity-50 cursor-not-allowed transform-none shadow-none'
      : '';

    const activeClasses = disabled || loading ? '' : 'active:scale-[0.98]';

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${activeClasses} ${className}`.trim();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={handleClick}
        className={classes}
        aria-label={ariaLabel}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...rest}
      >
        {loading && (
          <span role="status" className="inline-block mr-2">
            <svg
              className="animate-spin h-4 w-4 inline-block"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
