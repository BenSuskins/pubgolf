import { describe, test, expect } from 'bun:test';
import { PAR_VALUES } from './types';

describe('PAR_VALUES', () => {
  test('should export an array of 9 par values', () => {
    expect(PAR_VALUES).toHaveLength(9);
  });

  test('should have correct par values for each hole', () => {
    expect(PAR_VALUES).toEqual([1, 3, 2, 2, 2, 2, 4, 1, 1]);
  });

  test('should sum to 18 (total par for the course)', () => {
    const totalPar = PAR_VALUES.reduce((sum, par) => sum + par, 0);
    expect(totalPar).toBe(18);
  });

  test('should only contain positive integers', () => {
    PAR_VALUES.forEach((par) => {
      expect(Number.isInteger(par)).toBe(true);
      expect(par).toBeGreaterThan(0);
    });
  });
});
