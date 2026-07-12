import { describe, test, expect } from 'bun:test';
import { hasPlayedHole, parRelativeTotal, formatParRelative, firstUnplayedHole } from './scoring';

const pars = [1, 3, 2, 2, 2, 2, 4, 1, 1];

describe('hasPlayedHole', () => {
  test('should treat null as not played', () => {
    expect(hasPlayedHole(null)).toBe(false);
  });

  test('should treat the backend initial score of 0 as not played', () => {
    expect(hasPlayedHole(0)).toBe(false);
  });

  test('should treat any other score as played', () => {
    expect(hasPlayedHole(3)).toBe(true);
    expect(hasPlayedHole(-2)).toBe(true);
  });
});

describe('parRelativeTotal', () => {
  test('should ignore unplayed holes with backend zero scores', () => {
    const scores = [1, 2, 3, 4, 5, 0, 0, 0, 0];
    expect(parRelativeTotal(scores, pars)).toBe(15 - (1 + 3 + 2 + 2 + 2));
  });

  test('should be zero when no holes are played', () => {
    expect(parRelativeTotal([0, 0, 0, 0, 0, 0, 0, 0, 0], pars)).toBe(0);
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
    expect(firstUnplayedHole([1, 2, 0, 0, 0, 0, 0, 0, 0], 9)).toBe(3);
  });

  test('should return the last hole when every hole is played', () => {
    expect(firstUnplayedHole([1, 2, 3, 4, 5, 6, 7, 8, 9], 9)).toBe(9);
  });
});
