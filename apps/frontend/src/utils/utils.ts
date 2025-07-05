export const getGameGameCode = (): string => {
  const gameCode = localStorage.getItem('gameGameCode');
  if (!gameCode) {
    console.warn('No game gameCode found in local storage.');
    throw new Error('Game gameCode not found.');
  }
  return gameCode;
};

export const getPlayerName = (): string => {
  const playerName = localStorage.getItem('playerName');
  if (!playerName) {
    console.warn('No game playerName found in local storage.');
    throw new Error('Player Name not found.');
  }
  return playerName;
};

export const getPlayerId = (): string => {
  const playerId = localStorage.getItem('playerId');
  if (!playerId) {
    console.warn('No game playerId found in local storage.');
    throw new Error('Player Name not found.');
  }
  return playerId;
};

export const clearLocalStorage = () => {
  console.debug('Clearing local storage')
  localStorage.clear();
};

export const setPlayerName = (playerName: string) => {
  localStorage.setItem('playerName', playerName);
}

export const setPlayerId = (playerId: string) => {
  localStorage.setItem('playerId', playerId);
}

export const setGameGameCode = (gameGameCode: string) => {
  localStorage.setItem('gameGameCode', gameGameCode);
}

export const getShareLink = (): string => {
  if (typeof window !== 'undefined' && localStorage.getItem('gameGameCode')) {
    return `${window.location.protocol}//${window.location.host}?gameCode=${getGameGameCode()}`;
  }
  return '';
};

export function capitalizeGameGameCode(gameCode: string): string {
    if (!gameCode) return '';
    return gameCode[0].toUpperCase() + gameCode.slice(1).toLowerCase();
}