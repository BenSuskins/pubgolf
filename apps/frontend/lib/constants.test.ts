import { describe, test, expect } from 'bun:test';
import { RULES, DRINKS } from './constants';
import { PAR_VALUES } from './types';

describe('RULES', () => {
  test('should export an array of 11 rules', () => {
    expect(RULES).toHaveLength(11);
  });

  test('should have the correct first rule', () => {
    expect(RULES[0]).toBe('Each player must drink the designated drink at each stop.');
  });

  test('should have the correct last rule (Vomiting penalty)', () => {
    expect(RULES[RULES.length - 1]).toBe('Vomiting: +10 Points');
  });

  test('should all be non-empty strings', () => {
    RULES.forEach((rule) => {
      expect(typeof rule).toBe('string');
      expect(rule.length).toBeGreaterThan(0);
    });
  });
});

describe('DRINKS', () => {
  test('should export an array of 9 drink configurations', () => {
    expect(DRINKS).toHaveLength(9);
  });

  test('should have correct structure for each drink', () => {
    DRINKS.forEach((drink) => {
      expect(drink).toHaveProperty('drinkA');
      expect(drink).toHaveProperty('drinkB');
      expect(drink).toHaveProperty('par');
      expect(typeof drink.drinkA).toBe('string');
      expect(typeof drink.drinkB).toBe('string');
      expect(typeof drink.par).toBe('number');
    });
  });

  test('should have par values matching PAR_VALUES from types', () => {
    DRINKS.forEach((drink, index) => {
      expect(drink.par).toBe(PAR_VALUES[index]);
    });
  });

  test('should have all drink names as non-empty strings', () => {
    DRINKS.forEach((drink) => {
      expect(drink.drinkA.length).toBeGreaterThan(0);
      expect(drink.drinkB.length).toBeGreaterThan(0);
    });
  });

  test('should have correct first hole drinks (Tequila/Sambuca)', () => {
    expect(DRINKS[0].drinkA).toBe('Tequila');
    expect(DRINKS[0].drinkB).toBe('Sambuca');
    expect(DRINKS[0].par).toBe(1);
  });

  test('should have correct last hole drinks (VK/Smirnoff Ice)', () => {
    const lastDrink = DRINKS[DRINKS.length - 1];
    expect(lastDrink.drinkA).toBe('VK');
    expect(lastDrink.drinkB).toBe('Smirnoff Ice');
    expect(lastDrink.par).toBe(1);
  });
});
