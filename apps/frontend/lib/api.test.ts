import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import {
  createGame,
  joinGame,
  getGameState,
  submitScore,
  getRandomiseOptions,
  spinWheel,
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
      expect(url).toContain('/api/v1/games/WXYZ/join');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual({ name: 'Test Player' });
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
      expect(url).toContain('/api/v1/games/ABCD/players/player-123/scores');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual({ hole: 1, score: 2 });
    });

    test('should handle 204 no-content response', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      const result = await submitScore('ABCD', 'player-123', 1, 2);

      expect(result).toBeUndefined();
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
      expect(url).toContain('/api/v1/games/randomise-options');
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
      expect(url).toContain('/api/v1/games/ABCD/players/player-123/randomise');
      expect(options.method).toBe('POST');
      expect(result.result).toBe('Double Points');
      expect(result.hole).toBe(3);
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
