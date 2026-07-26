import Link from 'next/link';
import { Typography } from '@/components/ui/Typography';

export default function NotFound() {
  return (
    <section className="min-h-full flex flex-col items-center justify-center bg-ambient p-6 text-center">
      <Typography variant="display" className="mb-3 text-4xl">
        Out of Bounds
      </Typography>
      <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)] mb-6 max-w-md">
        That page doesn&apos;t exist. Head back to the clubhouse to host or join a round.
      </p>
      <Link
        href="/"
        className="text-[13px] text-[var(--color-text-muted)] border-b border-dashed border-[var(--color-border-subtle)] pb-0.5 hover:text-[var(--color-text-secondary)] transition-colors"
      >
        Back to Pub Golf
      </Link>
    </section>
  );
}
