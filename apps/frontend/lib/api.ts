import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/hooks/useLocalStorage';
import { CreateGameResponse, JoinGameResponse, GameState, PenaltyType, RoutesResponse, GameEvent, ActiveEvent, PlaceSearchResult, Pub, RouteData } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pubgolf.me';
const FETCH_TIMEOUT_MS = 15_000;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function timedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

// Rewrites known backend messages into copy a player can act on.
function friendlyMessage(status: number, backendMessage: string): string {
  if (backendMessage.includes('already exists for game')) {
    return "That name's already taken in this game — try another.";
  }
  if (backendMessage.includes('does not belong to game')) {
    return "You're not part of this game — rejoin from the home screen.";
  }
  if (status === 404 && /^Game `.*` not found/.test(backendMessage)) {
    return 'Game not found — double-check the code.';
  }
  if (backendMessage.includes('modified concurrently')) {
    return 'Someone else updated the game at the same moment — please try again.';
  }
  return backendMessage;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message = statusMessage(response.status, text);
    try {
      const json = JSON.parse(text);
      message = json.message ? friendlyMessage(response.status, json.message) : message;
    } catch {
      if (text) message = text;
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      toast.error('Session expired', { description: 'Please rejoin the game.' });
      localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
      localStorage.removeItem(STORAGE_KEYS.GAME_CODE);
      setTimeout(() => { window.location.href = '/'; }, 1500);
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function statusMessage(status: number, fallback: string): string {
  if (fallback) return fallback;
  if (status === 403) return "You don't have permission to do that";
  if (status === 404) return 'Not found';
  if (status >= 500) return 'Server error — please try again';
  return 'Something went wrong';
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
      if (error instanceof ApiError) throw error;
      lastError = error instanceof DOMException && error.name === 'AbortError'
        ? new Error('Request timed out — check your connection and try again')
        : error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  playerId?: string | null;
}

async function request<T>(path: string, { method = 'GET', body, playerId }: ApiRequestOptions = {}): Promise<T> {
  const doFetch = async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (playerId) {
      headers['PubGolf-Player-Id'] = playerId;
    }
    const response = await timedFetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return handleResponse<T>(response);
  };

  // Only GETs are retried: a timed-out mutation may still have succeeded
  // server-side, and repeating it can create duplicate games or consume
  // one-shot actions like the wildcard.
  return method === 'GET' ? fetchWithRetry(doFetch) : doFetch();
}

function gamePath(gameCode: string, suffix: string = ''): string {
  return `/api/v1/games/${encodeURIComponent(gameCode)}${suffix}`;
}

export async function getRoutes(): Promise<RoutesResponse> {
  return request('/api/v1/config/routes');
}

export async function createGame(host: string): Promise<CreateGameResponse> {
  return request('/api/v1/games', { method: 'POST', body: { host } });
}

export async function joinGame(gameCode: string, name: string): Promise<JoinGameResponse> {
  return request(gamePath(gameCode, '/players'), { method: 'POST', body: { name } });
}

export async function getGameState(gameCode: string): Promise<GameState> {
  return request(gamePath(gameCode));
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
  return request(gamePath(gameCode, '/scores'), { method: 'POST', body, playerId });
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
  return request('/api/v1/config/randomise-options');
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
  return request('/api/v1/config/penalty-options');
}

export async function spinWheel(
  gameCode: string,
  playerId: string
): Promise<SpinWheelResponse> {
  return request(gamePath(gameCode, '/randomise'), { method: 'POST', playerId });
}

export async function completeGame(gameCode: string, playerId: string): Promise<GameState> {
  return request(gamePath(gameCode), { method: 'PATCH', body: { status: 'COMPLETED' }, playerId });
}

export interface EventsResponse {
  events: GameEvent[];
}

export interface ActiveEventStateResponse {
  activeEvent: ActiveEvent | null;
}

export async function getAvailableEvents(gameCode: string): Promise<EventsResponse> {
  return request(gamePath(gameCode, '/events'));
}

export async function getActiveEvent(gameCode: string): Promise<ActiveEventStateResponse> {
  return request(gamePath(gameCode, '/events/active'));
}

export async function activateEvent(
  gameCode: string,
  eventId: string,
  playerId: string
): Promise<GameState> {
  return request(gamePath(gameCode, '/active-event'), { method: 'PUT', body: { eventId }, playerId });
}

export async function endEvent(gameCode: string, playerId: string): Promise<GameState> {
  return request(gamePath(gameCode, '/active-event'), { method: 'DELETE', playerId });
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
  return request(`/api/v1/places/search?${params.toString()}`);
}

export async function setPubs(
  gameCode: string,
  playerId: string,
  pubs: Pub[]
): Promise<void> {
  return request(gamePath(gameCode, '/pubs'), { method: 'PUT', body: { pubs }, playerId });
}

export async function getRoute(gameCode: string): Promise<RouteData> {
  return request(gamePath(gameCode, '/route'));
}

export { ApiError };
