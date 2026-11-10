import { API_BASE_URL } from './apiLocation';

const FETCH_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(public status: number, message: string, public reason?: 'duplicate-name') {
    super(message);
    this.name = 'ApiError';
  }
}

function isDuplicateName(message: string): boolean {
  return message.includes('already exists for game');
}

function timedFetch(url: string, options: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timed out. Check the round before trying again.');
      }
      if (error instanceof TypeError) {
        throw new Error('Could not connect. Check your connection and the round before trying again.');
      }
      throw error;
    })
    .finally(() => clearTimeout(id));
}

// Rewrites known backend messages into copy a player can act on.
function friendlyMessage(status: number, backendMessage: string): string {
  if (
    backendMessage === 'Validation failed: name: Name must not be blank' ||
    backendMessage === 'Validation failed: host: Host name must not be blank'
  ) {
    return 'Enter your name to continue.';
  }
  if (backendMessage === 'Only the host can activate events') {
    return 'Only the host can start an event.';
  }
  if (backendMessage === 'Only the host can end events') {
    return 'Only the host can end an event.';
  }
  if (backendMessage === 'Only the host can set pubs for this game') {
    return 'Only the host can change the pub route.';
  }
  if (backendMessage === 'Only the host can change drinks and pars') {
    return 'Only the host can change the course.';
  }
  if (backendMessage === 'Only the host can complete this game') {
    return 'Only the host can end the round.';
  }
  if (backendMessage === 'Invalid custom event') {
    return 'Check the event name and description, then try again.';
  }
  if (backendMessage === 'This game has ended' || backendMessage === 'Game is already completed') {
    return 'This round has ended.';
  }
  if (backendMessage === 'Cannot submit score to completed game') {
    return 'This round has ended, so scores can no longer be changed.';
  }
  if (backendMessage === 'Cannot activate event on completed game') {
    return 'This round has ended, so events can no longer be started.';
  }
  if (backendMessage === 'Cannot change the course of a completed game') {
    return 'This round has ended, so the course can no longer be changed.';
  }
  if (isDuplicateName(backendMessage)) {
    return "That name's already taken in this round — try another.";
  }
  if (backendMessage.includes('does not belong to game')) {
    return "You're not part of this round. Rejoin to continue.";
  }
  if (status === 404 && /^Game `.*` not found/.test(backendMessage)) {
    return 'Round not found — check the game code.';
  }
  if (backendMessage.includes('modified concurrently')) {
    return 'Someone else updated the round at the same time. Try again.';
  }
  return backendMessage;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message = statusMessage(response.status, text);
    let reason: 'duplicate-name' | undefined;
    try {
      const json = JSON.parse(text);
      message = json.message ? friendlyMessage(response.status, json.message) : message;
      if (response.status < 500 && json.message && isDuplicateName(json.message)) {
        reason = 'duplicate-name';
      }
    } catch {
      if (text) message = text;
    }
    if (response.status >= 500) {
      message = 'The service is unavailable. Check your round before trying again.';
    }

    throw new ApiError(response.status, message, reason);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text);
}

function statusMessage(status: number, fallback: string): string {
  if (fallback) return fallback;
  if (status === 403) return "You don't have permission to do that";
  if (status === 404) return 'Not found';
  if (status >= 500) return 'Server error — please try again';
  return 'Something went wrong';
}

async function fetchWithRetry<T>(
  fetchFunction: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 500
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFunction();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  playerId?: string | null;
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
  cache?: RequestCache;
}

export async function transportRequest<T>(path: string, { method = 'GET', body, playerId, baseUrl = API_BASE_URL, timeoutMs, retries, cache }: ApiRequestOptions = {}): Promise<T> {
  const doFetch = async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (playerId) {
      headers['PubGolf-Player-Id'] = playerId;
    }
    const response = await timedFetch(`${baseUrl}${path}`, {
      method,
      headers,
      ...(cache ? { cache } : {}),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }, timeoutMs);
    return handleResponse<T>(response);
  };

  // Only GETs are retried: a timed-out mutation may still have succeeded
  // server-side, and repeating it can create duplicate games or consume
  // one-shot actions like the wildcard.
  return method === 'GET' ? fetchWithRetry(doFetch, retries) : doFetch();
}

