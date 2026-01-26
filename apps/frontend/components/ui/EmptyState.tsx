import { Button } from './Button';
import { Card } from './Card';

export interface EmptyStateProps {
  /** Emoji icon to display */
  icon?: string;
  /** Main heading text */
  title?: string;
  /** Description text explaining the empty state */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState component for displaying placeholder content when data is not available.
 *
 * @example
 * // Basic usage
 * <EmptyState
 *   icon="🎯"
 *   title="No scores yet"
 *   description="Scores will appear here once players submit them"
 * />
 *
 * @example
 * // With action button
 * <EmptyState
 *   icon="📝"
 *   description="No events recorded yet"
 *   action={{ label: "Learn More", onClick: () => {} }}
 * />
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card variant="glass" padding="lg" className="text-center">
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        {icon && (
          <div className="text-5xl" role="img" aria-label={title || 'Empty state icon'}>
            {icon}
          </div>
        )}
        {title && (
          <h3 className="text-xl font-semibold text-[var(--color-text)]">
            {title}
          </h3>
        )}
        <p className="text-[var(--color-text-secondary)] max-w-md">
          {description}
        </p>
        {action && (
          <Button
            variant="secondary"
            size="md"
            onClick={action.onClick}
            className="mt-2"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
