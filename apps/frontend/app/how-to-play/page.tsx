import Link from 'next/link';
import { MarketingHeader } from '@/components/MarketingHeader';
import { RoutesTable } from '@/components/RoutesTable';
import { Card } from '@/components/ui/Card';
import { BackButton } from './BackButton';
import type { RouteHole } from '@/lib/types';
import type { PenaltyOption } from '@/lib/api';

const apiUrl = process.env.API_SERVER_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.pubgolf.me'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

async function loadGuideData<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export default async function HowToPlayPage() {
  const [course, penalties] = await Promise.all([
    loadGuideData<{ holes: RouteHole[] }>('/api/v1/config/routes'),
    loadGuideData<{ penalties: PenaltyOption[] }>('/api/v1/config/penalty-options'),
  ]);
  return (
    <>
      <MarketingHeader />
      <main className="page-container py-6 md:py-10">
        <div className="rules-grid grid gap-6">
          <div className="lg:col-span-2"><BackButton fromGame={false} /></div>
          <div className="lg:col-span-2">
            <h1 className="font-display mb-3 text-4xl">How to Play Pub Golf</h1>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
              Pub golf turns a pub crawl into a round of golf. Each hole has a drink and a target
              number of sips called par. Record your score at each hole; the lowest total wins.
            </p>
          </div>
          <Card as="section" padding="lg" rounded="lg" className="min-w-0 space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">How It Works</h2>
            <ol className="list-decimal space-y-3 pl-5 text-[var(--color-text-secondary)]">
              <li>The host creates a round, chooses the course, and shares the code or invite link.</li>
              <li>If the course has more than one drink route, pick one at the start and stick to it.</li>
              <li>At each hole, count the sips it takes to finish your drink and log that number.</li>
              <li>Compare your score with par. The leaderboard tracks each player across nine holes.</li>
              <li>The lowest total score wins. Each player can use Wildcard once during the round.</li>
            </ol>
            <h3 className="font-bold text-[var(--color-text)]">Scoring example</h3>
            <p className="text-[var(--color-text-secondary)]">
              If a hole has a par of 3 and you finish in 2 sips, your score is 2: one under par.
              Four sips would be one over par. A score of zero is recorded as a played hole.
            </p>
            <h3 className="font-bold text-[var(--color-error)]">Penalties</h3>
            <p className="text-[var(--color-text-secondary)]">
              A penalty records a score for the hole in place of your sip count.
              {penalties?.penalties?.length ? ' The available penalties are:' : ''}
            </p>
            {penalties?.penalties?.length ? (
              <ul className="space-y-2 text-[var(--color-text-secondary)]">
                {penalties.penalties.map((penalty) => (
                  <li key={penalty.type}><strong>{penalty.name}</strong>: {penalty.points} strokes</li>
                ))}
              </ul>
            ) : null}
          </Card>
          <Card as="section" padding="lg" rounded="lg" className="min-w-0">
            <h2 className="mb-3 font-bold text-[var(--color-text)]">The Course</h2>
            <p className="mb-4 text-[var(--color-text-secondary)]">
              A course has nine holes, with drinks and pars set by the host. Groups can choose
              their own venues and non-alcoholic drinks.
            </p>
            {course?.holes?.length ? <RoutesTable holes={course.holes} /> : null}
          </Card>
          <section className="lg:col-span-2 glass rounded-2xl p-6">
            <h2 className="font-display text-2xl">How many pubs do you need?</h2>
            <p className="mt-2 max-w-3xl text-[var(--color-text-secondary)]">
              Pub golf can be played in many ways. This app tracks nine holes, whether your group
              visits nine pubs or plays several holes at the same venue. The host chooses the course.
            </p>
            <Link href="/play?mode=host" className="btn-gradient mt-5 inline-flex min-h-12 items-center rounded-xl px-6 py-3">
              Host a round →
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
