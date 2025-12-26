import { CreateGameResponse, JoinGameResponse, GameState } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pubgolf.me';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text().catch(() => 'Request failed');
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function createGame(host: string): Promise<CreateGameResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host }),
  });
  return handleResponse<CreateGameResponse>(response);
}

export async function joinGame(gameCode: string, name: string): Promise<JoinGameResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse<JoinGameResponse>(response);
}

export async function getGameState(gameCode: string): Promise<GameState> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameCode}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<GameState>(response);
}

export async function submitScore(
  gameCode: string,
  playerId: string,
  hole: number,
  score: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/games/${gameCode}/players/${playerId}/scores`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hole, score }),
    }
  );
  return handleResponse<void>(response);
}
