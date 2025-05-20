import axios from 'axios';
import { clearLocalStorage, getGameIdentifier, getPlayerName, setGameIdentifier, setPlayerName, setPlayerId, getPlayerId} from '@/utils/utils';
import { env } from 'next-runtime-env';

const getBaseURL = () => {
  if (typeof window !== 'undefined' && env('NEXT_PUBLIC_API_URL')) {
    return env('NEXT_PUBLIC_API_URL');
  }
  return 'http://localhost:8080';
};

const api = () =>
  axios.create({
    baseURL: getBaseURL(),
  });

export const createGame = async (name: string) => {
  clearLocalStorage()
  const response = await api().post('/api/v1/games', {
      host: name
    });
  setGameIdentifier(response.data.gameCode);
  setPlayerName(name);
  setPlayerId(response.data.playerId);
  return response.data;
};

export const joinGame = async (identifier: string, name: string) => {
  const response = await api().post(`/api/v1/games/${identifier}/join`, {
    name: name
  });
  setGameIdentifier(identifier);
  setPlayerName(name);
  setPlayerId(response.data.playerId);
  return response.data;
};

export const submitScore = async (hole: number, score: number) => {
  const identifier = getGameIdentifier();
  const playerId = getPlayerId();
  const response = await api().post(`/api/v1/games/${identifier}/players/${playerId}/scores`, {
    hole: hole,
    score: score
  });
  return response.data;
};

export const getPlayers = async () => {
  const identifier = getGameIdentifier();
  const response = await api().get(`/api/v1/games/${identifier}`);
  return response.data;
};