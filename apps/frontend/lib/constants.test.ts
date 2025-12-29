import { describe, test, expect } from 'bun:test';
import { RULES, PENALTIES, DRINKS } from './constants';
import { PAR_VALUES } from './types';

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
