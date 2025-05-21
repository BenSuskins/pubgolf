export const getGameIdentifier = (): string => {
  const identifier = localStorage.getItem('gameIdentifier');
  if (!identifier) {
    console.warn('No game identifier found in local storage.');
    throw new Error('Game identifier not found.');
  }
  return identifier;
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

export const setGameIdentifier = (gameIdentifier: string) => {
  localStorage.setItem('gameIdentifier', gameIdentifier);
}

export const getShareLink = (): string => {
  if (typeof window !== 'undefined' && localStorage.getItem('gameIdentifier')) {
    return `${window.location.protocol}//${window.location.host}?identifier=${getGameIdentifier()}`;
  }
  return '';
};

export function capitalizeGameIdentifier(identifier: string): string {
    if (!identifier) return '';
    return identifier[0].toUpperCase() + identifier.slice(1).toLowerCase();
}