import { gamePath } from './apiLocation';
import { ApiError, ApiRequestOptions, transportRequest } from './apiTransport';
import { expireSession } from './sessionExpiry';
import { CreateGameResponse, JoinGameResponse, GameState, PenaltyType, RouteHole, RoutesResponse, GameEvent, ActiveEvent, PlaceSearchResult, Pub, RouteData } from './types';

type PublicConfigOptions = Pick<ApiRequestOptions, 'baseUrl' | 'timeoutMs' | 'retries' | 'cache'>;

function serverConfigOptions(): PublicConfigOptions {
  return {
    baseUrl: process.env.API_SERVER_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://api.pubgolf.me' : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'),
    timeoutMs: 2000,
    retries: 1,
    cache: 'no-store',
  };
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  try {
    return await transportRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) expireSession();
    throw error;
  }
}

export async function getRoutes(options: PublicConfigOptions = {}): Promise<RoutesResponse> {
  return request('/api/v1/config/routes', options);
}

export async function getServerRoutes(): Promise<RoutesResponse> {
  return getRoutes(serverConfigOptions());
}

export async function createGame(host: string): Promise<CreateGameResponse> {
  return request('/api/v1/games', { method: 'POST', body: { host } });
}

export async function joinGame(gameCode: string, name: string, rejoin: boolean = false): Promise<JoinGameResponse> {
  return request(gamePath(gameCode, '/players'), { method: 'POST', body: { name, rejoin } });
}

export async function getGameState(gameCode: string, options: PublicConfigOptions = {}): Promise<GameState> {
  return request(gamePath(gameCode), options);
}

export async function getServerGameState(gameCode: string): Promise<GameState> {
  return getGameState(gameCode, serverConfigOptions());
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

export async function getRandomiseOptions(options: PublicConfigOptions = {}): Promise<WheelOptionsResponse> {
  return request('/api/v1/config/randomise-options', options);
}

export async function getServerRandomiseOptions(): Promise<WheelOptionsResponse> {
  return getRandomiseOptions(serverConfigOptions());
}

export interface PenaltyOption {
  type: string;
  name: string;
  points: number;
}

export interface PenaltyOptionsResponse {
  penalties: PenaltyOption[];
}

export async function getPenaltyOptions(options: PublicConfigOptions = {}): Promise<PenaltyOptionsResponse> {
  return request('/api/v1/config/penalty-options', options);
}

export async function getServerPenaltyOptions(): Promise<PenaltyOptionsResponse> {
  return getPenaltyOptions(serverConfigOptions());
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

export async function activateCustomEvent(
  gameCode: string,
  title: string,
  description: string,
  playerId: string
): Promise<GameState> {
  return request(gamePath(gameCode, '/active-event/custom'), {
    method: 'PUT',
    body: { title, description },
    playerId,
  });
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

// Replaces the game's whole course. Returns the updated state, which is also
// broadcast to every connected player.
export async function setHoles(
  gameCode: string,
  playerId: string,
  holes: RouteHole[]
): Promise<GameState> {
  return request(gamePath(gameCode, '/holes'), { method: 'PUT', body: { holes }, playerId });
}

export { ApiError };
