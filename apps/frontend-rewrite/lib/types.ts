export interface Player {
  id: string;
  name: string;
  scores: (number | null)[];
  totalScore: number;
}

export interface GameState {
  gameId: string;
  gameCode: string;
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

// Par values for each hole (1-9)
export const PAR_VALUES = [1, 3, 2, 2, 2, 2, 4, 1, 1];
