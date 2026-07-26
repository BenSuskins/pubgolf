export interface FrequentlyAskedQuestion {
  question: string;
  answer: string;
}

export const FREQUENTLY_ASKED_QUESTIONS: FrequentlyAskedQuestion[] = [
  {
    question: 'What is pub golf?',
    answer:
      'Pub golf is a pub crawl drinking game scored like golf. Your group visits a series of pubs — the holes — and each hole has a set drink and a par. Finish your drink in fewer sips than the par to go under it; the lowest total score at the end of the crawl wins.',
  },
  {
    question: 'How do you score in pub golf?',
    answer:
      'Count the sips it takes you to finish your drink at each hole — that number is your score for the hole. Match the par to break even, beat it to go under. Penalties add points on top, and the player with the lowest total after the final hole is the champion.',
  },
  {
    question: 'How many pubs do you need for pub golf?',
    answer:
      'Nine pubs makes a classic course, mirroring nine holes of golf, but a host can run a shorter course to suit the night. Pick pubs within easy walking distance of each other so the round keeps moving.',
  },
  {
    question: 'Do I need to download an app to play?',
    answer:
      'No. Pub Golf runs in your browser — the host creates a round, shares the game code, and everyone joins and submits their scores from their own phone. It is free and there is no sign-up.',
  },
];
