'use client';

interface ActiveEventBannerProps {
  eventName: string;
}

export function ActiveEventBanner({ eventName }: ActiveEventBannerProps) {
  return (
    <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-lg px-4 py-3">
      <p className="font-medium text-[var(--color-accent)] text-center">
        Active Event: {eventName}
      </p>
    </div>
  );
}
