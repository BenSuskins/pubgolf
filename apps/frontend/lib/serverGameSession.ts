import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerGameState, ApiError } from './api';

export async function getServerGameSession() {
  const store = await cookies();
  const gameCode = store.get('gameCode')?.value;
  const playerId = store.get('playerId')?.value;
  if (!gameCode || !playerId) redirect('/play');

  try {
    const game = await getServerGameState(gameCode);
    if (!game.players.some((player) => player.id === playerId)) redirect('/play');
    return { gameCode, playerId, game };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) redirect('/play');
    throw error;
  }
}
