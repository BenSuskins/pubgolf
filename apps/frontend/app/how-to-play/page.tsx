import Link from 'next/link';
import { MarketingHeader } from '@/components/MarketingHeader';
import { RoutesTable } from '@/components/RoutesTable';
import { Card } from '@/components/ui/Card';
import { RulesList, PenaltiesList } from '@/components/RulesDetails';
import { BackButton } from './BackButton';
import { getServerPenaltyOptions, getServerRoutes } from '@/lib/api';

export default async function HowToPlayPage() {
  const [course, penalties] = await Promise.all([
    getServerRoutes().catch(() => null),
    getServerPenaltyOptions().catch(() => null),
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
          <Card as="section" padding="lg" rounded="lg" className="min-w-0">
            <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-3.5">How It Works</h2>
            <RulesList holes={course?.holes ?? []} />
            <h3 className="text-[var(--color-error)] font-bold text-sm mb-2.5">Penalties</h3>
            <PenaltiesList penalties={penalties?.penalties ?? []} />
          </Card>
          <Card as="section" padding="lg" rounded="lg" className="min-w-0">
            <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-3">The Course</h2>
            {course?.holes?.length ? <RoutesTable holes={course.holes} /> : null}
          </Card>
          <section className="lg:col-span-2 glass rounded-2xl p-6">
            <h2 className="font-display text-2xl">Scoring example</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              If a hole has a par of 3 and you finish in 2 sips, your score is 2: one under par.
              Four sips would be one over par. A score of zero is recorded as a played hole.
              A penalty records a score for the hole in place of your sip count.
            </p>
          </section>
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
