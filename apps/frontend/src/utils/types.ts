export interface DrinkInfo {
  drinkA: string;
  drinkB: string;
  par: number;
}

export interface Player {
  name: string;
  scores: number[];
  totalScore: number;
  lucky: Lucky;
}

export interface Lucky {
  hole: number;
  result: string;
}

export interface Options {
  option: string;
  optionSize: number;
}

export interface JoinGameFormProps {
  gameCode: string;
}

export interface ScoreboardTableProps {
  players: Player[];
}

export type LuckyResponse = {
  result: string;
  hole: number;
  outcomes: string[];
};

export interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  gameCode: string;
  buttonText: string;
}
