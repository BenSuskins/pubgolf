export interface Randomise {
  hole: number;
  result: string;
}

export interface Player {
  id: string;
  name: string;
  scores: (number | null)[];
  totalScore: number;
  randomise: Randomise | null;
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

export const PAR_VALUES = [1, 3, 2, 2, 2, 2, 4, 1, 1];
