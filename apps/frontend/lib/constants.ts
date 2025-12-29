export const RULES = [
  'Finish your drink in as few sips as possible. Your score = your sips.',
  'Pick Route A or B at the start. No switching mid-game.',
  'Use Randomise once per game to swap a drink for something random.',
  'Lowest total score wins. May the best drinker take home the glory.',
];

export const PENALTIES = [
  { name: 'Skip a drink', points: '+5', emoji: '🚫' },
  { name: 'Spill your drink', points: '+3', emoji: '💧' },
  { name: 'Tactical chunder', points: '+10', emoji: '🤮' },
];

export interface DrinkInfo {
  drinkA: string;
  drinkB: string;
  par: number;
}

export const DRINKS: DrinkInfo[] = [
  { drinkA: 'Tequila', drinkB: 'Sambuca', par: 1 },
  { drinkA: 'Beer', drinkB: 'Double Vodka & Single Vodka w/ Mixer', par: 3 },
  { drinkA: 'Wine', drinkB: 'Double Gin w/ Mixer', par: 2 },
  { drinkA: 'Cider', drinkB: 'Double Rum w/ Mixer', par: 2 },
  { drinkA: 'Cocktail', drinkB: 'Cocktail', par: 2 },
  { drinkA: 'Spirit w/ Mixer', drinkB: 'Spirit w/ Mixer', par: 2 },
  { drinkA: 'Guinness', drinkB: '2 x Double Whiskey w/ Mixer', par: 4 },
  { drinkA: 'Jägerbomb', drinkB: 'Jägerbomb', par: 1 },
  { drinkA: 'VK', drinkB: 'Smirnoff Ice', par: 1 },
];
