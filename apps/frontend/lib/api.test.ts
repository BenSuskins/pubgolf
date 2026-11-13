import { describe, test, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { toast } from 'sonner';
import {
  createGame,
  joinGame,
  getGameState,
  submitScore,
  setPubs,
  getRandomiseOptions,
  getServerRoutes,
  getServerGameState,
  getServerRandomiseOptions,
  getServerPenaltyOptions,
  activateCustomEvent,
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

  test('loads server configuration using the server address without retries', async () => {
    const previousServerUrl = process.env.API_SERVER_URL;
    process.env.API_SERVER_URL = 'http://backend:8080';
    try {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ holes: [] }), { status: 200 }));
      await getServerRoutes();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://backend:8080/api/v1/config/routes');
      expect(options.cache).toBe('no-store');
      expect(options.signal).toBeInstanceOf(AbortSignal);

      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ players: [] }), { status: 200 }));
      await getServerGameState('PAR123');
      const [gameUrl, gameOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(gameUrl).toBe('http://backend:8080/api/v1/games/PAR123');
      expect(gameOptions.cache).toBe('no-store');

      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ options: [] }), { status: 200 }));
      await getServerRandomiseOptions();
      expect((mockFetch.mock.calls[0] as [string, RequestInit])[0]).toBe('http://backend:8080/api/v1/config/randomise-options');

      mockFetch.mockClear();
      mockFetch.mockRejectedValueOnce(new TypeError('offline'));
      await expect(getServerPenaltyOptions()).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      if (previousServerUrl === undefined) delete process.env.API_SERVER_URL;
      else process.env.API_SERVER_URL = previousServerUrl;
    }
  });

  test('expires the browser session after an unauthorized response', async () => {
    document.cookie = 'gameCode=PAR001; Path=/';
    document.cookie = 'playerId=player-1; Path=/';
    const notification = spyOn(toast, 'error').mockImplementation(() => 'toast');
    const timer = spyOn(globalThis, 'setTimeout');
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }));

    try {
      await expect(submitScore('PAR001', 'player-1', 1, 2)).rejects.toThrow(ApiError);
      expect(document.cookie).not.toContain('gameCode=PAR001');
      expect(document.cookie).not.toContain('playerId=player-1');
      expect(notification).toHaveBeenCalledWith('Session expired', { description: 'Please rejoin the game.' });
      expect(timer.mock.calls.some(([, delay]) => delay === 1500)).toBe(true);
    } finally {
      const redirectIndex = timer.mock.calls.findIndex(([, delay]) => delay === 1500);
      if (redirectIndex >= 0) clearTimeout(timer.mock.results[redirectIndex].value);
      timer.mockRestore();
      notification.mockRestore();
    }
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

      await expect(createGame('A')).rejects.toMatchObject({
        name: 'ApiError', message: 'Name too short', status: 400,
      });
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
    test('should handle 201 response with empty body', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 201 }));

      const result = await setPubs('ABCD', 'player-123', []);

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

    test('explains a network failure without exposing browser error text', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(createGame('Ben')).rejects.toThrow(
        'Could not connect. Check your connection and the round before trying again.'
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('does not retry POSTs — a timed-out mutation may have succeeded server-side', async () => {
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      await expect(createGame('Ben')).rejects.toThrow(
        'Request timed out. Check the round before trying again.'
      );
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

      await expect(joinGame('ABCD', 'Ben')).rejects.toMatchObject({
        message: "That name's already taken in this round — try another.",
        reason: 'duplicate-name',
      });
    });

    test('rewrites game-not-found errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Game `NOPE123` not found.' }), {
          status: 404,
        })
      );

      await expect(getGameState('NOPE123')).rejects.toThrow('Round not found — check the game code.');
    });

    test('explains a server-side name validation error in player-friendly language', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Validation failed: name: Name must not be blank' }), {
          status: 400,
        })
      );
      await expect(createGame('')).rejects.toThrow('Enter your name to continue.');
    });

    test('explains an unavailable service without showing server details', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'database unavailable' }), { status: 503 })
      );
      await expect(createGame('Ben')).rejects.toThrow(
        'The service is unavailable. Check your round before trying again.'
      );
    });

    test('explains a rejected custom event', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid custom event' }), { status: 400 })
      );
      await expect(activateCustomEvent('ABCD', '', '', 'player-1')).rejects.toThrow(
        'Check the event name and description, then try again.'
      );
    });

    test('explains when a round has ended', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'This game has ended' }), { status: 409 })
      );
      await expect(joinGame('ABCD', 'Ben')).rejects.toThrow('This round has ended.');
    });

    test('explains who can change the pub route', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Only the host can set pubs for this game' }), {
          status: 403,
        })
      );
      await expect(setPubs('ABCD', 'player-1', [])).rejects.toThrow(
        'Only the host can change the pub route.'
      );
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

});
