import { forwardRef } from 'react';

/**
 * Typography component for semantic text styles.
 *
 * @example
 * // Basic usage
 * <Typography variant="heading">Section Title</Typography>
 *
 * @example
 * // Migrating from inline text classes
 * // Before: <h2 className="text-2xl font-bold font-display">Title</h2>
 * // After:  <Typography variant="title">Title</Typography>
 *
 * @example
 * // With gradient effect
 * <Typography variant="display" gradient>Hero Heading</Typography>
 *
 * @example
 * // Custom semantic HTML with color
 * <Typography variant="small" as="label" color="secondary">Form label</Typography>
 */
export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  /** Visual style variant */
  variant?: 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'small' | 'micro';
  /** Semantic HTML element to render as */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label' | 'legend';
  /** Text color */
  color?: 'primary' | 'secondary' | 'accent' | 'error' | 'success';
  /** Apply gradient effect (overrides color) */
  gradient?: boolean;
  children: React.ReactNode;
}

const defaultElements: Record<TypographyProps['variant'] & string, TypographyProps['as']> = {
  display: 'h1',
  title: 'h2',
  heading: 'h3',
  subheading: 'h4',
  body: 'p',
  small: 'span',
  micro: 'span',
};

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = 'body',
      as,
      color = 'primary',
      gradient = false,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const Component = (as || defaultElements[variant] || 'p') as keyof React.JSX.IntrinsicElements;

    const variantClasses = {
      display: 'text-5xl sm:text-6xl font-bold font-display',
      title: 'text-2xl font-bold font-display',
      heading: 'text-xl font-semibold font-display',
      subheading: 'text-lg font-medium',
      body: 'text-base',
      small: 'text-sm',
      micro: 'text-xs',
    };

    const colorClasses = {
      primary: 'text-[var(--color-text)]',
      secondary: 'text-[var(--color-text-secondary)]',
      accent: 'text-[var(--color-accent)]',
      error: 'text-[var(--color-error)]',
      success: 'text-[var(--color-success)]',
    };

    const gradientClass = gradient ? 'gradient-text' : '';
    const appliedColorClass = gradient ? '' : colorClasses[color];

    const classes = `${variantClasses[variant]} ${appliedColorClass} ${gradientClass} ${className}`.trim();

    return (
      <Component ref={ref} className={classes} {...rest}>
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';
