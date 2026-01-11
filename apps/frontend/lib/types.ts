export interface Randomise {
  hole: number;
  result: string;
}

export type PenaltyType = 'SKIP' | 'CHUNDER';

export interface Penalty {
  hole: number;
  type: PenaltyType;
  points: number;
}

export const PENALTY_EMOJI_MAP: Record<PenaltyType, string> = {
  SKIP: '🚫',
  CHUNDER: '🤮',
};

export interface Player {
  id: string;
  name: string;
  scores: (number | null)[];
  totalScore: number;
  randomise: Randomise | null;
  penalties: Penalty[];
}

export type GameStatus = 'ACTIVE' | 'COMPLETED';

export interface GameState {
  gameId: string;
  gameCode: string;
  status: GameStatus;
  hostPlayerId: string | null;
  players: Player[];
}

export interface CreateGameResponse {
  gameId: string;
  gameCode: string;
  playerId: string;
  playerName: string;
}

export interface JoinGameResponse {
  gameId: string;
  gameCode: string;
  playerId: string;
  playerName: string;
}

export interface RouteHole {
  hole: number;
  par: number;
  drinks: Record<string, string>;
}

export interface RoutesResponse {
  holes: RouteHole[];
}

export interface Event {
  id: string;
  name: string;
  description: string;
}

export interface EventsResponse {
  events: Event[];
}

export interface EventPayload {
  eventId: string;
  name: string;
  description: string;
}

export interface EventEndPayload {
  eventId: string;
  name: string;
}

export type WebSocketMessageType =
  | 'GAME_STATE'
  | 'EVENT_START'
  | 'EVENT_END'
  | 'GAME_ENDED';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
}
