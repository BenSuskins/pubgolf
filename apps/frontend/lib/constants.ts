/** Joins names into a natural "A, B, or C" phrase. */
function orList(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`;
}

/**
 * The route rule for a course. Hosts name their own routes and can run
 * anywhere from one to four of them, so the wording follows the course
 * rather than assuming the old "Route A or B" default.
 */
export function routeRule(routeNames: string[]): string {
  const names = routeNames.map((name) => name.trim()).filter((name) => name.length > 0);

  if (names.length === 0) {
    return 'Pick your route at the start. No switching mid-game.';
  }
  if (names.length === 1) {
    return `Everyone plays ${names[0]}. One route, no switching mid-game.`;
  }
  return `Pick ${orList(names)} at the start. No switching mid-game.`;
}

/** The rules for a course, with the route rule named after that course's routes. */
export function buildRules(routeNames: string[] = []): string[] {
  return [
    'Finish your drink in as few sips as possible. Your score = your sips.',
    routeRule(routeNames),
    'Use Wildcard once per round for a surprise on your next unplayed hole.',
    'The lowest total score wins the round.',
  ];
}

/** Generic rules, used before a course has loaded. */
export const RULES = buildRules();

/** The rules page, showing the default course everyone can read about. */
export const RULES_HREF = '/how-to-play';

/** Game rules use the current course instead of the public default course. */
export const GAME_RULES_HREF = '/game/rules';
