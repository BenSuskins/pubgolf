interface DrinkInfo {
    drinkA: string;
    drinkB: string;
    par: number;
};

interface Player {
    name: string;
    scores: number[];
    totalScore: number
}

interface JoinGameFormProps {
    gameIdentifier: string;
};

interface ScoreboardTableProps {
    players: Player[];
}

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    gameIdentifier: string;
    buttonText: string;
}
