import { describe, test, expect } from 'bun:test';
import { RULES, PENALTIES } from './constants';

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

describe('PENALTIES', () => {
  test('should export an array of 3 penalties', () => {
    expect(PENALTIES).toHaveLength(3);
  });

  test('should have correct structure for each penalty', () => {
    PENALTIES.forEach((penalty) => {
      expect(penalty).toHaveProperty('name');
      expect(penalty).toHaveProperty('points');
      expect(penalty).toHaveProperty('emoji');
      expect(typeof penalty.name).toBe('string');
      expect(typeof penalty.points).toBe('string');
      expect(typeof penalty.emoji).toBe('string');
    });
  });
});
