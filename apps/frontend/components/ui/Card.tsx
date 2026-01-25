import { forwardRef } from 'react';

/**
 * Card component with glass morphism effect.
 *
 * @example
 * // Basic usage
 * <Card>Content goes here</Card>
 *
 * @example
 * // Migrating from inline glass class
 * // Before: <div className="glass rounded-xl p-4">...</div>
 * // After:  <Card padding="sm">...</Card>
 *
 * @example
 * // With accent border
 * <Card variant="accent">Highlighted content</Card>
 *
 * @example
 * // As semantic HTML
 * <Card as="section" padding="lg">Section content</Card>
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant for border color */
  variant?: 'glass' | 'accent' | 'danger' | 'primary';
  /** Internal padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Apply glow effect */
  glow?: boolean | 'sm';
  /** Border radius size */
  rounded?: 'md' | 'lg' | 'xl';
  /** Semantic HTML element to render as */
  as?: 'div' | 'section' | 'article';
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'glass',
      padding = 'md',
      glow = false,
      rounded = 'xl',
      as: Component = 'div',
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const baseClasses = 'glass';

    const variantClasses = {
      glass: '',
      accent: 'border-[var(--color-accent)]',
      danger: 'border-[var(--color-error)]',
      primary: 'border-[var(--color-primary)]',
    };

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    };

    const glowClasses = glow === 'sm' ? 'glow-sm' : glow === true ? 'glow' : '';

    const roundedClasses = {
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${glowClasses} ${roundedClasses[rounded]} ${className}`.trim();

    return (
      <Component ref={ref} className={classes} {...rest}>
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';
