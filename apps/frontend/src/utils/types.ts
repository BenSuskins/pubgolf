interface DrinkInfo {
    pub: string;
    drinkA: string;
    drinkB: string;
    par: number;
    lat: number;
    lng: number;
};

interface Player {
    name: string;
    scores: number[];
    totalScore: number
}

interface MapComponentProps {
    drinks: DrinkInfo[];
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
