import { getServerGameSession } from '@/lib/serverGameSession';
import GameScreen from './GameScreen';

export default async function GamePage() {
  const session = await getServerGameSession();
  return <GameScreen initialGame={session.game} initialGameCode={session.gameCode} initialPlayerId={session.playerId} />;
}
