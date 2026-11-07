import { getServerPenaltyOptions } from '@/lib/api';
import ScoreForm from './ScoreForm';

export default async function SubmitScorePage() {
  const penalties = await getServerPenaltyOptions().catch(() => null);

  return <ScoreForm initialPenalties={penalties?.penalties ?? null} />;
}
