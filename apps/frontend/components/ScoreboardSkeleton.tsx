import { Skeleton } from './ui/Skeleton';

export function ScoreboardSkeleton() {
  return (
    <div
      className="overflow-x-auto -mx-4 px-4"
      role="region"
      aria-label="Scrollable scoreboard"
      tabIndex={0}
    >
      <table className="w-full border-collapse text-sm" role="table" aria-label="Loading scoreboard">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th scope="col" className="sticky left-0 z-10 bg-[var(--color-surface)] px-3 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
              Player
            </th>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
              <th scope="col" key={hole} className="px-3 py-3 text-center font-semibold min-w-[44px] text-[var(--color-text-secondary)]">
                {hole}
              </th>
            ))}
            <th scope="col" className="px-3 py-3 text-center font-semibold text-[var(--color-accent)]">Total</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map((row) => (
            <tr key={row} className="border-b border-[var(--color-border-subtle)]">
              <td className="sticky left-0 z-10 px-3 py-3 bg-[var(--color-surface)]">
                <Skeleton width="120px" height="1.25rem" />
              </td>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
                <td key={col} className="px-3 py-3 text-center">
                  <div className="flex justify-center">
                    <Skeleton width="28px" height="1.25rem" />
                  </div>
                </td>
              ))}
              <td className="px-3 py-3 text-center">
                <div className="flex justify-center">
                  <Skeleton width="36px" height="1.25rem" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sr-only" role="status" aria-live="polite">
        Loading scoreboard...
      </div>
    </div>
  );
}
