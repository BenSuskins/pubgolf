import { describe, test, expect } from 'bun:test';
import { RULES } from './constants';

describe('RULES', () => {
  test('should export an array of 4 rules', () => {
    expect(RULES).toHaveLength(4);
  });

  test('should all be non-empty strings', () => {
    RULES.forEach((rule) => {
      expect(typeof rule).toBe('string');
      expect(rule.length).toBeGreaterThan(0);
    });
  });
});

