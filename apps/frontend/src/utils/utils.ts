export const getGameCode = (): string => {
  const gameCode = localStorage.getItem("gameCode");
  if (!gameCode) {
    console.warn("No game code found in local storage.");
    throw new Error("Game code not found.");
  }
  return gameCode;
};

export const getPlayerName = (): string => {
  const playerName = localStorage.getItem("playerName");
  if (!playerName) {
    console.warn("No game playerName found in local storage.");
    throw new Error("Player Name not found.");
  }
  return playerName;
};

export const getPlayerId = (): string => {
  const playerId = localStorage.getItem("playerId");
  if (!playerId) {
    console.warn("No game playerId found in local storage.");
    throw new Error("Player Name not found.");
  }
  return playerId;
};

export const clearLocalStorage = () => {
  console.debug("Clearing local storage");
  localStorage.clear();
};

export const setPlayerName = (playerName: string) => {
  localStorage.setItem("playerName", playerName);
};

export const setPlayerId = (playerId: string) => {
  localStorage.setItem("playerId", playerId);
};

export const setGameCode = (gameCode: string) => {
  localStorage.setItem("gameCode", gameCode);
};

export const getShareLink = (): string => {
  if (typeof window !== "undefined" && localStorage.getItem("gameCode")) {
    return `${window.location.protocol}//${window.location.host}?gameCode=${getGameCode()}`;
  }
  return "";
};

export function capitalizeGameCode(gameCode: string): string {
  if (!gameCode) return "";
  return gameCode[0].toUpperCase() + gameCode.slice(1).toLowerCase();
}
