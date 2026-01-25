export interface SkeletonProps {
  width?: string;
  height?: string;
  variant?: 'rectangle' | 'circle';
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'rectangle',
  className = '',
}: SkeletonProps) {
  const baseClasses = 'bg-[var(--color-border)] animate-pulse';
  const variantClasses = variant === 'circle' ? 'rounded-full aspect-square' : 'rounded';
  const classes = `${baseClasses} ${variantClasses} ${className}`.trim();

  return (
    <div
      className={classes}
      style={{ width, height }}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
