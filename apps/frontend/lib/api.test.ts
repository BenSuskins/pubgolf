import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import {
  createGame,
  joinGame,
  getGameState,
  submitScore,
  getRandomiseOptions,
  spinWheel,
  setPubs,
  ApiError,
} from './api';

describe('API functions', () => {
  const originalFetch = global.fetch;
  const mockFetch = mock(() => Promise.resolve(new Response()));

  beforeEach(() => {
    mockFetch.mockClear();
    global.fetch = mockFetch as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('createGame', () => {
    test('should POST to correct endpoint with host', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            gameId: 'game-123',
            gameCode: 'ABCD',
            playerId: 'player-456',
            playerName: 'Test Host',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await createGame('Test Host');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/v1/games');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual({ host: 'Test Host' });
      expect(result.gameCode).toBe('ABCD');
      expect(result.playerId).toBe('player-456');
    });

    test('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(createGame('Test')).rejects.toThrow(ApiError);
    });

    test('should include error message from response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Name too short' }), {
          status: 400,
        })
      );

      try {
        await createGame('A');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).message).toBe('Name too short');
        expect((err as ApiError).status).toBe(400);
      }
    });
  });

  describe('joinGame', () => {
    test('should POST to correct endpoint with gameCode and name', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            gameId: 'game-123',
            gameCode: 'WXYZ',
            playerId: 'player-789',
            playerName: 'Test Player',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await joinGame('WXYZ', 'Test Player');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/v1/games/WXYZ/players');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual({ name: 'Test Player', rejoin: false });
      expect(result.gameCode).toBe('WXYZ');
    });

    test('should throw ApiError on 404 (game not found)', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Game not found' }), {
          status: 404,
        })
      );

      await expect(joinGame('INVALID', 'Player')).rejects.toThrow(ApiError);
    });
  });

  describe('getGameState', () => {
    test('should GET from correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            gameId: 'game-123',
            gameCode: 'ABCD',
            players: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await getGameState('ABCD');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/v1/games/ABCD');
      expect(options.method).toBe('GET');
      expect(result.gameCode).toBe('ABCD');
      expect(result.players).toEqual([]);
    });

    test('should throw ApiError on 404', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Game not found' }), {
          status: 404,
        })
      );

      await expect(getGameState('INVALID')).rejects.toThrow(ApiError);
    });
  });

  describe('submitScore', () => {
    test('should POST to correct endpoint with score data', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      await submitScore('ABCD', 'player-123', 1, 2);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/v1/games/ABCD/scores');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual({ hole: 1, score: 2 });
    });

    test('should handle 204 no-content response', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      const result = await submitScore('ABCD', 'player-123', 1, 2);

      expect(result).toBeUndefined();
    });
  });

  describe('setPubs', () => {
    test('should handle 201 created response with empty body', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 201 }));

      const result = await setPubs('ABCD', 'player-123', [
        { name: 'The Red Lion', latitude: 51.5, longitude: -0.1 },
      ]);

      expect(result).toBeUndefined();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/v1/games/ABCD/pubs');
      expect(options.method).toBe('PUT');
    });
  });

  describe('getRandomiseOptions', () => {
    test('should GET randomise options from correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            options: [
              { option: 'Double Points', optionSize: 10 },
              { option: 'Half Points', optionSize: 10 },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await getRandomiseOptions();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/v1/config/randomise-options');
      expect(result.options).toHaveLength(2);
    });
  });

  describe('spinWheel', () => {
    test('should POST to correct endpoint and return result', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: 'Double Points',
            hole: 3,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await spinWheel('ABCD', 'player-123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/v1/games/ABCD/randomise');
      expect(options.method).toBe('POST');
      expect(result.result).toBe('Double Points');
      expect(result.hole).toBe(3);
    });
  });

  describe('retry policy', () => {
    test('retries GETs after a network error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ gameId: '1', gameCode: 'ABCD', players: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await getGameState('ABCD');

      expect(result.gameCode).toBe('ABCD');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('does not retry POSTs — a timed-out mutation may have succeeded server-side', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(createGame('Ben')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('does not retry the one-shot wildcard spin', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(spinWheel('ABCD', 'player-1')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('request building', () => {
    test('URL-encodes the game code in paths', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ gameId: '1', gameCode: 'X', players: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await getGameState('AB/CD #1');

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/v1/games/AB%2FCD%20%231');
    });

    test('sends the player id header on authenticated calls', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: 'Beer', hole: 2 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await spinWheel('ABCD', 'player-1');

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers['PubGolf-Player-Id']).toBe('player-1');
    });
  });

  describe('friendly error copy', () => {
    test('rewrites duplicate-name errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Player `Ben` already exists for game `ABCD`.' }), {
          status: 400,
        })
      );

      await expect(joinGame('ABCD', 'Ben')).rejects.toThrow(
        "That name's already taken in this game — try another."
      );
    });

    test('rewrites game-not-found errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Game `NOPE123` not found.' }), {
          status: 404,
        })
      );

      await expect(getGameState('NOPE123')).rejects.toThrow('Game not found — double-check the code.');
    });

    test('passes through unrecognised backend messages', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Randomise already used' }), {
          status: 409,
        })
      );

      await expect(spinWheel('ABCD', 'player-1')).rejects.toThrow('Randomise already used');
    });
  });

  describe('ApiError', () => {
    test('should have correct name property', () => {
      const error = new ApiError(400, 'Bad request');
      expect(error.name).toBe('ApiError');
    });

    test('should expose status code', () => {
      const error = new ApiError(404, 'Not found');
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
    });

    test('should be instanceof Error', () => {
      const error = new ApiError(500, 'Server error');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
