import { getServerPenaltyOptions } from '@/lib/api';
import { getServerGameSession } from '@/lib/serverGameSession';
import ScoreForm from './ScoreForm';

export default async function SubmitScorePage() {
  const [session, penalties] = await Promise.all([
    getServerGameSession(),
    getServerPenaltyOptions().catch(() => null),
  ]);
  const player = session.game.players.find((candidate) => candidate.id === session.playerId)!;
  return <ScoreForm initialPenalties={penalties?.penalties ?? null} initialGame={session.game} initialPlayer={player} />;
}
