import axios from 'axios';
import { clearLocalStorage, getGameGameCode, getPlayerName, setGameGameCode, setPlayerName, setPlayerId, getPlayerId} from '@/utils/utils';
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
  setGameGameCode(response.data.gameCode);
  setPlayerName(name);
  setPlayerId(response.data.playerId);
  return response.data;
};

export const joinGame = async (gameCode: string, name: string) => {
  const response = await api().post(`/api/v1/games/${gameCode}/join`, {
    name: name
  });
  setGameGameCode(gameCode);
  setPlayerName(name);
  setPlayerId(response.data.playerId);
  return response.data;
};

export const submitScore = async (hole: number, score: number) => {
  const gameCode = getGameGameCode();
  const playerId = getPlayerId();
  const response = await api().post(`/api/v1/games/${gameCode}/players/${playerId}/scores`, {
    hole: hole,
    score: score
  });
  return response.data;
};

export const getGame = async () => {
  const gameCode = getGameGameCode();
  const response = await api().get(`/api/v1/games/${gameCode}`);
  return response.data;
};