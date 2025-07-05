interface DrinkInfo {
    drinkA: string;
    drinkB: string;
    par: number;
};

interface Player {
    name: string;
    scores: number[];
    totalScore: number
    lucky: Lucky
}

interface Lucky {
    hole: number;
    result: string
}

interface JoinGameFormProps {
    gameCode: string;
};

interface ScoreboardTableProps {
    players: Player[];
}

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    gameCode: string;
    buttonText: string;
}
