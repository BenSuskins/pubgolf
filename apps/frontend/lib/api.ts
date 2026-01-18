import { CreateGameResponse, JoinGameResponse, GameState, PenaltyType, RoutesResponse, GameEvent, ActiveEvent, PlaceSearchResult, Pub, RouteData } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pubgolf.me';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message = 'Request failed';
    try {
      const json = JSON.parse(text);
      message = json.message || text || 'Request failed';
    } catch {
      message = text || 'Request failed';
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function fetchWithRetry<T>(
  fetchFunction: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 500
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFunction();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export async function getRoutes(): Promise<RoutesResponse> {
  return fetchWithRetry(async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/games/routes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<RoutesResponse>(response);
  });
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
  score: number,
  penaltyType?: PenaltyType | null
): Promise<void> {
  const body: { hole: number; score: number; penaltyType?: PenaltyType } = { hole, score };
  if (penaltyType) {
    body.penaltyType = penaltyType;
  }
  const response = await fetch(
    `${API_BASE_URL}/api/v1/games/${gameCode}/players/${playerId}/scores`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  return handleResponse<void>(response);
}

export interface WheelOption {
  option: string;
  optionSize: number;
}

export interface WheelOptionsResponse {
  options: WheelOption[];
}

export interface SpinWheelResponse {
  result: string;
  hole: number;
}

export async function getRandomiseOptions(): Promise<WheelOptionsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/randomise-options`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<WheelOptionsResponse>(response);
}

export interface PenaltyOption {
  type: string;
  name: string;
  points: number;
}

export interface PenaltyOptionsResponse {
  penalties: PenaltyOption[];
}

export async function getPenaltyOptions(): Promise<PenaltyOptionsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/penalty-options`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<PenaltyOptionsResponse>(response);
}

export async function spinWheel(
  gameCode: string,
  playerId: string
): Promise<SpinWheelResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/games/${gameCode}/players/${playerId}/randomise`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return handleResponse<SpinWheelResponse>(response);
}

export async function completeGame(gameCode: string, playerId: string): Promise<GameState> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameCode}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  });
  return handleResponse<GameState>(response);
}

export interface EventsResponse {
  events: GameEvent[];
}

export interface ActiveEventStateResponse {
  activeEvent: ActiveEvent | null;
}

export async function getAvailableEvents(gameCode: string): Promise<EventsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameCode}/events`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<EventsResponse>(response);
}

export async function getActiveEvent(gameCode: string): Promise<ActiveEventStateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameCode}/events/active`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<ActiveEventStateResponse>(response);
}

export async function activateEvent(
  gameCode: string,
  eventId: string,
  playerId: string
): Promise<GameState> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/games/${gameCode}/events/${eventId}/activate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    }
  );
  return handleResponse<GameState>(response);
}

export async function endEvent(gameCode: string, playerId: string): Promise<GameState> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameCode}/events/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  });
  return handleResponse<GameState>(response);
}

export async function searchPlaces(
  query: string,
  latitude?: number,
  longitude?: number
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (latitude !== undefined && longitude !== undefined) {
    params.append('lat', latitude.toString());
    params.append('lng', longitude.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/places/search?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<PlaceSearchResult[]>(response);
}

export async function setPubs(
  gameCode: string,
  playerId: string,
  pubs: Pub[]
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameCode}/pubs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, pubs }),
  });
  return handleResponse<void>(response);
}

export async function getRoute(gameCode: string): Promise<RouteData> {
  const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameCode}/route`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<RouteData>(response);
}

export { ApiError };
