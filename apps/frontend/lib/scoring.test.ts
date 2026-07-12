import { describe, test, expect } from 'bun:test';
import { hasPlayedHole, parRelativeTotal, playerParRelative, formatParRelative, firstUnplayedHole } from './scoring';

const pars = [1, 3, 2, 2, 2, 2, 4, 1, 1];

describe('hasPlayedHole', () => {
  test('should treat null as not played', () => {
    expect(hasPlayedHole(null)).toBe(false);
  });

  test('should treat 0 as a real played score', () => {
    expect(hasPlayedHole(0)).toBe(true);
  });

  test('should treat any other score as played', () => {
    expect(hasPlayedHole(3)).toBe(true);
    expect(hasPlayedHole(-2)).toBe(true);
  });
});

describe('parRelativeTotal', () => {
  test('should ignore unplayed (null) holes', () => {
    const scores = [1, 2, 3, 4, 5, null, null, null, null];
    expect(parRelativeTotal(scores, pars)).toBe(15 - (1 + 3 + 2 + 2 + 2));
  });

  test('should count a played 0 against par', () => {
    const scores = [0, null, null, null, null, null, null, null, null];
    expect(parRelativeTotal(scores, pars)).toBe(-1);
  });

  test('should be zero when no holes are played', () => {
    expect(parRelativeTotal([null, null, null, null, null, null, null, null, null], pars)).toBe(0);
  });
});

describe('playerParRelative', () => {
  test('should prefer the server-computed value', () => {
    expect(playerParRelative({ parRelative: -3, scores: [5, null] }, pars)).toBe(-3);
  });

  test('should fall back to computing from scores', () => {
    expect(playerParRelative({ scores: [2, null, null, null, null, null, null, null, null] }, pars)).toBe(1);
  });
});

describe('formatParRelative', () => {
  test('should format level par as E', () => {
    expect(formatParRelative(0)).toBe('E');
  });

  test('should format over and under par with signs', () => {
    expect(formatParRelative(3)).toBe('+3');
    expect(formatParRelative(-2)).toBe('−2');
  });
});

describe('firstUnplayedHole', () => {
  test('should return the first hole with no logged sips', () => {
    expect(firstUnplayedHole([1, 2, null, null, null, null, null, null, null], 9)).toBe(3);
  });

  test('should return the last hole when every hole is played', () => {
    expect(firstUnplayedHole([1, 2, 3, 4, 5, 6, 7, 8, 9], 9)).toBe(9);
  });
});
