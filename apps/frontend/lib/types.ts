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

export interface GameEvent {
  id: string;
  title: string;
  description: string;
}

export interface ActiveEvent {
  id: string;
  title: string;
  description: string;
  activatedAt: string;
}

export interface GameState {
  gameId: string;
  gameCode: string;
  status: GameStatus;
  hostPlayerId: string | null;
  players: Player[];
  activeEvent: ActiveEvent | null;
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

export interface Pub {
  name: string;
  latitude: number;
  longitude: number;
}

export interface PubLocation extends Pub {
  hole: number;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: number[][];
}

export interface RouteData {
  pubs: PubLocation[];
  route: RouteGeometry | null;
}

export interface PlaceSearchResult {
  name: string;
  latitude: number;
  longitude: number;
}
