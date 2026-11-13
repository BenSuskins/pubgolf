import { describe, test, expect } from 'bun:test';
import { hasPlayedHole, formatParRelative } from './scoring';

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

describe('formatParRelative', () => {
  test('should format level par as E', () => {
    expect(formatParRelative(0)).toBe('E');
  });

  test('should format over and under par with signs', () => {
    expect(formatParRelative(3)).toBe('+3');
    expect(formatParRelative(-2)).toBe('−2');
  });
});
