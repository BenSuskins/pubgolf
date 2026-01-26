import { Button } from './Button';
import { Card } from './Card';

export interface ErrorMessageProps {
  /** Error message text */
  message: string;
  /** Display variant - inline for subtle errors, card for prominent errors */
  variant?: 'inline' | 'card';
  /** Show error icon (default: true) */
  icon?: boolean;
  /** Optional action button (e.g., retry) */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * ErrorMessage component for displaying error states consistently.
 *
 * @example
 * // Inline error (subtle)
 * <ErrorMessage message="Invalid input" variant="inline" />
 *
 * @example
 * // Card error (prominent)
 * <ErrorMessage
 *   message="Failed to load data"
 *   variant="card"
 *   action={{ label: "Retry", onClick: () => {} }}
 * />
 *
 * @example
 * // Without icon
 * <ErrorMessage message="Something went wrong" icon={false} />
 */
export function ErrorMessage({
  message,
  variant = 'inline',
  icon = true,
  action,
}: ErrorMessageProps) {
  const ErrorIcon = () => (
    <svg
      className="w-5 h-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  if (variant === 'inline') {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 text-[var(--color-error)] text-sm"
      >
        {icon && <ErrorIcon />}
        <span>{message}</span>
      </div>
    );
  }

  return (
    <Card variant="danger" padding="md" role="alert">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="text-[var(--color-error)] mt-0.5">
              <ErrorIcon />
            </div>
          )}
          <p className="text-[var(--color-error)] flex-1">{message}</p>
        </div>
        {action && (
          <Button
            variant="danger"
            size="sm"
            onClick={action.onClick}
            className="self-start"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
