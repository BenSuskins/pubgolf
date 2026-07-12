import { Skeleton } from './ui/Skeleton';

export function ScoreboardSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading leaderboard">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="glass rounded-[14px] px-3.5 py-3 flex items-center gap-3">
          <Skeleton width="20px" height="1.25rem" />
          <Skeleton width="34px" height="34px" variant="circle" />
          <div className="flex-1">
            <Skeleton width="120px" height="1.25rem" />
          </div>
          <Skeleton width="36px" height="1.25rem" />
        </div>
      ))}
      <div className="sr-only" role="status" aria-live="polite">
        Loading leaderboard...
      </div>
    </div>
  );
}
