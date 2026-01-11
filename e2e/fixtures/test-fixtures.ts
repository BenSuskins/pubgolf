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

interface Event {
  id: string;
  name: string;
  description: string;
}

interface EventPayload {
  eventId: string;
  name: string;
  description: string;
}

interface TestFixtures {
  createGameViaApi: (hostName: string) => Promise<GameSession>;
  joinGameViaApi: (gameCode: string, playerName: string) => Promise<GameSession>;
  submitScoreViaApi: (gameCode: string, playerId: string, hole: number, score: number) => Promise<void>;
  completeGameViaApi: (gameCode: string, playerId: string) => Promise<GameState>;
  getEventsViaApi: () => Promise<Event[]>;
  startEventViaApi: (gameCode: string, playerId: string, eventId: string) => Promise<void>;
  endEventViaApi: (gameCode: string, playerId: string) => Promise<void>;
  getActiveEventViaApi: (gameCode: string) => Promise<EventPayload | null>;
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

  getEventsViaApi: async ({}, use) => {
    const getEvents = async (): Promise<Event[]> => {
      const response = await fetch(`${API_URL}/api/v1/events`);

      if (!response.ok) {
        throw new Error(`Failed to get events: ${response.status}`);
      }

      const data = await response.json();
      return data.events;
    };

    await use(getEvents);
  },

  startEventViaApi: async ({}, use) => {
    const startEvent = async (
      gameCode: string,
      playerId: string,
      eventId: string
    ): Promise<void> => {
      const response = await fetch(`${API_URL}/api/v1/games/${gameCode}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, eventId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start event: ${response.status}`);
      }
    };

    await use(startEvent);
  },

  endEventViaApi: async ({}, use) => {
    const endEvent = async (gameCode: string, playerId: string): Promise<void> => {
      const response = await fetch(`${API_URL}/api/v1/games/${gameCode}/events/current`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to end event: ${response.status}`);
      }
    };

    await use(endEvent);
  },

  getActiveEventViaApi: async ({}, use) => {
    const getActiveEvent = async (gameCode: string): Promise<EventPayload | null> => {
      const response = await fetch(`${API_URL}/api/v1/games/${gameCode}/events/current`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get active event: ${response.status}`);
      }

      return response.json();
    };

    await use(getActiveEvent);
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
