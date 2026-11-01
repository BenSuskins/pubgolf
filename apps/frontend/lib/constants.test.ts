import { describe, test, expect } from 'bun:test';
import { RULES, buildRules, routeRule } from './constants';

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

  test('should use generic route wording when no routes are known', () => {
    expect(RULES[1]).toBe('Pick your route at the start. No switching mid-game.');
  });
});

describe('routeRule', () => {
  test('should fall back to generic wording for no routes', () => {
    expect(routeRule([])).toBe('Pick your route at the start. No switching mid-game.');
  });

  test('should ignore blank route names', () => {
    expect(routeRule(['  ', ''])).toBe('Pick your route at the start. No switching mid-game.');
  });

  test('should drop the choice for a single route', () => {
    expect(routeRule(['Ale Trail'])).toBe(
      'Everyone plays Ale Trail. One route, no switching mid-game.'
    );
  });

  test('should join two routes with "or"', () => {
    expect(routeRule(['Route A', 'Route B'])).toBe(
      'Pick Route A or Route B at the start. No switching mid-game.'
    );
  });

  test('should comma-join three routes', () => {
    expect(routeRule(['Route A', 'Route B', 'Route C'])).toBe(
      'Pick Route A, Route B, or Route C at the start. No switching mid-game.'
    );
  });

  test('should comma-join four custom-named routes', () => {
    expect(routeRule(['Ale Trail', 'Spirit Run', 'Wine Walk', 'Soft Stroll'])).toBe(
      'Pick Ale Trail, Spirit Run, Wine Walk, or Soft Stroll at the start. No switching mid-game.'
    );
  });

  test('should trim surrounding whitespace from names', () => {
    expect(routeRule([' Route A ', 'Route B'])).toBe(
      'Pick Route A or Route B at the start. No switching mid-game.'
    );
  });
});

describe('buildRules', () => {
  test('should always return 4 rules', () => {
    expect(buildRules(['Route A', 'Route B'])).toHaveLength(4);
    expect(buildRules(['Only Route'])).toHaveLength(4);
  });

  test('should place the route rule second', () => {
    expect(buildRules(['Ale Trail', 'Spirit Run'])[1]).toBe(
      routeRule(['Ale Trail', 'Spirit Run'])
    );
  });

  test('should keep the other rules unchanged', () => {
    const rules = buildRules(['Ale Trail', 'Spirit Run']);

    expect(rules[0]).toBe(RULES[0]);
    expect(rules[2]).toBe(RULES[2]);
    expect(rules[3]).toBe(RULES[3]);
  });
});
