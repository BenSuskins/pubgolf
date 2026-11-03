import Link from 'next/link';
import { MarketingHeader } from '@/components/MarketingHeader';
import { RoutesTable } from '@/components/RoutesTable';
import { Card } from '@/components/ui/Card';
import { BackButton } from './BackButton';
import type { RouteHole } from '@/lib/types';

const exampleCourse: RouteHole[] = [
  { hole: 1, par: 1, drinks: { 'Route A': 'Tequila', 'Route B': 'Sambuca' } },
  { hole: 2, par: 3, drinks: { 'Route A': 'Beer', 'Route B': 'Double Vodka & Single Vodka w/ Mixer' } },
  { hole: 3, par: 2, drinks: { 'Route A': 'Wine', 'Route B': 'Double Gin w/ Mixer' } },
  { hole: 4, par: 2, drinks: { 'Route A': 'Cider', 'Route B': 'Double Rum w/ Mixer' } },
  { hole: 5, par: 2, drinks: { 'Route A': 'Cocktail', 'Route B': 'Cocktail' } },
  { hole: 6, par: 2, drinks: { 'Route A': 'Spirit w/ Mixer', 'Route B': 'Spirit w/ Mixer' } },
  { hole: 7, par: 4, drinks: { 'Route A': 'Guinness', 'Route B': '2 x Double Whiskey w/ Mixer' } },
  { hole: 8, par: 1, drinks: { 'Route A': 'Jägerbomb', 'Route B': 'Jägerbomb' } },
  { hole: 9, par: 1, drinks: { 'Route A': 'VK', 'Route B': 'Smirnoff Ice' } },
];

export default function HowToPlayPage() {
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
              In Pub Golf, choosing <strong>Skip a drink</strong> records 5 strokes for that hole.
              Choosing <strong>Tactical chunder</strong> records 10. These replace the sip score for
              the hole; they are not added on top.
            </p>
          </Card>
          <Card as="section" padding="lg" rounded="lg" className="min-w-0">
            <h2 className="mb-3 font-bold text-[var(--color-text)]">The Course</h2>
            <p className="mb-4 text-[var(--color-text-secondary)]">
              This example course has nine holes and two drink routes. The host can change the
              drinks and pars. Groups can choose their own venues and non-alcoholic drinks.
            </p>
            <RoutesTable holes={exampleCourse} />
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
