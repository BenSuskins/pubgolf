export const rules = [
    "Each player must drink the designated drink at each stop.",
    "The par score for each drink represents the expected number of sips to finish the drink.",
    "Your score for a hole is the number of sips you took.",
    "Each sip can last at most 1 Minute.",
    "Doing additional drinks will lower your score as decided by the referee.",
    "A maximum of 4 drinks can be done per hole.",
    "Skipping a Drink: +5 Points",
    "Spilled Drink: +3 Points",
    "Vomitting: +10 Points",
];

export const drinks: DrinkInfo[] = [
    { drinkA: 'Tequila', drinkB: 'Sambuca', par: 1 },
    { drinkA: 'Beer', drinkB: 'Double Vodka & Single Vodka w/ Mixer', par: 3 },
    { drinkA: 'Wine', drinkB: 'Double Gin w/ Mixer', par: 2 },
    { drinkA: 'Cider', drinkB: 'Double Rum w/ Mixer', par: 2 },
    { drinkA: 'Cocktail', drinkB: 'Cocktail', par: 2 },
    { drinkA: 'Spirit w/ Mixer', drinkB: 'Spirit w/ Mixer', par: 2},
    { drinkA: 'Guinness', drinkB: '2 x Double Whiskey w/ Mixer', par: 4 },
    { drinkA: 'Jägerbomb', drinkB: 'Jägerbomb', par: 1 },
    { drinkA: 'VK', drinkB: 'Smirnoff Ice', par: 1 },
];

export const routes = {
    HOME: "/home",
    GAME: "/game",
    SUBMIT: "/submit-score",
    RULES: "/how-to-play",
};
