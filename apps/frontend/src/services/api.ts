import axios from 'axios';
import { clearLocalStorage, getGameIdentifier, getPlayerName, setGameIdentifier, setPlayerName } from '@/utils/utils';
import { baseURL } from '@/utils/constants';

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use(request => {
  console.debug('Starting Request', JSON.stringify(request, null, 2));
  return request;
});

api.interceptors.response.use(response => {
  console.debug('Response:', JSON.stringify(response.data, null, 2));
  return response;
}, error => {
  console.error('Error:', JSON.stringify(error.response?.data || error.message, null, 2));
  return Promise.reject(error);
});

export const createGame = async () => {
  clearLocalStorage()
  const response = await api.post('/games');
  setGameIdentifier(response.data.identifier);
  return response.data;
};

export const joinGame = async (identifier: string, name: string) => {
  const response = await api.post(`/games/${identifier}/join`, {
    name: name
  });
  setGameIdentifier(identifier);
  setPlayerName(name);
  return response.data;
};

export const submitScore = async (hole: number, score: number) => {
  const identifier = getGameIdentifier();
  const playerName = getPlayerName();
  const response = await api.post(`/games/${identifier}/players/${playerName}/score`, {
    hole: hole,
    score: score
  });
  return response.data;
};

export const getPlayers = async () => {
  const identifier = getGameIdentifier();
  const response = await api.get(`/games/${identifier}/players`);
  return response.data;
};
