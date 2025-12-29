import { test as base, Page } from '@playwright/test';

const API_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

interface GameSession {
  gameCode: string;
  gameId: string;
  playerId: string;
  playerName: string;
}

interface GameState {
  gameId: string;
  gameCode: string;
  status: 'ACTIVE' | 'COMPLETED';
  hostPlayerId: string | null;
  players: Array<{
    id: string;
    name: string;
    scores: number[];
    totalScore: number;
  }>;
}

interface TestFixtures {
  createGameViaApi: (hostName: string) => Promise<GameSession>;
  joinGameViaApi: (gameCode: string, playerName: string) => Promise<GameSession>;
  submitScoreViaApi: (gameCode: string, playerId: string, hole: number, score: number) => Promise<void>;
  completeGameViaApi: (gameCode: string, playerId: string) => Promise<GameState>;
  authenticatedPage: Page;
}

export const test = base.extend<TestFixtures>({
  createGameViaApi: async ({}, use) => {
    const createGame = async (hostName: string): Promise<GameSession> => {
      const response = await fetch(`${API_URL}/api/v1/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: hostName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create game: ${response.status}`);
      }

      const data = await response.json();
      return {
        gameCode: data.gameCode,
        gameId: data.gameId,
        playerId: data.playerId,
        playerName: data.playerName,
      };
    };

    await use(createGame);
  },

  joinGameViaApi: async ({}, use) => {
    const joinGame = async (gameCode: string, playerName: string): Promise<GameSession> => {
      const response = await fetch(`${API_URL}/api/v1/games/${gameCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to join game: ${response.status}`);
      }

      const data = await response.json();
      return {
        gameCode: data.gameCode,
        gameId: data.gameId,
        playerId: data.playerId,
        playerName: data.playerName,
      };
    };

    await use(joinGame);
  },

  submitScoreViaApi: async ({}, use) => {
    const submitScore = async (
      gameCode: string,
      playerId: string,
      hole: number,
      score: number
    ): Promise<void> => {
      const response = await fetch(
        `${API_URL}/api/v1/games/${gameCode}/players/${playerId}/scores`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hole, score }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to submit score: ${response.status}`);
      }
    };

    await use(submitScore);
  },

  completeGameViaApi: async ({}, use) => {
    const completeGame = async (
      gameCode: string,
      playerId: string
    ): Promise<GameState> => {
      const response = await fetch(
        `${API_URL}/api/v1/games/${gameCode}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to complete game: ${response.status}`);
      }

      return response.json();
    };

    await use(completeGame);
  },

  authenticatedPage: async ({ page, createGameViaApi }, use) => {
    const session = await createGameViaApi('TestPlayer');

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('gameCode', session.gameCode);
      localStorage.setItem('playerId', session.playerId);
      localStorage.setItem('playerName', session.playerName);
    }, session);

    await use(page);
  },
});

export { expect } from '@playwright/test';
